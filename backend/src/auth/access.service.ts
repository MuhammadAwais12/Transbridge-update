import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, Msb } from '../msb-admin/msb-admin.entity';
import { ClientProfile } from '../client/client.entity';

export type CallerRole = 'account_holder' | 'msb_admin';

/** The authenticated caller, resolved from the JWT `sub` against the database. */
export interface Caller {
  userId: string;
  role: CallerRole;
  /** MSB the user belongs to (admin's MSB, or the client's MSB). */
  msbId: string | null;
  /** clients.id for account holders, null for MSB admins. */
  clientId: string | null;
  /** clients.blindpay_receiver_id for account holders (provider customer ref). */
  customerRef: string | null;
}

/** Shape set on req.user by the passport JWT strategies. */
export interface JwtUser {
  userId: string;
  email?: string;
  role?: string;
  tokenVersion: number;
  authTime?: number;
}

/**
 * Central ownership rules:
 * - an account_holder may only access their own client records;
 * - an msb_admin may only access clients (and MSB data) whose msb_id matches theirs.
 * Missing record -> 404, mismatch -> 403.
 * Identity always comes from the database row for the JWT `sub`, never from
 * request params or body.
 */
@Injectable()
export class AccessService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(ClientProfile)
    private readonly clientRepository: Repository<ClientProfile>,
    @InjectRepository(Msb)
    private readonly msbRepository: Repository<Msb>,
  ) {}

  async resolveCaller(jwtUser: JwtUser | undefined): Promise<Caller> {
    if (!jwtUser?.userId) throw new UnauthorizedException();
    const user = await this.userRepository.findOne({
      where: { id: jwtUser.userId },
      select: ['id', 'role', 'msb_id', 'is_active', 'token_version'],
    });
    if (!user || !user.is_active) throw new UnauthorizedException();
    if (jwtUser.tokenVersion !== user.token_version) {
      throw new UnauthorizedException();
    }
    if (user.role !== 'account_holder' && user.role !== 'msb_admin') {
      throw new ForbiddenException('Unsupported role');
    }

    let clientId: string | null = null;
    let customerRef: string | null = null;
    if (user.role === 'account_holder') {
      const client = await this.clientRepository.findOne({
        where: { user_id: user.id },
        select: ['id', 'blindpay_receiver_id'],
      });
      clientId = client?.id ?? null;
      customerRef = client?.blindpay_receiver_id ?? null;
    }

    return {
      userId: user.id,
      role: user.role,
      msbId: user.msb_id ?? null,
      clientId,
      customerRef,
    };
  }

  isMsbAdmin(caller: Caller): boolean {
    return caller.role === 'msb_admin';
  }

  requireMsbAdmin(caller: Caller): void {
    if (!this.isMsbAdmin(caller)) {
      throw new ForbiddenException('MSB administrator access required');
    }
  }

  /**
   * MSB-scoped access. By default only that MSB's admins pass;
   * `allowClients` also lets the MSB's own account holders through (read-only metadata).
   */
  assertMsb(
    caller: Caller,
    msbId: string | undefined | null,
    opts: { allowClients?: boolean } = {},
  ): void {
    if (!this.isMsbAdmin(caller) && !opts.allowClients) {
      throw new ForbiddenException('MSB administrator access required');
    }
    if (!msbId || !caller.msbId || caller.msbId !== msbId) {
      throw new ForbiddenException('Access to this MSB is not allowed');
    }
  }

  /** clients.id based access. Returns the client row. */
  async assertClient(
    caller: Caller,
    clientId: string | undefined | null,
  ): Promise<ClientProfile> {
    if (!clientId) throw new NotFoundException('Client not found');
    const client = await this.clientRepository.findOne({
      where: { id: clientId },
    });
    if (!client) throw new NotFoundException('Client not found');
    this.assertClientRow(caller, client);
    return client;
  }

  /** Same rule as assertClient for a client row that is already loaded. */
  assertClientRow(caller: Caller, client: ClientProfile): void {
    const allowed = this.isMsbAdmin(caller)
      ? !!caller.msbId && client.msb_id === caller.msbId
      : client.user_id === caller.userId;
    if (!allowed) {
      throw new ForbiddenException('Access to this client is not allowed');
    }
  }

  /** users.id based access (e.g. Bridge user_transfers / user_beneficiaries). */
  async assertUser(
    caller: Caller,
    userId: string | undefined | null,
  ): Promise<User> {
    if (!userId) throw new NotFoundException('User not found');
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'role', 'msb_id'],
    });
    if (!user) throw new NotFoundException('User not found');
    const allowed = this.isMsbAdmin(caller)
      ? !!caller.msbId && user.msb_id === caller.msbId
      : user.id === caller.userId;
    if (!allowed) {
      throw new ForbiddenException('Access to this user is not allowed');
    }
    return user;
  }

  /**
   * Provider customer / receiver ref (clients.blindpay_receiver_id or msbs.customer_id).
   * Note: business clients share their MSB's customer ref, so a client-level check
   * cannot distinguish between business clients of the same MSB.
   */
  async assertCustomerRef(
    caller: Caller,
    customerRef: string | undefined | null,
  ): Promise<void> {
    if (!customerRef) throw new NotFoundException('Customer not found');

    if (!this.isMsbAdmin(caller)) {
      if (caller.customerRef && caller.customerRef === customerRef) return;
      const exists = await this.clientRepository.exists({
        where: { blindpay_receiver_id: customerRef },
      });
      if (!exists) throw new NotFoundException('Customer not found');
      throw new ForbiddenException('Access to this customer is not allowed');
    }

    const msb = await this.msbRepository.findOne({
      where: { customer_id: customerRef },
      select: ['id'],
    });
    if (msb && msb.id === caller.msbId) return;
    const clients = await this.clientRepository.find({
      where: { blindpay_receiver_id: customerRef },
      select: ['id', 'msb_id'],
    });
    if (!msb && clients.length === 0) {
      throw new NotFoundException('Customer not found');
    }
    if (caller.msbId && clients.some((c) => c.msb_id === caller.msbId)) return;
    throw new ForbiddenException('Access to this customer is not allowed');
  }
}
