import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  Headers,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BridgeService } from './bridge.service';
import { CreateTransferDto } from './dto/transfers.dto';
import {
  BridgeCreateVirtualAccountDto,
  VirtualAccountListDto,
  UpdateDeveloperFeeDto,
} from './dto/virtual-accounts.dto';
import { UpdateCustomerDto } from './dto/customer.dto';
import { FeeExternalAccount } from './entity/fee-external_account.entity';
import {
  CreateFeeExternalAccountDto,
  UpdateFeeExternalAccountDto,
} from './dto/fee-external-accounts.dto';
import { TransactionDetailsListDto } from './dto/transactions.dto';
import { KYCDto } from './dto/kyc.dto';
import { UserTransfer } from './entity/user-transfer.entity';
import { UserBeneficiary } from './entity/user-beneficiary.entity';
import { AccessService, Caller } from '../../auth/access.service';
import { Authenticated, CurrentCaller } from '../../auth/caller.guard';

@Authenticated()
@Controller('bridge')
export class BridgeController {
  constructor(
    private readonly bridgeService: BridgeService,
    private readonly access: AccessService,
    @InjectRepository(UserTransfer)
    private readonly userTransferRepository: Repository<UserTransfer>,
    @InjectRepository(UserBeneficiary)
    private readonly userBeneficiaryRepository: Repository<UserBeneficiary>,
  ) {}

  // ---- ownership helpers (customerID / userID from the URL are never trusted) ----

  /** Customer ref must be the caller's (client) or belong to the admin's MSB; userID likewise. */
  private async assertCustomerAndUser(
    caller: Caller,
    customerID: string,
    userID?: string,
    opts: { userRequired?: boolean } = {},
  ): Promise<void> {
    await this.access.assertCustomerRef(caller, customerID);
    if (!userID) {
      if (opts.userRequired) throw new BadRequestException('userID is required');
      return;
    }
    await this.access.assertUser(caller, userID);
  }

  /** A transfer / virtual account id is owned via user_transfers(transfer_id -> user_id). */
  private async assertMappedTransfer(
    caller: Caller,
    id: string,
    type: 'on-ramp' | 'off-ramp',
  ): Promise<void> {
    const mapping = await this.userTransferRepository.findOne({
      where: { transfer_id: id, type },
    });
    if (!mapping) {
      throw new NotFoundException(
        type === 'on-ramp' ? 'Virtual account not found' : 'Transfer not found',
      );
    }
    await this.access.assertUser(caller, mapping.user_id);
  }

  /** An external account id is owned via user_beneficiaries(external_account_id -> user_id). */
  private async assertMappedExternalAccount(
    caller: Caller,
    externalAccountID: string,
  ): Promise<void> {
    const mapping = await this.userBeneficiaryRepository.findOne({
      where: { external_account_id: externalAccountID },
    });
    if (!mapping) throw new NotFoundException('External account not found');
    await this.access.assertUser(caller, mapping.user_id);
  }

  // External Accounts
  @Get('customers/:customerID/external_accounts')
  async getAllExternalAccounts(
    @Param('customerID') customerID: string,
    @Query()
    query: {
      userID: string;
      limit?: number;
      starting_after?: string;
      ending_before?: string;
    },
    @CurrentCaller() caller: Caller,
  ): Promise<unknown> {
    await this.assertCustomerAndUser(caller, customerID, query.userID, {
      userRequired: true,
    });
    return (await this.bridgeService.getAllExternalAccounts(
      customerID,
      query,
    )) as unknown;
  }

  @Get('customers/:customerID/external_accounts/:externalAccountID')
  async getExternalAccount(
    @Param('customerID') customerID: string,
    @Param('externalAccountID') externalAccountID: string,
    @CurrentCaller() caller: Caller,
  ): Promise<unknown> {
    await this.assertCustomerAndUser(caller, customerID);
    await this.assertMappedExternalAccount(caller, externalAccountID);
    return (await this.bridgeService.getExternalAccount(
      customerID,
      externalAccountID,
    )) as unknown;
  }

