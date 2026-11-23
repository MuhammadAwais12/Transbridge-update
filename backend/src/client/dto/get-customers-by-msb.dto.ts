import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class GetCustomersByMsbDto {
  @ApiProperty({
    format: 'uuid',
    description: 'The MSB ID to fetch customers for',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  msb_id: string;
}
