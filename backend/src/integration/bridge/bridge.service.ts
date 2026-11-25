import {
  BadRequestException,
  HttpException,
  Injectable,
  Inject,
  forwardRef,
  NotFoundException,
} from '@nestjs/common';
import {
  CreateTransferDto,
  SourceDto,
  TransferDto,
  TransferListDto,
} from './dto/transfers.dto';
import {
  BridgeCreateVirtualAccountDto,
  VirtualAccountDestinationDto,
  VirtualAccountDto,
  VirtualAccountHistoryListDto,
  VirtualAccountHistoryDto,
  UpdateDeveloperFeeDto,
} from './dto/virtual-accounts.dto';
import { VirtualAccountListDto } from './dto/virtual-accounts.dto';
import { WalletBalanceDto, WalletDto, WalletListDto } from './dto/wallet.dto';
import { Currency, PaymentRail, State } from './dto/shared.dto';
import {
  convertOffRampTransferToTransactionDetails,
  convertVirtualAccountHistoryToTransactionDetails,
  mapVirtualAccountToTransfer,
} from './bridge.mapper';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { UserTransfer } from './entity/user-transfer.entity';
import { UserBeneficiary } from './entity/user-beneficiary.entity';
import { CustomerDto, UpdateCustomerDto } from './dto/customer.dto';
import {
  TransactionDetailsDto,
  TransactionDetailsListDto,
} from './dto/transactions.dto';
import { ExternalAccountDto } from './dto/external-accounts.dto';
import { ClientService } from 'src/client/client.service';
import {
  CreateFeeExternalAccountDto,
  UpdateFeeExternalAccountDto,
} from './dto/fee-external-accounts.dto';
import { FeeExternalAccount } from './entity/fee-external_account.entity';
import { generateIdempotencyKey } from 'src/utils/generateIdempotencyKey';
import { KYCDto, KYCListDto } from './dto/kyc.dto';
import { providers } from '../../config/providers.config';
@Injectable()
export class BridgeService {
  // Read lazily from providers.config so a missing value fails the call, not startup
  private get apiKey(): string {
    return providers.transbridge.apiKey;
  }
  private get baseUrl(): string {
    return providers.transbridge.apiUrl;
  }
  private get requestTimeoutMs(): number {
    return providers.transbridge.timeoutMs;
  }

  constructor(
    @InjectRepository(UserTransfer)
    private readonly userTransferRepository: Repository<UserTransfer>,
    @InjectRepository(UserBeneficiary)
    private readonly userBeneficiaryRepository: Repository<UserBeneficiary>,
    @Inject(forwardRef(() => ClientService))
    private readonly clientService: ClientService,
    private readonly dataSource: DataSource,
    @InjectRepository(FeeExternalAccount)
    private readonly feeExternalAccountRepository: Repository<FeeExternalAccount>,
  ) {}

  private buildHeaders(idempotencyKey?: string): Record<string, string> {
    const headers: Record<string, string> = {
      'Api-Key': this.apiKey,
      'Content-Type': 'application/json',
    };
    if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey;
    return headers;
  }

  private buildQuery(
    params?: Record<string, string | number | undefined>,
  ): string {
    if (!params) return '';
    const entries = Object.entries(params).filter(
      ([, v]) => v !== undefined,
    ) as Array<[string, string | number]>;
    if (entries.length === 0) return '';
    const qp = new URLSearchParams(
      Object.fromEntries(entries.map(([k, v]) => [k, String(v)])),
    ).toString();
    return qp ? `?${qp}` : '';
  }

  private async fetchWithRetry(
    url: string,
    init: RequestInit,
    retries = 3,
  ): Promise<Response> {
    let attempt = 0;
    let lastError: unknown;
    while (attempt < retries) {
      attempt += 1;
      const controller = new AbortController();
      const timeout = setTimeout(
        () => controller.abort(),
        this.requestTimeoutMs,
      );
      try {
        const response = await fetch(url, {
          ...init,
          signal: controller.signal,
        });
        clearTimeout(timeout);
        return response;
      } catch (error) {
        clearTimeout(timeout);
        lastError = error;
        const isAbort = (error as { name?: string }).name === 'AbortError';
        if (!isAbort || attempt >= retries) {
          throw error;
        }
        const backoffMs = 200 * attempt;
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
      }
    }
    throw lastError instanceof Error
      ? lastError
      : new Error('Request failed after 3 retries');
  }

