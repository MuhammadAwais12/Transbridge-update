import { ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { Transaction } from '../client/transaction.entity';
import { AccessService } from '../auth/access.service';
import { WebhookGateway } from './webhook.gateway';
import { Socket } from 'socket.io';

describe('WebhookGateway', () => {
  it('rejects subscriptions when the caller does not own the transaction', async () => {
    const transactionId = 'c5429ac4-1e1f-42a3-a922-e7c677269b04';
    const access = {
      assertClient: jest
        .fn()
        .mockRejectedValue(new ForbiddenException('Access denied')),
    };
    const transactionRepository = {
      findOne: jest.fn().mockResolvedValue({
        id: transactionId,
        client_id: 'other-client',
      }),
    };
    const gateway = new WebhookGateway(
      {} as JwtService,
      access as unknown as AccessService,
      transactionRepository as unknown as Repository<Transaction>,
    );
    const socket = {
      id: 'socket-1',
      data: { caller: { userId: 'user-1' } },
      emit: jest.fn(),
      join: jest.fn(),
    } as unknown as Socket;

    await gateway.handleSubscribeTransaction(socket, transactionId);

    expect(access.assertClient).toHaveBeenCalledWith(
      socket.data.caller,
      'other-client',
    );
    expect(socket.join).not.toHaveBeenCalled();
    expect(socket.emit).toHaveBeenCalledWith('subscription_error', {
      message: 'Transaction not found or access denied',
    });
  });

  it('disconnects clients without a JWT', async () => {
    const gateway = new WebhookGateway(
      {} as JwtService,
      {} as AccessService,
      {} as Repository<Transaction>,
    );
    const socket = {
      id: 'socket-1',
      handshake: { auth: {}, headers: {} },
      disconnect: jest.fn(),
    } as unknown as Socket;

    await gateway.handleConnection(socket);

    expect(socket.disconnect).toHaveBeenCalledWith(true);
  });
});
