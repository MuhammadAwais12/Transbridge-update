import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Headers,
} from '@nestjs/common';
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

@Controller('bridge')
export class BridgeController {
  constructor(private readonly bridgeService: BridgeService) {}

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
  ): Promise<unknown> {
    return (await this.bridgeService.getAllExternalAccounts(
      customerID,
      query,
    )) as unknown;
  }

  @Get('customers/:customerID/external_accounts/:externalAccountID')
  async getExternalAccount(
    @Param('customerID') customerID: string,
    @Param('externalAccountID') externalAccountID: string,
  ): Promise<unknown> {
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
  ): Promise<unknown> {
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
  ): Promise<unknown> {
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
  ): Promise<{ deleted: boolean }> {
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
  ): Promise<unknown> {
    return (await this.bridgeService.getAllTransfers(query)) as unknown;
  }

  @Post('transfers')
  async createTransfer(
    @Body() body: CreateTransferDto,
    @Query('userID') userId: string,
    @Headers('idempotency-key') idempotencyKey: string,
  ): Promise<unknown> {
    return (await this.bridgeService.createTransfer(
      userId,
      body,
      idempotencyKey,
    )) as unknown;
  }

  @Get('transfers/:transferID')
  async getTransfer(@Param('transferID') transferID: string): Promise<unknown> {
    return (await this.bridgeService.getTransfer(transferID)) as unknown;
  }

  @Put('transfers/:transferID')
  async updateTransfer(
    @Param('transferID') transferID: string,
    @Body() body: any,
  ): Promise<unknown> {
    return (await this.bridgeService.updateTransfer(
      transferID,
      body,
    )) as unknown;
  }

  @Delete('transfers/:transferID')
  async deleteTransfer(
    @Param('transferID') transferID: string,
  ): Promise<unknown> {
    return (await this.bridgeService.deleteTransfer(transferID)) as unknown;
  }

  // Virtual Accounts
  @Post('customers/:customerID/virtual_accounts')
  async createVirtualAccount(
    @Param('customerID') customerID: string,
    @Query('userID') userId: string,
    @Body() body: BridgeCreateVirtualAccountDto,
    @Headers('idempotency-key') idempotencyKey: string,
  ): Promise<unknown> {
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
  ): Promise<VirtualAccountListDto> {
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
  ): Promise<{ deactivated: boolean }> {
    return await this.bridgeService.deactivateVirtualAccount(
      customerID,
      virtualAccountID,
    );
  }

  @Post('customers/:customerID/virtual_accounts/:virtualAccountID/reactivate')
  async reactivateVirtualAccount(
    @Param('customerID') customerID: string,
    @Param('virtualAccountID') virtualAccountID: string,
  ): Promise<{ reactivated: boolean }> {
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
  ): Promise<unknown> {
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
  ): Promise<unknown> {
    return await this.bridgeService.getAllTransactions(customerID, userID);
  }

  @Put('customers/:customerID/virtual_accounts/:virtualAccountID')
  async updateDeveloperFee(
    @Param('customerID') customerID: string,
    @Param('virtualAccountID') virtualAccountID: string,
    @Body() body: UpdateDeveloperFeeDto,
  ): Promise<unknown> {
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
  ): Promise<unknown> {
    return await this.bridgeService.getCustomerObject(customerID);
  }

  @Put('customers/:customerID')
  async updateCustomer(
    @Param('customerID') customerID: string,
    @Body() body: UpdateCustomerDto,
  ): Promise<unknown> {
    return await this.bridgeService.updateCustomer(customerID, body);
  }

  @Get('developer/fees/accumulated')
  async getAccumulatedFees(
    @Query('msbID') msbID: string,
    @Query('month') month?: string,
    @Query('year') year?: string,
  ): Promise<unknown> {
    const m = month ? Number(month) : undefined;
    const y = year ? Number(year) : undefined;
    return await this.bridgeService.getAccumulatedFees(msbID, m, y);
  }

  @Get('msb/:msbID/transactions/statement')
  async getStatementTransactions(
    @Param('msbID') msbID: string,
    @Query('month') month?: string,
    @Query('year') year?: string,
  ): Promise<unknown> {
    const m = month ? Number(month) : undefined;
    const y = year ? Number(year) : undefined;
    return await this.bridgeService.getTransactionsByDateRange(msbID, m, y);
  }

  @Get('customers/:customerID/virtual_accounts/:virtualAccountID/statement')
  async getVirtualAccountStatement(
    @Param('customerID') customerID: string,
    @Param('virtualAccountID') virtualAccountID: string,
    @Query('userID') userID: string,
  ): Promise<TransactionDetailsListDto> {
    return await this.bridgeService.getVirtualAccountStatement(
      customerID,
      userID,
      virtualAccountID,
    );
  }

  @Get('msb/:msbID/fee_external_account')
  async getMSBFeeExternalAccount(
    @Param('msbID') msbID: string,
  ): Promise<FeeExternalAccount | null> {
    return await this.bridgeService.getMSBFeeExternalAccount(msbID);
  }

  @Post('msb/:msbID/fee_external_account')
  async createMSBFeeExternalAccount(
    @Param('msbID') msbID: string,
    @Body() body: CreateFeeExternalAccountDto,
  ): Promise<FeeExternalAccount | null> {
    return await this.bridgeService.createMSBFeeExternalAccount(msbID, body);
  }

  @Put('msb/:msbID/fee_external_account/:feeExternalAccountID')
  async updateMSBFeeExternalAccount(
    @Param('msbID') msbID: string,
    @Param('feeExternalAccountID') feeExternalAccountID: string,
    @Body() body: UpdateFeeExternalAccountDto,
  ): Promise<FeeExternalAccount | null> {
    return await this.bridgeService.updateMSBFeeExternalAccount(
      msbID,
      feeExternalAccountID,
      body,
    );
  }

  @Post('kyc_links')
  async generateKYCLink(
    @Query('customerID') customerID: string,
  ): Promise<KYCDto> {
    return await this.bridgeService.generateKYCLink(customerID);
  }
}
