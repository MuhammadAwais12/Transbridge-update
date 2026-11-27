import { timingSafeEqual } from 'crypto';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Throttle } from '@nestjs/throttler';
import type { Request as ExpressRequest } from 'express';
import {
  Controller,
  Post,
  Body,
  Get,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  UnauthorizedException,
  NotFoundException,
  UseInterceptors,
  UploadedFile,
  ForbiddenException,
  Headers,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MsbAdminService } from './msb-admin.service';
import { CreateMsbAdminDto } from './dto/create-msb-admin.dto';
import { LoginMsbAdminDto } from './dto/login-msb-admin.dto';
import { UpdateBrandingDto } from './dto/update-branding.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiConsumes,
  ApiHeader,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Enable2faDto } from './dto/enable-2fa.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Msb, User } from './msb-admin.entity';
import { AccessService, Caller } from '../auth/access.service';
import { Authenticated, CurrentCaller } from '../auth/caller.guard';

@ApiTags('MSB Admin')
@Controller('msb-admin')
export class MsbAdminController {
  constructor(
    private readonly msbAdminService: MsbAdminService,
    @InjectRepository(Msb)
    private readonly msbRepository: Repository<Msb>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly access: AccessService,
  ) {}

  /** 404 if the MSB does not exist, 403 if it is not the caller's. */
  private async loadOwnMsb(
    caller: Caller,
    msbId: string,
    opts: { allowClients?: boolean } = {},
  ): Promise<Msb> {
    const msb = await this.msbRepository.findOne({ where: { id: msbId } });
    if (!msb) throw new NotFoundException('MSB not found');
    this.access.assertMsb(caller, msb.id, opts);
    return msb;
  }

