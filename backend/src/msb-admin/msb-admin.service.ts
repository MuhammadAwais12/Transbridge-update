import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as speakeasy from 'speakeasy';
import * as crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { JwtService } from '@nestjs/jwt';
import { User, Msb, Activity } from './msb-admin.entity';
import { CreateMsbAdminDto } from './dto/create-msb-admin.dto';
import { LoginMsbAdminDto } from './dto/login-msb-admin.dto';
import { UpdateBrandingDto } from './dto/update-branding.dto';
import { EmailService } from '../email/email.service';
import { brand } from '../config/brand.config';
import { UploadService } from '../upload/upload.service';

// bcrypt has proper type definitions; use direct calls and suppress strict unsafe-call/member-access for these lines only

@Injectable()
export class MsbAdminService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Msb)
    private readonly msbRepository: Repository<Msb>,
    @InjectRepository(Activity)
    private readonly activityRepository: Repository<Activity>,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
    private readonly uploadService: UploadService,
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

  async register(
    createMsbAdminDto: CreateMsbAdminDto & {
      msbName?: string;
      msbDomain?: string;
    },
  ) {
    const { email, password, name, msbName, msbDomain } = createMsbAdminDto;
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
    if (!name || name.length > 100) {
      throw new BadRequestException(
        'Name must not be longer than 100 characters',
      );
    }
    if (msbName && msbName.length > 100) {
      throw new BadRequestException(
        'MSB name must not be longer than 100 characters',
      );
    }
    if (msbDomain && msbDomain.length > 255) {
      throw new BadRequestException(
        'MSB domain must not be longer than 255 characters',
      );
    }

    const existing = await this.userRepository.findOne({
      where: { email, role: 'msb_admin' },
    });
    if (existing) {
      throw new BadRequestException('MSB admin with this email already exists');
    }
    let msb: Msb | undefined;
    if (msbDomain) {
      msb =
        (await this.msbRepository.findOne({
          where: { domain: msbDomain },
        })) || undefined;
      if (msb) {
        throw new BadRequestException('MSB with this domain already exists');
      }
      msb = this.msbRepository.create({ name: msbName, domain: msbDomain });
      await this.msbRepository.save(msb);
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    const password_hash = (await bcrypt.hash(password, 10)) as string;
    const user = this.userRepository.create({
      email,
      name,
      role: 'msb_admin',
      is_active: true,
      password_hash,
      msb_id: msb ? msb.id : undefined,
    });
    await this.userRepository.save(user);
    // Send welcome email to the newly created MSB admin (non-blocking for registration)
    const loginUrl = brand.dashboardLoginUrl;
    try {
      const emailResult = await this.emailService.sendWelcomeEmail({
        fullName: name,
        email,
        accountId: user.id,
        loginUrl,
      });
      if (!emailResult.success) {
        console.warn('Welcome email failed to send:', emailResult.error);
      }
    } catch {
      console.warn('Unexpected error sending welcome email');
    }
    const payload = { sub: user.id, email: user.email, role: user.role };
    const token = this.jwtService.sign(payload);
    return {
      message: 'MSB admin registered successfully',
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
      msb: msb ? { id: msb.id, name: msb.name, domain: msb.domain } : undefined,
    };
  }

  async login(loginMsbAdminDto: LoginMsbAdminDto) {
    const { email, password, otp } = loginMsbAdminDto;

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
      where: { email, role: 'msb_admin', is_active: true },
    });
    if (!user || !user.password_hash) {
      throw new UnauthorizedException('Invalid credentials');
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    const isMatch = (await bcrypt.compare(
      password,
      user.password_hash,
    )) as boolean;
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
        const backupCodes = Array.isArray(user.twofa_backup_codes)
          ? [...user.twofa_backup_codes]
          : [];
        let matchedIndex = -1;
        for (let i = 0; i < backupCodes.length; i++) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
          const match = (await bcrypt.compare(candidate, backupCodes[i])) as boolean;
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
    
    // Log login activity
    const activity = this.activityRepository.create({
      id: uuidv4(),
      user_id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      msb_id: user.msb_id,
      activity: 'login',
    });
    await this.activityRepository.save(activity);
    
    const payload = { sub: user.id, email: user.email, role: user.role };
    const token = this.jwtService.sign(payload);
    return {
      message: 'Login successful',
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
    };
  }

  async logout(userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Log logout activity
    const activity = this.activityRepository.create({
      id: uuidv4(),
      user_id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      msb_id: user.msb_id,
      activity: 'logout',
    });
    await this.activityRepository.save(activity);

    return {
      message: 'Logout successful',
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
        const match = (await bcrypt.compare(candidate, backupCodes[i])) as boolean;
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

  async updateBranding(
    msbId: string,
    dto: UpdateBrandingDto,
    logoFile?: Express.Multer.File,
  ) {
    const msb = await this.msbRepository.findOne({ where: { id: msbId } });
    if (!msb) {
      throw new BadRequestException('MSB not found');
    }
    if (dto.primary_color !== undefined) {
      msb.primary_color = dto.primary_color;
    }
    if (dto.secondary_color !== undefined) {
      msb.secondary_color = dto.secondary_color;
    }
    if (dto.accent_color !== undefined) {
      msb.accent_color = dto.accent_color;
    }
    if (dto.theme !== undefined) {
      msb.theme = dto.theme;
    }
    if (logoFile) {
      // Upload file to S3 and save the S3 URL (no base64 conversion)
      const logoUrl = await this.uploadService.uploadFile(logoFile, 'logos');
      msb.logo_url = logoUrl;
    } else if (dto.logo_url !== undefined && dto.logo_url.trim() !== '') {
      // Check if logo_url is a base64 string
      if (dto.logo_url.startsWith('data:image/')) {
        // Upload base64 to S3 and save the S3 URL (never save base64 directly)
        const logoUrl = await this.uploadService.uploadBase64(dto.logo_url, 'logos');
        msb.logo_url = logoUrl;
      } else if (dto.logo_url.startsWith('http://') || dto.logo_url.startsWith('https://')) {
        // It's already a valid URL (e.g., S3 URL), use it directly
        msb.logo_url = dto.logo_url;
      } else {
        throw new BadRequestException('logo_url must be a valid HTTP/HTTPS URL or base64 image string');
      }
    } else if (dto.logo_url === '') {
      // Allow empty string to clear the logo
      msb.logo_url = null as any;
    }
    if (dto.name !== undefined) {
      msb.name = dto.name;
    }
    msb.updated_at = new Date();
    await this.msbRepository.save(msb);
    return { message: 'Branding updated successfully', msb };
  }

  async getAllAdmins() {
    const admins = await this.userRepository.find({
      where: { role: 'msb_admin' },
      order: { created_at: 'DESC' },
    });
    return {
      admins: admins.map((admin) => ({
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
        msb_id: admin.msb_id,
        is_active: admin.is_active,
        created_at: admin.created_at,
        last_login: admin.last_login,
        twofa_enabled: admin.twofa_enabled,
      })),
      count: admins.length,
    };
  }

  async deleteAdmin(adminId: string) {
    const admin = await this.userRepository.findOne({
      where: { id: adminId, role: 'msb_admin' },
    });
    if (!admin) {
      throw new NotFoundException('MSB admin not found');
    }
    await this.userRepository.remove(admin);
    return { message: 'MSB admin deleted successfully' };
  }

  async getAllActivities() {
    const activities = await this.activityRepository.find({
      order: { date: 'DESC' },
    });
    return {
      activities,
      count: activities.length,
    };
  }
}
