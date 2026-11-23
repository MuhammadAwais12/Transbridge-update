import { Controller, Post, Body, BadRequestException, Headers, Req, Res, HttpCode, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { CreateTransferDto } from './dto/create-transfer.dto';
import { Response, Request } from 'express';
import { TransferService } from './transfer.service';
import { ConfirmTransferDto } from './dto/confirm-transfer.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApproveTransactionDto } from './dto/approve-transaction.dto';

@ApiTags('Transfer')
@Controller('transfer')
export class TransferController {
  constructor(private readonly transferService: TransferService) {}

  @Get('debug/wallet/:clientId')
  @ApiOperation({ summary: 'Debug: Check if wallet exists for client' })
  async debugWallet(@Param('clientId') clientId: string) {
    try {
      const wallet = await this.transferService.debugGetWallet(clientId);
      return { wallet };
    } catch (err) {
      throw new BadRequestException('Failed to get wallet: ' + err);
    }
  }

  @Get('transaction/:transactionId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get transaction status by ID' })
  @ApiResponse({ status: 200, description: 'Transaction status returned' })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  async getTransactionStatus(@Param('transactionId') transactionId: string, @Req() req: any) {
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
  async preview(@Body() createTransferDto: CreateTransferDto) {
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
  async confirm(@Body() confirmTransferDto: ConfirmTransferDto) {
    try {
      const tx = await this.transferService.confirmTransfer(confirmTransferDto);
      return tx;
    } catch (err) {
      throw new BadRequestException('Failed to initiate transfer: ' + err);
    }
  }

  @Post('approve')
  @UseGuards(JwtAuthGuard)
  async approveTransaction(@Body() dto: ApproveTransactionDto, @Req() req: any) {
    return this.transferService.approveTransaction(dto, req.user);
  }

  @Post('complete/:transactionId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Manually complete a transaction (for debugging/fixes)' })
  @ApiResponse({ status: 200, description: 'Transaction completed successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async manuallyCompleteTransaction(
    @Param('transactionId') transactionId: string,
    @Body() body: { payoutId?: string },
    @Req() req: any
  ) {
    // Only allow MSB admins to manually complete transactions
    if (!req.user.msbId) {
      throw new BadRequestException('Only MSB administrators can manually complete transactions');
    }
    return this.transferService.manuallyCompleteTransaction(transactionId, body.payoutId);
  }
} 