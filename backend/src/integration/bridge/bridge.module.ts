import { Module, forwardRef } from '@nestjs/common';
import { BridgeService } from './bridge.service';
import { BridgeController } from './bridge.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserTransfer } from './entity/user-transfer.entity';
import { ClientProfile } from '../../client/client.entity';
import { UserBeneficiary } from './entity/user-beneficiary.entity';
import { ClientModule } from 'src/client/client.module';
import { FeeExternalAccount } from './entity/fee-external_account.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserTransfer,
      ClientProfile,
      UserBeneficiary,
      FeeExternalAccount,
    ]),
    forwardRef(() => ClientModule),
  ],
  controllers: [BridgeController],
  providers: [BridgeService],
  exports: [BridgeService],
})
export class BridgeModule {}
