import { Injectable, Logger } from '@nestjs/common';
import {
  SNSClient,
  PublishCommand,
  PublishCommandInput,
} from '@aws-sdk/client-sns';
import {
  SQSClient,
  Message,
  ReceiveMessageCommand,
  DeleteMessageCommand,
  ChangeMessageVisibilityCommand,
  SendMessageCommand,
} from '@aws-sdk/client-sqs';

type QuoteExpiryPayload =
  | {
      type: 'quote-request';
      requestId: string;
      executeAt: string;
    }
  | {
      type: 'supplier-notification';
      notificationId: string;
      executeAt: string;
    };

export type QuoteExpiryQueueMessage = {
  raw: Message;
  payload: QuoteExpiryPayload;
};

@Injectable()
export class QuoteExpiryQueueService {
  private readonly logger = new Logger(QuoteExpiryQueueService.name);
  private readonly region = process.env.AWS_REGION || 'eu-north-1';
  private readonly topicArn = process.env.QUOTE_EXPIRY_SNS_TOPIC_ARN;
  private readonly queueUrl = process.env.QUOTE_EXPIRY_SQS_QUEUE_URL;
  private readonly maxVisibilitySeconds = Math.min(
    43200,
    Number(process.env.QUOTE_EXPIRY_SQS_MAX_VISIBILITY || 3600),
  );
  private readonly credentials = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  };
  private readonly snsClient = this.topicArn
    ? new SNSClient({
        region: this.region,
        credentials: this.credentials,
      })
    : null;
  private readonly sqsClient = this.queueUrl
    ? new SQSClient({
        region: this.region,
        credentials: this.credentials,
      })
    : null;

  async scheduleQuoteRequestExpiry(requestId: string, executeAt: Date) {
    await this.publish({
      type: 'quote-request',
      requestId,
      executeAt: executeAt.toISOString(),
    });
  }

  async scheduleNotificationExpiry(notificationId: string, executeAt: Date) {
    await this.publish({
      type: 'supplier-notification',
      notificationId,
      executeAt: executeAt.toISOString(),
    });
  }

  async receiveBatch(maxMessages = 10): Promise<QuoteExpiryQueueMessage[]> {
    if (!this.sqsClient || !this.queueUrl) return [];
    const command = new ReceiveMessageCommand({
      QueueUrl: this.queueUrl,
      MaxNumberOfMessages: maxMessages,
      MessageAttributeNames: ['All'],
      WaitTimeSeconds: 1,
      VisibilityTimeout: 30,
    });
    const result = await this.sqsClient.send(command);
    const messages = result.Messages || [];
    const parsed: QuoteExpiryQueueMessage[] = [];
    for (const raw of messages) {
      const payload = this.extractPayload(raw);
      if (!payload) {
        await this.delete(raw);
        continue;
      }
      parsed.push({ raw, payload });
    }
    return parsed;
  }

  async delete(message: Message) {
    if (!this.sqsClient || !this.queueUrl || !message.ReceiptHandle) return;
    await this.sqsClient.send(
      new DeleteMessageCommand({
        QueueUrl: this.queueUrl,
        ReceiptHandle: message.ReceiptHandle,
      }),
    );
  }

  async delayUntil(message: Message, executeAt: Date) {
    if (!this.sqsClient || !this.queueUrl || !message.ReceiptHandle) return;
    const now = Date.now();
    const diffSeconds = Math.max(
      0,
      Math.ceil((executeAt.getTime() - now) / 1000),
    );
    const visibility = Math.min(diffSeconds, this.maxVisibilitySeconds);
    await this.sqsClient.send(
      new ChangeMessageVisibilityCommand({
        QueueUrl: this.queueUrl,
        ReceiptHandle: message.ReceiptHandle,
        VisibilityTimeout: visibility,
      }),
    );
  }

  private async publish(payload: QuoteExpiryPayload) {
    if (this.snsClient && this.topicArn) {
      const input: PublishCommandInput = {
        TopicArn: this.topicArn,
        Message: JSON.stringify(payload),
        MessageAttributes: {
          type: { DataType: 'String', StringValue: payload.type },
        },
      };
      await this.snsClient.send(new PublishCommand(input));
      return;
    }
    if (this.sqsClient && this.queueUrl) {
      await this.sqsClient.send(
        new SendMessageCommand({
          QueueUrl: this.queueUrl,
          MessageBody: JSON.stringify(payload),
          MessageAttributes: {
            type: { DataType: 'String', StringValue: payload.type },
          },
        }),
      );
      return;
    }
    this.logger.warn(
      `Quote expiry queue is not configured. Unable to queue payload of type ${payload.type}.`,
    );
  }

  private extractPayload(message: Message): QuoteExpiryPayload | null {
    if (!message.Body) return null;
    try {
      const body = JSON.parse(message.Body);
      const inner = body.Message ? JSON.parse(body.Message) : body;
      if (
        inner.type === 'quote-request' &&
        typeof inner.requestId === 'string' &&
        typeof inner.executeAt === 'string'
      ) {
        return inner;
      }
      if (
        inner.type === 'supplier-notification' &&
        typeof inner.notificationId === 'string' &&
        typeof inner.executeAt === 'string'
      ) {
        return inner;
      }
      this.logger.warn(
        `Unsupported quote expiry payload received: ${message.Body}`,
      );
      return null;
    } catch (error) {
      this.logger.error(
        'Failed to parse quote expiry payload',
        error instanceof Error ? error.stack : undefined,
      );
      return null;
    }
  }
}
