import { Controller, Post, Body, BadRequestException, Get, Param, Query } from '@nestjs/common';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiQuery } from '@nestjs/swagger';
import { WalletService } from './wallet.service';
import { AccessService, Caller } from '../auth/access.service';
import { Authenticated, CurrentCaller } from '../auth/caller.guard';

@ApiTags('Wallet')
@Authenticated()
@Controller('wallet')
export class WalletController {
  constructor(
    private readonly walletService: WalletService,
    private readonly access: AccessService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new wallet' })
  @ApiBody({ type: CreateWalletDto })
  @ApiResponse({ status: 201, description: 'Wallet created successfully' })
  @ApiResponse({ status: 400, description: 'Wallet creation failed' })
  async create(@Body() createWalletDto: CreateWalletDto, @CurrentCaller() caller: Caller) {
    await this.access.assertClient(caller, createWalletDto.client_id);
    // Call the service to handle wallet creation logic
    const wallet = await this.walletService.createWallet(createWalletDto);
    if (!wallet) {
      throw new BadRequestException('Failed to create wallet');
    }
    return wallet;
  }

  @Get('client/:clientId')
  @ApiOperation({ summary: 'Get wallets by client ID' })
  async getWalletsByClient(@Param('clientId') clientId: string, @CurrentCaller() caller: Caller) {
    await this.access.assertClient(caller, clientId);
    return this.walletService.getWalletsByClientId(clientId);
  }

  @Get()
  @ApiOperation({ summary: "Get wallets: an MSB admin gets their MSB's wallets, a client gets their own" })
  @ApiQuery({ name: 'msb_id', required: false, description: 'MSB ID to filter wallets (must be your own MSB)' })
  async getAllWallets(@CurrentCaller() caller: Caller, @Query('msb_id') msbId?: string) {
    if (!this.access.isMsbAdmin(caller)) {
      if (msbId) this.access.assertMsb(caller, msbId);
      return caller.clientId ? this.walletService.getWalletsByClientId(caller.clientId) : [];
    }
    this.access.assertMsb(caller, msbId ?? caller.msbId);
    return this.walletService.getAllWallets(caller.msbId as string);
  }
}
