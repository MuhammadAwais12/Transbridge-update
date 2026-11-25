import { Module } from '@nestjs/common';
import { EmailService } from './email.service';

// No controller: EmailService is used internally (client / msb-admin services) only.
@Module({
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {} 