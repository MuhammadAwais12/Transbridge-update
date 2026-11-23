import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransferController } from './transfer.controller';
import { TransferService } from './transfer.service';
import { WebhookService } from './webhook.service';
import { WebhookGateway } from './webhook.gateway';
import { TransactionController } from './transaction.controller';
import { BeneficiaryController } from './beneficiary.controller';
import { AccountController } from './account.controller';
import { Transaction } from '../client/transaction.entity';
import { Wallet } from '../msb-wallet/wallet.entity';
import { Beneficiary } from '../client/beneficiary.entity';
import { Account } from '../client/account.entity';
import { ClientProfile } from '../client/client.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Transaction, Wallet, Beneficiary, Account, ClientProfile]),
  ],
  controllers: [TransferController, TransactionController, BeneficiaryController, AccountController],
  providers: [TransferService, WebhookService, WebhookGateway],
  exports: [TransferService, WebhookService, WebhookGateway],
})
export class TransferModule {} 