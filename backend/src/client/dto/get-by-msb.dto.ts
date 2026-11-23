import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class GetByMsbDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  msb_id: string;
}