  @Post('register')
  @ApiOperation({
    summary: 'Register a new MSB admin and optionally a new MSB',
  })
  @ApiBody({ type: CreateMsbAdminDto })
  @ApiResponse({
    status: 201,
    description: 'MSB admin registered successfully',
  })
  @ApiResponse({ status: 400, description: 'Validation or duplicate error' })
  @ApiResponse({
    status: 403,
    description: 'Missing or invalid registration key',
  })
  @ApiHeader({
    name: 'x-registration-key',
    description: 'Must match the REGISTRATION_KEY environment variable',
    required: true,
  })
  async register(
    @Body() createMsbAdminDto: CreateMsbAdminDto,
    @Headers('x-registration-key') registrationKey?: string,
  ) {
    const expected = process.env.REGISTRATION_KEY;
    if (!expected)
      throw new ForbiddenException('Admin registration is disabled');
    const a = Buffer.from(registrationKey ?? '');
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      throw new ForbiddenException('Invalid registration key');
    }
    return this.msbAdminService.register(createMsbAdminDto);
  }

  @Post('login')
  @UseGuards(ThrottlerGuard)
  @Throttle({
    otp: { limit: 6, ttl: 3 * 60 * 1000 },
    ip: { limit: 30, ttl: 3 * 60 * 1000 },
  })
  @ApiOperation({ summary: 'Login as an MSB admin' })
  @ApiBody({ type: LoginMsbAdminDto })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginMsbAdminDto: LoginMsbAdminDto) {
    return this.msbAdminService.login(loginMsbAdminDto);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Logout as an MSB admin' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async logout(
    @Request() req: ExpressRequest & { user?: { userId?: string } },
  ) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('User not authenticated');
    }
    return this.msbAdminService.logout(userId);
  }

  @Post('refresh-token')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Exchange a valid access token for a fresh one' })
  @ApiResponse({ status: 401, description: 'Unauthorized or session too old' })
  async refreshToken(
    @Request() req: ExpressRequest & {
      user?: { userId?: string; authTime?: number; tokenVersion?: number };
    },
  ) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('User not authenticated');
    }
    return this.msbAdminService.refreshToken(
      userId,
      req.user?.authTime,
      req.user?.tokenVersion,
    );
  }

  // No super-admin role exists, so the listings below are scoped to the caller's own MSB.
  @Get('list')
  @Authenticated()
  @ApiOperation({ summary: "Get the caller's MSB account" })
  async list(@CurrentCaller() caller: Caller) {
    this.access.assertMsb(caller, caller.msbId);
    const msbs = await this.msbRepository.find({
      where: { id: caller.msbId as string },
    });
    return { msbs };
  }

  @Get('users')
  @Authenticated()
  @ApiOperation({ summary: "Get all users of the caller's MSB" })
  async getAllUsers(@CurrentCaller() caller: Caller) {
    this.access.assertMsb(caller, caller.msbId);
    // Never return password_hash / twofa_secret / twofa_backup_codes
    const users = await this.userRepository.find({
      where: { msb_id: caller.msbId as string },
      select: [
        'id',
        'msb_id',
        'email',
        'name',
        'role',
        'is_active',
        'last_login',
        'twofa_enabled',
        'created_at',
        'updated_at',
      ],
    });
    return { users };
  }

  @Get('admins')
  @Authenticated()
  @ApiOperation({ summary: "Get the MSB admins of the caller's MSB" })
  @ApiResponse({ status: 200, description: 'List of MSB admins' })
  async getAllAdmins(@CurrentCaller() caller: Caller) {
    this.access.assertMsb(caller, caller.msbId);
    const { admins } = await this.msbAdminService.getAllAdmins();
    const own = admins.filter((a) => a.msb_id === caller.msbId);
    return { admins: own, count: own.length };
  }

  @Get('activities')
  @Authenticated()
  @ApiOperation({ summary: "Get activity logs of the caller's MSB" })
  @ApiResponse({
    status: 200,
    description: 'List of activities',
  })
  async getAllActivities(@CurrentCaller() caller: Caller) {
    this.access.assertMsb(caller, caller.msbId);
    const { activities } = await this.msbAdminService.getAllActivities();
    const own = activities.filter((a) => a.msb_id === caller.msbId);
    return { activities: own, count: own.length };
  }

  @Get(':msbId')
  @Authenticated()
  @ApiOperation({ summary: 'Get MSB by ID (own MSB; clients may read their MSB)' })
  @ApiResponse({ status: 200, description: 'MSB found' })
  @ApiResponse({ status: 404, description: 'MSB not found' })
  async getMsbById(
    @Param('msbId') msbId: string,
    @CurrentCaller() caller: Caller,
  ) {
    const msb = await this.loadOwnMsb(caller, msbId, { allowClients: true });
    return { msb };
  }

  @Patch('branding/:msbId')
  @Authenticated()
  @UseInterceptors(
    FileInterceptor('logo', {
      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB for file uploads
        fieldSize: 100 * 1024 * 1024, // 100MB for form fields (to handle base64 in logo_url)
      },
    }),
  )
  @ApiOperation({ summary: 'Update branding for an MSB' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          example: 'FinTech Solutions Ltd',
        },
        primary_color: {
          type: 'string',
          example: '#3b82f6',
        },
        secondary_color: {
          type: 'string',
          example: '#22c55e',
        },
        accent_color: {
          type: 'string',
          example: '#f97316',
        },
        theme: {
          type: 'string',
          enum: ['light', 'dark'],
          example: 'light',
        },
        logo: {
          type: 'string',
          format: 'binary',
          description: 'Logo image file',
        },
        logo_url: {
          type: 'string',
          description: 'Logo URL (alternative to file upload)',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Branding updated successfully' })
  async updateBranding(
    @Param('msbId') msbId: string,
    @Body() dto: UpdateBrandingDto,
    @CurrentCaller() caller: Caller,
    @UploadedFile() logo?: Express.Multer.File,
  ) {
    await this.loadOwnMsb(caller, msbId);
    return this.msbAdminService.updateBranding(msbId, dto, logo);
  }

  @Post('2fa/setup')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Generate 2FA secret and otpauth URL (admin)' })
  async twofaSetup(
    @Request() req: ExpressRequest & { user?: { userId?: string } },
  ) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('User not authenticated');
    }
    return this.msbAdminService.twofaSetup(userId);
  }

  @Post('2fa/enable')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Enable 2FA after verifying OTP (admin)' })
  @ApiBody({ type: Enable2faDto })
  async twofaEnable(
    @Body() body: Enable2faDto,
    @Request() req: ExpressRequest & { user?: { userId?: string } },
  ) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('User not authenticated');
    }
    return this.msbAdminService.twofaEnable(userId, body.otp);
  }

  @Post('2fa/disable')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Disable 2FA (verify OTP) (admin)' })
  @ApiBody({ type: Enable2faDto })
  async twofaDisable(
    @Body() body: Enable2faDto,
    @Request() req: ExpressRequest & { user?: { userId?: string } },
  ) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('User not authenticated');
    }
    return this.msbAdminService.twofaDisable(userId, body.otp);
  }

  @Get('2fa/status')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get 2FA enablement status (admin)' })
  async twofaStatus(
    @Request() req: ExpressRequest & { user?: { userId?: string } },
  ) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('User not authenticated');
    }
    return this.msbAdminService.twofaStatus(userId);
  }

  @Delete('admins/:adminId')
  @Authenticated()
  @ApiOperation({ summary: 'Delete an MSB admin of your own MSB' })
  @ApiResponse({ status: 200, description: 'MSB admin deleted successfully' })
  @ApiResponse({ status: 404, description: 'MSB admin not found' })
  async deleteAdmin(
    @Param('adminId') adminId: string,
    @CurrentCaller() caller: Caller,
  ) {
    this.access.requireMsbAdmin(caller);
    await this.access.assertUser(caller, adminId); // 404 if missing, 403 if another MSB
    return this.msbAdminService.deleteAdmin(adminId);
  }
}
