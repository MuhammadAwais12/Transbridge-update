import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { VirtualAccountService } from './virtual-account.service';
import { CreateVirtualAccountDto } from './dto/create-virtual-account.dto';
import { VirtualAccountStatus } from './virtual-account.entity';

@Controller('virtual-account')
export class VirtualAccountController {
  constructor(private readonly virtualAccountService: VirtualAccountService) {}

  @Post()
  async createVirtualAccount(@Body() dto: CreateVirtualAccountDto) {
    return this.virtualAccountService.createVirtualAccount(dto);
  }

  @Get('list')
  async getVirtualAccountsList(@Query('msb_id') msbId: string) {
    // For now, return all virtual accounts since we don't have msb_id filtering yet
    // In the future, we can add msb_id filtering logic
    const virtualAccounts = await this.virtualAccountService.getAllVirtualAccounts();
    return { virtualAccounts };
  }

  @Get('client/:clientId')
  async getVirtualAccountsByClient(@Param('clientId') clientId: string) {
    return this.virtualAccountService.getVirtualAccountsByClient(clientId);
  }

  @Get(':id')
  async getVirtualAccountById(@Param('id') id: string) {
    return this.virtualAccountService.getVirtualAccountById(id);
  }

  @Get()
  async getAllVirtualAccounts() {
    return this.virtualAccountService.getAllVirtualAccounts();
  }

  @Put(':id/status')
  async updateVirtualAccountStatus(
    @Param('id') id: string,
    @Body('status') status: VirtualAccountStatus,
  ) {
    return this.virtualAccountService.updateVirtualAccountStatus(id, status);
  }

  @Delete(':id')
  async deleteVirtualAccount(@Param('id') id: string) {
    await this.virtualAccountService.deleteVirtualAccount(id);
    return { message: 'Virtual account deleted successfully' };
  }
} 