  private async requestJson(url: string, init: RequestInit): Promise<unknown> {
    const response = await this.fetchWithRetry(url, init);
    const contentType = response.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');
    let payload: unknown;
    try {
      payload = isJson ? await response.json() : await response.text();
    } catch {
      payload = null;
    }
    if (response.ok) return payload;
    throw new HttpException(
      (payload ?? {}) as Record<string, unknown> | string,
      response.status,
    );
  }

  private mergeAndSortTransfersByCreatedAt(
    transfers: TransferDto[],
  ): TransferDto[] {
    return transfers.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
  }

  private filterDuplicateVirtualAccountHistory(
    items: VirtualAccountHistoryDto[],
  ): VirtualAccountHistoryDto[] {
    // Assumes items are pre-sorted by created_at DESC.
    if (!Array.isArray(items) || items.length === 0) return [];
    const seenDepositIds = new Set<string>();
    const result: VirtualAccountHistoryDto[] = [];
    for (const item of items) {
      const key = item.deposit_id;
      if (item.type === State.FUNDS_SCHEDULED && !key) continue;
      if (!key) {
        result.push(item);
        continue;
      }
      if (seenDepositIds.has(key)) continue;
      seenDepositIds.add(key);
      result.push(item);
    }
    return result;
  }
  // External Accounts
  async getAllExternalAccounts(
    customerID: string,
    params?: {
      userID: string;
      limit?: number;
      starting_after?: string;
      ending_before?: string;
    },
  ): Promise<{ count: number; data: ExternalAccountDto[] }> {
    if (!params?.userID) {
      throw new BadRequestException('userID is required');
    }

    const url = `${this.baseUrl}/customers/${customerID}/external_accounts`;
    const headers = this.buildHeaders();
    const response = (await this.requestJson(
      `${url}${this.buildQuery(params)}`,
      { headers },
    )) as { count: number; data: { id: string; [key: string]: any }[] };

    const userBeneficiaries = await this.userBeneficiaryRepository.find({
      where: {
        user_id: params.userID,
      },
    });

    const externalAccountsSet = new Set(
      userBeneficiaries.map((ub) => ub.external_account_id),
    );

    response.data = response.data.filter((ea: ExternalAccountDto) =>
      externalAccountsSet.has(ea.id),
    );
    response.count = response.data.length;

    return response as { count: number; data: ExternalAccountDto[] };
  }

  async getExternalAccount(
    customerID: string,
    externalAccountID: string,
  ): Promise<any> {
    const url = `${this.baseUrl}/customers/${customerID}/external_accounts/${externalAccountID}`;
    const headers = this.buildHeaders();
    return this.requestJson(url, { headers });
  }

  async createExternalAccount(
    customerID: string,
    userId: string,
    body: any,
    idempotencyKey?: string,
  ): Promise<any> {
    if (!userId) {
      throw new BadRequestException('userId is required');
    }

    const url = `${this.baseUrl}/customers/${customerID}/external_accounts`;
    const headers = this.buildHeaders(idempotencyKey);
    const createdExternalAccount = (await this.requestJson(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    })) as { id: string; [key: string]: any };

    try {
      const record = this.userBeneficiaryRepository.create({
        user_id: userId,
        external_account_id: createdExternalAccount.id,
      });
      await this.userBeneficiaryRepository.save(record);
    } catch (e) {
      console.error('Failed to upsert user_beneficiaries mapping:', e);
    }

