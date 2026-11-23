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
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MsbAdminService } from './msb-admin.service';
import { CreateMsbAdminDto } from './dto/create-msb-admin.dto';
import { LoginMsbAdminDto } from './dto/login-msb-admin.dto';
import { UpdateBrandingDto } from './dto/update-branding.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiConsumes } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Enable2faDto } from './dto/enable-2fa.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Msb, User } from './msb-admin.entity';

@ApiTags('MSB Admin')
@Controller('msb-admin')
export class MsbAdminController {
  constructor(
    private readonly msbAdminService: MsbAdminService,
    @InjectRepository(Msb)
    private readonly msbRepository: Repository<Msb>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

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
  async register(@Body() createMsbAdminDto: CreateMsbAdminDto) {
    return this.msbAdminService.register(createMsbAdminDto);
  }

  @Post('login')
  @UseGuards(ThrottlerGuard)
  @Throttle({ otp: { limit: 6, ttl: 3 * 60 * 1000 } })
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

  @Get('list')
  @ApiOperation({ summary: 'Get all MSB accounts' })
  async list() {
    const msbs = await this.msbRepository.find();
    return { msbs };
  }

  @Get('users')
  @ApiOperation({ summary: 'Get all users' })
  async getAllUsers() {
    const users = await this.userRepository.find();
    return { users };
  }

  @Get('admins')
  @ApiOperation({ summary: 'Get all MSB admins' })
  @ApiResponse({ status: 200, description: 'List of MSB admins' })
  async getAllAdmins() {
    return this.msbAdminService.getAllAdmins();
  }

  @Get('activities')
  @ApiOperation({ summary: 'Get all activity logs' })
  @ApiResponse({
    status: 200,
    description: 'List of all activities',
  })
  async getAllActivities() {
    return this.msbAdminService.getAllActivities();
  }

  @Get(':msbId')
  @ApiOperation({ summary: 'Get MSB by ID' })
  @ApiResponse({ status: 200, description: 'MSB found' })
  @ApiResponse({ status: 404, description: 'MSB not found' })
  async getMsbById(@Param('msbId') msbId: string) {
    const msb = await this.msbRepository.findOne({ where: { id: msbId } });
    if (!msb) {
      return { statusCode: 404, message: 'MSB not found' };
    }
    return { msb };
  }

  @Patch('branding/:msbId')
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
    @UploadedFile() logo?: Express.Multer.File,
  ) {
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
  @ApiOperation({ summary: 'Delete an MSB admin' })
  @ApiResponse({ status: 200, description: 'MSB admin deleted successfully' })
  @ApiResponse({ status: 404, description: 'MSB admin not found' })
  async deleteAdmin(@Param('adminId') adminId: string) {
    return this.msbAdminService.deleteAdmin(adminId);
  }
}
