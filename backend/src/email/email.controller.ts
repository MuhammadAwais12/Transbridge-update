import { Controller, Post, Body, HttpStatus, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { EmailService } from './email.service';
import { WelcomeEmailDto } from './dto/welcome-email.dto';
import { KycEmailDto } from './dto/kyc-email.dto';

@ApiTags('Email')
@Controller('email')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Post('welcome')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Send welcome email',
    description: 'Sends a welcome email to new users with their account details',
  })
  @ApiBody({ type: WelcomeEmailDto })
  @ApiResponse({
    status: 200,
    description: 'Welcome email sent successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        messageId: { type: 'string', example: '49a3999c-0ce1-4ea6-ab68-afcd6dc2e794' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid input data',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error - Failed to send email',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        error: { type: 'string', example: 'Failed to send email' },
      },
    },
  })
  async sendWelcomeEmail(@Body() welcomeEmailDto: WelcomeEmailDto) {
    return await this.emailService.sendWelcomeEmail(welcomeEmailDto);
  }

  @Post('kyc')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Send KYC email',
    description: 'Sends a KYC email with terms of service and customer details links',
  })
  @ApiBody({ type: KycEmailDto })
  @ApiResponse({
    status: 200,
    description: 'KYC email sent successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        messageId: { type: 'string', example: '49a3999c-0ce1-4ea6-ab68-afcd6dc2e794' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid input data',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error - Failed to send email',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        error: { type: 'string', example: 'Failed to send email' },
      },
    },
  })
  async sendKycEmail(@Body() kycEmailDto: KycEmailDto) {
    return await this.emailService.sendKycEmail(kycEmailDto);
  }
} 