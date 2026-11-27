import { IsEmail, IsNotEmpty, IsString, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class KycEmailDto {
  @ApiProperty({
    description: 'Email address where the KYC email will be sent',
    example: 'customer@example.com',
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'URL for accepting terms of service',
    example: 'https://dashboard.example.com/terms',
  })
  @IsNotEmpty()
  @IsUrl()
  termsOfServiceUrl: string;

  @ApiProperty({
    description: 'URL for adding customer details for KYC',
    example: 'https://dashboard.example.com/kyc',
  })
  @IsNotEmpty()
  @IsUrl()
  customerDetailsUrl: string;
}