    return createdExternalAccount;
  }

  async updateExternalAccount(
    customerID: string,
    externalAccountID: string,
    body: any,
  ): Promise<any> {
    const url = `${this.baseUrl}/customers/${customerID}/external_accounts/${externalAccountID}`;
    const headers = this.buildHeaders();
    return this.requestJson(url, {
      method: 'PUT',
      headers,
      body: JSON.stringify(body),
    });
  }

  async deleteExternalAccount(
    customerID: string,
    externalAccountID: string,
    userID: string,
  ): Promise<{ deleted: boolean }> {
    const userBeneficiaries = await this.userBeneficiaryRepository.find({
      where: {
        external_account_id: externalAccountID,
        user_id: userID,
      },
    });

    if (userBeneficiaries.length === 0) {
      throw new BadRequestException('External account not found');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await queryRunner.manager.delete(
        UserBeneficiary,
        userBeneficiaries.map((ub) => ub.id),
      );

      const url = `${this.baseUrl}/customers/${customerID}/external_accounts/${externalAccountID}`;
      const headers = this.buildHeaders();
      await this.requestJson(url, {
        method: 'DELETE',
        headers,
      });

      await queryRunner.commitTransaction();
      return { deleted: true };
    } catch (e) {
      console.error('Failed to delete user beneficiary:', e);
      await queryRunner.rollbackTransaction();
    } finally {
      await queryRunner.release();
    }

    return { deleted: false };
  }

  async getOffRampTransfers(
    customerID: string,
    userID: string,
    queryOptions: { limit?: number; state?: State } = { limit: 100 },
  ): Promise<TransferDto[]> {
    const url = `${this.baseUrl}/transfers`;
    const headers = this.buildHeaders();
    const response = (await this.requestJson(
      `${url}${this.buildQuery(queryOptions)}`,
      { headers },
    )) as TransferListDto;

    const userTransfers = await this.userTransferRepository.find({
      where: {
        user_id: userID,
        type: 'off-ramp',
      },
    });

    const transfersSet = new Set(userTransfers.map((t) => t.transfer_id));

    const offRamps = response.data.filter(
      (transfer) =>
        transfersSet.has(transfer.id) &&
        transfer.on_behalf_of === customerID &&
        !transfer.features?.static_template, // remove on ramp static template transfers
    );

    return offRamps;
  }

  // Transfers
  async getAllTransfers(params: {
    customer_id: string;
    user_id: string;
    limit?: number;
    starting_after?: string;
    ending_before?: string;
    status?: string;
  }): Promise<TransferListDto> {
    const url = `${this.baseUrl}/transfers`;
    const headers = this.buildHeaders();
    const response = (await this.requestJson(
      `${url}${this.buildQuery(params)}`,
      { headers },
    )) as TransferListDto;

    const userTransfers = await this.userTransferRepository.find({
      where: {
        user_id: params.user_id,
        type: 'off-ramp',
      },
    });

    const transfersSet = new Set(userTransfers.map((t) => t.transfer_id));

    const result = new TransferListDto();
    const transfers = response.data.filter(
      (transfer) =>
        transfersSet.has(transfer.id) &&
        transfer.on_behalf_of === params.customer_id &&
        !transfer.features?.static_template, // remove on ramp static template transfers
    );

    const { data: virtualAccountsTransfer } =
      await this.getCustomerVirtualAccounts(params.customer_id, params.user_id);

    const virtualAccountsTransfers = virtualAccountsTransfer.map((va) =>
      mapVirtualAccountToTransfer(va),
    );

    result.data = this.mergeAndSortTransfersByCreatedAt([
      ...transfers,
      ...virtualAccountsTransfers,
    ]);

    result.count = result.data.length;

    return result;
  }

  async createTransfer(
    userId: string,
    body: CreateTransferDto,
    idempotencyKey?: string,
  ): Promise<any> {
    if (!userId) {
      throw new BadRequestException('userId is required');
    }

    const url = `${this.baseUrl}/transfers`;
    const headers = this.buildHeaders(idempotencyKey);
    const createdTransfer = (await this.requestJson(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    })) as TransferDto;

    try {
      const record = this.userTransferRepository.create({
        user_id: userId,
        type: 'off-ramp',
        transfer_id: createdTransfer.id,
      });
      await this.userTransferRepository.save(record);
    } catch (e) {
      console.error('Failed to upsert user_transfers mapping:', e);
    }

    return createdTransfer;
  }

  async getTransfer(transferID: string): Promise<any> {
    const url = `${this.baseUrl}/transfers/${transferID}`;
    const headers = this.buildHeaders();
    return this.requestJson(url, { headers });
  }

  async updateTransfer(transferID: string, body: any): Promise<any> {
    const url = `${this.baseUrl}/transfers/${transferID}`;
    const headers = this.buildHeaders();
    return this.requestJson(url, {
      method: 'PUT',
      headers,
      body: JSON.stringify(body),
    });
  }

  async deleteTransfer(transferID: string): Promise<any> {
    const url = `${this.baseUrl}/transfers/${transferID}`;
    const headers = this.buildHeaders();
    return this.requestJson(url, {
      method: 'DELETE',
      headers,
    });
  }

  // Virtual Accounts
  async createVirtualAccount(
    customerID: string,
    body: BridgeCreateVirtualAccountDto,
    idempotencyKey: string,
    userId: string,
  ): Promise<any> {
    if (!userId) {
      throw new BadRequestException('userId is required');
    }

    if (!body.destination.address) {
      // create a bridge wallet if no address
      if (
        body.destination.payment_rail !== PaymentRail.BASE &&
        body.destination.payment_rail !== PaymentRail.SOLANA
      ) {
        throw new BadRequestException('Invalid payment rail');
      }
      const wallet = await this.createBridgeWallet(
        customerID,
        body.destination.payment_rail,
        `${idempotencyKey}-wallet`,
      );

      // set bridge wallet id to the virtual account destination
      body.destination.bridge_wallet_id = wallet.id;
    }

    const url = `${this.baseUrl}/customers/${customerID}/virtual_accounts`;
    const headers = this.buildHeaders(idempotencyKey);
    const createdVirtualAccount = await this.requestJson(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    const va = createdVirtualAccount as VirtualAccountDto;

    try {
      const record = this.userTransferRepository.create({
        user_id: userId,
        type: 'on-ramp',
        transfer_id: va.id,
      });
      await this.userTransferRepository.save(record);
    } catch (e) {
      console.error('Failed to upsert user_virtual_accounts mapping:', e);
    }

    return va;
  }

  async deactivateVirtualAccount(
    customerID: string,
    virtualAccountID: string,
  ): Promise<{ deactivated: boolean }> {
    try {
      // deactivate from bridge to block transactions
      const url = `${this.baseUrl}/customers/${customerID}/virtual_accounts/${virtualAccountID}/deactivate`;
      const headers = this.buildHeaders(generateIdempotencyKey());
      await this.requestJson(url, {
        method: 'POST',
        headers,
      });

      return { deactivated: true };
    } catch (error) {
      console.error('Failed to deactivate virtual account:', error);
      return { deactivated: false };
    }
  }

  async reactivateVirtualAccount(
    customerID: string,
    virtualAccountID: string,
  ): Promise<{ reactivated: boolean }> {
    try {
      const url = `${this.baseUrl}/customers/${customerID}/virtual_accounts/${virtualAccountID}/reactivate`;
      const headers = this.buildHeaders(generateIdempotencyKey());
      await this.requestJson(url, { method: 'POST', headers });

      return { reactivated: true };
    } catch (error) {
      console.error('Failed to reactivate virtual account:', error);
      return { reactivated: false };
    }
  }

  async getCustomerVirtualAccounts(
    customerID: string,
    userId: string,
    status: 'activated' | 'deactivated' = 'activated',
    limit: number = 100,
    includeBalance: boolean = true,
  ): Promise<VirtualAccountListDto> {
    const url = `${this.baseUrl}/customers/${customerID}/virtual_accounts?status=${status}&limit=${limit}`;
    const headers = this.buildHeaders();
    const { count, data: virtualAccounts } = (await this.requestJson(url, {
      headers,
    })) as VirtualAccountListDto;

    const userTransfers = await this.userTransferRepository.find({
      where: {
        user_id: userId,
        type: 'on-ramp',
      },
    });

    if (userTransfers.length === 0) {
      return {
        count: 0,
        data: [],
      };
    }

    const virtualAccountsSet = new Set(userTransfers.map((t) => t.transfer_id));

    const result = new VirtualAccountListDto();
    result.count = count;
    result.data = virtualAccounts.filter((va) => virtualAccountsSet.has(va.id));

    if (!includeBalance) return result;

    const { data: wallets } = await this.getCustomerBridgeWallets(customerID);

    result.data = await Promise.all(
      result.data.map(async (va) => {
        const walletId = wallets.find(
          (w) => w.address === va.destination.address,
        )?.id;

        if (!walletId) {
          return {
            ...va,
            state: State.AWAITING_FUNDS,
          };
        }

        const walletBalance = await this.getCustomerBridgeWalletBalance(
          customerID,
          walletId,
        );

        const history = (await this.getVirtualAccountHistory(
          customerID,
          va.id,
        )) as { count: number; data: { type: State }[] };

        return {
          ...va,
          bridge_wallet_id: walletId,
          state:
            history.data?.length > 0
              ? history.data[0].type
              : State.AWAITING_FUNDS,
          bridge_wallet_balance: String(
            walletBalance.balances.reduce(
              (acc, balance) => acc + Number(balance.balance),
              0,
            ),
          ),
        };
      }),
    );

    return result;
  }

  async getCustomerBridgeWallets(
    customerID: string,
    limit = 100,
  ): Promise<WalletListDto> {
    const url = `${this.baseUrl}/customers/${customerID}/wallets?limit=${limit}`;
    const headers = this.buildHeaders();
    const walletList = await this.requestJson(url, { headers });

    return walletList as WalletListDto;
  }

  async getCustomerBridgeWalletBalance(
    customerID: string,
    walletID: string,
  ): Promise<WalletBalanceDto> {
    const url = `${this.baseUrl}/customers/${customerID}/wallets/${walletID}`;
    const headers = this.buildHeaders();
    const wallet = await this.requestJson(url, { headers });

    return wallet as WalletBalanceDto;
  }

  async getVirtualAccountHistory(
    customerID: string,
    virtualAccountID: string,
    limit = 100,
  ): Promise<VirtualAccountHistoryListDto> {
    const url = `${this.baseUrl}/customers/${customerID}/virtual_accounts/${virtualAccountID}/history?limit=${limit}`;
    const headers = this.buildHeaders();
    const history = await this.requestJson(url, { headers });
    return history as VirtualAccountHistoryListDto;
  }

  async getVirtualAccountStatement(
    customerID: string,
    userID: string,
    virtualAccountID: string,
  ): Promise<TransactionDetailsListDto> {
    const { data: history } = await this.getVirtualAccountHistory(
      customerID,
      virtualAccountID,
      100,
    );

    const customerVirtualAccounts = await this.getCustomerVirtualAccounts(
      customerID,
      userID,
      'activated',
      100,
      true,
    );

    const virtualAccount = customerVirtualAccounts.data.find(
      (va) => va.id === virtualAccountID,
    );

    if (!virtualAccount) {
      throw new NotFoundException('Virtual account not found');
    }

    const filtered = this.filterDuplicateVirtualAccountHistory(history).filter(
      (h) => h.type === State.PAYMENT_PROCESSED,
    );

    const onRampTransactions = filtered.map((d) =>
      convertVirtualAccountHistoryToTransactionDetails(d, virtualAccount),
    );

    const offRampTransfers = await this.getOffRampTransfers(
      customerID,
      userID,
      {
        limit: 100,
        state: State.PAYMENT_PROCESSED,
      },
    );

    const filteredOffRampTransfers = offRampTransfers.filter(
      (t) => t.source.bridge_wallet_id === virtualAccount.bridge_wallet_id,
    );

    const offRampTransactions = filteredOffRampTransfers.map((t) =>
      convertOffRampTransferToTransactionDetails(t),
    );

    const sortedTransactions = [
      ...onRampTransactions,
      ...offRampTransactions,
    ].sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );

    return {
      count: sortedTransactions.length,
      data: sortedTransactions,
    };
  }

  async getAllTransactions(
    customerID: string,
    userID: string,
    developerFeeOnly: boolean = false,
  ): Promise<TransactionDetailsListDto> {
    const { data: virtualAccounts } = await this.getCustomerVirtualAccounts(
      customerID,
      userID,
      'activated',
      100,
      false,
    );

    const virtualAccountIds = virtualAccounts.map((va) => va.id);

    const virtualAccountList = await Promise.all(
      virtualAccountIds.map(async (virtualAccountId) => {
        const history = await this.getVirtualAccountHistory(
          customerID,
          virtualAccountId,
          100,
        );
        return history.data;
      }),
    );

    const history: TransactionDetailsListDto = {
      count: 0,
      data: [],
    };

    const flattened = virtualAccountList.flat();

    let filtered = this.filterDuplicateVirtualAccountHistory(flattened);

    if (developerFeeOnly) {
      filtered = filtered.filter((h) => h.type === State.PAYMENT_PROCESSED);
    }

    const onRampTransactions = filtered.map((d) =>
      convertVirtualAccountHistoryToTransactionDetails(
        d,
        virtualAccounts.find(
          (va) => va.id === d.virtual_account_id,
        ) as VirtualAccountDto,
      ),
    );

    const offRampTransfers = await this.getOffRampTransfers(
      customerID,
      userID,
      {
        limit: 100,
        state: developerFeeOnly ? State.PAYMENT_PROCESSED : undefined,
      },
    );

    const { data: externalAccounts } = await this.getAllExternalAccounts(
      customerID,
      { userID, limit: 100 },
    );

    const offRampTransactions = offRampTransfers.map((t) =>
      convertOffRampTransferToTransactionDetails(
        t,
        externalAccounts.find(
          (ea) => ea.id === t.destination.external_account_id,
        ),
      ),
    );

    history.data = [...onRampTransactions, ...offRampTransactions].sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );

    history.count = history.data.length;

    return history;
  }

  async getAccumulatedFees(
    msbID: string,
    month?: number,
    year?: number,
  ): Promise<{
    fees_earned: number;
    total_fees_accumulated: number;
    month: number;
    year: number;
  }> {
    let earnings = 0;
    let accumulation = 0;

    // Determine target month/year (default to current UTC month/year)
    const now = new Date();
    const targetYear = typeof year === 'number' ? year : now.getUTCFullYear();
    const targetMonth =
      typeof month === 'number' && month >= 1 && month <= 12
        ? month
        : now.getUTCMonth() + 1; // 1-12

    const customerAndUserIds =
      await this.clientService.getMSBCustomersForFees(msbID);

    if (customerAndUserIds.length === 0) {
      return {
        month: targetMonth,
        year: targetYear,
        fees_earned: 0,
        total_fees_accumulated: 0,
      };
    }

    const transactionsPerUser = await Promise.all(
      customerAndUserIds.map(async ({ customerId, userId }) => {
        const { data } = await this.getAllTransactions(
          customerId,
          userId,
          true,
        );

        return data;
      }),
    );

    const transactions = transactionsPerUser.flat();

    // Filter transactions to the specified month/year
    const monthlyTransactions = transactions.filter((t) => {
      const d = new Date(t.created_at);
      return (
        d.getUTCFullYear() === targetYear && d.getUTCMonth() + 1 === targetMonth
      );
    });

    const default_developer_fee_percent = await this.getDefaultDeveloperFee();

    const default_fee_percent =
      Number(
        default_developer_fee_percent.default_liquidation_address_fee_percent,
      ) / 100;

    monthlyTransactions.forEach((transaction) => {
      const { txn_earnings, txn_accumulation } = this.calculateFees(
        transaction,
        default_fee_percent,
      );
      earnings += txn_earnings;
      accumulation += txn_accumulation;
    });

    return {
      month: targetMonth,
      year: targetYear,
      fees_earned: earnings,
      total_fees_accumulated: accumulation,
    };
  }

  /**
   * Returns all transactions for an MSB within a given month/year, annotated with the customer account.
   * - If month/year are not provided, defaults to the entire previous month (UTC).
   */
  async getTransactionsByDateRange(
    msbID: string,
    month?: number,
    year?: number,
  ): Promise<{
    count: number;
    data: Array<
      TransactionDetailsDto & {
        customer_id: string;
        user_id: string;
        email: string;
        name: string;
      }
    >;
  }> {
    const customerAndUsers =
      await this.clientService.getMSBCustomersForFees(msbID);

    if (customerAndUsers.length === 0) {
      return { count: 0, data: [] };
    }

    // Determine target month/year (default to previous UTC month)
    const now = new Date();
    const prevMonthIndex = now.getUTCMonth() - 1; // 0-11, previous month relative to now
    const targetMonth =
      typeof month === 'number' && month >= 1 && month <= 12
        ? month
        : prevMonthIndex >= 0
          ? prevMonthIndex + 1
          : 12; // if January, previous is December
    const targetYear =
      typeof year === 'number'
        ? year
        : prevMonthIndex >= 0
          ? now.getUTCFullYear()
          : now.getUTCFullYear() - 1; // if January, previous month is Dec last year

    // Build inclusive UTC date range [start, end] for the target month
    const rangeStart = new Date(
      Date.UTC(targetYear, targetMonth - 1, 1, 0, 0, 0, 0),
    );
    const firstOfNextMonth = new Date(
      Date.UTC(
        targetMonth === 12 ? targetYear + 1 : targetYear,
        targetMonth === 12 ? 0 : targetMonth,
        1,
        0,
        0,
        0,
        0,
      ),
    );
    const rangeEnd = new Date(firstOfNextMonth.getTime() - 1);

    const resultsPerCustomer = await Promise.all(
      customerAndUsers.map(async ({ customerId, userId, email, name }) => {
        const { data } = await this.getAllTransactions(
          customerId,
          userId,
          true,
        );
        // Filter by inclusive date range and annotate with customer_id
        const filtered = data.filter((t) => {
          const createdAt = new Date(t.created_at).getTime();
          return (
            createdAt >= rangeStart.getTime() && createdAt <= rangeEnd.getTime()
          );
        });
        return filtered.map((t) => ({
          ...t,
          customer_id: customerId,
          user_id: userId ?? '',
          email: email,
          name,
        }));
      }),
    );

    const flattened = resultsPerCustomer.flat();
    const sorted = flattened.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );

    return {
      count: sorted.length,
      data: sorted,
    };
  }

  private roundToTwoDecimals(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }

  private calculateFees(
    transaction: TransactionDetailsDto,
    default_developer_fee_percent: number,
  ): {
    txn_earnings: number;
    txn_accumulation: number;
  } {
    const default_fee_unrounded =
      transaction.raw_amount * default_developer_fee_percent; // this is the fee we collect ourselves
    const default_fee =
      default_fee_unrounded < 0.01
        ? 0
        : this.roundToTwoDecimals(default_fee_unrounded);
    const earnings_unrounded = transaction.developer_fee - default_fee;
    const txn_earnings = Math.max(
      0,
      this.roundToTwoDecimals(earnings_unrounded),
    );

    return {
      txn_earnings,
      txn_accumulation: this.roundToTwoDecimals(transaction.developer_fee),
    };
  }

  async updateDeveloperFee(
    customerID: string,
    virtualAccountID: string,
    body: UpdateDeveloperFeeDto,
  ): Promise<any> {
    const url = `${this.baseUrl}/customers/${customerID}/virtual_accounts/${virtualAccountID}`;
    const headers = this.buildHeaders();
    return this.requestJson(url, {
      method: 'PUT',
      headers,
      body: JSON.stringify(body),
    });
  }

  // Bridge Wallets
  async createBridgeWallet(
    customerID: string,
    chain: 'base' | 'solana',
    idempotencyKey: string,
  ): Promise<WalletDto> {
    const url = `${this.baseUrl}/customers/${customerID}/wallets`;
    const headers = this.buildHeaders(idempotencyKey);
    const wallet = await this.requestJson(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ chain }),
    });

    return wallet as WalletDto;
  }

  async getCustomer(customerID: string): Promise<CustomerDto> {
    const url = `${this.baseUrl}/customers/${customerID}`;
    const headers = this.buildHeaders();
    return (await this.requestJson(url, { headers })) as CustomerDto;
  }

  async createDefaultVirtualAccountIfNotExists(
    customerID: string,
    userID: string,
  ): Promise<void> {
    const { data } = await this.getCustomerVirtualAccounts(customerID, userID);

    if (data.length > 0) {
      console.info(
        `Virtual account already exists for user: ${userID} (${data.length})`,
      );
      return;
    }

    // Default virtual account
    const newVirtualAccount = new BridgeCreateVirtualAccountDto();

    const source = new SourceDto();
    source.currency = Currency.USD;

    const destination = new VirtualAccountDestinationDto();
    destination.currency = Currency.USDC;
    destination.payment_rail = PaymentRail.BASE;

    newVirtualAccount.source = source;
    newVirtualAccount.destination = destination;
    newVirtualAccount.developer_fee_percent = '0.00';

    await this.createVirtualAccount(
      customerID,
      newVirtualAccount,
      Math.random().toString(36).slice(2, 8), // idempotency key
      userID,
    );

    console.info(`Default virtual account created for user: ${userID}`);
  }

  async getDefaultDeveloperFee(): Promise<{
    default_liquidation_address_fee_percent: string;
  }> {
    const url = `${this.baseUrl}/developer/fees`;
    const headers = this.buildHeaders();
    const response = (await this.requestJson(url, { headers })) as {
      default_liquidation_address_fee_percent: string;
    };

    return response;
  }

  async getCustomerObject(customerId: string): Promise<unknown> {
    const url = `${this.baseUrl}/customers/${customerId}`;
    const headers = this.buildHeaders();

    return this.requestJson(url, { headers });
  }

  async updateCustomer(
    customerId: string,
    body: UpdateCustomerDto,
  ): Promise<unknown> {
    const url = `${this.baseUrl}/customers/${customerId}`;
    const headers = this.buildHeaders();
    return this.requestJson(url, {
      method: 'PUT',
      headers,
      body: JSON.stringify(body),
    });
  }

  async getMSBFeeExternalAccount(
    msbID: string,
  ): Promise<FeeExternalAccount | null> {
    const feeExternalAccount = await this.feeExternalAccountRepository.findOne({
      where: { msb_id: msbID },
    });

    return feeExternalAccount;
  }

  async createMSBFeeExternalAccount(
    msbID: string,
    body: CreateFeeExternalAccountDto,
  ): Promise<FeeExternalAccount | null> {
    let feeExternalAccount: FeeExternalAccount | null = null;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      feeExternalAccount = this.feeExternalAccountRepository.create({
        ...body,
        msb_id: msbID,
        ...(body.account_owner_type === 'individual' && {
          business_name: undefined,
        }),
        ...(body.account_owner_type === 'business' && {
          first_name: undefined,
          last_name: undefined,
        }),
      });
      await queryRunner.manager.save(feeExternalAccount);
      await queryRunner.commitTransaction();
    } catch (e) {
      console.error('Failed to create fee external account:', e);
      await queryRunner.rollbackTransaction();
    } finally {
      await queryRunner.release();
    }

    return feeExternalAccount;
  }

  async updateMSBFeeExternalAccount(
    msbID: string,
    feeExternalAccountID: string,
    update: UpdateFeeExternalAccountDto,
  ): Promise<FeeExternalAccount | null> {
    let updatedFeeAccount: FeeExternalAccount | null = null;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      updatedFeeAccount = await this.feeExternalAccountRepository.findOne({
        where: { id: feeExternalAccountID, msb_id: msbID },
      });
      if (!updatedFeeAccount) {
        throw new BadRequestException('MSB fee account not found');
      }
      await this.feeExternalAccountRepository.update(updatedFeeAccount.id, {
        ...update,
        ...(update.account_owner_type === 'individual' && {
          business_name: undefined,
        }),
        ...(update.account_owner_type === 'business' && {
          first_name: undefined,
          last_name: undefined,
        }),
      });
      await queryRunner.commitTransaction();
    } catch (e) {
      console.error('Failed to update fee external account:', e);
      await queryRunner.rollbackTransaction();
    }

    return updatedFeeAccount;
  }

  async generateKYCLink(customerID: string): Promise<KYCDto> {
    const customer = await this.getCustomer(customerID);
    if (!customer) {
      throw new BadRequestException('Customer not found');
    }

    const url = `${this.baseUrl}/kyc_links?customer_id=${customer.id}`;
    const headers = this.buildHeaders();
    const response = (await this.requestJson(url, {
      method: 'GET',
      headers,
    })) as KYCListDto;

    return response.data[0];
  }
}