  @Post('customers/:customerID/external_accounts')
  async createExternalAccount(
    @Param('customerID') customerID: string,
    @Query('userID') userID: string,
    @Body() body: any,
    @Headers('idempotency-key') idempotencyKey: string,
    @CurrentCaller() caller: Caller,
  ): Promise<unknown> {
    await this.assertCustomerAndUser(caller, customerID, userID, {
      userRequired: true,
    });
    return (await this.bridgeService.createExternalAccount(
      customerID,
      userID,
      body,
      idempotencyKey,
    )) as unknown;
  }

  @Put('customers/:customerID/external_accounts/:externalAccountID')
  async updateExternalAccount(
    @Param('customerID') customerID: string,
    @Param('externalAccountID') externalAccountID: string,
    @Body() body: any,
    @CurrentCaller() caller: Caller,
  ): Promise<unknown> {
    await this.assertCustomerAndUser(caller, customerID);
    await this.assertMappedExternalAccount(caller, externalAccountID);
    return (await this.bridgeService.updateExternalAccount(
      customerID,
      externalAccountID,
      body,
    )) as unknown;
  }

  @Delete('customers/:customerID/external_accounts/:externalAccountID')
  async deleteExternalAccount(
    @Param('customerID') customerID: string,
    @Param('externalAccountID') externalAccountID: string,
    @Query('userID') userID: string,
    @CurrentCaller() caller: Caller,
  ): Promise<{ deleted: boolean }> {
    await this.assertCustomerAndUser(caller, customerID, userID, {
      userRequired: true,
    });
    await this.assertMappedExternalAccount(caller, externalAccountID);
    return this.bridgeService.deleteExternalAccount(
      customerID,
      externalAccountID,
      userID,
    );
  }

  // Transfers
  @Get('transfers')
  async getAllTransfers(
    @Query()
    query: {
      customer_id: string;
      user_id: string;
      limit?: number;
      starting_after?: string;
      ending_before?: string;
      status?: string;
    },
    @CurrentCaller() caller: Caller,
  ): Promise<unknown> {
    // user_id is required: without it the user_transfers filter would match every user
    await this.assertCustomerAndUser(caller, query.customer_id, query.user_id, {
      userRequired: true,
    });
    return (await this.bridgeService.getAllTransfers(query)) as unknown;
  }

  @Post('transfers')
  async createTransfer(
    @Body() body: CreateTransferDto,
    @Query('userID') userId: string,
    @Headers('idempotency-key') idempotencyKey: string,
    @CurrentCaller() caller: Caller,
  ): Promise<unknown> {
    await this.assertCustomerAndUser(caller, body.on_behalf_of, userId, {
      userRequired: true,
    });
    return (await this.bridgeService.createTransfer(
      userId,
      body,
      idempotencyKey,
    )) as unknown;
  }

  @Get('transfers/:transferID')
  async getTransfer(
    @Param('transferID') transferID: string,
    @CurrentCaller() caller: Caller,
  ): Promise<unknown> {
    await this.assertMappedTransfer(caller, transferID, 'off-ramp');
    return (await this.bridgeService.getTransfer(transferID)) as unknown;
  }

  @Put('transfers/:transferID')
  async updateTransfer(
    @Param('transferID') transferID: string,
    @Body() body: any,
    @CurrentCaller() caller: Caller,
  ): Promise<unknown> {
    await this.assertMappedTransfer(caller, transferID, 'off-ramp');
    return (await this.bridgeService.updateTransfer(
      transferID,
      body,
    )) as unknown;
  }

  @Delete('transfers/:transferID')
  async deleteTransfer(
    @Param('transferID') transferID: string,
    @CurrentCaller() caller: Caller,
  ): Promise<unknown> {
    await this.assertMappedTransfer(caller, transferID, 'off-ramp');
    return (await this.bridgeService.deleteTransfer(transferID)) as unknown;
  }

