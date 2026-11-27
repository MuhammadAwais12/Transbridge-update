import { providers } from '../config/providers.config';
import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from '../client/transaction.entity';
import { Wallet } from '../msb-wallet/wallet.entity';
import { Beneficiary } from '../client/beneficiary.entity';
import { Account } from '../client/account.entity';
import { ClientProfile } from '../client/client.entity';
import { CreateTransferDto } from './dto/create-transfer.dto';
import { ConfirmTransferDto } from './dto/confirm-transfer.dto';
import { WebhookService } from './webhook.service';
import { getTokenNetworkConfig } from '../utils/token-network-config';

@Injectable()
export class TransferService {
  private readonly logger = new Logger(TransferService.name);

  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    @InjectRepository(Wallet)
    private readonly walletRepository: Repository<Wallet>,
    @InjectRepository(Beneficiary)
    private readonly beneficiaryRepository: Repository<Beneficiary>,
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
    @InjectRepository(ClientProfile)
    private readonly clientRepository: Repository<ClientProfile>,
    private readonly webhookService: WebhookService,
  ) {}

  async debugGetWallet(clientId: string): Promise<any> {
    const wallet = await this.walletRepository.findOne({
      where: { client_id: clientId }
    });
    return wallet;
  }

  async getTransactionById(transactionId: string): Promise<any> {
    const transaction = await this.transactionRepository.findOne({
      where: { id: transactionId }
    });
    
    if (!transaction) {
      throw new Error('Transaction not found');
    }
    
    return transaction;
  }

  async getTransferPreview(dto: CreateTransferDto): Promise<any> {
    console.log('Transfer preview request:', JSON.stringify(dto, null, 2));
    console.log('Environment variables check:', providers.status());

    // Validate transfer amount based on payment method and currency
    await this.validateTransferAmount(dto);
    
    // Get the client profile to get the linked wallet information
    const client = await this.clientRepository.findOne({
      where: { id: dto.client_id }
    });
    
    if (!client) {
      throw new BadRequestException('Client not found');
    }
    
    if (!client.wallet_address || !client.blindpay_wallet_id) {
      throw new BadRequestException('Client wallet not linked. Please connect your wallet first.');
    }

    console.log('Client wallet found:', { 
      id: client.id, 
      wallet_address: client.wallet_address,
      wallet_network: client.wallet_network,
      blindpay_wallet_id: client.blindpay_wallet_id 
    });

    // Get the source account to find the BlindPay receiver ID
    const sourceAccount = await this.accountRepository.findOne({
      where: { id: dto.account_id }
    });

    console.log('Source account found:', sourceAccount ? { id: sourceAccount.id, blindpay_bank_account_id: sourceAccount.blindpay_bank_account_id } : 'Not found');

    if (!sourceAccount || !sourceAccount.blindpay_bank_account_id) {
      throw new Error('Source account not found or not properly configured with BlindPay');
    }

    // Get the destination receiver ID
    let destinationReceiverId: string;
    let beneficiaryBankAccountId: string;
    
    if (dto.bank_account_id) {
      // Use the bank_account_id directly as the destination receiver ID
      destinationReceiverId = dto.bank_account_id;
      beneficiaryBankAccountId = dto.bank_account_id; // This is the beneficiary's bank account ID
      console.log('Using bank_account_id as destination receiver ID:', destinationReceiverId);
    } else if (dto.destination_account_id) {
      // Internal transfer - get receiver ID from destination account
      const destAccount = await this.accountRepository.findOne({
        where: { id: dto.destination_account_id }
      });
      console.log('Destination account found:', destAccount ? { id: destAccount.id, blindpay_bank_account_id: destAccount.blindpay_bank_account_id } : 'Not found');
      if (!destAccount || !destAccount.blindpay_bank_account_id) {
        throw new Error('Destination account not found or not properly configured');
      }
      destinationReceiverId = destAccount.blindpay_bank_account_id;
      beneficiaryBankAccountId = destAccount.blindpay_bank_account_id; // For internal transfers, use destination account's bank account ID
    } else if (dto.beneficiary_id) {
      // External transfer - get receiver ID from beneficiary
      const beneficiary = await this.beneficiaryRepository.findOne({
        where: { id: dto.beneficiary_id }
      });
      console.log('Beneficiary found:', beneficiary ? { id: beneficiary.id, blindpay_bank_account_id: beneficiary.blindpay_bank_account_id } : 'Not found');
      if (!beneficiary || !beneficiary.blindpay_bank_account_id) {
        throw new Error('Beneficiary not found or not properly configured');
      }
      destinationReceiverId = beneficiary.blindpay_bank_account_id;
      beneficiaryBankAccountId = beneficiary.blindpay_bank_account_id; // For external transfers, use beneficiary's bank account ID
    } else {
      throw new Error('Either bank_account_id, destination_account_id, or beneficiary_id must be provided');
    }

    // Convert amount to cents for BlindPay API (multiply by 100)
    const amountInCents = Math.round(dto.amount * 100);
    
    // Determine source and destination currencies
    const sourceCurrency = sourceAccount.currency || 'USD';
    let destinationCurrency = 'USD'; // Default fallback
    
    if (dto.destination_account_id) {
      // Internal transfer - get currency from destination account
      const destAccount = await this.accountRepository.findOne({
        where: { id: dto.destination_account_id }
      });
      destinationCurrency = destAccount?.currency || 'USD';
    } else if (dto.beneficiary_id) {
      // External transfer - determine currency based on beneficiary country
      const beneficiary = await this.beneficiaryRepository.findOne({
        where: { id: dto.beneficiary_id }
      });
      if (beneficiary) {
        // Map country to currency (simplified mapping)
        const countryToCurrency: { [key: string]: string } = {
          'United States': 'USD',
          'Germany': 'EUR',
          'France': 'EUR',
          'Italy': 'EUR',
          'Spain': 'EUR',
          'Netherlands': 'EUR',
          'Belgium': 'EUR',
          'Austria': 'EUR',
          'Ireland': 'EUR',
          'Finland': 'EUR',
          'Portugal': 'EUR',
          'Greece': 'EUR',
          'Slovenia': 'EUR',
          'Cyprus': 'EUR',
          'Malta': 'EUR',
          'Slovakia': 'EUR',
          'Estonia': 'EUR',
          'Latvia': 'EUR',
          'Lithuania': 'EUR',
          'Luxembourg': 'EUR',
          'United Kingdom': 'GBP',
          'Canada': 'CAD',
          'Japan': 'JPY',
          'Australia': 'AUD',
          'Switzerland': 'CHF',
          'Sweden': 'SEK',
          'Norway': 'NOK',
          'Denmark': 'DKK',
          'Poland': 'PLN',
          'Czech Republic': 'CZK',
          'Hungary': 'HUF',
          'Romania': 'RON',
          'Bulgaria': 'BGN',
          'Croatia': 'HRK',
          'Mexico': 'MXN',
          'Brazil': 'BRL',
        };
        destinationCurrency = countryToCurrency[beneficiary.country] || 'USD';
      }
    }
    
    console.log('Currency determination:', {
      sourceCurrency,
      destinationCurrency,
      sourceAccountId: sourceAccount.id,
      destinationAccountId: dto.destination_account_id,
      beneficiaryId: dto.beneficiary_id
    });
    
    console.log('Payin quote request:', {
      receiver_id: sourceAccount.blindpay_bank_account_id,
      blockchain_wallet_id: client.blindpay_wallet_id,
      request_amount: amountInCents,
      currency: sourceCurrency,
      currency_type: 'sender',
      payment_method: dto.payment_method,
      token: dto.token,
      network: dto.network,
    });

    console.log('=== PAYIN QUOTE NETWORK ===');
    console.log('Network for payin quote:', dto.network);
    console.log('Token for payin quote:', dto.token);
    console.log('================================');

    // Get payin quote
    const payinQuoteRes = await fetch(`${providers.onlineBanking.url}/v1/instances/${providers.blindpay.instanceId}/payin-quotes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${providers.blindpay.apiKey}`,
        'x-api-key': providers.onlineBanking.xApiKey ?? '',
      },
      body: JSON.stringify({
        receiver_id: sourceAccount.blindpay_bank_account_id,
        blockchain_wallet_id: client.blindpay_wallet_id,
        request_amount: amountInCents,
        currency: sourceCurrency,
        currency_type: 'sender',
        payment_method: dto.payment_method,
        token: dto.token,
        network: dto.network,
      }),
    });
    
    if (!payinQuoteRes.ok) {
      const errorText = await payinQuoteRes.text();
      console.error('Payin quote error:', errorText);
      throw new Error('Failed to get payin quote: ' + errorText);
    }
    
    const payinQuote = await payinQuoteRes.json();
    console.log('Payin quote response:', payinQuote);

    // Use net amount after payin fees for the payout quote
    const payinReceiverCentsForPayout = typeof payinQuote.receiver_amount !== 'undefined' && payinQuote.receiver_amount !== null
      ? Number(payinQuote.receiver_amount)
      : amountInCents;

    console.log('Payout quote request:', {
      bank_account_id: beneficiaryBankAccountId,
      blockchain_wallet_id: client.blindpay_wallet_id,
      request_amount: payinReceiverCentsForPayout,
      currency: destinationCurrency,
      currency_type: 'receiver',
      token: dto.token,
      network: dto.network,
    });

    // Get payout quote
    const payoutQuoteRes = await fetch(`${providers.onlineBanking.url}/v2/quotes/${providers.blindpay.instanceId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${providers.blindpay.apiKey}`,
        'x-api-key': providers.onlineBanking.xApiKey ?? '',
      },
      body: JSON.stringify({
        bank_account_id: beneficiaryBankAccountId,
        blockchain_wallet_id: client.blindpay_wallet_id,
        request_amount: payinReceiverCentsForPayout,
        currency: destinationCurrency,
        currency_type: 'receiver',
        token: dto.token,
        network: dto.network,
      }),
    });
    
    if (!payoutQuoteRes.ok) {
      const errorText = await payoutQuoteRes.text();
      console.error('Payout quote error:', errorText);
      throw new Error('Failed to get payout quote: ' + errorText);
    }
    
    const payoutQuote = await payoutQuoteRes.json();
    console.log('Payout quote response:', payoutQuote);
    


    // Calculate total fees from quotes
    // BlindPay quotes often provide sender_amount and receiver_amount (in cents)
    // Fees per leg are (sender_amount - receiver_amount) plus any explicit flat/partner fees (also in cents)
    const toNumber = (v: any): number => {
      if (v === null || v === undefined) return 0;
      const n = typeof v === 'string' ? Number(v) : v;
      return Number.isFinite(n) ? n : 0;
    };

    const payinSenderCents = toNumber(payinQuote.sender_amount);
    const payinReceiverCents = toNumber(payinQuote.receiver_amount);
    const payinFlatFeeCents = toNumber(payinQuote.flat_fee);
    const payinPartnerFeeCents = toNumber(payinQuote.partner_fee_amount);
    const payinLegFeeCents = Math.max(0, payinSenderCents - payinReceiverCents) + payinFlatFeeCents + payinPartnerFeeCents;

    const payoutSenderCents = toNumber(payoutQuote.sender_amount);
    const payoutReceiverCents = toNumber(payoutQuote.receiver_amount);
    const payoutFlatFeeCents = toNumber(payoutQuote.flat_fee);
    const payoutPartnerFeeCents = toNumber(payoutQuote.partner_fee_amount);
    const payoutLegFeeCents = Math.max(0, payoutSenderCents - payoutReceiverCents) + payoutFlatFeeCents + payoutPartnerFeeCents;

    const totalFeesCents = payinLegFeeCents + payoutLegFeeCents;
    const totalFees = totalFeesCents / 100; // convert to dollars
    const recipientAmount = toNumber(dto.amount) - totalFees;



    return {
      payin_quote: payinQuote,
      payout_quote: payoutQuote,
      total_fees: totalFees,
      recipient_amount: recipientAmount,
      sender_amount: dto.amount,
      currency: 'USD',
      estimated_completion: '2-3 business days',
    };
  }

  async confirmTransfer(dto: ConfirmTransferDto): Promise<any> {
    console.log('Confirming transfer with data:', JSON.stringify(dto, null, 2));
    
    // Get the client profile to get the linked wallet information
    const client = await this.clientRepository.findOne({
      where: { id: dto.client_id }
    });
    
    if (!client) {
      throw new BadRequestException('Client not found');
    }
    
    if (!client.wallet_address || !client.blindpay_wallet_id) {
      throw new BadRequestException('Client wallet not linked. Please connect your wallet first.');
    }

    console.log('Client wallet found:', { 
      id: client.id, 
      wallet_address: client.wallet_address,
      wallet_network: client.wallet_network,
      blindpay_wallet_id: client.blindpay_wallet_id 
    });

    // Log the wallet address that will be used for payin
    console.log('=== PAYIN WALLET ADDRESS ===');
    console.log('Wallet address for payin:', client.wallet_address);
    console.log('Client ID:', dto.client_id);
    console.log('Client wallet network:', client.wallet_network);
    console.log('================================');

    // Initiate payin using the quote ID
    console.log('Initiating payin with quote ID:', dto.payin_quote_id);
    console.log('Network for payin initiation:', dto.network);
    
    const payinRes = await fetch(`${providers.onlineBanking.url}/v1/instances/${providers.blindpay.instanceId}/payins/payins/evm`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${providers.blindpay.apiKey}`,
        'x-api-key': providers.onlineBanking.xApiKey ?? '',
      },
      body: JSON.stringify({
        payin_quote_id: dto.payin_quote_id,
        network: dto.network, // Add network parameter to ensure consistency
      }),
    });
    
    if (!payinRes.ok) {
      const errorText = await payinRes.text();
      console.error('Payin initiation error:', errorText);
      throw new Error('Failed to initiate payin: ' + errorText);
    }
    
    const payin = await payinRes.json();
    console.log('Payin initiated successfully:', payin);

    // Validate payout quote before storing
    if (dto.payout_quote_id && dto.payout_quote_data) {
      console.log('=== PAYOUT QUOTE VALIDATION ===');
      console.log('Payout quote ID:', dto.payout_quote_id);
      console.log('Payout quote data keys:', Object.keys(dto.payout_quote_data));
      console.log('Payout quote data:', JSON.stringify(dto.payout_quote_data, null, 2));
      
      try {
        await this.validateQuote(dto.payout_quote_id, dto.payout_quote_data);
        console.log('Payout quote validation passed');
      } catch (validationError) {
        console.error('Payout quote validation failed:', validationError.message);
        throw new BadRequestException(`Payout quote validation failed: ${validationError.message}`);
      }
    } else {
      console.warn('Missing payout quote data for validation:', {
        has_quote_id: !!dto.payout_quote_id,
        has_quote_data: !!dto.payout_quote_data
      });
    }

    // Get dynamic token and network configuration based on client's wallet and environment
    const { token, network } = getTokenNetworkConfig(client.wallet_network);
    
    // Create transaction record
    const tx = this.transactionRepository.create({
      account_id: dto.account_id,
      client_id: dto.client_id,
      msb_id: dto.msb_id,
      transaction_number: 'TXN-' + Date.now(),
      type: 'debit',
      category: 'transfer',
      amount: String(dto.amount),
      currency: 'USD',
      description: 'Bank transfer via BlindPay',
      status: 'payin_pending',
      requires_approval: false,
      payment_method: dto.payment_method,
              metadata: {
          payin_id: payin.id,
          payin_quote_id: dto.payin_quote_id,
          payout_quote_id: dto.payout_quote_id,
          original_payout_quote_id: dto.payout_quote_id, // Store as original for webhook lookup
          wallet_address: client.wallet_address,
          blindpay_wallet_id: client.blindpay_wallet_id,
          // Store the complete payout quote data exactly as received from preview
          payout_quote_data: dto.payout_quote_data,
        // Store the original quote creation parameters for refresh
        quote_creation_params: {
          bank_account_id: dto.bank_account_id || dto.payout_quote_data?.bank_account_id || dto.payout_quote_data?.receiver_id, // Use the actual BlindPay bank account ID from transfer request or quote data
          blockchain_wallet_id: client.blindpay_wallet_id,
          request_amount: dto.payout_quote_data?.sender_amount || dto.payout_quote_data?.amount,
          currency: dto.payout_quote_data?.currency || 'USD',
          currency_type: 'receiver',
          token: dto.payout_quote_data?.token || token, // Use dynamic token configuration
          network: dto.payout_quote_data?.network || network, // Use dynamic network configuration
        },
        // Store beneficiary bank account ID for quote refresh
        beneficiary_bank_account_id: dto.beneficiary_id || dto.destination_account_id,
      },
    });
    
    // Debug: Log the quote creation parameters being stored
    console.log('=== QUOTE CREATION PARAMETERS STORED ===');
    console.log('Quote creation params:', {
      bank_account_id: dto.bank_account_id || dto.payout_quote_data?.bank_account_id || dto.payout_quote_data?.receiver_id,
      blockchain_wallet_id: client.blindpay_wallet_id,
      request_amount: dto.payout_quote_data?.sender_amount || dto.payout_quote_data?.amount,
      currency: dto.payout_quote_data?.currency || 'USD',
      currency_type: 'receiver',
      token: dto.payout_quote_data?.token || token, // Use dynamic token configuration
      network: dto.payout_quote_data?.network || network, // Use dynamic network configuration
    });
    console.log('================================');
    
    await this.transactionRepository.save(tx);
    console.log('Transaction created:', tx.id);

    // Do NOT initiate payout here anymore
    return tx;
  }

  async handleWebhook(body: any, headers: any, rawBody: Buffer | undefined): Promise<void> {
    console.log('Received webhook:', { body, headers });

    // Verify webhook signature over the exact request bytes
    if (!this.webhookService.verifySignature(headers, rawBody)) {
      throw new Error('Webhook signature verification failed');
    }

    // Process the webhook event using the webhook service
    await this.webhookService.processWebhook(body);
  }

  // Helper methods
  private async findTransactionByPayinId(payinId: string): Promise<Transaction | null> {
    return this.transactionRepository.findOne({
      where: { metadata: { payin_id: payinId } }
    });
  }

  private async findTransactionByPayoutId(payoutId: string): Promise<Transaction | null> {
    return this.transactionRepository.findOne({
      where: { metadata: { payout_id: payoutId } }
    });
  }

  private async updateTransactionByPayinId(payinId: string, status: string): Promise<void> {
    const tx = await this.findTransactionByPayinId(payinId);
    if (tx) {
      tx.status = status;
      await this.transactionRepository.save(tx);
    }
  }

  private async updateTransactionByPayoutId(payoutId: string, status: string): Promise<void> {
    const tx = await this.findTransactionByPayoutId(payoutId);
    if (tx) {
      tx.status = status;
      await this.transactionRepository.save(tx);
    }
  }

  /**
   * Mint USDC tokens to wallet for testing
   * This should only be used in development
   */
  private async mintUSDCToWallet(walletAddress: string, amount: string): Promise<void> {
    try {
      console.log(`Minting ${amount} USDC to wallet: ${walletAddress}`);
      
      const mintRes = await fetch(`${providers.onlineBanking.url}/v1/instances/${providers.blindpay.instanceId}/utilities/mint`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${providers.blindpay.apiKey}`,
          'x-api-key': providers.onlineBanking.xApiKey ?? '',
        },
        body: JSON.stringify({
          address: walletAddress,
          amount: amount, // Amount in wei (1 USDC = 1000000000000000000 wei)
        }),
      });

      if (!mintRes.ok) {
        const errorText = await mintRes.text();
        console.error('USDC minting error:', errorText);
        throw new Error('Failed to mint USDC: ' + errorText);
      }

      const mintResult = await mintRes.json();
              console.log('USDC minted successfully:', mintResult);
    } catch (err) {
              console.error('Error minting USDC:', err);
      // Don't throw error - this is optional for development
    }
  }

  /**
   * Validate transfer amount based on payment method and currency
   */
  private async validateTransferAmount(dto: CreateTransferDto): Promise<void> {
    const amount = dto.amount;
    const paymentMethod = dto.payment_method;
    
    // Get destination currency for validation
    let destinationCurrency = 'USD';
    if (dto.destination_account_id) {
      const destAccount = await this.accountRepository.findOne({
        where: { id: dto.destination_account_id }
      });
      destinationCurrency = destAccount?.currency || 'USD';
    } else if (dto.beneficiary_id) {
      const beneficiary = await this.beneficiaryRepository.findOne({
        where: { id: dto.beneficiary_id }
      });
      if (beneficiary) {
        const countryToCurrency: { [key: string]: string } = {
          'United States': 'USD',
          'Germany': 'EUR', 'France': 'EUR', 'Italy': 'EUR', 'Spain': 'EUR',
          'Netherlands': 'EUR', 'Belgium': 'EUR', 'Austria': 'EUR', 'Ireland': 'EUR',
          'Finland': 'EUR', 'Portugal': 'EUR', 'Greece': 'EUR', 'Slovenia': 'EUR',
          'Cyprus': 'EUR', 'Malta': 'EUR', 'Slovakia': 'EUR', 'Estonia': 'EUR',
          'Latvia': 'EUR', 'Lithuania': 'EUR', 'Luxembourg': 'EUR',
          'United Kingdom': 'GBP', 'Canada': 'CAD', 'Japan': 'JPY', 'Australia': 'AUD',
          'Switzerland': 'CHF', 'Sweden': 'SEK', 'Norway': 'NOK', 'Denmark': 'DKK',
          'Poland': 'PLN', 'Czech Republic': 'CZK', 'Hungary': 'HUF', 'Romania': 'RON',
          'Bulgaria': 'BGN', 'Croatia': 'HRK', 'Mexico': 'MXN', 'Brazil': 'BRL',
        };
        destinationCurrency = countryToCurrency[beneficiary.country] || 'USD';
      }
    }

    // Define minimum amounts for different payment methods and currencies
    const minimumAmounts: { [key: string]: { [key: string]: number } } = {
      'swift': {
        'USD': 100,
        'EUR': 85,  // Approximate EUR equivalent
        'GBP': 75,  // Approximate GBP equivalent
        'default': 100
      },
      'ach': {
        'USD': 1,
        'default': 1
      },
      'wire': {
        'USD': 25,
        'EUR': 20,
        'GBP': 20,
        'default': 25
      },
      'sepa': {
        'EUR': 1,
        'default': 1
      },
      'default': {
        'USD': 1,
        'EUR': 1,
        'GBP': 1,
        'default': 1
      }
    };

    // Get minimum amount for this payment method and currency
    const methodMinimums = minimumAmounts[paymentMethod] || minimumAmounts['default'];
    const minimumAmount = methodMinimums[destinationCurrency] || methodMinimums['default'];

    if (amount < minimumAmount) {
      const currencySymbol = destinationCurrency === 'USD' ? '$' : destinationCurrency === 'EUR' ? '€' : destinationCurrency === 'GBP' ? '£' : '';
      throw new BadRequestException(
        `Minimum transfer amount for ${paymentMethod.toUpperCase()} to ${destinationCurrency} is ${currencySymbol}${minimumAmount}. ` +
        `Current amount: ${currencySymbol}${amount}`
      );
    }

    // Define maximum amounts (if needed)
    const maximumAmounts: { [key: string]: { [key: string]: number } } = {
      'ach': {
        'USD': 25000,
        'default': 25000
      },
      'swift': {
        'USD': 1000000,
        'EUR': 1000000,
        'GBP': 1000000,
        'default': 1000000
      },
      'default': {
        'USD': 1000000,
        'EUR': 1000000,
        'GBP': 1000000,
        'default': 1000000
      }
    };

    const methodMaximums = maximumAmounts[paymentMethod] || maximumAmounts['default'];
    const maximumAmount = methodMaximums[destinationCurrency] || methodMaximums['default'];

    if (amount > maximumAmount) {
      const currencySymbol = destinationCurrency === 'USD' ? '$' : destinationCurrency === 'EUR' ? '€' : destinationCurrency === 'GBP' ? '£' : '';
      throw new BadRequestException(
        `Maximum transfer amount for ${paymentMethod.toUpperCase()} to ${destinationCurrency} is ${currencySymbol}${maximumAmount.toLocaleString()}. ` +
        `Current amount: ${currencySymbol}${amount}`
      );
    }

    console.log(`Transfer amount validation passed: ${amount} ${destinationCurrency} via ${paymentMethod}`);
  }

  /**
   * Validate quote before using it for payout
   */
  private async validateQuote(quoteId: string, quoteData: any): Promise<void> {
    if (!quoteId) {
      throw new BadRequestException('Quote ID is required for payout');
    }

    if (!quoteData) {
      throw new BadRequestException('Quote data is required for payout');
    }

    // Check if quote has expired
    if (quoteData.expires_at) {
      const expirationTime = new Date(quoteData.expires_at).getTime();
      const currentTime = Date.now();
      
      if (currentTime > expirationTime) {
        throw new BadRequestException(
          `Quote has expired. Quote ID: ${quoteId}. ` +
          `Expired at: ${new Date(expirationTime).toISOString()}. ` +
          `Current time: ${new Date(currentTime).toISOString()}`
        );
      }

      // Check if quote expires soon (within 5 minutes)
      const fiveMinutesFromNow = currentTime + (5 * 60 * 1000);
      if (expirationTime < fiveMinutesFromNow) {
        console.warn(`Quote ${quoteId} expires soon at ${new Date(expirationTime).toISOString()}`);
      }
    }

    // Validate required quote fields
    const requiredFields = ['id', 'sender_amount', 'receiver_amount'];
    for (const field of requiredFields) {
      if (!quoteData[field]) {
        throw new BadRequestException(`Quote is missing required field: ${field}`);
      }
    }

    console.log(`Quote validation passed: ${quoteId}`);
  }

  /**
   * Approve tokens for BlindPay to move them
   */
  private async approveTokensForBlindPay(walletAddress: string, contractAddress: string, amount: string): Promise<void> {
    try {
      console.log(`Approving ${amount} tokens for BlindPay contract: ${contractAddress}`);
      
      // This would require a blockchain transaction
      // For now, we'll just log the requirement
      console.log('Token approval required for wallet:', walletAddress);
      console.log('Contract address:', contractAddress);
      console.log('Amount to approve:', amount);
      
      // TODO: Implement actual token approval using ethers.js or similar
      // This requires the wallet's private key and blockchain interaction
      
    } catch (err) {
      console.error('Error approving tokens:', err);
      throw new Error('Token approval failed: ' + err.message);
    }
  }

  /**
   * Approve a transaction after payin completion
   */
  async approveTransaction(dto: any, user: any): Promise<any> {
    this.logger.log('Approving transaction:', dto.transaction_id);
    this.logger.log('User from JWT:', user);
    
    // Find the client profile using the user ID from JWT
    const client = await this.clientRepository.findOne({
      where: { user_id: user.userId }
    });

    if (!client) {
      throw new BadRequestException('Client profile not found for this user');
    }

    this.logger.log('Client profile found:', { id: client.id, user_id: client.user_id });
    
    // Find the transaction
    const tx = await this.transactionRepository.findOne({
      where: { id: dto.transaction_id }
    });

    if (!tx) {
      throw new BadRequestException('Transaction not found');
    }

    // Verify the transaction belongs to the client
    if (tx.client_id !== client.id) {
      this.logger.error('Transaction ownership mismatch:', {
        transaction_client_id: tx.client_id,
        client_id: client.id,
        user_id: user.userId
      });
      throw new BadRequestException('Transaction does not belong to this user');
    }

    // Check if transaction is in the correct state for approval
    if (tx.status !== 'payin_completed' && tx.status !== 'payout_failed') {
      throw new BadRequestException(`Transaction cannot be approved in current status: ${tx.status}`);
    }
    const approvalStatus = tx.status;
    const retryingFailedPayout = approvalStatus === 'payout_failed';

    // Check if approval is required or if this is a retry of a failed payout
    if (!tx.metadata?.awaiting_approval && !retryingFailedPayout) {
      throw new BadRequestException('Transaction does not require approval');
    }

    // Verify wallet address matches the client's wallet address
    if (client.wallet_address !== dto.wallet_address) {
      this.logger.error('Wallet address mismatch:', {
        client_wallet_address: client.wallet_address,
        provided_wallet_address: dto.wallet_address
      });
      throw new BadRequestException('Wallet address does not match your registered wallet');
    }

    // Get payout quote data from transaction metadata
    let payout_quote_id = tx.metadata?.payout_quote_id;
    let payout_quote_data = tx.metadata?.payout_quote_data;
    const wallet_address = client.wallet_address; // Use client's wallet address

    // If this is a retry of a failed payout, we might need to create a new quote
    if (retryingFailedPayout) {
      this.logger.log('Retrying failed payout - checking if we need a new quote');
      
      try {
        // Try to validate the existing quote first
        if (payout_quote_id && payout_quote_data) {
          await this.validateQuote(payout_quote_id, payout_quote_data);
          this.logger.log('Existing quote is still valid, using it for retry');
        } else {
          throw new Error('No existing quote data found');
        }
      } catch (quoteError) {
        this.logger.log('Existing quote is invalid or expired, creating new quote for retry');
        
        // Create a new payout quote using the stored parameters
        const quoteParams = tx.metadata?.quote_creation_params;
        if (!quoteParams) {
          throw new BadRequestException('Missing quote creation parameters for retry');
        }
        
        const newQuoteRes = await fetch(`${providers.onlineBanking.url}/v2/quotes/${providers.blindpay.instanceId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${providers.blindpay.apiKey}`,
            'x-api-key': providers.onlineBanking.xApiKey ?? '',
          },
          body: JSON.stringify(quoteParams),
        });
        
        if (!newQuoteRes.ok) {
          const errorText = await newQuoteRes.text();
          this.logger.error('Failed to create new quote for retry:', errorText);
          throw new BadRequestException(`Failed to create new quote for retry: ${errorText}`);
        }
        
        const newQuote = await newQuoteRes.json();
        payout_quote_id = newQuote.id;
        payout_quote_data = newQuote;
        
        // Update transaction metadata with new quote
        tx.metadata = {
          ...tx.metadata,
          payout_quote_id: newQuote.id,
          payout_quote_data: newQuote,
          retry_quote_created_at: new Date().toISOString(),
        };
        const quoteUpdate = await this.transactionRepository.update(
          { id: tx.id, status: approvalStatus },
          { metadata: tx.metadata },
        );
        if (!quoteUpdate.affected) {
          throw new BadRequestException('Transaction approval is already in progress or no longer available');
        }
        
        this.logger.log('New quote created for retry:', newQuote.id);
      }
    }

    if (!payout_quote_id || !payout_quote_data) {
      throw new BadRequestException('Missing payout quote data for approval');
    }

    this.logger.log('=== TRANSACTION APPROVAL ===');
    this.logger.log('Transaction ID:', tx.id);
    this.logger.log('Payout quote ID:', payout_quote_id);
    this.logger.log('Wallet address:', wallet_address);
    this.logger.log('============================');

    // Validate before claiming so invalid quotes do not lock the transaction.
    await this.validateQuote(payout_quote_id, payout_quote_data);

    const claimResult = await this.transactionRepository.update(
      { id: tx.id, status: approvalStatus },
      { status: 'payout_processing' },
    );
    if (!claimResult.affected) {
      throw new BadRequestException('Transaction approval is already in progress or no longer available');
    }

    tx.status = 'payout_processing';

    let payoutDefinitelyRejected = false;
    try {
      // Note: Token allowance verification is handled by the frontend during the approval process
      // The frontend will show a MetaMask approval modal to the user, similar to the confirm transfer flow
      this.logger.log('Skipping backend allowance verification - frontend will handle token approval');

      // Initiate payout
      this.logger.log('Initiating payout with quote ID:', payout_quote_id);
      
      const payoutRes = await fetch(`${providers.onlineBanking.url}/v2/payouts/${providers.blindpay.instanceId}/evm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${providers.blindpay.apiKey}`,
          'x-api-key': providers.onlineBanking.xApiKey ?? '',
        },
        body: JSON.stringify({
          quote_id: payout_quote_id,
          sender_wallet_address: wallet_address,
        }),
      });

      if (!payoutRes.ok) {
        payoutDefinitelyRejected =
          payoutRes.status >= 400 && payoutRes.status < 500 && payoutRes.status !== 409;
        const errorText = await payoutRes.text();
        this.logger.error('Payout initiation error during approval:', errorText);
        
        // Check if the error is due to quote expiration
        if (errorText.includes('quote_expired') || errorText.includes('expired') || errorText.includes('instrument_id_invalid')) {
          throw new BadRequestException('Quote has expired - please retry the transfer');
        }
        
        // Check if the error is due to allowance failure
        if (errorText.includes('safenet_pull_allowance_failed')) {
          throw new BadRequestException('Token allowance not found - please ensure tokens are approved before transfer');
        }
        
        throw new BadRequestException(`Payout initiation failed: ${errorText}`);
      }

      const payout = await payoutRes.json();
      this.logger.log('Payout initiated successfully during approval:', payout);
      
      // Update transaction status
      tx.status = 'payout_pending';
      tx.metadata = {
        ...tx.metadata,
        payout_id: payout.id,
        original_payout_quote_id: payout_quote_id, // Store the original quote ID used to create this payout
        payout_initiated_at: new Date().toISOString(),
        approved_at: new Date().toISOString(),
        approved_by: user.id,
        approval_reason: dto.reason || 'Client approved the transfer',
        awaiting_approval: false,
        // Clear error information if this was a retry
        ...(retryingFailedPayout && {
          payout_error: undefined,
          payout_error_at: undefined,
          approval_failed_at: undefined,
          retry_successful: true,
          retry_count: (tx.metadata?.retry_count || 0) + 1,
        }),
      };
      
      await this.transactionRepository.save(tx);
      this.logger.log('Transaction updated with payout ID after approval:', tx.id, payout.id);

      return {
        success: true,
        message: 'Transaction approved and payout initiated successfully',
        transaction_id: tx.id,
        payout_id: payout.id,
        status: 'payout_pending'
      };

    } catch (error) {
      this.logger.error('Failed to approve transaction:', error);
      
      if (payoutDefinitelyRejected) {
        tx.status = 'payout_failed';
        tx.metadata = {
          ...tx.metadata,
          payout_error: error.message,
          payout_error_at: new Date().toISOString(),
          approval_failed_at: new Date().toISOString(),
        };
        await this.transactionRepository.save(tx);
      } else {
        this.logger.error(
          'Payout outcome is uncertain; leaving transaction in payout_processing to prevent a duplicate payout',
        );
      }
      
      throw error;
    }
  }

} 