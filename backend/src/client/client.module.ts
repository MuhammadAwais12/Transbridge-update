import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ClientService } from './client.service';
import { ClientUser, ClientProfile } from './client.entity';
import { Account } from './account.entity';
import { Beneficiary } from './beneficiary.entity';
import { Transaction } from './transaction.entity';
import { ResetPassword } from './reset-password.entity';
import { ClientController } from './client.controller';
import { jwtSecret } from '../auth/jwt-secret';
import { WalletModule } from '../msb-wallet/wallet.module';
import { BridgeModule } from 'src/integration/bridge/bridge.module';
import { EmailModule } from '../email/email.module';
import { Msb } from 'src/msb-admin/msb-admin.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ClientUser,
      ClientProfile,
      Account,
      Beneficiary,
      Transaction,
      Msb,
      ResetPassword,
    ]),
    JwtModule.register({
      secret: jwtSecret(),
      signOptions: { expiresIn: '7d' },
    }),
    WalletModule,
    forwardRef(() => BridgeModule),
    EmailModule,
  ],
  controllers: [ClientController],
  providers: [ClientService],
  exports: [ClientService],
})
export class ClientModule {}
