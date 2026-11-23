import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MsbAdminModule } from './msb-admin/msb-admin.module';
import { ClientModule } from './client/client.module';
import { AccountModule } from './client/account.module';
import { WalletModule } from './msb-wallet/wallet.module';
import { TransferModule } from './transfer/transfer.module';
import { VirtualAccountModule } from './virtual-account/virtual-account.module';
import { WebhookController } from './webhook.controller';
import { UploadModule } from './upload/upload.module';
import { EmailModule } from './email/email.module';
import { BridgeModule } from './integration/bridge/bridge.module';
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      errorMessage: () => 'Too many OTP attempts. Try again later',
      throttlers: [
        {
          name: 'otp',
          // High default; actual limits come from route decorators
          limit: 1000000,
          ttl: 180000,
          // Key by email if present, else IP
          getTracker: (req: Record<string, unknown>): string => {
            let email: string | undefined;
            const body = (req as { body?: unknown }).body;
            if (
              typeof body === 'object' &&
              body !== null &&
              'email' in (body as Record<string, unknown>)
            ) {
              const val = (body as { email?: unknown }).email;
              if (typeof val === 'string') email = val.toLowerCase();
            }
            let ip: string | undefined;
            const ipVal = (req as { ip?: unknown }).ip;
            if (typeof ipVal === 'string') ip = ipVal;
            let ipFromIps: string | undefined;
            const ipsVal = (req as { ips?: unknown }).ips;
            if (Array.isArray(ipsVal) && typeof ipsVal[0] === 'string')
              ipFromIps = ipsVal[0];
            return email ?? ip ?? ipFromIps ?? 'anonymous';
          },
        },
      ],
    }),
    // TypeOrmModule.forRoot({
    //   // type: 'postgres',
    //   // host: 'localhost',
    //   // port: 5432,
    //   // username: 'postgres',
    //   // password: '@123qwe',
    //   // database: 'transbridge_dashboard',
    //   // autoLoadEntities: true,
    //   // synchronize: false, // Use migrations, not auto-sync, in production!
    //   type: 'postgres',
    //   host: 'database-1.c1saqqkamrdk.eu-north-1.rds.amazonaws.com',
    //   port: 5432,
    //   username: 'postgres',
    //   password: 'TransBridgeTeam567!',
    //   database: 'postgres',
    //   ssl: { rejectUnauthorized: false },
    //   autoLoadEntities: true,
    //   synchronize: false, // Use migrations, not auto-sync, in production!
    // }),
    TypeOrmModule.forRoot({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT ?? '5432', 10),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  autoLoadEntities: true,
  synchronize: process.env.DB_SYNC === 'true', // local dev only
}),
    MsbAdminModule,
    ClientModule,
    AccountModule,
    WalletModule,
    TransferModule,
    VirtualAccountModule,
    UploadModule,
    EmailModule,
    BridgeModule,
  ],
  controllers: [AppController, WebhookController],
  providers: [AppService],
})
export class AppModule {}
