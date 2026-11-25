import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from '../client/transaction.entity';
import { Wallet } from '../msb-wallet/wallet.entity';
import { ClientProfile } from '../client/client.entity';
import * as crypto from 'crypto';
import { WebhookGateway } from './webhook.gateway';
import { providers } from '../config/providers.config';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    @InjectRepository(Wallet)
    private readonly walletRepository: Repository<Wallet>,
    @InjectRepository(ClientProfile)
    private readonly clientRepository: Repository<ClientProfile>,
    private readonly webhookGateway: WebhookGateway,
  ) {}

  /**
   * Svix verification: HMAC-SHA256 over `${svix-id}.${svix-timestamp}.${raw body bytes}`
   * with the base64 part of "whsec_<base64>", compared in constant time.
   * `rawBody` must be the exact request bytes (req.rawBody), not a re-serialised req.body.
   */
  verifySignature(headers: any, rawBody: Buffer | undefined): boolean {
    const svixId = headers['svix-id'];
    const svixTimestamp = headers['svix-timestamp'];
    const svixSignature = headers['svix-signature'];
    const secret = providers.blindpay.webhookSecret; // throws ProviderConfigError if unset

    if (!svixId || !svixTimestamp || !svixSignature) {
      this.logger.error('Missing webhook signature headers');
      return false;
    }
    if (!rawBody || !Buffer.isBuffer(rawBody)) {
      this.logger.error('Raw request body unavailable for webhook verification');
      return false;
    }

    // Verify timestamp to prevent replay attacks (missing / non-numeric / outside 5 minutes)
    if (!/^\d+$/.test(String(svixTimestamp))) {
      this.logger.error('Webhook timestamp is missing or not a number');
      return false;
    }
    const timestamp = Number(svixTimestamp);
    const now = Math.floor(Date.now() / 1000);
    const tolerance = 300; // 5 minutes
    if (Math.abs(now - timestamp) > tolerance) {
      this.logger.error('Webhook timestamp is too old or too new');
      return false;
    }

    // Verify signature according to BlindPay (Svix) documentation, over the raw bytes
    const secretBytes = Buffer.from(secret.startsWith('whsec_') ? secret.slice('whsec_'.length) : secret, 'base64');
    const expected = crypto
      .createHmac('sha256', secretBytes)
      .update(`${svixId}.${svixTimestamp}.`)
      .update(rawBody)
      .digest();

    // Header is a space-separated list of "v1,<base64>"; any match is valid
    const valid = String(svixSignature)
      .split(' ')
      .some((sig) => {
        const [version, value] = sig.split(',', 2);
        if (version !== 'v1' || !value) return false;
        const given = Buffer.from(value, 'base64');
        return given.length === expected.length && crypto.timingSafeEqual(given, expected);
      });

    if (!valid) {
      this.logger.error('Invalid webhook signature');
      return false;
    }

    this.logger.log('Webhook signature verified successfully');
    return true;
  }

  async processWebhook(body: any): Promise<void> {
    // BlindPay webhooks have the event type in webhook_event field
    const eventType = body.webhook_event || body.event_type;
    const data = body; // The entire body is the data

    this.logger.log(`Processing webhook event: ${eventType}`, data);

    switch (eventType) {
      case 'payin.new':
        await this.handlePayinNew(data);
        break;
      case 'payin.update':
        await this.handlePayinUpdate(data);
        break;
      case 'payin.complete':
        await this.handlePayinComplete(data);
        break;
      case 'payout.new':
        await this.handlePayoutNew(data);
        break;
      case 'payout.update':
        await this.handlePayoutUpdate(data);
        break;
      case 'payout.complete':
        await this.handlePayoutComplete(data);
        break;
      case 'receiver.new':
        await this.handleReceiverNew(data);
        break;
      case 'receiver.update':
        await this.handleReceiverUpdate(data);
        break;
      case 'bankAccount.new':
        await this.handleBankAccountNew(data);
        break;
      case 'blockchainWallet.new':
        await this.handleBlockchainWalletNew(data);
        break;
      case 'document.verified':
        await this.handleDocumentVerified(data);
        break;
      case 'document.rejected':
        await this.handleDocumentRejected(data);
        break;
      case 'document.uploaded':
        await this.handleDocumentUploaded(data);
        break;
      case 'kyc.completed':
        await this.handleKycCompleted(data);
        break;
      case 'kyc.rejected':
        await this.handleKycRejected(data);
        break;
      case 'kyc.under_review':
        await this.handleKycUnderReview(data);
        break;
      default:
        this.logger.warn(`Unhandled webhook event type: ${eventType}`);
    }
  }

  private async handlePayinNew(data: any): Promise<void> {
    this.logger.log('Payin started:', data);
    // Payin has been initiated, update transaction status if needed
    const tx = await this.findTransactionByPayinId(data.id);
    if (tx) {
      tx.status = 'payin_pending'; // Changed from 'payin_processing'
      tx.metadata = {
        ...tx.metadata,
        payin_started_at: new Date().toISOString(),
        payin_status: data.status
      };
      await this.transactionRepository.save(tx);
      this.logger.log('Transaction updated for payin start:', tx.id);
    }
  }

  private async handlePayinUpdate(data: any): Promise<void> {
    this.logger.log('Payin updated:', data);
    // Payin status has been updated
    const tx = await this.findTransactionByPayinId(data.id);
    if (tx) {
      tx.metadata = {
        ...tx.metadata,
        payin_updated_at: new Date().toISOString(),
        payin_status: data.status
      };
      await this.transactionRepository.save(tx);
      this.logger.log('Transaction updated for payin update:', tx.id);
    }
  }

  private async handlePayoutNew(data: any): Promise<void> {
    this.logger.log('Payout started:', data);
    // Payout has been initiated
    const tx = await this.findTransactionByPayoutId(data.id);
    if (tx) {
      tx.status = 'payout_pending'; // Changed from 'payout_processing'
      tx.metadata = {
        ...tx.metadata,
        payout_started_at: new Date().toISOString(),
        payout_status: data.status
      };
      await this.transactionRepository.save(tx);
      this.logger.log('Transaction updated for payout start:', tx.id);
    }
  }

  private async handlePayoutUpdate(data: any): Promise<void> {
    this.logger.log('Payout updated:', data);
    // Payout status has been updated
    const tx = await this.findTransactionByPayoutId(data.id);
    if (tx) {
      tx.metadata = {
        ...tx.metadata,
        payout_updated_at: new Date().toISOString(),
        payout_status: data.status
      };
      await this.transactionRepository.save(tx);
      this.logger.log('Transaction updated for payout update:', tx.id);
    }
  }

  private async handleReceiverNew(data: any): Promise<void> {
    this.logger.log('Receiver created:', data);
    // New receiver has been created in BlindPay
    // Update KYC status based on receiver data
    await this.updateKycStatusFromReceiver(data);
  }

  private async handleReceiverUpdate(data: any): Promise<void> {
    this.logger.log('Receiver updated:', data);
    // Receiver has been updated in BlindPay
    // Update KYC status based on receiver data
    await this.updateKycStatusFromReceiver(data);
  }

  private async updateKycStatusFromReceiver(receiverData: any): Promise<void> {
    try {
      // Extract receiver ID from the webhook data
      const receiverId = receiverData.id || receiverData.receiver_id;
      if (!receiverId) {
        this.logger.warn('No receiver ID found in webhook data');
        return;
      }

      // Find the client profile by BlindPay receiver ID
      const clientProfile = await this.clientRepository.findOne({
        where: { blindpay_receiver_id: receiverId }
      });

      if (!clientProfile) {
        this.logger.warn(`No client profile found for receiver ID: ${receiverId}`);
        return;
      }

      // Store the previous KYC status for logging
      const previousKycStatus = clientProfile.kyc_status;
      let newKycStatus = 'pending';
      let kycCompletedAt: Date | null = null;

      // Primary KYC status determination from receiver status
      if (receiverData.status === 'verified' || receiverData.status === 'active') {
        newKycStatus = 'approved';
        kycCompletedAt = new Date();
      } else if (receiverData.status === 'rejected' || receiverData.status === 'failed') {
        newKycStatus = 'rejected';
      } else if (receiverData.status === 'pending' || receiverData.status === 'processing') {
        newKycStatus = 'pending';
      } else if (receiverData.status === 'under_review') {
        newKycStatus = 'under_review';
      }

      // Override with explicit KYC status if provided
      if (receiverData.kyc_status && receiverData.kyc_status !== 'undefined') {
        newKycStatus = receiverData.kyc_status;
        if (receiverData.kyc_status === 'approved' || receiverData.kyc_status === 'verified') {
          kycCompletedAt = new Date();
        }
      }

      // Check document verification status for additional validation
      if (receiverData.documents && Array.isArray(receiverData.documents)) {
        const allDocumentsVerified = receiverData.documents.every((doc: any) => 
          doc.status === 'verified' || doc.status === 'approved'
        );
        
        if (allDocumentsVerified && newKycStatus === 'pending') {
          newKycStatus = 'approved';
          kycCompletedAt = new Date();
        }
      }

      // Only update if KYC status has actually changed
      if (clientProfile.kyc_status !== newKycStatus) {
        // Update only the KYC status column and related fields
        clientProfile.kyc_status = newKycStatus;
        
        // Update completion timestamp if KYC is approved
        if (kycCompletedAt) {
          clientProfile.kyc_completed_at = kycCompletedAt;
        }
        
        // Update the updated_at timestamp
        clientProfile.updated_at = new Date();

        // Save only the KYC-related changes
        await this.clientRepository.save(clientProfile);
        
        this.logger.log(`KYC status updated for client ${clientProfile.id}: ${previousKycStatus} → ${newKycStatus}`);
      } else {
        this.logger.log(`KYC status unchanged for client ${clientProfile.id}: ${newKycStatus}`);
      }

      // Log the KYC status update details
      this.logger.log(`Receiver ${receiverId} KYC status processing:`, {
        client_id: clientProfile.id,
        previous_status: previousKycStatus,
        new_status: newKycStatus,
        receiver_status: receiverData.status,
        receiver_kyc_status: receiverData.kyc_status,
        documents_count: receiverData.documents?.length || 0,
        documents_verified: receiverData.documents?.every((doc: any) => 
          doc.status === 'verified' || doc.status === 'approved'
        ) || false
      });

      } catch (error) {
        this.logger.error('Failed to update KYC status from receiver data:', error);
        this.logger.error('Receiver data:', receiverData);
      }
    }

  private async updateKycStatusFromDocument(documentData: any): Promise<void> {
      try {
        // Extract receiver ID from the document data
        const receiverId = documentData.receiver_id || documentData.receiverId;
        if (!receiverId) {
          this.logger.warn('No receiver ID found in document webhook data');
          return;
        }

        // Find the client profile by BlindPay receiver ID
        const clientProfile = await this.clientRepository.findOne({
          where: { blindpay_receiver_id: receiverId }
        });

        if (!clientProfile) {
          this.logger.warn(`No client profile found for receiver ID: ${receiverId}`);
          return;
        }

        // Store the previous KYC status for logging
        const previousKycStatus = clientProfile.kyc_status;
        let newKycStatus = clientProfile.kyc_status;
        let kycCompletedAt: Date | null = null;

        // Determine KYC status based on document verification
        if (documentData.status === 'verified' || documentData.status === 'approved') {
          // Document is verified, check if this completes KYC
          if (clientProfile.kyc_status === 'pending' || clientProfile.kyc_status === 'under_review') {
            newKycStatus = 'approved';
            kycCompletedAt = new Date();
          }
        } else if (documentData.status === 'rejected' || documentData.status === 'failed') {
          // Document is rejected, KYC status should be rejected
          newKycStatus = 'rejected';
        } else if (documentData.status === 'pending' || documentData.status === 'processing') {
          // Document is pending, KYC status should be under review
          if (clientProfile.kyc_status === 'pending') {
            newKycStatus = 'under_review';
          }
        }

        // Only update if KYC status has actually changed
        if (clientProfile.kyc_status !== newKycStatus) {
          // Update only the KYC status column and related fields
          clientProfile.kyc_status = newKycStatus;
          
          // Update completion timestamp if KYC is approved
          if (kycCompletedAt) {
            clientProfile.kyc_completed_at = kycCompletedAt;
          }
          
          // Update the updated_at timestamp
          clientProfile.updated_at = new Date();

          // Save only the KYC-related changes
          await this.clientRepository.save(clientProfile);
          
          this.logger.log(`KYC status updated from document for client ${clientProfile.id}: ${previousKycStatus} → ${newKycStatus}`);
        } else {
          this.logger.log(`KYC status unchanged from document for client ${clientProfile.id}: ${newKycStatus}`);
        }

        // Log the document-based KYC status update details
        this.logger.log(`Document ${documentData.id || 'unknown'} KYC status processing:`, {
          client_id: clientProfile.id,
          previous_status: previousKycStatus,
          new_status: newKycStatus,
          document_status: documentData.status,
          document_type: documentData.document_type,
          receiver_id: receiverId
        });

      } catch (error) {
        this.logger.error('Failed to update KYC status from document data:', error);
        this.logger.error('Document data:', documentData);
      }
    }

  /**
   * Validate quote before using it for payout
   */
  private async validateQuote(quoteId: string, quoteData: any): Promise<void> {
    if (!quoteId) {
      throw new Error('Quote ID is required for payout');
    }

    if (!quoteData) {
      throw new Error('Quote data is required for payout');
    }

    // Check if quote has expired
    if (quoteData.expires_at) {
      const expirationTime = new Date(quoteData.expires_at).getTime();
      const currentTime = Date.now();
      
      if (currentTime > expirationTime) {
        throw new Error(
          `Quote has expired. Quote ID: ${quoteId}. ` +
          `Expired at: ${new Date(expirationTime).toISOString()}. ` +
          `Current time: ${new Date(currentTime).toISOString()}`
        );
      }

      // Check if quote expires soon (within 5 minutes)
      const fiveMinutesFromNow = currentTime + (5 * 60 * 1000);
      if (expirationTime < fiveMinutesFromNow) {
        this.logger.warn(`Quote ${quoteId} expires soon at ${new Date(expirationTime).toISOString()}`);
      }
    }

    // Validate required quote fields
    const requiredFields = ['id', 'sender_amount', 'receiver_amount'];
    for (const field of requiredFields) {
      if (!quoteData[field]) {
        throw new Error(`Quote is missing required field: ${field}`);
      }
    }

    this.logger.log(`Quote validation passed: ${quoteId}`);
  }

  private async updateKycStatusFromKycEvent(kycData: any, newStatus: string): Promise<void> {
      try {
        // Extract receiver ID from the KYC data
        const receiverId = kycData.receiver_id || kycData.receiverId;
        if (!receiverId) {
          this.logger.warn('No receiver ID found in KYC webhook data');
          return;
        }

        // Find the client profile by BlindPay receiver ID
        const clientProfile = await this.clientRepository.findOne({
          where: { blindpay_receiver_id: receiverId }
        });

        if (!clientProfile) {
          this.logger.warn(`No client profile found for receiver ID: ${receiverId}`);
          return;
        }

        // Store the previous KYC status for logging
        const previousKycStatus = clientProfile.kyc_status;
        let kycCompletedAt: Date | null = null;

        // Set completion timestamp if KYC is approved
        if (newStatus === 'approved') {
          kycCompletedAt = new Date();
        }

        // Only update if KYC status has actually changed
        if (clientProfile.kyc_status !== newStatus) {
          // Update only the KYC status column and related fields
          clientProfile.kyc_status = newStatus;
          
          // Update completion timestamp if KYC is approved
          if (kycCompletedAt) {
            clientProfile.kyc_completed_at = kycCompletedAt;
          }
          
          // Update the updated_at timestamp
          clientProfile.updated_at = new Date();

          // Save only the KYC-related changes
          await this.clientRepository.save(clientProfile);
          
          this.logger.log(`KYC status updated from KYC event for client ${clientProfile.id}: ${previousKycStatus} → ${newStatus}`);
        } else {
          this.logger.log(`KYC status unchanged from KYC event for client ${clientProfile.id}: ${newStatus}`);
        }

        // Log the KYC event status update details
        this.logger.log(`KYC event ${kycData.id || 'unknown'} status processing:`, {
          client_id: clientProfile.id,
          previous_status: previousKycStatus,
          new_status: newStatus,
          kyc_event_type: kycData.event_type || 'unknown',
          receiver_id: receiverId
        });

      } catch (error) {
        this.logger.error('Failed to update KYC status from KYC event data:', error);
        this.logger.error('KYC event data:', kycData);
      }
    }

  private async handleBankAccountNew(data: any): Promise<void> {
    this.logger.log('Bank account created:', data);
    // New bank account has been created in BlindPay
    // This could be used to update account records or other bank account-related data
  }

  private async handleBlockchainWalletNew(data: any): Promise<void> {
    this.logger.log('Blockchain wallet created:', data);
    // New blockchain wallet has been created in BlindPay
    // This could be used to update wallet records or other wallet-related data
  }

  private async handleDocumentVerified(data: any): Promise<void> {
    this.logger.log('Document verified:', data);
    // Document has been verified, update KYC status if needed
    await this.updateKycStatusFromDocument(data);
  }

  private async handleDocumentRejected(data: any): Promise<void> {
    this.logger.log('Document rejected:', data);
    // Document has been rejected, update KYC status if needed
    await this.updateKycStatusFromDocument(data);
  }

  private async handleDocumentUploaded(data: any): Promise<void> {
    this.logger.log('Document uploaded:', data);
    // Document has been uploaded, update KYC status if needed
    await this.updateKycStatusFromDocument(data);
  }

  private async handleKycCompleted(data: any): Promise<void> {
    this.logger.log('KYC completed:', data);
    // KYC has been completed, update KYC status
    await this.updateKycStatusFromKycEvent(data, 'approved');
  }

  private async handleKycRejected(data: any): Promise<void> {
    this.logger.log('KYC rejected:', data);
    // KYC has been rejected, update KYC status
    await this.updateKycStatusFromKycEvent(data, 'rejected');
  }

  private async handleKycUnderReview(data: any): Promise<void> {
    this.logger.log('KYC under review:', data);
    // KYC is under review, update KYC status
    await this.updateKycStatusFromKycEvent(data, 'under_review');
  }

  private async handlePayinComplete(data: any): Promise<void> {
    this.logger.log('Payin completed:', data);
    
    const tx = await this.findTransactionByPayinId(data.id);
    if (!tx) {
      this.logger.error('Transaction not found for payin ID:', data.id);
      return;
    }

    if (data.status === 'completed') {
      tx.status = 'payin_completed';
      tx.metadata = {
        ...tx.metadata,
        payin_completed_at: new Date().toISOString(),
        payin_status: data.status
      };
      await this.transactionRepository.save(tx);
      this.logger.log('Payin completed for transaction:', tx.id);

      // Forward webhook event to connected clients
      this.webhookGateway.sendTransactionUpdate(tx.id, 'payin.complete', {
        transaction_id: tx.id,
        payin_id: data.id,
        status: 'payin_completed',
        data: data
      });

             // Update transaction status to 'payin_completed' and wait for client approval
       tx.status = 'payin_completed';
            tx.metadata = {
              ...tx.metadata,
         payin_completed_at: new Date().toISOString(),
         payin_status: data.status,
         awaiting_approval: true,
         approval_required_at: new Date().toISOString()
            };
            await this.transactionRepository.save(tx);
            
       this.logger.log('Payin completed - waiting for client approval for transaction:', tx.id);
       
       // Forward payin completion to connected clients
       this.webhookGateway.sendTransactionUpdate(tx.id, 'payin.complete', {
              transaction_id: tx.id,
         payin_id: data.id,
         status: 'payin_completed',
         awaiting_approval: true,
         data: data
       });
    } else {
      tx.status = 'payin_failed';
      tx.metadata = {
        ...tx.metadata,
        failure_reason: data.failure_reason || 'Payin failed',
        payin_status: data.status
      };
      await this.transactionRepository.save(tx);
      this.logger.error('Payin failed for transaction:', tx.id);
      
      // Forward payin failure to connected clients
      this.webhookGateway.sendTransactionUpdate(tx.id, 'payin.failed', {
        transaction_id: tx.id,
        error: data.failure_reason || 'Payin failed',
        status: 'payin_failed'
      });
    }
  }

  private async handlePayoutComplete(data: any): Promise<void> {
    this.logger.log('Payout completed:', data);
    this.logger.log('Payout ID from webhook:', data.id);
    this.logger.log('Payout status from webhook:', data.status);
    
    const tx = await this.findTransactionByPayoutId(data.id);
    if (!tx) {
      this.logger.error('Transaction not found for payout ID:', data.id);
      this.logger.error('Webhook data:', JSON.stringify(data, null, 2));
      
      // Log some recent transactions to help debug
      const recentTransactions = await this.transactionRepository
        .createQueryBuilder('transaction')
        .where("transaction.status IN ('payout_pending', 'payout_completed', 'completed')")
        .orderBy('transaction.created_at', 'DESC')
        .limit(5)
        .getMany();
      
      this.logger.log('Recent payout-related transactions:', 
        recentTransactions.map(t => ({
          id: t.id,
          status: t.status,
          payout_id: t.metadata?.payout_id,
          payout_quote_id: t.metadata?.payout_quote_id,
          original_payout_quote_id: t.metadata?.original_payout_quote_id,
          created_at: t.created_at
        }))
      );
      return;
    }

    if (data.status === 'completed') {
      tx.status = 'completed';
      tx.completed_at = new Date();
      tx.metadata = {
        ...tx.metadata,
        payout_completed_at: new Date().toISOString(),
        payout_status: data.status
      };
    } else if (data.status === 'failed') {
      tx.status = 'failed';
      tx.metadata = {
        ...tx.metadata,
        failure_reason: data.failure_reason || 'Payout failed',
        payout_status: data.status
      };
    } else if (data.status === 'refunded') {
      tx.status = 'refunded';
      tx.metadata = {
        ...tx.metadata,
        payout_status: data.status
      };
    }

    await this.transactionRepository.save(tx);
    this.logger.log('Transaction status updated:', tx.id, tx.status);
    
    // Forward payout completion to connected clients
    this.webhookGateway.sendTransactionUpdate(tx.id, 'payout.complete', {
      transaction_id: tx.id,
      payout_id: data.id,
      status: tx.status,
      data: data
    });
  }

  private async findTransactionByPayinId(payinId: string): Promise<Transaction | null> {
    // Use TypeORM's JSON operators to search within metadata
    return this.transactionRepository
      .createQueryBuilder('transaction')
      .where("transaction.metadata->>'payin_id' = :payinId", { payinId })
      .getOne();
  }

  private async findTransactionByPayoutId(payoutId: string): Promise<Transaction | null> {
    this.logger.log('Searching for transaction with payout ID:', payoutId);
    
    // First, try to find by payout_id in metadata
    let tx = await this.transactionRepository
      .createQueryBuilder('transaction')
      .where("transaction.metadata->>'payout_id' = :payoutId", { payoutId })
      .getOne();
    
    if (tx) {
      this.logger.log('Found transaction by payout_id in metadata:', tx.id);
      return tx;
    }
    
    // If not found, try to find by payout_quote_id in metadata (in case the payout ID is stored differently)
    tx = await this.transactionRepository
      .createQueryBuilder('transaction')
      .where("transaction.metadata->>'payout_quote_id' = :payoutId", { payoutId })
      .getOne();
    
    if (tx) {
      this.logger.log('Found transaction by payout_quote_id in metadata:', tx.id);
      return tx;
    }
    
    // If still not found, try to find by original_payout_quote_id in metadata
    tx = await this.transactionRepository
      .createQueryBuilder('transaction')
      .where("transaction.metadata->>'original_payout_quote_id' = :payoutId", { payoutId })
      .getOne();
    
    if (tx) {
      this.logger.log('Found transaction by original_payout_quote_id in metadata:', tx.id);
      return tx;
    }
    
    // If still not found, try a broader search in metadata for any field containing the payout ID
    const transactions = await this.transactionRepository
      .createQueryBuilder('transaction')
      .where("transaction.metadata::text ILIKE :searchTerm", { searchTerm: `%${payoutId}%` })
      .getMany();
    
    if (transactions.length > 0) {
      this.logger.log(`Found ${transactions.length} transactions containing payout ID in metadata:`, 
        transactions.map(t => ({ id: t.id, status: t.status, metadata: t.metadata })));
      
      // Return the first one that seems to be in a payout-related status
      const payoutRelatedTx = transactions.find(t => 
        t.status === 'payout_pending' || 
        t.status === 'payout_completed' || 
        t.metadata?.payout_id ||
        t.metadata?.payout_quote_id ||
        t.metadata?.original_payout_quote_id
      );
      
      if (payoutRelatedTx) {
        this.logger.log('Returning transaction with payout-related status:', payoutRelatedTx.id);
        return payoutRelatedTx;
      }
      
      // If no payout-related transaction found, return the first one
      this.logger.log('No payout-related transaction found, returning first match:', transactions[0].id);
      return transactions[0];
    }
    
    this.logger.error('No transaction found for payout ID:', payoutId);
    return null;
  }
} 