import { WebSocketGateway, WebSocketServer, SubscribeMessage, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: "*",
  },
})
export class WebhookGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(WebhookGateway.name);
  private connectedClients = new Set<Socket>();

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    this.connectedClients.add(client);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    this.connectedClients.delete(client);
  }

  // Method to broadcast webhook events to all connected clients
  broadcastWebhookEvent(eventType: string, data: any) {
    this.logger.log(`Broadcasting webhook event: ${eventType}`, data);
    this.server.emit('webhook', {
      event_type: eventType,
      data: data
    });
  }

  // Method to send webhook event to specific client (if needed)
  sendToClient(clientId: string, eventType: string, data: any) {
    this.server.to(clientId).emit('webhook', {
      event_type: eventType,
      data: data
    });
  }

  // Handle client subscription to specific transaction updates
  @SubscribeMessage('subscribe_transaction')
  handleSubscribeTransaction(client: Socket, transactionId: string) {
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