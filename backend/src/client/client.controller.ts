import { ThrottlerGuard } from '@nestjs/throttler';
import { Throttle } from '@nestjs/throttler';
import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  Request,
  UnauthorizedException,
  Param,
  UseGuards,
  Put,
} from '@nestjs/common';
import { ClientService } from './client.service';
import { CreateClientDto } from './dto/create-client.dto';
import { LoginClientDto } from './dto/login-client.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LinkWalletDto } from './dto/link-wallet.dto';
import { ResetWalletDto } from './dto/reset-wallet.dto';
import { RequestResetPasswordDto } from './dto/request-reset-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { Enable2faDto } from './dto/enable-2fa.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClientProfile } from './client.entity';
import { User } from '../msb-admin/msb-admin.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UpdateClientProfileDto } from './dto/account.dto';
import { GetByMsbDto } from './dto/get-by-msb.dto';
import { GetCustomersByMsbDto } from './dto/get-customers-by-msb.dto';
import type { Request as ExpressRequest } from 'express';
import { AccessService, Caller } from '../auth/access.service';
import { Authenticated, CurrentCaller } from '../auth/caller.guard';

type AuthenticatedRequest = ExpressRequest & {
  user?: { userId?: string; authTime?: number; tokenVersion?: number };
};

@ApiTags('Client')
@Controller('client')
export class ClientController {
  constructor(
    private readonly clientService: ClientService,
    @InjectRepository(ClientProfile)
    private readonly clientProfileRepository: Repository<ClientProfile>,
    private readonly access: AccessService,
  ) {}

  @Post('register')
  @Authenticated()
  @ApiOperation({ summary: 'Register a new client (MSB admin, own MSB only)' })
  @ApiBody({ type: CreateClientDto })
  @ApiResponse({ status: 201, description: 'Client registered successfully' })
  @ApiResponse({ status: 400, description: 'Validation or duplicate error' })
  async register(
    @Body() createClientDto: CreateClientDto,
    @CurrentCaller() caller: Caller,
  ) {
    this.access.assertMsb(caller, createClientDto.msb_id);
    return this.clientService.register(createClientDto);
  }

