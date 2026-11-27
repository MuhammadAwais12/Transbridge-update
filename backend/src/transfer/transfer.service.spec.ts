import { Repository } from 'typeorm';
import { Account } from '../client/account.entity';
import { ClientProfile } from '../client/client.entity';
import { Beneficiary } from '../client/beneficiary.entity';
import { Transaction } from '../client/transaction.entity';
import { Wallet } from '../msb-wallet/wallet.entity';
import { TransferService } from './transfer.service';
import { WebhookService } from './webhook.service';

describe('TransferService', () => {
  describe('approveTransaction', () => {
    it('allows only one concurrent approval to initiate a payout', async () => {
      const transaction = {
        id: 'transaction-1',
        client_id: 'client-1',
        status: 'payin_completed',
        metadata: {
          awaiting_approval: true,
          payout_quote_id: 'quote-1',
          payout_quote_data: {
            id: 'quote-1',
            sender_amount: '10',
            receiver_amount: '10',
          },
        },
      };
      let claimed = false;
      const transactionRepository = {
        findOne: jest.fn().mockImplementation(async () => ({ ...transaction, metadata: { ...transaction.metadata } })),
        update: jest.fn().mockImplementation(async () => {
          if (claimed) {
            return { affected: 0 };
          }
          claimed = true;
          return { affected: 1 };
        }),
        save: jest.fn().mockImplementation(async (value) => value),
      };
      const clientRepository = {
        findOne: jest.fn().mockResolvedValue({
          id: 'client-1',
          user_id: 'user-1',
          wallet_address: 'wallet-1',
        }),
      };
      const service = new TransferService(
        transactionRepository as unknown as Repository<Transaction>,
        {} as Repository<Wallet>,
        {} as Repository<Beneficiary>,
        {} as Repository<Account>,
        clientRepository as unknown as Repository<ClientProfile>,
        {} as WebhookService,
      );
      const previousEnv = {
        onlineBankingUrl: process.env.PROVIDER_ONLINE_BANKING_URL,
        blindPayInstanceId: process.env.PROVIDER_BLINDPAY_INSTANCE_ID,
        blindPayApiKey: process.env.PROVIDER_BLINDPAY_API_KEY,
      };
      process.env.PROVIDER_ONLINE_BANKING_URL = 'https://provider.test';
      process.env.PROVIDER_BLINDPAY_INSTANCE_ID = 'instance-1';
      process.env.PROVIDER_BLINDPAY_API_KEY = 'test-key';
      const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => ({ id: 'payout-1' }),
      } as Response);

      const dto = { transaction_id: 'transaction-1', wallet_address: 'wallet-1' };
      try {
        const results = await Promise.allSettled([
          service.approveTransaction(dto, { userId: 'user-1', id: 'user-1' }),
          service.approveTransaction(dto, { userId: 'user-1', id: 'user-1' }),
        ]);

        expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
        expect(results.filter((result) => result.status === 'rejected')).toHaveLength(1);
        expect(fetchSpy).toHaveBeenCalledTimes(1);
      } finally {
        fetchSpy.mockRestore();
        if (previousEnv.onlineBankingUrl === undefined) {
          delete process.env.PROVIDER_ONLINE_BANKING_URL;
        } else {
          process.env.PROVIDER_ONLINE_BANKING_URL = previousEnv.onlineBankingUrl;
        }
        if (previousEnv.blindPayInstanceId === undefined) {
          delete process.env.PROVIDER_BLINDPAY_INSTANCE_ID;
        } else {
          process.env.PROVIDER_BLINDPAY_INSTANCE_ID = previousEnv.blindPayInstanceId;
        }
        if (previousEnv.blindPayApiKey === undefined) {
          delete process.env.PROVIDER_BLINDPAY_API_KEY;
        } else {
          process.env.PROVIDER_BLINDPAY_API_KEY = previousEnv.blindPayApiKey;
        }
      }
    });
  });
});
