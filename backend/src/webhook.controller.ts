import { Controller, Post, Req, Res, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Response, Request } from 'express';
import { TransferService } from './transfer/transfer.service';

@ApiTags('Webhook')
@Controller('webhook')
export class WebhookController {
  constructor(private readonly transferService: TransferService) {}

  @Post()
  @HttpCode(200)
  @ApiOperation({ summary: 'Receive BlindPay webhook events' })
  async webhook(@Req() req: Request, @Res() res: Response) {
    try {
      await this.transferService.handleWebhook(req.body, req.headers);
      res.status(200).send('OK');
    } catch (err) {
      console.error('Webhook processing failed:', err);
      res.status(400).send('Webhook processing failed: ' + err.message);
    }
  }

  @Post('test')
  @HttpCode(200)
  @ApiOperation({ summary: 'Test webhook endpoint (for development)' })
  async testWebhook(@Req() req: Request, @Res() res: Response) {
    try {
      console.log('Test webhook received:', req.body);
      res.status(200).send('Test webhook received successfully');
    } catch (err) {
      console.error('Test webhook failed:', err);
      res.status(400).send('Test webhook failed: ' + err.message);
    }
  }
} 