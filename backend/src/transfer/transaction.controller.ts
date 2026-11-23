import { Controller, Get, Post, Query, Body, Logger, Param } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from '../client/transaction.entity';
import { ClientProfile } from '../client/client.entity';
import { MSBTransactionListDto } from './dto/msb-transaction-list.dto';
import { ClientTransactionListDto } from './dto/client-transaction-list.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';

@ApiTags('Transaction')
@Controller('transaction')
export class TransactionController {
  private readonly logger = new Logger(TransactionController.name);

  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    @InjectRepository(ClientProfile)
    private readonly clientRepository: Repository<ClientProfile>,
  ) {}

  @Post('list')
  @ApiOperation({ summary: 'Get transactions for a specific client with pagination' })
  @ApiBody({ type: ClientTransactionListDto })
  @ApiResponse({ status: 200, description: 'Transactions retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request parameters' })
  async list(@Body() body: ClientTransactionListDto) {
    const { client_id, page = 1, limit = 50 } = body;
    this.logger.log(`Fetching transactions for client_id: ${client_id}, page: ${page}, limit: ${limit}`);
    
    if (!client_id) {
      this.logger.error('No client_id provided');
      return { transactions: [], total: 0, page: 1, limit: 50 };
    }

    try {
      // Build query for transactions with pagination
      const queryBuilder = this.transactionRepository
        .createQueryBuilder('transaction')
        .leftJoinAndSelect('transaction.main_account', 'account')
        .where('transaction.client_id = :client_id', { client_id })
        .orderBy('transaction.created_at', 'DESC');

      // Get total count for pagination
      const total = await queryBuilder.getCount();

      // Add pagination
      const offset = (page - 1) * limit;
      queryBuilder.skip(offset).take(limit);

      // Execute query
      const transactions = await queryBuilder.getMany();

      this.logger.log(`Found ${transactions.length} transactions for client_id: ${client_id} (page ${page}/${Math.ceil(total / limit)})`);
      
      return {
        transactions,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      this.logger.error(`Error fetching transactions for client_id: ${client_id}`, error);
      return { transactions: [], total: 0, page: 1, limit: 50 };
    }
  }

  // Keep the GET endpoint for backward compatibility
  @Get('list')
  async listGet(@Query('user_id') userId: string) {
    this.logger.log(`Fetching transactions for user_id: ${userId}`);
    
    if (!userId) {
      this.logger.error('No user_id provided');
      return { transactions: [] };
    }

    try {
      // Try to find transactions by client_id first, then by msb_id
      let transactions = await this.transactionRepository.find({ 
        where: { client_id: userId },
        relations: ['main_account'],
        order: { created_at: 'DESC' }
      });

      // If no transactions found by client_id, try msb_id
      if (transactions.length === 0) {
        this.logger.log(`No transactions found for client_id: ${userId}, trying msb_id`);
        transactions = await this.transactionRepository.find({ 
          where: { msb_id: userId },
          relations: ['main_account'],
          order: { created_at: 'DESC' }
        });
      }

      this.logger.log(`Found ${transactions.length} transactions for user_id: ${userId}`);
      return { transactions };
    } catch (error) {
      this.logger.error(`Error fetching transactions for user_id: ${userId}`, error);
      return { transactions: [] };
    }
  }

  @Get('recent')
  async getRecentTransaction(@Query('user_id') userId: string) {
    this.logger.log(`Fetching transactions for user_id: ${userId}`);
    
    if (!userId) {
      this.logger.error('No user_id provided');
      return { transactions: [] };
    }

    try {
      // Try to find transactions by client_id first, then by msb_id
      let transactions = await this.transactionRepository.find({ 
        where: { client_id: userId },
        relations: ['main_account'],
        order: { created_at: 'DESC' },
        take: 4
      });

      // If no transactions found by client_id, try msb_id
      if (!transactions || transactions.length === 0) {
        this.logger.log(`No transactions found for client_id: ${userId}, trying msb_id`);
        return { transactions: [] }
      }

      this.logger.log(`Found ${transactions.length} transactions for user_id: ${userId}`);
      return { transactions };
      
    } catch (error) {
      this.logger.error(`Error fetching transactions for user_id: ${userId}`, error);
      return { transactions: [] };
    }
  }

  @Post('msb/list')
  @ApiOperation({ summary: 'Get all transactions for all clients under an MSB' })
  @ApiBody({ type: MSBTransactionListDto })
  @ApiResponse({ status: 200, description: 'Transactions retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request parameters' })
  async listForMSB(@Body() body: MSBTransactionListDto) {
    const { msb_id, page = 1, limit = 50, status, type } = body;
    this.logger.log(`Fetching transactions for MSB: ${msb_id}, page: ${page}, limit: ${limit}`);
    
    if (!msb_id) {
      this.logger.error('No msb_id provided');
      return { transactions: [], total: 0, page: 1, limit: 50 };
    }

    try {
      // First, get all client IDs for this MSB
      const clients = await this.clientRepository.find({
        where: { msb_id },
        select: ['id', 'first_name', 'last_name', 'legal_name', 'doing_business_as']
      });

      if (clients.length === 0) {
        this.logger.log(`No clients found for MSB: ${msb_id}`);
        return { transactions: [], total: 0, page: 1, limit: 50, clients: [] };
      }

      const clientIds = clients.map(client => client.id);
      this.logger.log(`Found ${clientIds.length} clients for MSB: ${msb_id}`);

      // Build query for transactions
      const queryBuilder = this.transactionRepository
        .createQueryBuilder('transaction')
        .leftJoinAndSelect('transaction.main_account', 'account')
        .where('transaction.client_id IN (:...clientIds)', { clientIds })
        .orderBy('transaction.created_at', 'DESC');

      // Add filters if provided
      if (status) {
        queryBuilder.andWhere('transaction.status = :status', { status });
      }

      if (type) {
        queryBuilder.andWhere('transaction.type = :type', { type });
      }

      // Get total count for pagination
      const total = await queryBuilder.getCount();

      // Add pagination
      const offset = (page - 1) * limit;
      queryBuilder.skip(offset).take(limit);

      // Execute query
      const transactions = await queryBuilder.getMany();

      // Enrich transactions with client information
      const enrichedTransactions = transactions.map(transaction => {
        const client = clients.find(c => c.id === transaction.client_id);
        return {
          ...transaction,
          client_info: client ? {
            id: client.id,
            name: client.legal_name || `${client.first_name} ${client.last_name}`,
            type: client.legal_name ? 'business' : 'individual'
          } : null
        };
      });

      this.logger.log(`Found ${transactions.length} transactions for MSB: ${msb_id} (page ${page}/${Math.ceil(total / limit)})`);
      
      return {
        transactions: enrichedTransactions,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        clients: clients.map(client => ({
          id: client.id,
          name: client.legal_name || `${client.first_name} ${client.last_name}`,
          type: client.legal_name ? 'business' : 'individual'
        }))
      };
    } catch (error) {
      this.logger.error(`Error fetching transactions for MSB: ${msb_id}`, error);
      return { transactions: [], total: 0, page: 1, limit: 50, error: 'Failed to fetch transactions' };
    }
  }

  @Get('msb/list')
  @ApiOperation({ summary: 'Get all transactions for all clients under an MSB (GET method)' })
  @ApiResponse({ status: 200, description: 'Transactions retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request parameters' })
  async listForMSBGet(@Query('msb_id') msbId: string, @Query('page') page: string, @Query('limit') limit: string, @Query('status') status: string, @Query('type') type: string) {
    return this.listForMSB({
      msb_id: msbId,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 50,
      status,
      type
    });
  }

  @Get(':id/payin')
  @ApiOperation({ summary: 'Get transaction payin track' })
  @ApiResponse({ status: 200, description: 'Transaction payin retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request parameters' })
  async getTransactionPayIn(@Param('id') id: string) {
    try {
       const payinRes = await fetch(`${process.env.NEXT_PUBLIC_ONLINE_BANKING_URL}/v1/e/payins/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_BLINDPAY_API_KEY}`,
        'x-api-key': process.env.NEXT_PUBLIC_ONLINE_BANKING_X_API_KEY || '',
      }});

     const payin = await payinRes.json();

      return payin;
    } catch (error) {
      console.error('Error fetching transaction payin:', error);
    }
  }
} 