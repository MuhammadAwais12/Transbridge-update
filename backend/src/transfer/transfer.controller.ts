import { Controller, Post, Body, BadRequestException, ForbiddenException, NotFoundException, Req, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateTransferDto } from './dto/create-transfer.dto';
import { TransferService } from './transfer.service';
import { ConfirmTransferDto } from './dto/confirm-transfer.dto';
import { ApproveTransactionDto } from './dto/approve-transaction.dto';
import { Transaction } from '../client/transaction.entity';
import { Account } from '../client/account.entity';
import { Beneficiary } from '../client/beneficiary.entity';
import { AccessService, Caller } from '../auth/access.service';
import { Authenticated, CurrentCaller } from '../auth/caller.guard';

@ApiTags('Transfer')
@Authenticated()
@Controller('transfer')
export class TransferController {
  constructor(
    private readonly transferService: TransferService,
    private readonly access: AccessService,
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
    @InjectRepository(Beneficiary)
    private readonly beneficiaryRepository: Repository<Beneficiary>,
  ) {}

  /** Loads a transaction (404) and checks the caller may access its client (403). */
  private async loadOwnedTransaction(caller: Caller, transactionId: string): Promise<Transaction> {
    const tx = await this.transactionRepository.findOne({ where: { id: transactionId } });
    if (!tx) throw new NotFoundException('Transaction not found');
    await this.access.assertClient(caller, tx.client_id);
    return tx;
  }

  /**
   * Never trust IDs in a transfer body: the client must be the caller's (or in the admin's MSB),
   * and the source account / beneficiary / bank account must belong to that client.
   */
  private async assertTransferRefs(caller: Caller, dto: CreateTransferDto | ConfirmTransferDto): Promise<void> {
    const client = await this.access.assertClient(caller, dto.client_id);
    if (dto.msb_id !== client.msb_id) {
      throw new ForbiddenException('msb_id does not match the client');
    }

    const source = await this.accountRepository.findOne({ where: { id: dto.account_id } });
    if (!source) throw new NotFoundException('Source account not found');
    if (source.client_id !== client.id) {
      throw new ForbiddenException('Source account does not belong to the client');
    }

    const allowedBankAccountIds = new Set<string>();
    if (dto.beneficiary_id) {
      const beneficiary = await this.beneficiaryRepository.findOne({ where: { id: dto.beneficiary_id } });
      if (!beneficiary) throw new NotFoundException('Beneficiary not found');
      if (beneficiary.client_id !== client.id) {
        throw new ForbiddenException('Beneficiary does not belong to the client');
      }
      if (beneficiary.blindpay_bank_account_id) allowedBankAccountIds.add(beneficiary.blindpay_bank_account_id);
    }
    if (dto.destination_account_id) {
      // Internal transfers may target another client's account, but only within the caller's MSB.
      const destination = await this.accountRepository.findOne({ where: { id: dto.destination_account_id } });
      if (!destination) throw new NotFoundException('Destination account not found');
      if (!caller.msbId || destination.msb_id !== caller.msbId) {
        throw new ForbiddenException('Destination account belongs to a different MSB');
      }
      if (destination.blindpay_bank_account_id) allowedBankAccountIds.add(destination.blindpay_bank_account_id);
    }
    if (dto.bank_account_id && !allowedBankAccountIds.has(dto.bank_account_id)) {
      throw new ForbiddenException('bank_account_id does not match the beneficiary or destination account');
    }
  }

  @Get('debug/wallet/:clientId')
  @ApiOperation({ summary: 'Debug: Check if wallet exists for client' })
  async debugWallet(@Param('clientId') clientId: string, @CurrentCaller() caller: Caller) {
    await this.access.assertClient(caller, clientId);
    try {
      const wallet = await this.transferService.debugGetWallet(clientId);
      return { wallet };
    } catch (err) {
      throw new BadRequestException('Failed to get wallet: ' + err);
    }
  }

  @Get('transaction/:transactionId')
  @ApiOperation({ summary: 'Get transaction status by ID' })
  @ApiResponse({ status: 200, description: 'Transaction status returned' })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  async getTransactionStatus(@Param('transactionId') transactionId: string, @CurrentCaller() caller: Caller) {
    await this.loadOwnedTransaction(caller, transactionId);
    try {
      const transaction = await this.transferService.getTransactionById(transactionId);
      return transaction;
    } catch (err) {
      throw new BadRequestException('Failed to get transaction status: ' + err);
    }
  }

  @Post()
  @ApiOperation({ summary: 'Preview a bank transfer (payin + payout quotes)' })
  @ApiBody({ type: CreateTransferDto })
  @ApiResponse({ status: 200, description: 'Transfer preview returned' })
  @ApiResponse({ status: 400, description: 'Failed to get transfer preview' })
  async preview(@Body() createTransferDto: CreateTransferDto, @CurrentCaller() caller: Caller) {
    await this.assertTransferRefs(caller, createTransferDto);
    try {
      const preview = await this.transferService.getTransferPreview(createTransferDto);
      return preview;
    } catch (err) {
      throw new BadRequestException('Failed to get transfer preview: ' + err);
    }
  }

  @Post('confirm')
  @ApiOperation({ summary: 'Confirm and initiate a bank transfer (payin)' })
  @ApiBody({ type: ConfirmTransferDto })
  @ApiResponse({ status: 201, description: 'Transfer initiated' })
  @ApiResponse({ status: 400, description: 'Failed to initiate transfer' })
  async confirm(@Body() confirmTransferDto: ConfirmTransferDto, @CurrentCaller() caller: Caller) {
    await this.assertTransferRefs(caller, confirmTransferDto);
    try {
      const tx = await this.transferService.confirmTransfer(confirmTransferDto);
      return tx;
    } catch (err) {
      throw new BadRequestException('Failed to initiate transfer: ' + err);
    }
  }

  @Post('approve')
  async approveTransaction(@Body() dto: ApproveTransactionDto, @Req() req: any) {
    // TransferService.approveTransaction already checks that the transaction belongs to req.user
    return this.transferService.approveTransaction(dto, req.user);
  }

}
