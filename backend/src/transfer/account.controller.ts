import { providers } from '../config/providers.config';
import { Controller, Post, Body, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account } from '../client/account.entity';
import { TransferCreateAccountDto } from './dto/create-account.dto';
import { AccessService, Caller } from '../auth/access.service';
import { Authenticated, CurrentCaller } from '../auth/caller.guard';

@Authenticated()
@Controller('account')
export class AccountController {
  constructor(
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
    private readonly access: AccessService,
  ) {}

  @Post()
  async create(@Body() createAccountDto: TransferCreateAccountDto, @CurrentCaller() caller: Caller) {
    // Never trust client_id / msb_id / receiver_id from the body
    const client = await this.access.assertClient(caller, createAccountDto.client_id);
    if (createAccountDto.msb_id !== client.msb_id) {
      throw new ForbiddenException('msb_id does not match the client');
    }
    if (!client.blindpay_receiver_id || createAccountDto.receiver_id !== client.blindpay_receiver_id) {
      throw new ForbiddenException('receiver_id does not belong to the client');
    }

    // Call BlindPay API to create the bank account
    const apiUrl = `${providers.onlineBanking.url}/v1/instances/${providers.blindpay.instanceId}/receivers/${createAccountDto.receiver_id}/bank-accounts`;
    
    console.log('Creating account with payload:', JSON.stringify(createAccountDto, null, 2));
    console.log('BlindPay API URL:', apiUrl);
    
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${providers.blindpay.apiKey}`,
          'x-api-key': providers.onlineBanking.xApiKey ?? '',
        },
        body: JSON.stringify(createAccountDto.bankAccountData),
      });
      
      console.log('BlindPay response status:', response.status);
      console.log('BlindPay response headers:', response.headers);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('BlindPay API error response:', errorText);
        throw new Error(`BlindPay API error (${response.status}): ${errorText}`);
      }
      
      const bankAccount = await response.json();
      console.log('BlindPay success response:', bankAccount);
      
      // Save to local accounts table
      // Map BlindPay account_type to DB allowed values
      const dbAccountTypeMap = { checking: 'current', saving: 'savings' };
      const account = this.accountRepository.create({
        client_id: createAccountDto.client_id,
        msb_id: createAccountDto.msb_id,
        account_number: bankAccount.account_number || bankAccount.iban || bankAccount.clabe || bankAccount.pix_key,
        account_name: createAccountDto.account_name,
        account_type: dbAccountTypeMap[createAccountDto.account_type] || 'current', // Mapped value
        currency: createAccountDto.currency,
        balance: createAccountDto.initial_balance?.toString() || '0',
        available_balance: createAccountDto.initial_balance?.toString() || '0',
        status: 'active',
        opened_date: new Date(),
        last_activity: new Date(),
        blindpay_bank_account_id: bankAccount.id || null, // Save BlindPay bank account id
        overdraft_limit: createAccountDto.overdraft_limit?.toString() || null,
        minimum_balance: createAccountDto.minimum_balance?.toString() || null,
        monthly_fee: createAccountDto.monthly_fee?.toString() || '0',
        interest_rate: createAccountDto.interest_rate?.toString() || null,
      } as any);
      await this.accountRepository.save(account);
      return account;
    } catch (err) {
      console.error('Account creation error:', err);
      throw new BadRequestException('Failed to create account: ' + err.message);
    }
  }
} 