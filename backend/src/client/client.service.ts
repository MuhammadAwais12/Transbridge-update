import { providers, ProviderConfigError } from '../config/providers.config';
import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Raw, In } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as speakeasy from 'speakeasy';
import * as crypto from 'crypto';
import { JwtService } from '@nestjs/jwt';
import { ClientProfile } from './client.entity';
import { Account } from './account.entity';
import { Beneficiary } from './beneficiary.entity';
import { Transaction } from './transaction.entity';
import { ResetPassword } from './reset-password.entity';
import { GetByMsbDto } from './dto/get-by-msb.dto';
import { CreateClientDto } from './dto/create-client.dto';
import { LoginClientDto } from './dto/login-client.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LinkWalletDto } from './dto/link-wallet.dto';
import { ResetWalletDto } from './dto/reset-wallet.dto';
import { RequestResetPasswordDto } from './dto/request-reset-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { WalletService } from '../msb-wallet/wallet.service';
import { UpdateClientProfileDto } from './dto/account.dto';
import { BridgeService } from 'src/integration/bridge/bridge.service';
import { Msb, User } from 'src/msb-admin/msb-admin.entity';
import { EmailService } from '../email/email.service';
import { brand } from '../config/brand.config';

@Injectable()
export class ClientService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(ClientProfile)
    private readonly clientRepository: Repository<ClientProfile>,
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
    @InjectRepository(Msb)
    private readonly msbRepository: Repository<Msb>,
    @InjectRepository(Beneficiary)
    private readonly beneficiaryRepository: Repository<Beneficiary>,
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    @InjectRepository(ResetPassword)
    private readonly resetPasswordRepository: Repository<ResetPassword>,
    private readonly jwtService: JwtService,
    private readonly dataSource: DataSource,
    private readonly walletService: WalletService,
    @Inject(forwardRef(() => BridgeService))
    private readonly bridgeService: BridgeService,
    private readonly emailService: EmailService,
  ) {}

  private generateBackupCodes(count = 10): string[] {
    const codes = new Set<string>();
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    while (codes.size < count) {
      const bytes = crypto.randomBytes(8);
      let code = '';
      for (let i = 0; i < 8; i++) {
        code += alphabet[bytes[i] % alphabet.length];
      }
      codes.add(code);
    }
    return Array.from(codes);
  }

  private getRequestTimeoutMs(): number {
    return providers.onlineBanking.timeoutMs;
  }

  private async fetchWithTimeout(
    url: string,
    init?: RequestInit,
    timeoutMs: number = 10000,
  ): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const resp = await fetch(url, {
        ...(init || {}),
        signal: controller.signal,
      });
      return resp;
    } finally {
      clearTimeout(timer);
    }
  }

  private async mapWithConcurrency<T, R>(
    items: T[],
    limit: number,
    mapper: (item: T, index: number) => Promise<R>,
  ): Promise<R[]> {
    if (limit <= 0) limit = 1;
    const results: R[] = new Array(items.length);
    let nextIndex = 0;

    const runNext = async (): Promise<void> => {
      const current = nextIndex++;
      if (current >= items.length) return;
      try {
        results[current] = await mapper(items[current], current);
      } finally {
        if (nextIndex < items.length) {
          await runNext();
        }
      }
    };

    const starters = new Array(Math.min(limit, items.length))
      .fill(0)
      .map(() => runNext());
    await Promise.all(starters);
    return results;
  }

  private async fetchJsonWithRetry(
    url: string,
    init: RequestInit,
    retries = 2,
    timeoutMs = this.getRequestTimeoutMs(),
  ): Promise<any> {
    let attempt = 0;
    let lastErr: any;
    while (attempt <= retries) {
      try {
        const resp = await this.fetchWithTimeout(url, init, timeoutMs);
        const contentType = resp.headers.get('content-type') || '';
        const isJson = contentType.includes('application/json');
        const payload = isJson ? await resp.json() : await resp.text();
        if (!resp.ok) {
          throw new BadRequestException(
            `Failed request (${resp.status}): ${typeof payload === 'string' ? payload : JSON.stringify(payload)}`,
          );
        }
        return payload;
      } catch (e) {
        lastErr = e;
        const isAbort = e?.name === 'AbortError';
        if (!isAbort && !(e instanceof BadRequestException)) {
          // non-timeout network error; retry
        }
        if (attempt === retries) break;
        const backoff = 250 * (attempt + 1);
        await new Promise((r) => setTimeout(r, backoff));
        attempt++;
      }
    }
    throw lastErr;
  }

  async register(createClientDto: CreateClientDto) {
    const {
      email,
      password,
      name,
      msb_id,
      is_msb,
      developer_fee_percent = '0.00',
      ...profileData
    } = createClientDto;

    // Manual validation as backup
    if (!email || email.length > 254) {
      throw new BadRequestException(
        'Email must not be longer than 254 characters',
      );
    }
    if (!password || password.length < 6 || password.length > 128) {
      throw new BadRequestException(
        'Password must be between 6 and 128 characters',
      );
    }
    // name, first_name, and last_name are optional; no manual validation
    if (profileData.phone_number && profileData.phone_number.length > 20) {
      throw new BadRequestException(
        'Phone number must not be longer than 20 characters',
      );
    }
    if (profileData.address_1 && profileData.address_1.length > 255) {
      throw new BadRequestException(
        'Address 1 must not be longer than 255 characters',
      );
    }
    if (profileData.address_2 && profileData.address_2.length > 255) {
      throw new BadRequestException(
        'Address 2 must not be longer than 255 characters',
      );
    }
    if (profileData.city && profileData.city.length > 100) {
      throw new BadRequestException(
        'City must not be longer than 100 characters',
      );
    }
    if (profileData.state && profileData.state.length > 100) {
      throw new BadRequestException(
        'State must not be longer than 100 characters',
      );
    }
    if (profileData.postal_code && profileData.postal_code.length > 20) {
      throw new BadRequestException(
        'Postal code must not be longer than 20 characters',
      );
    }

    // Check if user already exists
    const existing = await this.userRepository.findOne({
      where: { email, role: 'account_holder' },
    });
    if (existing) {
      throw new BadRequestException('Client with this email already exists');
    }

    // No extra required fields beyond msb_id, email, password, client_type

    // Construct minimal payload; other fields are optional/not required
    const blindpay_payload: any = {
      type: createClientDto.client_type,
      email: createClientDto.email,
    };

    // Remove undefined and null fields
    Object.keys(blindpay_payload).forEach(
      (key) =>
        (blindpay_payload[key] === undefined ||
          blindpay_payload[key] === null) &&
        delete blindpay_payload[key],
    );

    // Create BlindPay customer first
    let blindpay_receiver_id: string;
    let tosUrl = '';
    let kycUrl = '';

    try {
      const baseUrl = providers.onlineBanking.url;
      const api_url = `${baseUrl}/customers`;

      // const response = await fetch(api_url, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${process.env.NEXT_PUBLIC_BLINDPAY_API_KEY}`,
      //     'x-api-key': process.env.NEXT_PUBLIC_ONLINE_BANKING_X_API_KEY || '',
      //   },
      //   body: JSON.stringify(blindpay_payload),
      // });

      const xApiKey =
        providers.onlineBanking.xApiKey;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (xApiKey) headers['x-api-key'] = xApiKey;
      // if (process.env.NEXT_PUBLIC_BLINDPAY_API_KEY)
      //   headers['Authorization'] =
      //     `Bearer ${process.env.NEXT_PUBLIC_BLINDPAY_API_KEY}`;

      const response = await fetch(api_url, {
        method: 'POST',
        headers,
        body: JSON.stringify({ email, type: createClientDto.client_type }),
      });

      if (!response.ok) {
        const errorText = await response.text();

        // Parse error response to provide more specific error messages
        let errorMessage = 'Failed to create BlindPay receiver';
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch (parseError) {
          // If we can't parse the error, use the raw text
          errorMessage = errorText;
        }

        throw new Error(`${errorMessage} (Status: ${response.status})`);
      }

      const data = await response.json();
      blindpay_receiver_id = data.id;

      console.log('blindpay_receiver_id', blindpay_receiver_id);

      const api_url1 = `${baseUrl}/customers/${blindpay_receiver_id}/tos-acceptance-link`;
      const api_url2 = `${baseUrl}/customers/${blindpay_receiver_id}/kyc-link`;

      try {
        const response1 = await fetch(api_url1, {
          method: 'GET',
          headers,
        });

        if (!response1.ok) {
          throw new Error(`HTTP error! Status: ${response1.status}`);
        }

        // Get the TOS link from response
        const tosData = await response1.json();
        console.log('tos link data:', tosData);
        tosUrl = tosData.url || tosData.link || tosData.tos_url || '';
      } catch (error) {
        console.error('Error fetching TOS link:', error);
      }

      try {
        const response2 = await fetch(api_url2, {
          method: 'GET',
          headers,
        });

        if (!response2.ok) {
          throw new Error(`HTTP error! Status: ${response2.status}`);
        }

        // Get the KYC link from response
        const kycData = await response2.json();
        console.log('kyc link data:', kycData);
        kycUrl = kycData.url || kycData.link || kycData.kyc_url || '';
      } catch (error) {
        console.error('Error fetching KYC link:', error);
      }

      if (profileData.client_type === 'business') {
        blindpay_receiver_id = providers.originalTechAccountId;
        const msb = await this.msbRepository.findOne({ where: { id: msb_id } });
        if (msb?.customer_id) {
          blindpay_receiver_id = msb.customer_id;
        }
      }
    } catch (e) {
      if (e instanceof ProviderConfigError) throw e; // keep the "missing env var" message
      // Provide more specific error messages based on the error
      let userFriendlyMessage = 'Failed to create BlindPay receiver';
      if (e.message.includes('400')) {
        userFriendlyMessage = 'Failed to create your account.';
      } else if (e.message.includes('401')) {
        userFriendlyMessage = 'Authentication failed. Please contact support.';
      } else if (e.message.includes('403')) {
        userFriendlyMessage = 'Access denied. Please contact support.';
      } else if (e.message.includes('500')) {
        userFriendlyMessage = 'Server error. Please try again later.';
      } else if (e.message.includes('network') || e.message.includes('fetch')) {
        userFriendlyMessage =
          'Network error. Please check your connection and try again.';
      }

      throw new BadRequestException(
        `${userFriendlyMessage} Details: ${e.message}`,
      );
    }

    // Only proceed with user creation if BlindPay receiver was successfully created
    if (!blindpay_receiver_id) {
      throw new BadRequestException(
        'Failed to create BlindPay receiver. Please check your KYC information and try again.',
      );
    }

    // Use transaction to ensure atomicity of user and client profile creation
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Now create the user in our database
      const password_hash = await bcrypt.hash(password, 10);
      const user = this.userRepository.create({
        email,
        name:
          name ||
          (profileData.first_name
            ? `${profileData.first_name} ${profileData.last_name || ''}`.trim()
            : 'Client'),
        role: 'account_holder',
        is_active: true,
        password_hash,
        msb_id,
      });
      await queryRunner.manager.save(user);

      // Create client profile
      const clientProfile = this.clientRepository.create({
        user_id: user.id,
        msb_id,
        blindpay_receiver_id,
        ...profileData,
        first_name: profileData.first_name ?? '',
        last_name: profileData.last_name ?? '',
        id_document_type: profileData.id_document_type?.toUpperCase(),
        is_msb,
        developer_fee_percent,
      });
      await queryRunner.manager.save(clientProfile);

      // Commit the transaction
      await queryRunner.commitTransaction();

      // Send KYC email after successful registration
      try {
        // Use the URLs fetched from the API, fallback to default URLs if not available
        const baseUrl =
          process.env.NEXT_PUBLIC_DASHBOARD_URL ||
          process.env.DASHBOARD_URL ||
          brand.dashboardOrigin;
        const termsOfServiceUrl = tosUrl || `${baseUrl}/terms`;
        const customerDetailsUrl = kycUrl || `${baseUrl}/kyc`;

        await this.emailService.sendKycEmail({
          email: user.email,
          termsOfServiceUrl,
          customerDetailsUrl,
        });
      } catch (emailError) {
        // Log email error but don't fail the registration
        console.error('Failed to send KYC email:', emailError);
      }

      const payload = { sub: user.id, email: user.email, role: user.role };
      const token = this.jwtService.sign(payload);
      return {
        message: 'Client registered successfully',
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          msb_id: user.msb_id,
          is_active: user.is_active,
          created_at: user.created_at,
          last_login: user.last_login,
        },
        client: {
          id: clientProfile.id,
          first_name: clientProfile.first_name,
          last_name: clientProfile.last_name,
        },
      };
    } catch (error) {
      // Rollback the transaction on error
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      // Release the query runner
      await queryRunner.release();
    }
  }

  async login(loginClientDto: LoginClientDto) {
    const { email, password, otp } = loginClientDto;

    // Manual validation as backup
    if (!email || email.length > 254) {
      throw new BadRequestException(
        'Email must not be longer than 254 characters',
      );
    }
    if (!password || password.length < 6 || password.length > 128) {
      throw new BadRequestException(
        'Password must be between 6 and 128 characters',
      );
    }

    const user = await this.userRepository.findOne({
      where: { email, role: 'account_holder', is_active: true },
    });
    if (!user || !user.password_hash) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }
    // If 2FA is enabled, require and verify OTP or a valid backup code
    if (user.twofa_enabled) {
      if (!otp) {
        throw new UnauthorizedException('OTP required');
      }
      const isValidOtp = speakeasy.totp.verify({
        secret: user.twofa_secret ?? '',
        encoding: 'base32',
        token: otp,
        window: 1,
      });

      if (!isValidOtp) {
        const candidate = (otp || '').toString().toUpperCase();
        // Try backup codes if TOTP fails
        const backupCodes = Array.isArray(user.twofa_backup_codes)
          ? [...user.twofa_backup_codes]
          : [];

        let matchedIndex = -1;
        for (let i = 0; i < backupCodes.length; i++) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
          const match = (await bcrypt.compare(
            candidate,
            backupCodes[i],
          )) as boolean;
          if (match) {
            matchedIndex = i;
            break;
          }
        }

        if (matchedIndex >= 0) {
          // consume the used backup code
          backupCodes.splice(matchedIndex, 1);
          user.twofa_backup_codes = backupCodes;
        } else {
          throw new UnauthorizedException('Invalid OTP');
        }
      }
    }

    user.last_login = new Date();
    await this.userRepository.save(user);
    const payload = { sub: user.id, email: user.email, role: user.role };
    const token = this.jwtService.sign(payload);
    // Fetch client profile for this user
    const clientProfile = await this.clientRepository.findOne({
      where: { user_id: user.id },
    });

    if (!clientProfile?.blindpay_receiver_id) {
      throw new BadRequestException('Login failed');
    }

    const customerID = clientProfile.blindpay_receiver_id;
    // the customer bridge id
    const bridgeCustomerData = await this.bridgeService.getCustomer(customerID);

    // Create default virtual account if the client is not a MSB and no virtual account exists
    if (!clientProfile.is_msb && bridgeCustomerData.status === 'active') {
      await this.bridgeService.createDefaultVirtualAccountIfNotExists(
        customerID,
        user.id,
      );
    }

    return {
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: `${clientProfile.first_name ?? 'Client'} ${clientProfile.last_name ?? ''}`.trim(),
        customer_name:
          `${bridgeCustomerData.first_name ?? ''} ${bridgeCustomerData.last_name ?? ''}`.trim(),
        role: user.role,
        msb_id: user.msb_id,
        is_active: user.is_active,
        created_at: user.created_at,
        last_login: user.last_login,
        password_changed: user.password_changed,
        // Include wallet information if available
        wallet_address: clientProfile?.wallet_address,
        wallet_network: clientProfile?.wallet_network,
        blindpay_wallet_id: clientProfile?.blindpay_receiver_id,
        client_type: clientProfile?.client_type,
        is_msb: clientProfile?.is_msb,
        developer_fee_percent: clientProfile?.developer_fee_percent,
        activated: bridgeCustomerData.status === 'active',
      },
      client: clientProfile
        ? {
            id: clientProfile.id,
            first_name: clientProfile.first_name,
            last_name: clientProfile.last_name,
            wallet_address: clientProfile.wallet_address as string | undefined,
            wallet_network: clientProfile.wallet_network as string | undefined,
            wallet_connected_at: clientProfile.wallet_connected_at as
              | Date
              | undefined,
            blindpay_wallet_id: clientProfile.blindpay_wallet_id as
              | string
              | undefined,
          }
        : null,
    };
  }

  async twofaSetup(userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');

    const appName =
      user.role === 'msb_admin'
        ? `${brand.companyName} Admin`
        : `${brand.companyName} Client`;
    const secret = speakeasy.generateSecret({
      name: `${appName} (${user.email})`,
      length: 20,
    });

    user.twofa_secret = secret.base32;
    await this.userRepository.save(user);

    return {
      otpauth_url: secret.otpauth_url,
      base32: secret.base32,
    };
  }

  async twofaEnable(userId: string, otp: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user || !user.twofa_secret)
      throw new UnauthorizedException('2FA not initialized');

    const ok = speakeasy.totp.verify({
      secret: user.twofa_secret,
      encoding: 'base32',
      token: otp,
      window: 1,
    });

    if (!ok) throw new UnauthorizedException('Invalid OTP');

    user.twofa_enabled = true;
    // Generate 10 backup codes and store hashed copies
    const plainBackupCodes = this.generateBackupCodes(10);
    const hashedBackupCodes = await Promise.all(
      plainBackupCodes.map((c) => bcrypt.hash(c, 10)),
    );
    user.twofa_backup_codes = hashedBackupCodes as any;
    await this.userRepository.save(user);
    return {
      message: '2FA enabled',
      twofa_enabled: true,
      backup_codes: plainBackupCodes,
    };
  }

  async twofaDisable(userId: string, otp: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user || !user.twofa_secret)
      throw new UnauthorizedException('2FA not enabled');

    const ok = speakeasy.totp.verify({
      secret: user.twofa_secret,
      encoding: 'base32',
      token: otp,
      window: 1,
    });
    if (!ok) {
      const candidate = (otp || '').toString().toUpperCase();
      const backupCodes = Array.isArray(user.twofa_backup_codes)
        ? [...user.twofa_backup_codes]
        : [];
      let matchedIndex = -1;
      for (let i = 0; i < backupCodes.length; i++) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        const match = (await bcrypt.compare(
          candidate,
          backupCodes[i],
        )) as boolean;
        if (match) {
          matchedIndex = i;
          break;
        }
      }
      if (matchedIndex >= 0) {
        // consume the used backup code
        backupCodes.splice(matchedIndex, 1);
        user.twofa_backup_codes = backupCodes;
      } else {
        throw new UnauthorizedException('Invalid OTP');
      }
    }

    user.twofa_enabled = false;
    user.twofa_secret = null as any;
    user.twofa_backup_codes = null as any;
    await this.userRepository.save(user);
    return { message: '2FA disabled', twofa_enabled: false };
  }

  async twofaStatus(userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');
    return { twofa_enabled: !!user.twofa_enabled };
  }

  async changePassword(changePasswordDto: ChangePasswordDto, userId: string) {
    const { currentPassword, newPassword } = changePasswordDto;

    // Manual validation as backup
    if (
      !currentPassword ||
      currentPassword.length < 6 ||
      currentPassword.length > 128
    ) {
      throw new BadRequestException(
        'Current password must be between 6 and 128 characters',
      );
    }
    if (!newPassword || newPassword.length < 6 || newPassword.length > 128) {
      throw new BadRequestException(
        'New password must be between 6 and 128 characters',
      );
    }

    // Find the user
    const user = await this.userRepository.findOne({
      where: { id: userId, role: 'account_holder' },
    });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password_hash,
    );
    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // Update password and mark as changed
    user.password_hash = newPasswordHash;
    user.password_changed = true;
    user.updated_at = new Date();

    await this.userRepository.save(user);

    return {
      message: 'Password changed successfully',
      success: true,
    };
  }

  async linkWallet(linkWalletDto: LinkWalletDto, userId: string) {
    const { wallet_address, wallet_network } = linkWalletDto;

    // Find the user and client profile
    const user = await this.userRepository.findOne({
      where: { id: userId, role: 'account_holder' },
    });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const clientProfile = await this.clientRepository.findOne({
      where: { user_id: userId },
    });
    if (!clientProfile) {
      throw new BadRequestException('Client profile not found');
    }

    // Check if wallet is already linked
    if (clientProfile.wallet_address) {
      throw new BadRequestException('Wallet is already linked to this client');
    }

    // Validate wallet address format (basic Ethereum address validation)
    if (!/^0x[a-fA-F0-9]{40}$/.test(wallet_address)) {
      throw new BadRequestException('Invalid wallet address format');
    }

    // Update client profile with wallet information
    clientProfile.wallet_address = wallet_address;
    clientProfile.wallet_network = wallet_network;
    clientProfile.wallet_connected_at = new Date();

    await this.clientRepository.save(clientProfile);

    // Create wallet in BlindPay using WalletService
    try {
      const wallet = await this.walletService.createWallet({
        client_id: clientProfile.id,
        name: `Client Wallet - ${clientProfile.first_name} ${clientProfile.last_name}`,
        network: wallet_network,
        address: wallet_address,
        is_account_abstraction: true,
      });

      if (!wallet) {
        throw new BadRequestException('Failed to create wallet in BlindPay');
      }

      // Update client profile with BlindPay wallet ID
      clientProfile.blindpay_wallet_id = wallet.blindpay_wallet_id;
      await this.clientRepository.save(clientProfile);

      return {
        message: 'Wallet linked successfully',
        success: true,
        wallet: {
          id: wallet.id,
          address: wallet.address,
          network: wallet.network,
          blindpay_wallet_id: wallet.blindpay_wallet_id,
        },
        client: {
          id: clientProfile.id,
          wallet_address: clientProfile.wallet_address,
          wallet_network: clientProfile.wallet_network,
          wallet_connected_at: clientProfile.wallet_connected_at,
        },
      };
    } catch (error) {
      // Rollback client profile changes if wallet creation fails
      (clientProfile.wallet_address as any) = null;
      (clientProfile.wallet_network as any) = null;
      (clientProfile.wallet_connected_at as any) = null;
      await this.clientRepository.save(clientProfile);

      throw new BadRequestException(`Failed to link wallet: ${error.message}`);
    }
  }

  async resetWallet(resetWalletDto: ResetWalletDto, supportAgentId?: string) {
    const { client_id, reason, support_agent_id } = resetWalletDto;

    // Find the client profile
    const clientProfile = await this.clientRepository.findOne({
      where: { id: client_id },
    });

    if (!clientProfile) {
      throw new BadRequestException('Client not found');
    }

    // Find the associated user
    const user = await this.userRepository.findOne({
      where: { id: clientProfile.user_id },
    });

    if (!user) {
      throw new BadRequestException('Client user record not found');
    }

    // Check if wallet is currently linked
    if (!clientProfile.wallet_address) {
      throw new BadRequestException(
        'No wallet is currently linked to this client',
      );
    }

    // Store wallet information for audit purposes
    const previousWalletInfo = {
      wallet_address: clientProfile.wallet_address,
      wallet_network: clientProfile.wallet_network,
      wallet_connected_at: clientProfile.wallet_connected_at,
      blindpay_wallet_id: clientProfile.blindpay_wallet_id,
      reset_at: new Date(),
      reset_reason: reason || 'Customer support request',
      reset_by: support_agent_id || support_agent_id || 'system',
    };

    // Clear wallet information from client profile
    (clientProfile.wallet_address as any) = null;
    (clientProfile.wallet_network as any) = null;
    (clientProfile.wallet_connected_at as any) = null;
    (clientProfile.blindpay_wallet_id as any) = null;
    clientProfile.updated_at = new Date();

    // Save the updated client profile
    await this.clientRepository.save(clientProfile);

    return {
      message: 'Wallet reset successfully',
      success: true,
      client: {
        id: clientProfile.id,
        user_id: clientProfile.user_id,
        wallet_address: null,
        wallet_network: null,
        wallet_connected_at: null,
        blindpay_wallet_id: null,
      },
      reset_info: {
        previous_wallet: previousWalletInfo.wallet_address,
        reset_reason: previousWalletInfo.reset_reason,
        reset_by: previousWalletInfo.reset_by,
        reset_at: previousWalletInfo.reset_at,
      },
    };
  }

  async profile(client_id: string) {
    const clientProfile = await this.clientRepository.findOne({
      where: { id: client_id },
    });

    if (!clientProfile) {
      throw new BadRequestException('Client profile not found');
    }

    return {
      id: clientProfile.id,
      first_name: clientProfile.first_name,
      last_name: clientProfile.last_name,
      phone_number: clientProfile.phone_number,
      date_of_birth: clientProfile.date_of_birth,
      nationality: clientProfile.nationality,
      address_1: clientProfile.address_1,
      address_2: clientProfile.address_2,
      city: clientProfile.city,
      state: clientProfile.state,
      postal_code: clientProfile.postal_code,
      country: clientProfile.country,
    };
  }

  async updateProfileV2(id: string, dto: UpdateClientProfileDto) {
    const updated = await this.clientRepository.update(id, {
      first_name: dto.first_name,
      last_name: dto.last_name,
      phone_number: dto.phone_number,
      date_of_birth: dto.date_of_birth,
      nationality: dto.nationality,
      address_1: dto.address_1,
      address_2: dto.address_2,
      city: dto.city,
      state: dto.state,
      postal_code: dto.postal_code,
      country: dto.country,
    });

    if (updated.affected === 0)
      throw new NotFoundException(`Client ${id} not found`);

    return this.clientRepository.findOne({ where: { id } });
  }
  async updateProfile(id: string, dto: UpdateClientProfileDto) {
    try {
      const client = await this.clientRepository.findOne({ where: { id } });
      if (!client) throw new NotFoundException(`Client ${id} not found`);
      const blindpay_payload: any = {
        email: dto.email,
        tax_id: client.msb_id,
        first_name: dto.first_name,
        last_name: dto.last_name,
        phone_number: dto.phone_number,
        date_of_birth: toRfc3339(dto.date_of_birth),
        nationality: dto.nationality,
        address_line_1: dto.address_1,
        address_line_2: dto.address_2,
        city: dto.city,
        state_province_region: dto.state,
        postal_code: dto.postal_code,
        country: dto.country,
        id_doc_country: client.id_document_country?.toUpperCase(), // ISO2
        id_doc_type: client.id_document_type,
      };
      const api_url = `${providers.onlineBanking.url}/v2/receivers/${providers.blindpay.instanceId}/${client?.blindpay_receiver_id}`;

      const response = await fetch(api_url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${providers.blindpay.apiKey}`,
          'x-api-key': providers.onlineBanking.xApiKey ?? '',
        },
        body: JSON.stringify(blindpay_payload),
      });

      if (!response.ok) {
        const errorText = await response.text();

        throw new Error(`${errorText} (Status: ${response.status})`);
      }
      const mapped = {
        first_name: dto.first_name ?? client.first_name,
        last_name: dto.last_name ?? client.last_name,
        phone_number: dto.phone_number ?? client.phone_number,
        date_of_birth: dto.date_of_birth ?? client.date_of_birth,
        nationality: dto.nationality ?? client.nationality,
        address_1: dto.address_1 ?? client.address_1,
        address_2: dto.address_2 ?? client.address_2,
        city: dto.city ?? client.city,
        state: dto.state ?? client.state,
        postal_code: dto.postal_code ?? client.postal_code,
        country: dto.country ?? client.id_document_country,
        id_document_country: dto.country ?? client.id_document_country,
      };

      const resp = this.clientRepository.merge(client, mapped);
      await this.clientRepository.save(resp);
      return {
        ...resp,
        ...mapped,
      };
    } catch (e) {
      if (e instanceof ProviderConfigError) throw e; // keep the "missing env var" message
      // Provide more specific error messages based on the error
      let userFriendlyMessage = 'Failed to create BlindPay receiver';
      if (e.message.includes('400')) {
        userFriendlyMessage = 'Failed to create your account.';
      } else if (e.message.includes('401')) {
        userFriendlyMessage = 'Authentication failed. Please contact support.';
      } else if (e.message.includes('403')) {
        userFriendlyMessage = 'Access denied. Please contact support.';
      } else if (e.message.includes('500')) {
        userFriendlyMessage = 'Server error. Please try again later.';
      } else if (e.message.includes('network') || e.message.includes('fetch')) {
        userFriendlyMessage =
          'Network error. Please check your connection and try again.';
      }

      throw new BadRequestException(
        `${userFriendlyMessage} Details: ${e.message}`,
      );
    }
  }

  async getAllDataByMsbId(dto: GetByMsbDto) {
    const { msb_id } = dto;
    // 1) Collect BlindPay receiver IDs for this MSB
    const clientRows = await this.clientRepository.find({
      where: { msb_id },
      select: ['blindpay_receiver_id', 'is_msb', 'user_id'],
    });

    const bridgeCustomers = clientRows.filter(
      (v) => v.blindpay_receiver_id && v.blindpay_receiver_id.length === 36,
    );

    const userEmails = await this.userRepository.find({
      where: {
        id: In(bridgeCustomers.map((r) => r.user_id)),
      },
      select: ['id', 'email'],
    });

    const customerUserEmailMap = new Map(
      bridgeCustomers.map((r) => [
        r.blindpay_receiver_id,
        userEmails.find((u) => u.id === r.user_id)?.email ?? '',
      ]),
    );

    const ids = bridgeCustomers.map((r) => r.blindpay_receiver_id);

    // If no IDs for this MSB, avoid upstream call entirely
    if (ids.length === 0) {
      return { customers: [] };
    }

    // 2) Fetch individual customers using Promise.all
    const baseUrl = providers.onlineBanking.url;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      accept: 'application/json',
    };
    const xApiKey =
      providers.onlineBanking.xApiKey;
    if (xApiKey) headers['x-api-key'] = xApiKey;

    // Fetch individual customers using Promise.all
    let customers: any[] = [];
    try {
      const customerPromises = ids.map(async (customerId) => {
        const api_url = `${baseUrl}/customers/${customerId}`;
        try {
          const customerData = await this.fetchJsonWithRetry(
            api_url,
            { method: 'GET', headers },
            2,
            this.getRequestTimeoutMs(),
          );
          return customerData;
        } catch (e) {
          // Log error but don't fail the entire operation for individual customer failures
          console.warn(`Failed to fetch customer ${customerId}:`, e);
          return null;
        }
      });

      const customerResults = await Promise.all(customerPromises);
      customers = customerResults.filter((customer) => customer !== null);
    } catch (e) {
      if (e?.name === 'AbortError') {
        // Graceful degrade on upstream timeout
        return { customers: [] };
      }
      // If upstream responds with a non-timeout error, convert to 400
      throw new BadRequestException(
        `Failed to fetch customers: ${e instanceof Error ? e.message : String(e)}`,
      );
    }

    // 3) For each customer id, fetch KYC links and enrich response with kyc_link and tos_link
    const kycResults = await this.mapWithConcurrency(
      customers,
      5,
      async (cust) => {
        const url = `${baseUrl}/kyc_links?customer_id=${encodeURIComponent(cust.id)}`;
        try {
          const resp = await this.fetchWithTimeout(
            url,
            { method: 'GET', headers },
            6000,
          );
          if (!resp.ok)
            return {
              id: cust.id,
              kyc_link: undefined,
              tos_link: undefined,
            } as any;
          const payload = await resp.json();
          const arr: any[] = Array.isArray(payload)
            ? payload
            : payload?.data || [];
          if (!Array.isArray(arr) || arr.length === 0)
            return {
              id: cust.id,
              kyc_link: undefined,
              tos_link: undefined,
            } as any;
          const match = arr.find((it) => it?.customer_id === cust.id) || arr[0];
          const kyc = match?.kyc_link;
          const tos = match?.tos_link;
          return { id: cust.id, kyc_link: kyc, tos_link: tos } as any;
        } catch {
          return {
            id: cust.id,
            kyc_link: undefined,
            tos_link: undefined,
          } as any;
        }
      },
    );
    const kycById = new Map(kycResults.map((k) => [k.id, k]));

    const isMSBMap: Record<string, boolean> = {};

    clientRows.forEach((r) => {
      // checks if blindpay_receiver_id is a bridge customer id
      if (r.blindpay_receiver_id?.length === 36) {
        isMSBMap[r.blindpay_receiver_id] = r.is_msb ?? false;
      }
    });

    const enriched = customers.map((c) => {
      const k = kycById.get(c.id);
      return {
        ...c,
        type: c.type === 'business' && isMSBMap[c.id] ? 'business-msb' : c.type,
        kyc_link: k?.kyc_link,
        tos_link: k?.tos_link,
        is_msb: isMSBMap[c.id] ?? false,
        email: customerUserEmailMap.get(c.id) ?? '',
      };
    });

    // filter enriched here by unique emails
    return { customers: this.uniqueByKey(enriched, 'email') };
  }

  private uniqueByKey<T>(items: T[], key: keyof T): T[] {
    const seen = new Set();
    return items.filter((item) => {
      const val = item[key];
      if (seen.has(val)) return false;
      seen.add(val);
      return true;
    });
  }

  async getMSBCustomersForFees(
    msbID: string,
  ): Promise<
    { customerId: string; userId: string; email: string; name: string }[]
  > {
    const clients = await this.clientRepository.find({
      where: {
        msb_id: msbID,
        blindpay_receiver_id: Raw(
          (alias) => `${alias} IS NOT NULL AND LENGTH(${alias}) = 36`,
        ),
      },
      select: [
        'blindpay_receiver_id',
        'client_type',
        'first_name',
        'last_name',
        'legal_name',
        'user_id',
      ],
    });

    const userEmails = await this.userRepository.find({
      where: {
        id: In(clients.map((r) => r.user_id)),
      },
      select: ['id', 'email', 'name'],
    });

    const userEmailMap = new Map(
      clients.map((r) => [
        r.user_id,
        userEmails.find((u) => u.id === r.user_id)?.email ?? '',
      ]),
    );

    return clients
      .filter(
        (client) =>
          client.blindpay_receiver_id &&
          typeof client.blindpay_receiver_id === 'string' &&
          client.blindpay_receiver_id.length > 0 &&
          client.blindpay_receiver_id.length === 36,
      )
      .map((client) => ({
        customerId: client.blindpay_receiver_id,
        userId: client.user_id,
        name: client.first_name + ' ' + client.last_name,
        email: userEmailMap.get(client.user_id) ?? '',
      }));
  }

  async getCustomersByMsbId(msb_id: string) {
    const baseUrl = providers.onlineBanking.url;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      accept: 'application/json',
    };
    const xApiKey =
      providers.onlineBanking.xApiKey;
    if (xApiKey) headers['x-api-key'] = xApiKey;

    // Fetch all clients under the specified MSB ID
    const clients = await this.clientRepository.find({
      where: { msb_id },
      select: [
        'blindpay_receiver_id',
        'client_type',
        'first_name',
        'last_name',
        'legal_name',
        'user_id',
      ],
    });

    // Extract blindpay_receiver_ids and prepare customer data with names
    const customerData = clients
      .filter(
        (client) =>
          client.blindpay_receiver_id &&
          typeof client.blindpay_receiver_id === 'string' &&
          client.blindpay_receiver_id.length > 0 &&
          client.blindpay_receiver_id.length === 36,
      )
      .map((client) => ({
        customerId: client.blindpay_receiver_id,
        name:
          client.client_type === 'individual'
            ? `${client.first_name || ''} ${client.last_name || ''}`.trim()
            : client.legal_name || '',
      }));

    const customerIds = customerData.map((customer) => customer.customerId);

    // If no customer IDs, return empty array
    if (customerIds.length === 0) {
      return { virtual_accounts: [] };
    }

    // Fetch virtual accounts for each customer using Promise.all
    const virtualAccountPromises = customerData.map(async (customer) => {
      const api_url = `${baseUrl}/customers/${customer.customerId}/virtual_accounts`;
      try {
        const response = await this.fetchJsonWithRetry(
          api_url,
          { method: 'GET', headers },
          2,
          this.getRequestTimeoutMs(),
        );
        // Add customer name to each virtual account
        const virtualAccounts = response.data || [];
        return virtualAccounts.map((account: any) => ({
          ...account,
          customer_name: customer.name,
        }));
      } catch (e) {
        // Log error but don't fail the entire operation for individual customer failures
        console.warn(
          `Failed to fetch virtual accounts for customer ${customer.customerId}:`,
          e,
        );
        return [];
      }
    });

    // Wait for all requests to complete
    const virtualAccountResults = await Promise.all(virtualAccountPromises);

    // Flatten the results into a single array
    const allVirtualAccounts = virtualAccountResults.flat();

    return { virtual_accounts: allVirtualAccounts };
  }

  async getAllTransactionsByMsbId(msb_id: string) {
    const baseUrl = providers.onlineBanking.url;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      accept: 'application/json',
    };
    const xApiKey =
      providers.onlineBanking.xApiKey;
    if (xApiKey) headers['x-api-key'] = xApiKey;

    // Fetch all clients under the specified MSB ID
    const clients = await this.clientRepository.find({
      where: { msb_id },
      select: ['blindpay_receiver_id'],
    });

    // Extract blindpay_receiver_ids and remove duplicates
    const customerIds = clients
      .map((client) => client.blindpay_receiver_id)
      .filter(
        (id): id is string =>
          typeof id === 'string' && id.length > 0 && id.length === 36,
      );

    // Remove duplicates using Set
    const uniqueCustomerIds = [...new Set(customerIds)];

    // If no customer IDs, return empty array
    if (uniqueCustomerIds.length === 0) {
      return {
        count: 0,
        transfers: [],
      };
    }

    // Fetch transfers for each customer using Promise.all
    const transferPromises = uniqueCustomerIds.map(async (customerId) => {
      const api_url = `${baseUrl}/customers/${customerId}/transfers?limit=100`;
      try {
        const response = await this.fetchJsonWithRetry(
          api_url,
          { method: 'GET', headers },
          2,
          this.getRequestTimeoutMs(),
        );
        return response.data || [];
      } catch (e) {
        // Log error but don't fail the entire operation for individual customer failures
        console.warn(
          `Failed to fetch transfers for customer ${customerId}:`,
          e,
        );
        return [];
      }
    });

    // Wait for all requests to complete
    const transferResults = await Promise.all(transferPromises);

    // Flatten the results into a single array
    const allTransfers = transferResults.flat();

    return {
      count: allTransfers.length,
      transfers: allTransfers,
    };
  }

  async getBusinessClients() {
    const clients = await this.clientRepository.find({
      where: {
        client_type: 'business',
        is_msb: false,
      },
      order: { created_at: 'DESC' },
    });
    return {
      clients,
      count: clients.length,
    };
  }

  async requestPasswordReset(requestResetPasswordDto: RequestResetPasswordDto) {
    const { email } = requestResetPasswordDto;

    // Check if email exists in the users table
    const user = await this.userRepository.findOne({
      where: { email, role: 'account_holder' },
    });

    if (!user) {
      throw new NotFoundException('Email not found');
    }

    // Create a new reset password record
    const resetPassword = this.resetPasswordRepository.create({
      email: email.toLowerCase(),
      used: false,
    });
    await this.resetPasswordRepository.save(resetPassword);

    // Generate reset link with token (using the id as token)
    const frontendUrl = process.env.FRONTEND_URL || brand.dashboardOrigin;
    const resetLink = `${frontendUrl}/reset-password?token=${resetPassword.id}`;

    // Send reset password email
    try {
      await this.emailService.sendResetPasswordEmail({
        email: email.toLowerCase(),
        resetLink,
      });
    } catch (emailError) {
      // Log email error but don't fail the request
      console.error('Failed to send reset password email:', emailError);
    }

    return {
      message: 'If the email exists, a password reset link has been sent',
      success: true,
    };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { token, newPassword } = resetPasswordDto;

    // Manual validation as backup
    if (!newPassword || newPassword.length < 6 || newPassword.length > 128) {
      throw new BadRequestException(
        'New password must be between 6 and 128 characters',
      );
    }

    // Find the reset password record
    const resetPassword = await this.resetPasswordRepository.findOne({
      where: { id: token },
    });

    if (!resetPassword) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    if (resetPassword.used) {
      throw new BadRequestException('This reset token has already been used');
    }

    // Find the user by email
    const user = await this.userRepository.findOne({
      where: { email: resetPassword.email, role: 'account_holder' },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // Update password and mark reset token as used
    user.password_hash = newPasswordHash;
    user.password_changed = true;
    user.updated_at = new Date();
    await this.userRepository.save(user);

    resetPassword.used = true;
    await this.resetPasswordRepository.save(resetPassword);

    return {
      message: 'Password reset successfully',
      success: true,
    };
  }
}

function toRfc3339(dateYmd: string): string {
  // expects "YYYY-MM-DD"
  return `${dateYmd}T00:00:00.000Z`; // RFC 3339 with UTC "Z"
}
