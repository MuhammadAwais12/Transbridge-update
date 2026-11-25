import { providers } from '../config/providers.config';
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VirtualAccount, VirtualAccountStatus } from './virtual-account.entity';
import { CreateVirtualAccountDto } from './dto/create-virtual-account.dto';
import { ClientProfile } from '../client/client.entity';

@Injectable()
export class VirtualAccountService {
  constructor(
    @InjectRepository(VirtualAccount)
    private virtualAccountRepository: Repository<VirtualAccount>,
    @InjectRepository(ClientProfile)
    private clientRepository: Repository<ClientProfile>,
  ) {}

  async createVirtualAccount(dto: CreateVirtualAccountDto): Promise<VirtualAccount> {
    // Verify client exists
    const client = await this.clientRepository.findOne({ where: { id: dto.clientId } });
    if (!client) {
      throw new NotFoundException('Client not found');
    }

    // Verify client has blindpay_receiver_id
    if (!client.blindpay_receiver_id) {
      throw new BadRequestException('Client must have a BlindPay receiver ID to create virtual accounts');
    }

    // Verify client has supported ID document type
    const supportedIdTypes = ['PASSPORT', 'SSN'];
    console.log(`Client ${client.first_name} ${client.last_name} has id_document_type: "${client.id_document_type}"`);
    // if (!client.id_document_type || !supportedIdTypes.includes(client.id_document_type)) {
    //   throw new BadRequestException('Client must have a PASSPORT or SSN ID document type to create virtual accounts. Current ID type: ' + (client.id_document_type || 'none'));
    // }

    // Check blockchainWalletId is present and a string
    if (!dto.blockchainWalletId || typeof dto.blockchainWalletId !== 'string') {
      throw new BadRequestException('blockchainWalletId is required and must be a string');
    }

    // Call BlindPay API to create virtual account using the client's receiver ID
    const blindpayUrl = `${providers.onlineBanking.url}/v2/virtual-accounts/${providers.blindpay.instanceId}/${client.blindpay_receiver_id}`;
    const blindpayPayload = {
      token: dto.token || 'USDC',
      blockchain_wallet_id: dto.blockchainWalletId,
    };
    console.log('BlindPay API URL:', blindpayUrl);
    console.log('BlindPay API Payload:', JSON.stringify(blindpayPayload));
    console.log('Client receiver ID:', client.blindpay_receiver_id);
    console.log('Client ID document type:', client.id_document_type);

    const response = await fetch(blindpayUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${providers.blindpay.apiKey}`,
        'x-api-key': providers.onlineBanking.xApiKey ?? '',
      },
      body: JSON.stringify(blindpayPayload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('BlindPay API error:', errorText);
      throw new BadRequestException(`Failed to create virtual account: ${errorText}`);
    }

    const blindpayResponse = await response.json();
    console.log('BlindPay virtual account response:', blindpayResponse);

    // Create virtual account in our database
    const virtualAccount = this.virtualAccountRepository.create({
      clientId: dto.clientId,
      blindpayReceiverId: client.blindpay_receiver_id, // Use the client's receiver ID
      blindpayVirtualAccountId: blindpayResponse.id,
      accountNumber: blindpayResponse.account_number,
      routingNumber: blindpayResponse.routing_number,
      bankName: blindpayResponse.bank_name || 'BlindPay Bank',
      paymentRail: dto.paymentRail,
      status: VirtualAccountStatus.ACTIVE,
      token: dto.token || 'USDC',
      blockchainWalletId: dto.blockchainWalletId,
      accountName: dto.accountName,
      description: dto.description,
      balance: '0',
      availableBalance: '0',
      currency: 'USD',
    });

    return this.virtualAccountRepository.save(virtualAccount);
  }

  async getVirtualAccountsByClient(clientId: string): Promise<VirtualAccount[]> {
    return this.virtualAccountRepository.find({
      where: { clientId },
      relations: ['client'],
      order: { createdAt: 'DESC' },
    });
  }

  async getVirtualAccountById(id: string): Promise<VirtualAccount> {
    const virtualAccount = await this.virtualAccountRepository.findOne({
      where: { id },
      relations: ['client'],
    });

    if (!virtualAccount) {
      throw new NotFoundException('Virtual account not found');
    }

    return virtualAccount;
  }

  async updateVirtualAccountStatus(id: string, status: VirtualAccountStatus): Promise<VirtualAccount> {
    const virtualAccount = await this.getVirtualAccountById(id);
    virtualAccount.status = status;
    return this.virtualAccountRepository.save(virtualAccount);
  }

  async deleteVirtualAccount(id: string): Promise<void> {
    const virtualAccount = await this.getVirtualAccountById(id);
    await this.virtualAccountRepository.remove(virtualAccount);
  }

  async getVirtualAccountsByMsb(msbId: string): Promise<VirtualAccount[]> {
    return this.virtualAccountRepository.find({
      where: { client: { msb_id: msbId } },
      relations: ['client'],
      order: { createdAt: 'DESC' },
    });
  }

  async getAllVirtualAccounts(): Promise<VirtualAccount[]> {
    return this.virtualAccountRepository.find({
      relations: ['client'],
      order: { createdAt: 'DESC' },
    });
  }
} 