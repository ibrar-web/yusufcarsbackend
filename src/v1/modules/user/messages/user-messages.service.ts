import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from '../../supplier/messages/entities/message.entity';
import { SendUserMessageDto } from './dto/send-user-message.dto';
import { Supplier } from '../../../entities/supplier.entity';
import { User } from '../../../entities/user.entity';
import { QuoteRequest } from '../../../entities/quote-request.entity';
import { QuotesGateway } from '../../realtime/quotes.gateway';

@Injectable()
export class UserMessagesService {
  constructor(
    @InjectRepository(Message) private readonly messages: Repository<Message>,
    @InjectRepository(Supplier) private readonly suppliers: Repository<Supplier>,
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(QuoteRequest) private readonly requests: Repository<QuoteRequest>,
    private readonly gateway: QuotesGateway,
  ) {}

  async list(userId: string, quoteRequestId?: string) {
    const where = quoteRequestId
      ? { user: { id: userId } as any, quoteRequest: { id: quoteRequestId } as any }
      : { user: { id: userId } as any };
    return this.messages.find({
      where,
      order: { createdAt: 'DESC' },
      take: 100,
    });
  }

  async send(userId: string, dto: SendUserMessageDto) {
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const supplier = await this.suppliers.findOne({ where: { id: dto.supplierId } });
    if (!supplier) throw new NotFoundException('Supplier not found');

    const quoteRequest = await this.requests.findOne({ where: { id: dto.quoteRequestId }, relations: ['user'] });
    if (!quoteRequest) throw new NotFoundException('Quote request not found');

    const message = this.messages.create({
      supplier,
      user,
      quoteRequest,
      direction: 'user-to-supplier',
      body: dto.body,
    });
    await this.messages.save(message);

    this.gateway.emitChatMessage({
      quoteRequestId: dto.quoteRequestId,
      supplierId: supplier.id,
      userId: user.id,
      body: dto.body,
      direction: 'user-to-supplier',
      createdAt: message.createdAt,
    });

    return message;
  }
}
