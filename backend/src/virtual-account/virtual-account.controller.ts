import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { VirtualAccountService } from './virtual-account.service';
import { CreateVirtualAccountDto } from './dto/create-virtual-account.dto';
import { VirtualAccount, VirtualAccountStatus } from './virtual-account.entity';
import { AccessService, Caller } from '../auth/access.service';
import { Authenticated, CurrentCaller } from '../auth/caller.guard';

@Authenticated()
@Controller('virtual-account')
export class VirtualAccountController {
  constructor(
    private readonly virtualAccountService: VirtualAccountService,
    private readonly access: AccessService,
  ) {}

  /** Caller-scoped list: MSB admin -> their MSB, client -> their own. */
  private async listForCaller(caller: Caller, msbId?: string): Promise<VirtualAccount[]> {
    if (this.access.isMsbAdmin(caller)) {
      this.access.assertMsb(caller, msbId ?? caller.msbId);
      return this.virtualAccountService.getVirtualAccountsByMsb(caller.msbId as string);
    }
    if (msbId) this.access.assertMsb(caller, msbId);
    return caller.clientId
      ? this.virtualAccountService.getVirtualAccountsByClient(caller.clientId)
      : [];
  }

  /** Loads the VA (404 if missing) and checks the caller may access its client (403). */
  private async loadOwned(caller: Caller, id: string): Promise<VirtualAccount> {
    const va = await this.virtualAccountService.getVirtualAccountById(id);
    await this.access.assertClient(caller, va.clientId);
    return va;
  }

  @Post()
  async createVirtualAccount(@Body() dto: CreateVirtualAccountDto, @CurrentCaller() caller: Caller) {
    await this.access.assertClient(caller, dto.clientId);
    return this.virtualAccountService.createVirtualAccount(dto);
  }

  @Get('list')
  async getVirtualAccountsList(@CurrentCaller() caller: Caller, @Query('msb_id') msbId?: string) {
    const virtualAccounts = await this.listForCaller(caller, msbId);
    return { virtualAccounts };
  }

  @Get('client/:clientId')
  async getVirtualAccountsByClient(@Param('clientId') clientId: string, @CurrentCaller() caller: Caller) {
    await this.access.assertClient(caller, clientId);
    return this.virtualAccountService.getVirtualAccountsByClient(clientId);
  }

  @Get(':id')
  async getVirtualAccountById(@Param('id') id: string, @CurrentCaller() caller: Caller) {
    return this.loadOwned(caller, id);
  }

  @Get()
  async getAllVirtualAccounts(@CurrentCaller() caller: Caller) {
    return this.listForCaller(caller);
  }

  @Put(':id/status')
  async updateVirtualAccountStatus(
    @Param('id') id: string,
    @Body('status') status: VirtualAccountStatus,
    @CurrentCaller() caller: Caller,
  ) {
    await this.loadOwned(caller, id);
    return this.virtualAccountService.updateVirtualAccountStatus(id, status);
  }

  @Delete(':id')
  async deleteVirtualAccount(@Param('id') id: string, @CurrentCaller() caller: Caller) {
    await this.loadOwned(caller, id);
    await this.virtualAccountService.deleteVirtualAccount(id);
    return { message: 'Virtual account deleted successfully' };
  }
}
