import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account } from './account.entity';
import { CreateAccountDto, UpdateAccountStatusDto, UpdateAccountLimitsDto, UpdateAccountBalanceDto } from './dto/account.dto';

@Injectable()
export class AccountService {
  constructor(
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
  ) {}

  async create(dto: CreateAccountDto) {
    const exists = await this.accountRepository.findOne({ where: { account_number: dto.account_number } });
    if (exists) throw new BadRequestException('Account number already exists');
    // Convert numeric fields to string for decimal columns
    const account = this.accountRepository.create({
      ...dto,
      overdraft_limit: dto.overdraft_limit !== undefined ? String(dto.overdraft_limit) : undefined,
      minimum_balance: dto.minimum_balance !== undefined ? String(dto.minimum_balance) : undefined,
      monthly_fee: dto.monthly_fee !== undefined ? String(dto.monthly_fee) : undefined,
      interest_rate: dto.interest_rate !== undefined ? String(dto.interest_rate) : undefined,
    });
    return this.accountRepository.save(account);
  }

  async list(filter: any) {
    if (filter.user_id) {
      filter.client_id = filter.user_id;
      delete filter.user_id;
      // Only return accounts for this client_id
      return this.accountRepository.find({ where: { client_id: filter.client_id } });
    }
    return this.accountRepository.find({ where: filter });
  }

  async listByMsb(msb_id: string) {
    // Validate msb_id before querying
    if (!msb_id || msb_id === 'undefined' || msb_id === 'null') {
      throw new BadRequestException('Invalid MSB ID provided');
    }
    return this.accountRepository.find({ where: { msb_id } });
  }

  async getById(id: string) {
    const account = await this.accountRepository.findOne({ where: { id } });
    if (!account) throw new NotFoundException('Account not found');
    return account;
  }

  async updateStatus(id: string, dto: UpdateAccountStatusDto) {
    const account = await this.getById(id);
    account.status = dto.status;
    return this.accountRepository.save(account);
  }

  async updateLimits(id: string, dto: UpdateAccountLimitsDto) {
    const account = await this.getById(id);
    if (dto.overdraft_limit !== undefined) account.overdraft_limit = String(dto.overdraft_limit);
    if (dto.minimum_balance !== undefined) account.minimum_balance = String(dto.minimum_balance);
    if (dto.monthly_fee !== undefined) account.monthly_fee = String(dto.monthly_fee);
    if (dto.interest_rate !== undefined) account.interest_rate = String(dto.interest_rate);
    return this.accountRepository.save(account);
  }

  async updateBalance(id: string, dto: UpdateAccountBalanceDto) {
    const account = await this.getById(id);
    if (dto.balance !== undefined) account.balance = String(dto.balance);
    if (dto.available_balance !== undefined) account.available_balance = String(dto.available_balance);
    return this.accountRepository.save(account);
  }

  // PIN management stubs
  async generatePin(id: string) {
    // Implement PIN generation and storage (hashed)
    return { message: 'PIN generated (stub)' };
  }

  async getPin(id: string) {
    // Implement secure PIN retrieval
    return { message: 'PIN retrieval (stub)' };
  }
} 