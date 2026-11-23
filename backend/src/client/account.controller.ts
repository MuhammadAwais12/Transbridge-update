import { Controller, Post, Body, Get, Query, Param, Put, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiQuery } from '@nestjs/swagger';
import { AccountService } from './account.service';
import { CreateAccountDto, UpdateAccountStatusDto, UpdateAccountLimitsDto, UpdateAccountBalanceDto } from './dto/account.dto';

@ApiTags('Account')
@Controller('account')
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @Post('create')
  @ApiOperation({ summary: 'Create a new account' })
  @ApiBody({ type: CreateAccountDto })
  @ApiResponse({ status: 201, description: 'Account created successfully' })
  async create(@Body() dto: CreateAccountDto) {
    console.log('Received DTO:', dto); // Debug log
    return this.accountService.create(dto);
  }

  @Get('list')
  @ApiOperation({ summary: 'List accounts' })
  @ApiQuery({ name: 'client_id', required: false })
  @ApiQuery({ name: 'msb_id', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'account_type', required: false })
  @ApiQuery({ name: 'user_id', required: false }) // Added for frontend compatibility
  async list(@Query() query: any) {
    return this.accountService.list(query);
  }

  @Get('msb/:msb_id')
  @ApiOperation({ summary: 'List all accounts for an MSB' })
  async listByMsb(@Param('msb_id') msb_id: string) {
    // Validate msb_id parameter
    if (!msb_id || msb_id === 'undefined' || msb_id === 'null') {
      throw new BadRequestException('Invalid MSB ID provided');
    }
    return this.accountService.listByMsb(msb_id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get account by ID' })
  async getById(@Param('id') id: string) {
    return this.accountService.getById(id);
  }

  @Put('update-status/:id')
  @ApiOperation({ summary: 'Update account status' })
  @ApiBody({ type: UpdateAccountStatusDto })
  async updateStatus(@Param('id') id: string, @Body() dto: UpdateAccountStatusDto) {
    return this.accountService.updateStatus(id, dto);
  }

  @Put('update-limits/:id')
  @ApiOperation({ summary: 'Update account limits/fees' })
  @ApiBody({ type: UpdateAccountLimitsDto })
  async updateLimits(@Param('id') id: string, @Body() dto: UpdateAccountLimitsDto) {
    return this.accountService.updateLimits(id, dto);
  }

  @Put('update-balance/:id')
  @ApiOperation({ summary: 'Update account balance (admin only)' })
  @ApiBody({ type: UpdateAccountBalanceDto })
  async updateBalance(@Param('id') id: string, @Body() dto: UpdateAccountBalanceDto) {
    return this.accountService.updateBalance(id, dto);
  }

  @Post('generate-pin/:id')
  @ApiOperation({ summary: 'Generate account PIN' })
  async generatePin(@Param('id') id: string) {
    return this.accountService.generatePin(id);
  }

  @Get('pin/:id')
  @ApiOperation({ summary: 'Get account PIN (secure)' })
  async getPin(@Param('id') id: string) {
    return this.accountService.getPin(id);
  }
} 