import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { Message } from '../../../entities/messages.entity';
import { SendUserMessageDto } from './dto/send-user-message.dto';
import { Supplier } from '../../../entities/supplier.entity';
import { AppRole, User } from '../../../entities/user.entity';
import { Chats } from '../../../entities/chats.entity';
import { ChatSocketService } from '../../sockets/chat/chat-socket.service';

type ChatListOptions = {
  supplierId?: string;
  page?: number;
  limit?: number;
};

type SupplierInfo = {
  id: string;
  businessName: string | null;
  userId: string;
  firstName: string | null;
};

type PublicUserProfile = {
  id: string;
  email: string;
  fullName: string;
  firstName: string | null;
  role: AppRole;
  isActive: boolean;
  suspensionReason: string | null;
  createdAt: Date;
  postCode: string | null;
};

type MessageResponse = {
  id: string;
  content: string;
  isRead: boolean;
  createdAt: Date;
  deletedAt: Date | null;
  senderId: string;
  sender: PublicUserProfile;
};

@Injectable()
export class UserMessagesService {
  constructor(
    @InjectRepository(Message) private readonly messages: Repository<Message>,
    @InjectRepository(Supplier)
    private readonly suppliers: Repository<Supplier>,
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Chats)
    private readonly chats: Repository<Chats>,
    private readonly chatSocket: ChatSocketService,
  ) {}

  async list(userId: string, supplierId: string) {
    let chat = await this.chats.findOne({
      where: {
        user: { id: userId } as any,
        supplier: { id: supplierId } as any,
      },
      relations: ['supplier'],
    });

    const isNewChat = !chat;
    if (!chat) {
      const newChat = await this.ensureChat(userId, supplierId);
      chat = await this.chats.findOne({
        where: { id: newChat.id },
        relations: ['supplier'],
      });
    }

    if (!chat) {
      throw new NotFoundException('Chat not found');
    }

    const supplierProfile = chat.supplier
      ? await this.suppliers.findOne({
          where: { user: { id: chat.supplier.id } as any },
          relations: ['user'],
        })
      : null;

    const supplierInfo = this.formatSupplierInfo(chat.supplier, supplierProfile);

    const messages = isNewChat
      ? []
      : (
          await this.messages.find({
            where: { chat: { id: chat.id } as any },
            order: { createdAt: 'DESC' },
            take: 100,
          })
        ).map((message) => this.formatMessage(message));

    return { supplier: supplierInfo, messages };
  }

  async listChats(userId: string, options: ChatListOptions = {}) {
    const page = options.page && options.page > 0 ? options.page : 1;
    const limit =
      options.limit && options.limit > 0 ? Math.min(options.limit, 100) : 20;
    const skip = (page - 1) * limit;

    const [chats, total] = await this.chats.findAndCount({
      where: { user: { id: userId } as any },
      relations: ['supplier'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    const supplierUserIds = Array.from(
      new Set(
        chats
          .map((chat) => chat.supplier?.id)
          .filter((id): id is string => Boolean(id)),
      ),
    );
    const supplierProfiles = supplierUserIds.length
      ? await this.suppliers.find({
          where: { user: { id: In(supplierUserIds) } as any },
          relations: ['user'],
        })
      : [];
    const supplierProfileMap = new Map<string, Supplier>();
    for (const profile of supplierProfiles) {
      const profileUserId = profile.user?.id;
      if (profileUserId) {
        supplierProfileMap.set(profileUserId, profile);
      }
    }

    const chatIds = chats.map((chat) => chat.id);
    const latestMap = new Map<string, MessageResponse>();
    if (chatIds.length) {
      const recentMessages = await this.messages
        .createQueryBuilder('message')
        .leftJoinAndSelect('message.chat', 'chat')
        .leftJoinAndSelect('message.sender', 'sender')
        .where('message."chatId" IN (:...chatIds)', { chatIds })
        .orderBy('message."createdAt"', 'DESC')
        .getMany();
      for (const message of recentMessages) {
        if (!latestMap.has(message.chat.id)) {
          latestMap.set(message.chat.id, this.formatMessage(message));
        }
      }
    }

    const data = chats.map((chat) => {
      const supplierProfile = chat.supplier
        ? supplierProfileMap.get(chat.supplier.id)
        : null;
      const latestMessage = latestMap.get(chat.id) ?? null;
      return {
        chat: {
          id: chat.id,
          supplier: this.formatSupplierInfo(chat.supplier, supplierProfile),
          createdAt: chat.createdAt,
        },
        latestMessage,
      };
    });

    return { data, meta: { total, page, limit } };
  }

  async send(userId: string, dto: SendUserMessageDto) {
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const chat = await this.chats.findOne({
      where: { id: dto.chatId, user: { id: userId } as any },
      relations: ['supplier'],
    });
    if (!chat) throw new NotFoundException('Chat not found');
    if (!chat.supplier || chat.supplier.role !== 'supplier') {
      throw new NotFoundException('Supplier user not found');
    }

    const supplierProfile = await this.suppliers.findOne({
      where: { user: { id: chat.supplier.id } as any },
      relations: ['user'],
    });

    const message = this.messages.create({
      chat,
      sender: user,
      content: dto.message,
      isRead: false,
    });
    await this.messages.save(message);

    const supplierInfo = this.formatSupplierInfo(chat.supplier, supplierProfile);
    const messageResponse = this.formatMessage(message);

    this.chatSocket.emitMessage({
      messageId: message.id,
      chatId: chat.id,
      senderId: user.id,
      senderRole: 'user',
      recipientId: chat.supplier.id,
      content: dto.message,
      createdAt: message.createdAt.toISOString(),
    });

    return { supplier: supplierInfo, message: messageResponse };
  }

  private formatSupplierInfo(
    supplierUser?: User | null,
    supplierProfile?: Supplier | null,
  ): SupplierInfo | null {
    if (!supplierUser) return null;
    return {
      id: supplierProfile?.id ?? supplierUser.id,
      businessName: supplierProfile?.businessName ?? null,
      userId: supplierUser.id,
      firstName:
        supplierUser.fullName?.split(' ')?.[0] ?? supplierUser.fullName ?? null,
    };
  }

  private formatUserProfile(user?: User | null): PublicUserProfile | null {
    if (!user) return null;
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      firstName: user.fullName?.split(' ')?.[0] ?? user.fullName ?? null,
      role: user.role,
      isActive: user.isActive,
      suspensionReason: user.suspensionReason ?? null,
      createdAt: user.createdAt,
      postCode: user.postCode ?? null,
    };
  }

  private formatMessage(message: Message): MessageResponse {
    const senderProfile = this.formatUserProfile(message.sender);
    if (!senderProfile) {
      throw new Error('Message sender missing profile');
    }

    return {
      id: message.id,
      content: message.content,
      isRead: message.isRead,
      createdAt: message.createdAt,
      deletedAt: message.deletedAt ?? null,
      senderId: message.sender.id,
      sender: senderProfile,
    };
  }

  private async ensureChat(userId: string, supplierUserId: string) {
    const existing = await this.chats.findOne({
      where: {
        user: { id: userId } as any,
        supplier: { id: supplierUserId } as any,
      },
      relations: ['supplier'],
    });
    if (existing) return existing;

    const user = await this.users.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const supplierUser = await this.users.findOne({
      where: { id: supplierUserId },
    });
    if (!supplierUser || supplierUser.role !== 'supplier') {
      throw new NotFoundException('Supplier user not found');
    }

    const supplier = await this.suppliers.findOne({
      where: { user: { id: supplierUser.id } as any },
      relations: ['user'],
    });
    if (!supplier || !supplier.user) {
      throw new NotFoundException('Supplier profile not found');
    }

    const chat = this.chats.create({ user, supplier: supplierUser });
    return this.chats.save(chat);
  }
}
