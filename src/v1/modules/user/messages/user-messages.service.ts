import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { Message } from '../../../entities/messages.entity';
import { SendUserMessageDto } from './dto/send-user-message.dto';
import { Supplier } from '../../../entities/supplier.entity';
import { User } from '../../../entities/user.entity';
import { Chats } from '../../../entities/chats.entity';
import { ChatSocketService } from '../../sockets/chat/chat-socket.service';

type ChatListOptions = {
  supplierId?: string;
  page?: number;
  limit?: number;
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

    if (!chat) {
      chat = await this.ensureChat(userId, supplierId);
      return [];
    }

    return this.messages.find({
      where: { chat: { id: chat.id } as any },
      order: { createdAt: 'ASC' },
      take: 100,
    });
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
    const latestMap = new Map<string, Message>();
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
          latestMap.set(message.chat.id, message);
        }
      }
    }

    const data = chats.map((chat) => {
      const supplierProfile = chat.supplier
        ? supplierProfileMap.get(chat.supplier.id)
        : null;
      const latestMessage = latestMap.get(chat.id);
      return {
        chat: {
          id: chat.id,
          supplier: chat.supplier
            ? {
                id: supplierProfile?.id ?? chat.supplier.id,
                businessName: supplierProfile?.businessName ?? null,
                userId: chat.supplier.id,
                firstName:
                  chat.supplier.fullName?.split(' ')?.[0] ??
                  chat.supplier.fullName ??
                  null,
              }
            : null,
          createdAt: chat.createdAt,
        },
        latestMessage: latestMessage
          ? {
              id: latestMessage.id,
              content: latestMessage.content,
              senderId: latestMessage.sender.id,
              createdAt: latestMessage.createdAt,
              isRead: latestMessage.isRead,
            }
          : null,
      };
    });

    return { data, meta: { total, page, limit } };
  }

  async send(userId: string, dto: SendUserMessageDto) {
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const supplierUser = await this.users.findOne({
      where: { id: dto.supplierId },
    });
    console.log('supplierUser :', supplierUser);
    if (!supplierUser || supplierUser.role !== 'supplier') {
      throw new NotFoundException('Supplier user not found');
    }
    const chat = await this.ensureChat(userId, dto.supplierId);

    const message = this.messages.create({
      chat,
      sender: user,
      content: dto.message,
      isRead: false,
    });
    await this.messages.save(message);

    this.chatSocket.emitMessage({
      messageId: message.id,
      chatId: chat.id,
      senderId: user.id,
      senderRole: 'user',
      recipientId: supplierUser.id,
      content: dto.message,
      createdAt: message.createdAt.toISOString(),
    });

    return message;
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
