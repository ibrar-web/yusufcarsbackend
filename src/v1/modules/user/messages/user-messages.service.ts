import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { Message } from '../../../entities/messages.entity';
import { SendUserMessageDto } from './dto/send-user-message.dto';
import { Supplier } from '../../../entities/supplier.entity';
import { Chats } from '../../../entities/chats.entity';
import { ChatSocketService } from '../../sockets/chat/chat-socket.service';
import { AppRole, User } from 'src/v1/entities/user.entity';

type PaginationOptions = {
  page?: number;
  limit?: number;
};

type ChatListOptions = PaginationOptions & {
  supplierId?: string;
};

type MessageResponse = {
  id: string;
  content: string;
  isRead: boolean;
  createdAt: Date;
  deletedAt: Date | null;
  chatId: string;
  sender: {
    id: string;
    email: string;
    fullName: string;
    role: AppRole;
    createdAt: Date;
  };
};

type MessagePageMeta = {
  total: number;
  page: number;
  limit: number;
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

  async list(
    userId: string,
    supplierId: string,
    options: PaginationOptions = {},
  ) {
    let chat = await this.chats.findOne({
      where: {
        user: { id: userId },
        supplier: { id: supplierId },
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
          where: { user: { id: chat.supplier.id } },
          relations: ['user'],
        })
      : null;

    const supplierInfo = chat.supplier
      ? {
          id: supplierProfile?.id ?? chat.supplier.id,
          businessName: supplierProfile?.businessName ?? null,
          userId: chat.supplier.id,
          firstName:
            chat.supplier.fullName?.split(' ')?.[0] ??
            chat.supplier.fullName ??
            null,
        }
      : null;

    const page = options.page && options.page > 0 ? options.page : 1;
    const limit =
      options.limit && options.limit > 0 ? Math.min(options.limit, 100) : 50;
    const skip = (page - 1) * limit;

    let messages: MessageResponse[] = [];
    let total = 0;

    if (!isNewChat) {
      const [records, count] = await this.messages.findAndCount({
        where: { chat: { id: chat.id } },
        relations: ['sender', 'chat'],
        order: { createdAt: 'DESC' },
        take: limit,
        skip,
      });
      total = count;
      messages = records.map((message) => {
        if (!message.sender) {
          throw new Error('Message sender missing profile');
        }
        if (!message.chat) {
          throw new Error('Message chat missing');
        }
        return {
          id: message.id,
          content: message.content,
          isRead: message.isRead,
          createdAt: message.createdAt,
          deletedAt: message.deletedAt ?? null,
          chatId: message.chat.id,
          sender: {
            id: message.sender.id,
            email: message.sender.email,
            fullName: message.sender.fullName,
            role: message.sender.role,
            createdAt: message.sender.createdAt,
          },
        };
      });
    }

    const chatInfo = {
      id: chat.id,
      createdAt: chat.createdAt,
      userId,
      supplierId: chat.supplier?.id ?? supplierId,
    };

    const meta: MessagePageMeta = { total, page, limit };

    return { chat: chatInfo, supplier: supplierInfo, messages, meta };
  }

  async listChats(userId: string, options: ChatListOptions = {}) {
    const page = options.page && options.page > 0 ? options.page : 1;
    const limit =
      options.limit && options.limit > 0 ? Math.min(options.limit, 100) : 20;
    const skip = (page - 1) * limit;

    const [chats, total] = await this.chats.findAndCount({
      where: { user: { id: userId } },
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
          where: { user: { id: In(supplierUserIds) } },
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
          if (!message.sender) {
            throw new Error('Message sender missing profile');
          }
          latestMap.set(message.chat.id, {
            id: message.id,
            content: message.content,
            isRead: message.isRead,
            createdAt: message.createdAt,
            deletedAt: message.deletedAt ?? null,
            chatId: message.chat.id,
            sender: {
              id: message.sender.id,
              email: message.sender.email,
              fullName: message.sender.fullName,
              role: 'user',
              createdAt: message.sender.createdAt,
            },
          });
        }
      }
    }

    const data = chats.map((chat) => {
      const supplierProfile = chat.supplier
        ? supplierProfileMap.get(chat.supplier.id)
        : null;
      const latestMessage = latestMap.get(chat.id) ?? null;
      const supplierInfo = chat.supplier
        ? {
            id: supplierProfile?.id ?? chat.supplier.id,
            businessName: supplierProfile?.businessName ?? null,
            userId: chat.supplier.id,
            firstName:
              chat.supplier.fullName?.split(' ')?.[0] ??
              chat.supplier.fullName ??
              null,
          }
        : null;
      return {
        chat: {
          id: chat.id,
          supplier: supplierInfo,
          createdAt: chat.createdAt,
          userId,
          supplierId: chat.supplier?.id ?? null,
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
      where: { id: dto.chatId, user: { id: userId } },
      relations: ['supplier'],
    });
    if (!chat) throw new NotFoundException('Chat not found');
    if (!chat.supplier || chat.supplier.role !== 'supplier') {
      throw new NotFoundException('Supplier user not found');
    }

    const supplierProfile = await this.suppliers.findOne({
      where: { user: { id: chat.supplier.id } },
      relations: ['user'],
    });

    const message = this.messages.create({
      chat,
      sender: user,
      content: dto.message,
      isRead: false,
    });
    await this.messages.save(message);

    const supplierInfo = chat.supplier
      ? {
          id: supplierProfile?.id ?? chat.supplier.id,
          businessName: supplierProfile?.businessName ?? null,
          userId: chat.supplier.id,
          firstName:
            chat.supplier.fullName?.split(' ')?.[0] ??
            chat.supplier.fullName ??
            null,
        }
      : null;
    if (!message.sender) {
      throw new Error('Message sender missing profile');
    }
    const messageResponse: MessageResponse = {
      id: message.id,
      content: message.content,
      isRead: message.isRead,
      createdAt: message.createdAt,
      deletedAt: message.deletedAt ?? null,
      chatId: chat.id,
      sender: {
        id: message.sender.id,
        email: message.sender.email,
        fullName: message.sender.fullName,
        role: 'user',
        createdAt: message.sender.createdAt,
      },
    };

    const chatInfo = {
      id: chat.id,
      createdAt: chat.createdAt,
      userId,
      supplierId: chat.supplier.id,
    };

    this.attachSocketMeta(messageResponse, {
      chatId: chat.id,
      recipientId: chat.supplier.id,
      senderId: user.id,
      senderRole: 'user',
    });
    this.chatSocket.emitMessage(messageResponse);

    return { chat: chatInfo, supplier: supplierInfo, message: messageResponse };
  }

  private async ensureChat(userId: string, supplierUserId: string) {
    const existing = await this.chats.findOne({
      where: {
        user: { id: userId },
        supplier: { id: supplierUserId },
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
      where: { user: { id: supplierUser.id } },
      relations: ['user'],
    });
    if (!supplier || !supplier.user) {
      throw new NotFoundException('Supplier profile not found');
    }

    const chat = this.chats.create({ user, supplier: supplierUser });
    return this.chats.save(chat);
  }

  private attachSocketMeta(
    message: MessageResponse,
    meta: {
      recipientId: string;
      chatId: string;
      senderId: string;
      senderRole: 'user' | 'supplier';
    },
  ) {
    Object.defineProperties(message, {
      __recipientId: { value: meta.recipientId, enumerable: false },
      __chatId: { value: meta.chatId, enumerable: false },
      __senderId: { value: meta.senderId, enumerable: false },
      __senderRole: { value: meta.senderRole, enumerable: false },
    });
  }
}
