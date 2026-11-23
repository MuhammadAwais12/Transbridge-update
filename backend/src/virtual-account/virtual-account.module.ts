import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VirtualAccountController } from './virtual-account.controller';
import { VirtualAccountService } from './virtual-account.service';
import { VirtualAccount } from './virtual-account.entity';
import { ClientProfile } from '../client/client.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([VirtualAccount, ClientProfile]),
  ],
  controllers: [VirtualAccountController],
  providers: [VirtualAccountService],
  exports: [VirtualAccountService],
})
export class VirtualAccountModule {} 