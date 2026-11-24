import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User, Msb } from '../msb-admin/msb-admin.entity';
import { ClientProfile } from '../client/client.entity';
import { AccessService } from './access.service';
import { CallerGuard } from './caller.guard';

/** Global so every controller can use @Authenticated() / AccessService without re-importing. */
@Global()
@Module({
  imports: [TypeOrmModule.forFeature([User, Msb, ClientProfile])],
  providers: [AccessService, CallerGuard],
  exports: [AccessService, CallerGuard],
})
export class AccessModule {}
