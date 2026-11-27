import { WebSocketGateway, WebSocketServer, SubscribeMessage, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { Transaction } from '../client/transaction.entity';
import { AccessService } from '../auth/access.service';
import { getAllowedCorsOrigins } from '../config/cors.config';
import {
  isSessionAuthTimeValid,
  MAX_SESSION_SECONDS,
} from '../auth/session-token';

@WebSocketGateway({
  cors: {
    origin: (origin, callback) => {
      callback(
        null,
        !origin || getAllowedCorsOrigins().includes(origin),
      );
    },
    credentials: true,
  },
})
export class WebhookGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(WebhookGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly access: AccessService,
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
  ) {}

  async handleConnection(client: Socket) {
    const authToken = client.handshake.auth?.token;
    const authorization = client.handshake.headers.authorization;
    const token =
      typeof authToken === 'string'
        ? authToken
        : authorization?.startsWith('Bearer ')
          ? authorization.slice(7)
          : undefined;

    if (!token) {
      client.disconnect(true);
      return;
    }

    try {
      const payload = await this.jwtService.verifyAsync<{
        sub: string;
        tokenVersion: number;
        authTime: number;
        exp: number;
      }>(token);
      if (!isSessionAuthTimeValid(payload.authTime)) {
        throw new UnauthorizedException('Session expired');
      }
      const caller = await this.access.resolveCaller({
        userId: payload.sub,
        tokenVersion: payload.tokenVersion,
      });
      client.data.caller = caller;
      const sessionExpiresAt = (payload.authTime + MAX_SESSION_SECONDS) * 1000;
      const expiresIn = Math.min(payload.exp * 1000, sessionExpiresAt) - Date.now();
      client.data.authExpiryTimer = setTimeout(
        () => client.disconnect(true),
        Math.min(expiresIn, 2 ** 31 - 1),
      );
    } catch (error) {
      this.logger.warn(
        `Rejected unauthenticated WebSocket connection: ${
          error instanceof Error ? error.message : 'invalid token'
        }`,
      );
      client.disconnect(true);
      return;
    }

    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    if (client.data.authExpiryTimer) {
      clearTimeout(client.data.authExpiryTimer);
    }
  }

  // Handle client subscription to specific transaction updates
  @SubscribeMessage('subscribe_transaction')
  async handleSubscribeTransaction(
    client: Socket,
    input: string | { transaction_id?: string; transactionId?: string },
  ) {
    const transactionId =
      typeof input === 'string'
        ? input
        : input?.transaction_id ?? input?.transactionId;
    if (
      !transactionId ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        transactionId,
      )
    ) {
      client.emit('subscription_error', { message: 'Invalid transaction ID' });
      return;
    }

    const tx = await this.transactionRepository.findOne({
      where: { id: transactionId },
      select: ['id', 'client_id'],
    });
    const caller = client.data.caller;
    if (!tx || !caller) {
      client.emit('subscription_error', {
        message: 'Transaction not found or access denied',
      });
      return;
    }

    try {
      await this.access.assertClient(caller, tx.client_id);
    } catch (error) {
      if (!(error instanceof UnauthorizedException)) {
        this.logger.warn(`Denied transaction subscription: ${transactionId}`);
      }
      client.emit('subscription_error', {
        message: 'Transaction not found or access denied',
      });
      return;
    }

    this.logger.log(`Client ${client.id} subscribed to transaction: ${transactionId}`);
    client.join(`transaction_${transactionId}`);
  }

  // Handle client unsubscription from specific transaction updates
  @SubscribeMessage('unsubscribe_transaction')
  handleUnsubscribeTransaction(client: Socket, transactionId: string) {
    this.logger.log(`Client ${client.id} unsubscribed from transaction: ${transactionId}`);
    client.leave(`transaction_${transactionId}`);
  }

  // Method to send transaction-specific updates
  sendTransactionUpdate(transactionId: string, eventType: string, data: any) {
    this.server.to(`transaction_${transactionId}`).emit('transaction_update', {
      transaction_id: transactionId,
      event_type: eventType,
      data: data
    });
  }
} 