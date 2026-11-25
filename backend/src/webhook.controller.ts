import { Controller, Post, Req, Res, HttpCode, RawBodyRequest, Logger } from '@nestjs/common';
import { ProviderConfigError } from './config/providers.config';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Response, Request } from 'express';
import { TransferService } from './transfer/transfer.service';
import { Authenticated } from './auth/caller.guard';

@ApiTags('Webhook')
@Controller('webhook')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  constructor(private readonly transferService: TransferService) {}

  @Post()
  @HttpCode(200)
  @ApiOperation({ summary: 'Receive BlindPay webhook events' })
  async webhook(@Req() req: RawBodyRequest<Request>, @Res() res: Response) {
    try {
      // req.rawBody is populated because main.ts creates the app with rawBody: true
      await this.transferService.handleWebhook(req.body, req.headers, req.rawBody);
      res.status(200).send('OK');
    } catch (err) {
      if (err instanceof ProviderConfigError) {
        // Public endpoint: keep the env variable name in the server log only.
        this.logger.error(`Webhook not configured: ${err.message}`);
        res.status(503).send('Webhook not configured');
        return;
      }
      console.error('Webhook processing failed:', err);
      res.status(400).send('Webhook processing failed: ' + err.message);
    }
  }

  @Post('test')
  @Authenticated() // not public: only POST /webhook (signature-verified) is
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