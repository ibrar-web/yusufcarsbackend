import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from '../../../entities/messages.entity';
import { SendMessageDto } from './dto/send-message.dto';
import { Supplier } from '../../../entities/supplier.entity';
import { AppRole, User } from '../../../entities/user.entity';
import { Chats } from '../../../entities/chats.entity';
import { ChatSocketService } from '../../sockets/chat/chat-socket.service';

type PaginationOptions = {
  page?: number;
  limit?: number;
};

type SupplierChatListOptions = PaginationOptions & {
  userId?: string;
};

type PublicUserProfile = {
  id: string;
  email: string;
  fullName: string;
  role: AppRole;
  createdAt: Date;
};

type MessageResponse = {
  id: string;
  content: string;
  isRead: boolean;
  createdAt: Date;
  deletedAt: Date | null;
  chatId: string;
  sender: PublicUserProfile;
};

type MessagePageMeta = {
  total: number;
  page: number;
  limit: number;
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

  async list(
    supplierUserId: string,
    userId: string,
    options: PaginationOptions = {},
  ) {
    let chat = await this.chats.findOne({
      where: {
        supplier: { id: supplierUserId },
        user: { id: userId },
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

    const userProfile = chat.user
      ? {
          id: chat.user.id,
          email: chat.user.email,
          fullName: chat.user.fullName,
          role: chat.user.role,
          isActive: chat.user.isActive,
          suspensionReason: chat.user.suspensionReason ?? null,
          createdAt: chat.user.createdAt,
          postCode: chat.user.postCode ?? null,
        }
      : null;
    const userInfo = userProfile
      ? { ...userProfile, userId: userProfile.id }
      : null;
    const page = options.page && options.page > 0 ? options.page : 1;
    const limit =
      options.limit && options.limit > 0 ? Math.min(options.limit, 100) : 50;
    const skip = (page - 1) * limit;

    let messages: MessageResponse[] = [];
    let total = 0;
    if (chatExisted) {
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
            isActive: message.sender.isActive,
            suspensionReason: message.sender.suspensionReason ?? null,
            createdAt: message.sender.createdAt,
            postCode: message.sender.postCode ?? null,
          },
        };
      });
    }

    const chatInfo = {
      id: chat.id,
      createdAt: chat.createdAt,
      userId: chat.user.id,
      supplierId: supplierUserId,
    };

    const meta: MessagePageMeta = { total, page, limit };

    return { chat: chatInfo, user: userInfo, messages, meta };
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
        supplier: { id: supplierUserId },
        ...(options.userId ? { user: { id: options.userId } } : {}),
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
              role: message.sender.role,
              createdAt: message.sender.createdAt,
            },
          });
        }
      }
    }

    const data = chats.map((chat) => {
      const latestMessage = latestMap.get(chat.id) ?? null;
      const userProfile = chat.user
        ? {
            id: chat.user.id,
            email: chat.user.email,
            fullName: chat.user.fullName,
            role: chat.user.role,
            isActive: chat.user.isActive,
            suspensionReason: chat.user.suspensionReason ?? null,
            createdAt: chat.user.createdAt,
            postCode: chat.user.postCode ?? null,
          }
        : null;
      return {
        chat: {
          id: chat.id,
          user: userProfile ? { ...userProfile, userId: userProfile.id } : null,
          createdAt: chat.createdAt,
          userId: chat.user?.id ?? null,
          supplierId: supplierUserId,
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
      where: { user: { id: supplierUser.id } },
      relations: ['user'],
    });
    if (!supplier || !supplier.user) {
      throw new NotFoundException('Supplier profile not found');
    }

    const chat = await this.chats.findOne({
      where: {
        id: dto.chatId,
        supplier: { id: supplierUserId },
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

    const userProfile = chat.user
      ? {
          id: chat.user.id,
          email: chat.user.email,
          fullName: chat.user.fullName,
          role: chat.user.role,
          isActive: chat.user.isActive,
          suspensionReason: chat.user.suspensionReason ?? null,
          createdAt: chat.user.createdAt,
          postCode: chat.user.postCode ?? null,
        }
      : null;
    const userInfo = userProfile
      ? { ...userProfile, userId: userProfile.id }
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
        role: 'supplier',
        createdAt: message.sender.createdAt,
      },
    };
    this.attachSocketMeta(messageResponse, {
      chatId: chat.id,
      recipientId: chat.user.id,
      senderId: supplierUser.id,
      senderRole: 'supplier',
    });
    this.chatSocket.emitMessage(messageResponse);

    const chatInfo = {
      id: chat.id,
      createdAt: chat.createdAt,
      userId: chat.user.id,
      supplierId: supplierUserId,
    };

    return { chat: chatInfo, user: userInfo, message: messageResponse };
  }

  private async ensureChat(userId: string, supplierUserId: string) {
    const existing = await this.chats.findOne({
      where: {
        user: { id: userId },
        supplier: { id: supplierUserId },
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
