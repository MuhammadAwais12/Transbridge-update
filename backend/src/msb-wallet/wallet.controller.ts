import { Controller, Post, Body, BadRequestException, Get, Param, Query } from '@nestjs/common';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiQuery } from '@nestjs/swagger';
import { WalletService } from './wallet.service';

@ApiTags('Wallet')
@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new wallet' })
  @ApiBody({ type: CreateWalletDto })
  @ApiResponse({ status: 201, description: 'Wallet created successfully' })
  @ApiResponse({ status: 400, description: 'Wallet creation failed' })
  async create(@Body() createWalletDto: CreateWalletDto) {
    // Call the service to handle wallet creation logic
    const wallet = await this.walletService.createWallet(createWalletDto);
    if (!wallet) {
      throw new BadRequestException('Failed to create wallet');
    }
    return wallet;
  }

  @Get('client/:clientId')
  @ApiOperation({ summary: 'Get wallets by client ID' })
  async getWalletsByClient(@Param('clientId') clientId: string) {
    return this.walletService.getWalletsByClientId(clientId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all wallets (optionally filtered by MSB ID)' })
  @ApiQuery({ name: 'msb_id', required: false, description: 'MSB ID to filter wallets' })
  async getAllWallets(@Query('msb_id') msbId?: string) {
    return this.walletService.getAllWallets(msbId);
  }
} 