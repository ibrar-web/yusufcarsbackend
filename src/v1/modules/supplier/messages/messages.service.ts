import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from './entities/message.entity';
import { SendMessageDto } from './dto/send-message.dto';
import { Supplier } from '../../../entities/supplier.entity';
import { User } from '../../../entities/user.entity';
import { QuoteRequest } from '../../../entities/quote-request.entity';
import { ChatSocketService } from '../../sockets/chat/chat-socket.service';

@Injectable()
export class SupplierMessagesService {
  constructor(
    @InjectRepository(Message) private readonly messages: Repository<Message>,
    @InjectRepository(Supplier)
    private readonly suppliers: Repository<Supplier>,
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(QuoteRequest)
    private readonly requests: Repository<QuoteRequest>,
    private readonly chatSocket: ChatSocketService,
  ) {}

  async listForSupplier(supplierId: string, quoteRequestId?: string) {
    const where = quoteRequestId
      ? {
          supplier: { id: supplierId } as any,
          quoteRequest: { id: quoteRequestId } as any,
        }
      : { supplier: { id: supplierId } as any };
    return this.messages.find({
      where,
      order: { createdAt: 'DESC' },
      take: 100,
    });
  }

  async sendFromSupplier(supplierId: string, dto: SendMessageDto) {
    const supplier = await this.suppliers.findOne({
      where: { id: supplierId },
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
      user: quoteRequest.user,
      quoteRequest,
      direction: dto.direction,
      body: dto.body,
    });
    await this.messages.save(message);

    this.chatSocket.emitMessage({
      messageId: message.id,
      quoteRequestId: dto.quoteRequestId,
      senderId: supplier.user.id,
      senderRole: 'supplier',
      recipientId: quoteRequest.user.id,
      body: dto.body,
      createdAt: message.createdAt.toISOString(),
      direction: 'supplier-to-user',
    });

    return message;
  }
}