  // Virtual Accounts
  @Post('customers/:customerID/virtual_accounts')
  async createVirtualAccount(
    @Param('customerID') customerID: string,
    @Query('userID') userId: string,
    @Body() body: BridgeCreateVirtualAccountDto,
    @Headers('idempotency-key') idempotencyKey: string,
    @CurrentCaller() caller: Caller,
  ): Promise<unknown> {
    await this.assertCustomerAndUser(caller, customerID, userId, {
      userRequired: true,
    });
    return (await this.bridgeService.createVirtualAccount(
      customerID,
      body,
      idempotencyKey,
      userId,
    )) as unknown;
  }

  @Get('customers/:customerID/virtual_accounts')
  async getCustomerVirtualAccounts(
    @Param('customerID') customerID: string,
    @Query()
    {
      user_id,
      status = 'activated',
      limit = 100,
    }: {
      user_id: string;
      status?: 'activated' | 'deactivated';
      limit?: number;
    },
    @CurrentCaller() caller: Caller,
  ): Promise<VirtualAccountListDto> {
    await this.assertCustomerAndUser(caller, customerID, user_id, {
      userRequired: true,
    });
    return await this.bridgeService.getCustomerVirtualAccounts(
      customerID,
      user_id,
      status,
      limit,
    );
  }

  @Post('customers/:customerID/virtual_accounts/:virtualAccountID/deactivate')
  async deactivateVirtualAccount(
    @Param('customerID') customerID: string,
    @Param('virtualAccountID') virtualAccountID: string,
    @CurrentCaller() caller: Caller,
  ): Promise<{ deactivated: boolean }> {
    await this.assertCustomerAndUser(caller, customerID);
    await this.assertMappedTransfer(caller, virtualAccountID, 'on-ramp');
    return await this.bridgeService.deactivateVirtualAccount(
      customerID,
      virtualAccountID,
    );
  }

  @Post('customers/:customerID/virtual_accounts/:virtualAccountID/reactivate')
  async reactivateVirtualAccount(
    @Param('customerID') customerID: string,
    @Param('virtualAccountID') virtualAccountID: string,
    @CurrentCaller() caller: Caller,
  ): Promise<{ reactivated: boolean }> {
    await this.assertCustomerAndUser(caller, customerID);
    await this.assertMappedTransfer(caller, virtualAccountID, 'on-ramp');
    return await this.bridgeService.reactivateVirtualAccount(
      customerID,
      virtualAccountID,
    );
  }

  @Get('customers/:customerID/virtual_accounts/:virtualAccountID/history')
  async getVirtualAccountHistory(
    @Param('customerID') customerID: string,
    @Param('virtualAccountID') virtualAccountID: string,
    @Query() { limit = 100 }: { limit?: number },
    @CurrentCaller() caller: Caller,
  ): Promise<unknown> {
    await this.assertCustomerAndUser(caller, customerID);
    await this.assertMappedTransfer(caller, virtualAccountID, 'on-ramp');
    return await this.bridgeService.getVirtualAccountHistory(
      customerID,
      virtualAccountID,
      limit,
    );
  }

  @Get('customers/:customerID/virtual_accounts/history/all')
  async getAllVirtualAccountHistory(
    @Param('customerID') customerID: string,
    @Query('userID') userID: string,
    @CurrentCaller() caller: Caller,
  ): Promise<unknown> {
    await this.assertCustomerAndUser(caller, customerID, userID, {
      userRequired: true,
    });
    return await this.bridgeService.getAllTransactions(customerID, userID);
  }

  @Put('customers/:customerID/virtual_accounts/:virtualAccountID')
  async updateDeveloperFee(
    @Param('customerID') customerID: string,
    @Param('virtualAccountID') virtualAccountID: string,
    @Body() body: UpdateDeveloperFeeDto,
    @CurrentCaller() caller: Caller,
  ): Promise<unknown> {
    // Fees are set by the MSB, not by the client
    this.access.requireMsbAdmin(caller);
    await this.assertCustomerAndUser(caller, customerID);
    await this.assertMappedTransfer(caller, virtualAccountID, 'on-ramp');
    return await this.bridgeService.updateDeveloperFee(
      customerID,
      virtualAccountID,
      body,
    );
  }

  @Get('developer/fees')
  async getDeveloperFees(): Promise<{
    default_liquidation_address_fee_percent: string;
  }> {
    return await this.bridgeService.getDefaultDeveloperFee();
  }

