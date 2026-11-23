import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateBrandingDto {
  @ApiPropertyOptional({ example: 'FinTech Solutions Ltd', description: 'MSB Name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: '#3b82f6' })
  @IsOptional()
  @IsString()
  primary_color?: string;

  @ApiPropertyOptional({ example: '#22c55e' })
  @IsOptional()
  @IsString()
  secondary_color?: string;

  @ApiPropertyOptional({ example: '#f97316' })
  @IsOptional()
  @IsString()
  accent_color?: string;

  @ApiPropertyOptional({ example: 'light', enum: ['light', 'dark'] })
  @IsOptional()
  @IsString()
  theme?: string;

  @ApiPropertyOptional({ 
    example: 'https://transbridge-dashboard.s3.eu-north-1.amazonaws.com/logos/uuid.png', 
    description: 'Logo URL (S3 URL), base64 image string (will be uploaded to S3), or empty string to clear' 
  })
  @IsOptional()
  @IsString()
  logo_url?: string;
} 