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
import { BridgeModule } from './integration/bridge/bridge.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { AccessModule } from './auth/access.module';

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

@Module({
  imports: [
    ThrottlerModule.forRoot({
      errorMessage: () => 'Too many requests. Try again later',
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
            // Per-account key: rotating IPs must not reset an account's budget.
            // Per-IP limits come from the separate 'ip' throttler.
            return email ?? ip ?? ipFromIps ?? 'anonymous';
          },
        },
        {
          name: 'ip',
          limit: 1000000,
          ttl: 180000,
          getTracker: (req: Record<string, unknown>): string => {
            const ip = (req as { ip?: unknown }).ip;
            if (typeof ip === 'string') return ip;
            const ips = (req as { ips?: unknown }).ips;
            if (Array.isArray(ips) && typeof ips[0] === 'string') return ips[0];
            return 'anonymous';
          },
        },
      ],
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: requireEnv('DB_HOST'),
      port: parseInt(process.env.DB_PORT ?? '5432', 10),
      username: requireEnv('DB_USER'),
      password: requireEnv('DB_PASSWORD'),
      database: requireEnv('DB_NAME'),
      ssl:
        process.env.DB_SSL === 'true'
          ? {
              rejectUnauthorized: true,
              ...(process.env.DB_SSL_CA ? { ca: process.env.DB_SSL_CA } : {}),
            }
          : false,
      autoLoadEntities: true,
      synchronize: process.env.DB_SYNC === 'true', // local dev only
    }),
    AccessModule,
    MsbAdminModule,
    ClientModule,
    AccountModule,
    WalletModule,
    TransferModule,
    VirtualAccountModule,
    UploadModule,
    BridgeModule,
  ],
  controllers: [AppController, WebhookController],
  providers: [AppService],
})
export class AppModule {}
