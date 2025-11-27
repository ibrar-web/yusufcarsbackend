import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from '../../../entities/messages.entity';
import { SendMessageDto } from './dto/send-message.dto';
import { Supplier } from '../../../entities/supplier.entity';
import { AppRole, User } from '../../../entities/user.entity';
import { Chats } from '../../../entities/chats.entity';
import { ChatSocketService } from '../../sockets/chat/chat-socket.service';

type SupplierChatListOptions = {
  userId?: string;
  page?: number;
  limit?: number;
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
export class SupplierMessagesService {
  constructor(
    @InjectRepository(Message) private readonly messages: Repository<Message>,
    @InjectRepository(Supplier)
    private readonly suppliers: Repository<Supplier>,
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Chats)
    private readonly chats: Repository<Chats>,
    private readonly chatSocket: ChatSocketService,
  ) {}

  async list(supplierUserId: string, userId: string) {
    let chat = await this.chats.findOne({
      where: {
        supplier: { id: supplierUserId } as any,
        user: { id: userId } as any,
      },
      relations: ['user'],
    });
    const chatExisted = Boolean(chat);

    if (!chat) {
      const newChat = await this.ensureChat(userId, supplierUserId);
      chat = await this.chats.findOne({
        where: { id: newChat.id },
        relations: ['user'],
      });
    }

    if (!chat) throw new NotFoundException('Chat not found');

    const userProfile = this.formatUserProfile(chat.user);
    const userInfo = userProfile ? { ...userProfile, userId: userProfile.id } : null;

    const messages = chatExisted
      ? (
          await this.messages.find({
            where: { chat: { id: chat.id } as any },
            order: { createdAt: 'DESC' },
            take: 100,
          })
        ).map((message) => this.formatMessage(message))
      : [];

    return { user: userInfo, messages };
  }

  async listChats(
    supplierUserId: string,
    options: SupplierChatListOptions = {},
  ) {
    const page = options.page && options.page > 0 ? options.page : 1;
    const limit =
      options.limit && options.limit > 0 ? Math.min(options.limit, 100) : 20;
    const skip = (page - 1) * limit;

    const [chats, total] = await this.chats.findAndCount({
      where: {
        supplier: { id: supplierUserId } as any,
        ...(options.userId ? { user: { id: options.userId } as any } : {}),
      },
      relations: ['user'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

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
      const latestMessage = latestMap.get(chat.id) ?? null;
      const userProfile = this.formatUserProfile(chat.user);
      return {
        chat: {
          id: chat.id,
          user: userProfile ? { ...userProfile, userId: userProfile.id } : null,
          createdAt: chat.createdAt,
        },
        latestMessage,
      };
    });

    return { data, meta: { total, page, limit } };
  }

  async send(supplierUserId: string, dto: SendMessageDto) {
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

    const chat = await this.chats.findOne({
      where: {
        id: dto.chatId,
        supplier: { id: supplierUserId } as any,
      },
      relations: ['user', 'supplier'],
    });
    if (!chat) throw new NotFoundException('Chat not found');
    if (!chat.user) throw new NotFoundException('User not found');

    const message = this.messages.create({
      chat,
      sender: supplierUser,
      content: dto.message,
      isRead: false,
    });
    await this.messages.save(message);

    const userProfile = this.formatUserProfile(chat.user);
    const userInfo = userProfile ? { ...userProfile, userId: userProfile.id } : null;
    const messageResponse = this.formatMessage(message);

    this.chatSocket.emitMessage({
      messageId: message.id,
      chatId: chat.id,
      senderId: supplierUser.id,
      senderRole: 'supplier',
      recipientId: chat.user.id,
      content: dto.message,
      createdAt: message.createdAt.toISOString(),
    });

    return { user: userInfo, message: messageResponse };
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
      relations: ['user', 'supplier'],
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

    const chat = this.chats.create({ user, supplier: supplierUser });
    return this.chats.save(chat);
  }
}
