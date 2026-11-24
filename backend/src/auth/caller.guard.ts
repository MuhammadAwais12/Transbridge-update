import {
  applyDecorators,
  CanActivate,
  createParamDecorator,
  ExecutionContext,
  Injectable,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from './jwt-auth.guard';
import { AccessService, Caller, JwtUser } from './access.service';

type RequestWithCaller = { user?: JwtUser; caller?: Caller };

/** Runs after JwtAuthGuard: resolves req.user into a DB-backed Caller on req.caller. */
@Injectable()
export class CallerGuard implements CanActivate {
  constructor(private readonly access: AccessService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<RequestWithCaller>();
    req.caller = await this.access.resolveCaller(req.user);
    return true;
  }
}

/** JWT required (401 without a valid token) + caller resolved for ownership checks. */
export const Authenticated = () =>
  applyDecorators(UseGuards(JwtAuthGuard, CallerGuard), ApiBearerAuth());

/** Injects the resolved Caller. Only valid on routes using @Authenticated(). */
export const CurrentCaller = createParamDecorator(
  (_data: unknown, context: ExecutionContext): Caller => {
    const req = context.switchToHttp().getRequest<RequestWithCaller>();
    return req.caller as Caller;
  },
);
