import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { MsbAdminController } from './msb-admin.controller';
import { MsbAdminService } from './msb-admin.service';
import { User, Msb, Activity } from './msb-admin.entity';
import { jwtSecret } from '../auth/jwt-secret';
import { EmailModule } from '../email/email.module';
import { UploadModule } from '../upload/upload.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Msb, Activity]),
    JwtModule.register({
      secret: jwtSecret(),
      signOptions: { expiresIn: '7d' },
    }),
    EmailModule,
    UploadModule,
  ],
  controllers: [MsbAdminController],
  providers: [MsbAdminService],
})
export class MsbAdminModule {} 