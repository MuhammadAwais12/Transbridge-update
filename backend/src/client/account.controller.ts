import { Controller, Post, Body, Get, Query, Param, Put, BadRequestException, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiQuery } from '@nestjs/swagger';
import { AccountService } from './account.service';
import { CreateAccountDto, UpdateAccountStatusDto, UpdateAccountLimitsDto, UpdateAccountBalanceDto } from './dto/account.dto';
import { AccessService, Caller } from '../auth/access.service';
import { Authenticated, CurrentCaller } from '../auth/caller.guard';

@ApiTags('Account')
@Authenticated()
@Controller('account')
export class AccountController {
  constructor(
    private readonly accountService: AccountService,
    private readonly access: AccessService,
  ) {}

  /** Loads the account (404) and checks the caller may access its client (403). */
  private async loadOwned(caller: Caller, id: string) {
    const account = await this.accountService.getById(id);
    await this.access.assertClient(caller, account.client_id);
    return account;
  }

  @Post('create')
  @ApiOperation({ summary: 'Create a new account' })
  @ApiBody({ type: CreateAccountDto })
  @ApiResponse({ status: 201, description: 'Account created successfully' })
  async create(@Body() dto: CreateAccountDto, @CurrentCaller() caller: Caller) {
    const client = await this.access.assertClient(caller, dto.client_id);
    if (dto.msb_id !== client.msb_id) {
      throw new ForbiddenException('msb_id does not match the client');
    }
    return this.accountService.create(dto);
  }

  @Get('list')
  @ApiOperation({ summary: 'List accounts (scoped to the caller)' })
  @ApiQuery({ name: 'client_id', required: false })
  @ApiQuery({ name: 'msb_id', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'account_type', required: false })
  @ApiQuery({ name: 'user_id', required: false }) // Added for frontend compatibility
  async list(@Query() query: any, @CurrentCaller() caller: Caller) {
    // `user_id` is treated as a clients.id by AccountService.list
    const requestedClientId: string | undefined = query.client_id ?? query.user_id;
    if (requestedClientId) {
      await this.access.assertClient(caller, requestedClientId);
    } else if (this.access.isMsbAdmin(caller)) {
      this.access.assertMsb(caller, query.msb_id ?? caller.msbId);
      query.msb_id = caller.msbId;
    } else {
      if (query.msb_id) this.access.assertMsb(caller, query.msb_id);
      if (!caller.clientId) return [];
      query.client_id = caller.clientId;
    }
    return this.accountService.list(query);
  }

  @Get('msb/:msb_id')
  @ApiOperation({ summary: 'List all accounts for an MSB' })
  async listByMsb(@Param('msb_id') msb_id: string, @CurrentCaller() caller: Caller) {
    // Validate msb_id parameter
    if (!msb_id || msb_id === 'undefined' || msb_id === 'null') {
      throw new BadRequestException('Invalid MSB ID provided');
    }
    this.access.assertMsb(caller, msb_id);
    return this.accountService.listByMsb(msb_id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get account by ID' })
  async getById(@Param('id') id: string, @CurrentCaller() caller: Caller) {
    return this.loadOwned(caller, id);
  }

  @Put('update-status/:id')
  @ApiOperation({ summary: 'Update account status (MSB admin only)' })
  @ApiBody({ type: UpdateAccountStatusDto })
  async updateStatus(@Param('id') id: string, @Body() dto: UpdateAccountStatusDto, @CurrentCaller() caller: Caller) {
    this.access.requireMsbAdmin(caller);
    await this.loadOwned(caller, id);
    return this.accountService.updateStatus(id, dto);
  }

  @Put('update-limits/:id')
  @ApiOperation({ summary: 'Update account limits/fees (MSB admin only)' })
  @ApiBody({ type: UpdateAccountLimitsDto })
  async updateLimits(@Param('id') id: string, @Body() dto: UpdateAccountLimitsDto, @CurrentCaller() caller: Caller) {
    this.access.requireMsbAdmin(caller);
    await this.loadOwned(caller, id);
    return this.accountService.updateLimits(id, dto);
  }

  @Put('update-balance/:id')
  @ApiOperation({ summary: 'Update account balance (admin only)' })
  @ApiBody({ type: UpdateAccountBalanceDto })
  async updateBalance(@Param('id') id: string, @Body() dto: UpdateAccountBalanceDto, @CurrentCaller() caller: Caller) {
    this.access.requireMsbAdmin(caller);
    await this.loadOwned(caller, id);
    return this.accountService.updateBalance(id, dto);
  }

  @Post('generate-pin/:id')
  @ApiOperation({ summary: 'Generate account PIN' })
  async generatePin(@Param('id') id: string, @CurrentCaller() caller: Caller) {
    await this.loadOwned(caller, id);
    return this.accountService.generatePin(id);
  }

  @Get('pin/:id')
  @ApiOperation({ summary: 'Get account PIN (secure)' })
  async getPin(@Param('id') id: string, @CurrentCaller() caller: Caller) {
    await this.loadOwned(caller, id);
    return this.accountService.getPin(id);
  }
}
