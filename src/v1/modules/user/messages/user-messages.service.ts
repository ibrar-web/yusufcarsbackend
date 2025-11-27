import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from '../../supplier/messages/entities/message.entity';
import { SendUserMessageDto } from './dto/send-user-message.dto';
import { Supplier } from '../../../entities/supplier.entity';
import { User } from '../../../entities/user.entity';
import { QuoteRequest } from '../../../entities/quote-request.entity';
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
    @InjectRepository(QuoteRequest)
    private readonly requests: Repository<QuoteRequest>,
    @InjectRepository(Chats)
    private readonly chats: Repository<Chats>,
    private readonly chatSocket: ChatSocketService,
  ) {}

  async list(userId: string, supplierId: string) {
    const chat = await this.chats.findOne({
      where: {
        user: { id: userId } as any,
        supplier: { id: supplierId } as any,
      },
    });

    if (!chat) {
      const user = await this.users.findOne({ where: { id: userId } });
      const supplierUser = await this.users.findOne({ where: { id: supplierId } });
      if (!user || !supplierUser) {
        throw new NotFoundException('Chat participants not found');
      }
      const newChat = this.chats.create({ user, supplier: supplierUser });
      await this.chats.save(newChat);
      return [];
    }

    return this.messages.find({
      where: {
        user: { id: userId } as any,
        supplier: { id: supplierId } as any,
      },
      order: { createdAt: 'DESC' },
      take: 100,
    });
  }

  async listChats(userId: string, options: ChatListOptions = {}) {
    const page = options.page && options.page > 0 ? options.page : 1;
    const limit =
      options.limit && options.limit > 0 ? Math.min(options.limit, 100) : 20;
    const skip = (page - 1) * limit;

    const countResult = await this.messages
      .createQueryBuilder('message')
      .select('COUNT(DISTINCT message."supplierId")', 'count')
      .where('message."userId" = :userId', { userId })
      .getRawOne<{ count: string }>();
    const total = parseInt(countResult?.count ?? '0', 10);
    if (total === 0) {
      return { data: [], meta: { total, page, limit } };
    }

    const latestRows = await this.messages
      .createQueryBuilder('latest')
      .select('latest."supplierId"', 'supplierId')
      .addSelect('MAX(latest."createdAt")', 'latestAt')
      .where('latest."userId" = :userId', { userId })
      .groupBy('latest."supplierId"')
      .orderBy('latestAt', 'DESC')
      .offset(skip)
      .limit(limit)
      .getRawMany<{ supplierId: string; latestAt: string }>();

    if (!latestRows.length) {
      return { data: [], meta: { total, page, limit } };
    }

    const supplierIds = latestRows.map((row) => row.supplierId);
    const latestTimestampMap = new Map(
      latestRows.map((row) => [row.supplierId, new Date(row.latestAt).getTime()]),
    );

    const candidates = await this.messages
      .createQueryBuilder('message')
      .leftJoinAndSelect('message.supplier', 'supplier')
      .leftJoinAndSelect('message.user', 'user')
      .leftJoinAndSelect('message.quoteRequest', 'quoteRequest')
      .where('message."userId" = :userId', { userId })
      .andWhere('message."supplierId" IN (:...supplierIds)', { supplierIds })
      .orderBy('message.createdAt', 'DESC')
      .getMany();

    const grouped = new Map<string, Message>();
    for (const message of candidates) {
      const targetTs = latestTimestampMap.get(message.supplier.id);
      if (
        typeof targetTs === 'number' &&
        message.createdAt.getTime() === targetTs &&
        !grouped.has(message.supplier.id)
      ) {
        grouped.set(message.supplier.id, message);
      }
    }

    const data = latestRows
      .map((row) => grouped.get(row.supplierId))
      .filter((item): item is Message => Boolean(item));

    return { data, meta: { total, page, limit } };
  }

  async send(userId: string, dto: SendUserMessageDto) {
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const supplier = await this.suppliers.findOne({
      where: { id: dto.supplierId },
      relations: ['user'],
    });
    if (!supplier) throw new NotFoundException('Supplier not found');

    const quoteRequest = await this.requests.findOne({
      where: { id: dto.quoteRequestId },
      relations: ['user'],
    });
    if (!quoteRequest) throw new NotFoundException('Quote request not found');

    const message = this.messages.create({
      supplier,
      user,
      quoteRequest,
      direction: 'user-to-supplier',
      body: dto.body,
    });
    await this.messages.save(message);

    this.chatSocket.emitMessage({
      messageId: message.id,
      quoteRequestId: dto.quoteRequestId,
      senderId: user.id,
      senderRole: 'user',
      recipientId: supplier.user.id,
      body: dto.body,
      createdAt: message.createdAt.toISOString(),
      direction: 'user-to-supplier',
    });

    return message;
  }
}