  @Post('login')
  @UseGuards(ThrottlerGuard)
  @Throttle({
    otp: { limit: 6, ttl: 3 * 60 * 1000 },
    ip: { limit: 30, ttl: 3 * 60 * 1000 },
  })
  @ApiOperation({ summary: 'Login as a client' })
  @ApiBody({ type: LoginClientDto })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginClientDto: LoginClientDto) {
    return this.clientService.login(loginClientDto);
  }

  @Get(':id/profile')
  @Authenticated()
  @ApiOperation({ summary: 'Get client profile' })
  async getPin(@Param('id') id: string, @CurrentCaller() caller: Caller) {
    await this.access.assertClient(caller, id);
    return this.clientService.profile(id);
  }

  @Get('list')
  @Authenticated()
  @ApiOperation({ summary: 'Get all clients for an MSB' })
  @ApiQuery({ name: 'msb_id', required: true })
  async list(
    @Query('msb_id') msb_id: string,
    @CurrentCaller() caller: Caller,
  ) {
    this.access.assertMsb(caller, msb_id);
    const clients = await this.clientProfileRepository.find({
      where: { msb_id },
    });
    return { clients };
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Change client password' })
  @ApiBody({ type: ChangePasswordDto })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Invalid current password' })
  async changePassword(
    @Body() changePasswordDto: ChangePasswordDto,
    @Request() req: AuthenticatedRequest,
  ) {
    // Extract user ID from JWT token
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('User not authenticated');
    }
    return this.clientService.changePassword(changePasswordDto, userId);
  }

  @Post('2fa/setup')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Generate 2FA secret and otpauth URL' })
  async twofaSetup(@Request() req: AuthenticatedRequest) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('User not authenticated');
    }
    const result: { otpauth_url: string; base32: string } =
      await this.clientService.twofaSetup(userId);
    return result;
  }

  @Post('2fa/enable')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Enable 2FA after verifying OTP' })
  @ApiBody({ type: Enable2faDto })
  async twofaEnable(
    @Body() body: Enable2faDto,
    @Request() req: AuthenticatedRequest,
  ) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('User not authenticated');
    }
    const result: { message: string; twofa_enabled: boolean } =
      await this.clientService.twofaEnable(userId, body.otp);
    return result;
  }

  @Post('2fa/disable')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Disable 2FA (verify OTP)' })
  @ApiBody({ type: Enable2faDto })
  async twofaDisable(
    @Body() body: Enable2faDto,
    @Request() req: AuthenticatedRequest,
  ) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('User not authenticated');
    }
    const result: { message: string; twofa_enabled: boolean } =
      await this.clientService.twofaDisable(userId, body.otp);
    return result;
  }

  @Get('2fa/status')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get 2FA enablement status' })
  async twofaStatus(@Request() req: AuthenticatedRequest) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('User not authenticated');
    }
    const result: { twofa_enabled: boolean } =
      await this.clientService.twofaStatus(userId);
    return result;
  }

  @Post('link-wallet')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Link client wallet and register with BlindPay' })
  @ApiBody({ type: LinkWalletDto })
  @ApiResponse({ status: 200, description: 'Wallet linked successfully' })
  @ApiResponse({
    status: 400,
    description: 'Validation error or wallet linking failed',
  })
  @ApiResponse({ status: 401, description: 'User not authenticated' })
  async linkWallet(
    @Body() linkWalletDto: LinkWalletDto,
    @Request() req: AuthenticatedRequest,
  ) {
    // Extract user ID from JWT token
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('User not authenticated');
    }
    return this.clientService.linkWallet(linkWalletDto, userId);
  }

  @Post('reset-wallet')
  @Authenticated()
  @ApiOperation({ summary: 'Reset client wallet (for customer support)' })
  @ApiBody({ type: ResetWalletDto })
  @ApiResponse({ status: 200, description: 'Wallet reset successfully' })
  @ApiResponse({
    status: 400,
    description: 'Validation error or client not found',
  })
  @ApiResponse({ status: 401, description: 'User not authenticated' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async resetWallet(
    @Body() resetWalletDto: ResetWalletDto,
    @Request() req: AuthenticatedRequest,
    @CurrentCaller() caller: Caller,
  ) {
    // Extract user ID from JWT token
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('User not authenticated');
    }

    // Check if the user is an MSB admin (only MSB admins can reset wallets)
    const user = await this.clientProfileRepository.manager
      .getRepository(User)
      .findOne({
        where: { id: userId },
      });

    if (!user || user.role !== 'msb_admin') {
      throw new UnauthorizedException(
        'Only MSB administrators can reset client wallets',
      );
    }
    // ...and only for clients of their own MSB
    await this.access.assertClient(caller, resetWalletDto.client_id);

    return this.clientService.resetWallet(resetWalletDto, userId);
  }

  @Put(':id/profile')
  @Authenticated()
  @ApiBody({ type: UpdateClientProfileDto })
  @ApiOperation({ summary: 'Update client profile' })
  async updateProfile(
    @Param('id') id: string,
    @Body() updateDto: UpdateClientProfileDto,
    @CurrentCaller() caller: Caller,
  ) {
    await this.access.assertClient(caller, id);
    return this.clientService.updateProfileV2(id, updateDto);
  }

  @Post('msb-data')
  @Authenticated()
  @ApiOperation({ summary: 'Get all data filtered by msb_id' })
  @ApiBody({ type: GetByMsbDto })
  async getAllDataByMsbId(
    @Body() dto: GetByMsbDto,
    @CurrentCaller() caller: Caller,
  ) {
    this.access.assertMsb(caller, dto.msb_id);
    return this.clientService.getAllDataByMsbId(dto);
  }

  @Post('customer/virtual_accounts')
  @Authenticated()
  @ApiOperation({ summary: 'Get all customers under a specific MSB ID' })
  @ApiBody({ type: GetCustomersByMsbDto })
  @ApiResponse({ status: 200, description: 'Customers retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  async getCustomersByMsbId(
    @Body() dto: GetCustomersByMsbDto,
    @CurrentCaller() caller: Caller,
  ) {
    this.access.assertMsb(caller, dto.msb_id);
    return this.clientService.getCustomersByMsbId(dto.msb_id);
  }

  @Post('transactions/all')
  @Authenticated()
  @ApiOperation({ summary: 'Get all customer IDs under a specific MSB ID' })
  @ApiBody({ type: GetCustomersByMsbDto })
  @ApiResponse({
    status: 200,
    description: 'Customer IDs retrieved successfully',
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  async getAllTransactionsByMsbId(
    @Body() dto: GetCustomersByMsbDto,
    @CurrentCaller() caller: Caller,
  ) {
    this.access.assertMsb(caller, dto.msb_id);
    return this.clientService.getAllTransactionsByMsbId(dto.msb_id);
  }

  @Get('business')
  @Authenticated()
  @ApiOperation({
    summary: 'Get all business clients that are not MSBs',
    description:
      'Returns all clients where client_type is "business" and is_msb is false',
  })
  @ApiResponse({
    status: 200,
    description: 'Business clients retrieved successfully',
  })
  async getBusinessClients(@CurrentCaller() caller: Caller) {
    // Scoped to the admin's own MSB (previously returned business clients of every MSB)
    this.access.assertMsb(caller, caller.msbId);
    const { clients } = await this.clientService.getBusinessClients();
    const own = clients.filter((c) => c.msb_id === caller.msbId);
    return { clients: own, count: own.length };
  }

  @Post('request-reset-password')
  @UseGuards(ThrottlerGuard)
  @Throttle({
    otp: { limit: 3, ttl: 15 * 60 * 1000 },
    ip: { limit: 15, ttl: 15 * 60 * 1000 },
  })
  @ApiOperation({ summary: 'Request password reset link' })
  @ApiBody({ type: RequestResetPasswordDto })
  @ApiResponse({
    status: 200,
    description: 'Password reset link sent if email exists',
  })
  async requestPasswordReset(
    @Body() requestResetPasswordDto: RequestResetPasswordDto,
  ) {
    return this.clientService.requestPasswordReset(requestResetPasswordDto);
  }

  @Post('reset-password')
  @UseGuards(ThrottlerGuard)
  @Throttle({
    otp: { limit: 5, ttl: 15 * 60 * 1000 },
    ip: { limit: 20, ttl: 15 * 60 * 1000 },
  })
  @ApiOperation({ summary: 'Reset password using token from email link' })
  @ApiBody({ type: ResetPasswordDto })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  @ApiResponse({ status: 400, description: 'Invalid token or validation error' })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.clientService.resetPassword(resetPasswordDto);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(@Request() req: AuthenticatedRequest) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('User not authenticated');
    }
    return this.clientService.logout(userId);
  }

  @Post('refresh-token')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Exchange a valid access token for a fresh one' })
  @ApiResponse({ status: 401, description: 'Unauthorized or session too old' })
  async refreshToken(@Request() req: AuthenticatedRequest) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('User not authenticated');
    }
    return this.clientService.refreshToken(
      userId,
      req.user?.authTime,
      req.user?.tokenVersion,
    );
  }
}
