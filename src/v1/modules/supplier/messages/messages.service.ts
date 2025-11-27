import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Message } from '../../../entities/messages.entity';
import { SendMessageDto } from './dto/send-message.dto';
import { Supplier } from '../../../entities/supplier.entity';
import { User } from '../../../entities/user.entity';
import { Chats } from '../../../entities/chats.entity';
import { ChatSocketService } from '../../sockets/chat/chat-socket.service';

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

  async listForSupplier(supplierId: string, userId?: string) {
    if (userId) {
      const chat = await this.ensureChat(userId, supplierId);
      return this.messages.find({
        where: { chat: { id: chat.id } as any },
        relations: ['chat', 'chat.user', 'chat.supplier'],
        order: { createdAt: 'ASC' },
        take: 100,
      });
    }
    const chats = await this.chats.find({
      where: { supplier: { id: supplierId } as any },
      relations: ['user'],
      order: { createdAt: 'DESC' },
      take: 20,
    });
    const chatIds = chats.map((chat) => chat.id);
    if (!chatIds.length) return [];
    return this.messages.find({
      where: { chat: { id: In(chatIds) } as any },
      relations: ['chat', 'chat.user', 'chat.supplier'],
      order: { createdAt: 'DESC' },
      take: 100,
    });
  }

  async sendFromSupplier(supplierId: string, dto: SendMessageDto) {
    const supplier = await this.suppliers.findOne({
      where: { id: supplierId },
      relations: ['user'],
    });
    if (!supplier || !supplier.user) throw new NotFoundException('Supplier not found');
    const user = await this.users.findOne({
      where: { id: dto.userId },
    });
    if (!user) throw new NotFoundException('User not found');

    const chat = await this.ensureChat(user.id, supplierId);

    const message = this.messages.create({
      chat,
      sender: supplier.user,
      content: dto.message,
      isRead: false,
    });
    await this.messages.save(message);

    this.chatSocket.emitMessage({
      messageId: message.id,
      chatId: chat.id,
      senderId: supplier.user.id,
      senderRole: 'supplier',
      recipientId: user.id,
      content: dto.message,
      createdAt: message.createdAt.toISOString(),
    });

    return message;
  }

  private async ensureChat(userId: string, supplierId: string) {
    const existing = await this.chats.findOne({
      where: {
        user: { id: userId } as any,
        supplier: { id: supplierId } as any,
      },
      relations: ['user', 'supplier', 'supplier.user'],
    });
    if (existing) return existing;

    const user = await this.users.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const supplier = await this.suppliers.findOne({
      where: { id: supplierId },
      relations: ['user'],
    });
    if (!supplier || !supplier.user) throw new NotFoundException('Supplier not found');

    const chat = this.chats.create({ user, supplier });
    return this.chats.save(chat);
  }
}
