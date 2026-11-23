import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Wallet } from './wallet.entity';
import { ClientProfile } from '../client/client.entity';
import { CreateWalletDto } from './dto/create-wallet.dto';

@Injectable()
export class WalletService {
  constructor(
    @InjectRepository(Wallet)
    private readonly walletRepository: Repository<Wallet>,
    @InjectRepository(ClientProfile)
    private readonly clientRepository: Repository<ClientProfile>,
  ) {}

  async createWallet(dto: CreateWalletDto): Promise<Wallet | null> {
    // Find the client profile to get the receiver_id
    const client = await this.clientRepository.findOne({ where: { id: dto.client_id } });
    if (!client) {
      throw new Error('Client not found');
    }
    if (!client.blindpay_receiver_id) {
      throw new Error('Client does not have a BlindPay receiver ID. Please ensure the client has completed KYC successfully.');
    }

    // Step 1: Get the message to sign from BlindPay API
    const signMessageUrl = `${process.env.NEXT_PUBLIC_ONLINE_BANKING_URL}/v2/instances/${process.env.NEXT_PUBLIC_BLINDPAY_INSTANCE_ID}/receivers/${client.blindpay_receiver_id}/blockchain-wallets/sign-message`;
    
    console.log('Getting sign message from BlindPay API:', signMessageUrl);
    
    let messageToSign: string;
    try {
      const signMessageResponse = await fetch(signMessageUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_BLINDPAY_API_KEY}`,
          'x-api-key': process.env.NEXT_PUBLIC_ONLINE_BANKING_X_API_KEY || '',
        },
      });
      
      if (!signMessageResponse.ok) {
        const errorText = await signMessageResponse.text();
        console.error('BlindPay sign message API error:', errorText);
        throw new Error(`Failed to get sign message from BlindPay: ${signMessageResponse.status} - ${errorText}`);
      }
      
      const signMessageData = await signMessageResponse.json();
      messageToSign = signMessageData.message;
      console.log('Received message to sign:', messageToSign);
    } catch (err) {
      console.error('Error getting sign message from BlindPay:', err);
      throw new Error('Failed to get sign message from BlindPay: ' + err.message);
    }

    // Step 2: Generate signature (for now, we'll use a placeholder signature)
    // In a real implementation, you would use a proper signing library
    const signature_tx_hash = this.generateSignature(messageToSign);
    console.log('Generated signature:', signature_tx_hash);

    const apiUrl = `${process.env.NEXT_PUBLIC_ONLINE_BANKING_URL}/v2/instances/${process.env.NEXT_PUBLIC_BLINDPAY_INSTANCE_ID}/receivers/${client.blindpay_receiver_id}/blockchain-wallets`;
    
    // Prepare payload for online banking API
    const payload: any = {
      name: dto.name,
      network: dto.network,
      is_account_abstraction: dto.is_account_abstraction === true, // Ensure boolean value
      signature_tx_hash: signature_tx_hash, // Always include the generated signature
    };
    
    // Validate that address is required
    if (!dto.address || dto.address.trim() === '') {
      throw new Error('Address is required');
    }
    
    // Network-specific address validation
    if (dto.network.includes('stellar')) {
      // Stellar addresses should be 56 characters and start with 'G'
      if (!dto.address.startsWith('G') || dto.address.length !== 56) {
        throw new Error('Invalid Stellar address format. Must start with G and be 56 characters');
      }
    } else {
      // EVM networks (Ethereum, Polygon, Base, Arbitrum, etc.)
      if (!dto.address.startsWith('0x') || dto.address.length !== 42) {
        throw new Error('Invalid address format. Must be 0x followed by 40 hex characters');
      }
    }
    
    payload.address = dto.address;

    console.log('Creating wallet with payload:', payload);
    console.log('BlindPay API URL:', apiUrl);
    
    let blindpayWalletId: string | undefined;
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_BLINDPAY_API_KEY}`,
          'x-api-key': process.env.NEXT_PUBLIC_ONLINE_BANKING_X_API_KEY || '',
        },
        body: JSON.stringify(payload),
      });
      
      console.log('BlindPay API response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('BlindPay API error response:', errorText);
        console.error('BlindPay API URL:', apiUrl);
        console.error('BlindPay API payload:', payload);
        throw new Error(`Failed to create wallet in online banking backend: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log('BlindPay API success response:', data);
      
      blindpayWalletId = data.wallet_id || data.id;
      if (!blindpayWalletId) {
        throw new Error('No wallet id returned from online banking backend');
      }
    } catch (err) {
      console.error('Error creating wallet in BlindPay:', err);
      throw new Error('Online banking wallet creation failed: ' + err.message);
    }
    
    // Save wallet in local DB
    const walletData = {
      client_id: dto.client_id,
      name: dto.name,
      network: dto.network,
      signature_tx_hash: signature_tx_hash, // Save the generated signature
      address: dto.address, // Now required
      is_account_abstraction: dto.is_account_abstraction === true, // Ensure boolean value
      blindpay_wallet_id: blindpayWalletId,
    };
    
    console.log('Saving wallet to database:', walletData);
    
    const wallet = this.walletRepository.create(walletData);
    await this.walletRepository.save(wallet);
    return wallet;
  }

  // Helper method to generate a signature (placeholder implementation)
  private generateSignature(message: string): string {
    // This is a placeholder implementation
    // In a real implementation, you would use a proper signing library like ethers.js
    // For now, we'll generate a mock signature that follows the expected format
    const mockSignature = '0x' + '1'.repeat(130); // 0x + 130 characters
    console.log('Generated mock signature for message:', message);
    return mockSignature;
  }

  async getWalletsByClientId(clientId: string): Promise<Wallet[]> {
    return this.walletRepository.find({ where: { client_id: clientId } });
  }

  async getAllWallets(msbId?: string): Promise<Wallet[]> {
    const query = this.walletRepository.createQueryBuilder('wallet')
      .leftJoinAndSelect('wallet.client', 'client')
      .orderBy('wallet.created_at', 'DESC');
    
    if (msbId) {
      query.where('client.msb_id = :msbId', { msbId });
    }
    
    return query.getMany();
  }

  async getWalletsByMsbId(msbId: string): Promise<Wallet[]> {
    return this.walletRepository.createQueryBuilder('wallet')
      .leftJoinAndSelect('wallet.client', 'client')
      .where('client.msb_id = :msbId', { msbId })
      .orderBy('wallet.created_at', 'DESC')
      .getMany();
  }
} 