  @Get('customers/:customerID')
  async getCustomerInfo(
    @Param('customerID') customerID: string,
    @CurrentCaller() caller: Caller,
  ): Promise<unknown> {
    await this.assertCustomerAndUser(caller, customerID);
    return await this.bridgeService.getCustomerObject(customerID);
  }

  @Put('customers/:customerID')
  async updateCustomer(
    @Param('customerID') customerID: string,
    @Body() body: UpdateCustomerDto,
    @CurrentCaller() caller: Caller,
  ): Promise<unknown> {
    await this.assertCustomerAndUser(caller, customerID);
    return await this.bridgeService.updateCustomer(customerID, body);
  }

  @Get('developer/fees/accumulated')
  async getAccumulatedFees(
    @Query('msbID') msbID: string,
    @CurrentCaller() caller: Caller,
    @Query('month') month?: string,
    @Query('year') year?: string,
  ): Promise<unknown> {
    this.access.assertMsb(caller, msbID);
    const m = month ? Number(month) : undefined;
    const y = year ? Number(year) : undefined;
    return await this.bridgeService.getAccumulatedFees(msbID, m, y);
  }

  @Get('msb/:msbID/transactions/statement')
  async getStatementTransactions(
    @Param('msbID') msbID: string,
    @CurrentCaller() caller: Caller,
    @Query('month') month?: string,
    @Query('year') year?: string,
  ): Promise<unknown> {
    this.access.assertMsb(caller, msbID);
    const m = month ? Number(month) : undefined;
    const y = year ? Number(year) : undefined;
    return await this.bridgeService.getTransactionsByDateRange(msbID, m, y);
  }

  @Get('customers/:customerID/virtual_accounts/:virtualAccountID/statement')
  async getVirtualAccountStatement(
    @Param('customerID') customerID: string,
    @Param('virtualAccountID') virtualAccountID: string,
    @Query('userID') userID: string,
    @CurrentCaller() caller: Caller,
  ): Promise<TransactionDetailsListDto> {
    await this.assertCustomerAndUser(caller, customerID, userID, {
      userRequired: true,
    });
    await this.assertMappedTransfer(caller, virtualAccountID, 'on-ramp');
    return await this.bridgeService.getVirtualAccountStatement(
      customerID,
      userID,
      virtualAccountID,
    );
  }

  @Get('msb/:msbID/fee_external_account')
  async getMSBFeeExternalAccount(
    @Param('msbID') msbID: string,
    @CurrentCaller() caller: Caller,
  ): Promise<FeeExternalAccount | null> {
    this.access.assertMsb(caller, msbID);
    return await this.bridgeService.getMSBFeeExternalAccount(msbID);
  }

  @Post('msb/:msbID/fee_external_account')
  async createMSBFeeExternalAccount(
    @Param('msbID') msbID: string,
    @Body() body: CreateFeeExternalAccountDto,
    @CurrentCaller() caller: Caller,
  ): Promise<FeeExternalAccount | null> {
    this.access.assertMsb(caller, msbID);
    return await this.bridgeService.createMSBFeeExternalAccount(msbID, body);
  }

  @Put('msb/:msbID/fee_external_account/:feeExternalAccountID')
  async updateMSBFeeExternalAccount(
    @Param('msbID') msbID: string,
    @Param('feeExternalAccountID') feeExternalAccountID: string,
    @Body() body: UpdateFeeExternalAccountDto,
    @CurrentCaller() caller: Caller,
  ): Promise<FeeExternalAccount | null> {
    this.access.assertMsb(caller, msbID);
    return await this.bridgeService.updateMSBFeeExternalAccount(
      msbID,
      feeExternalAccountID,
      body,
    );
  }

  @Post('kyc_links')
  async generateKYCLink(
    @Query('customerID') customerID: string,
    @CurrentCaller() caller: Caller,
  ): Promise<KYCDto> {
    await this.assertCustomerAndUser(caller, customerID);
    return await this.bridgeService.generateKYCLink(customerID);
  }
}
