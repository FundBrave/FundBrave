import { Injectable, Logger, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createRemoteJWKSet, jwtVerify } from 'jose';

export interface PrivyTokenClaims {
  /** Privy DID, e.g. did:privy:cxxxx */
  did: string;
}

export interface PrivyUserProfile {
  did: string;
  email: string | null;
  /** Address of the Privy embedded EVM wallet (not external linked wallets). */
  embeddedWalletAddress: string | null;
  googleSubject: string | null;
}

interface PrivyLinkedAccount {
  type: string;
  address?: string;
  email?: string;
  subject?: string;
  chain_type?: string;
  wallet_client_type?: string;
  connector_type?: string;
}

/**
 * Verifies Privy access tokens (ES256 JWTs) and fetches user profiles
 * from the Privy REST API. The API never sees private keys — Privy
 * embedded wallets are user-controlled by design.
 */
@Injectable()
export class PrivyService {
  private readonly logger = new Logger(PrivyService.name);
  private readonly appId: string;
  private readonly appSecret: string;
  private jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

  constructor(config: ConfigService) {
    this.appId = config.get<string>('privy.appId') ?? '';
    this.appSecret = config.get<string>('privy.appSecret') ?? '';
  }

  get isConfigured(): boolean {
    return Boolean(this.appId && this.appSecret && !this.appId.startsWith('your-'));
  }

  private assertConfigured(): void {
    if (!this.isConfigured) {
      throw new ServiceUnavailableException(
        'Privy is not configured. Set PRIVY_APP_ID and PRIVY_APP_SECRET in packages/api/.env',
      );
    }
  }

  private getJwks() {
    if (!this.jwks) {
      this.jwks = createRemoteJWKSet(
        new URL(`https://auth.privy.io/api/v1/apps/${this.appId}/jwks.json`),
      );
    }
    return this.jwks;
  }

  /** Verify a Privy access token and return its claims. */
  async verifyAccessToken(token: string): Promise<PrivyTokenClaims> {
    this.assertConfigured();
    try {
      const { payload } = await jwtVerify(token, this.getJwks(), {
        issuer: 'privy.io',
        audience: this.appId,
      });
      if (!payload.sub) throw new Error('missing sub');
      return { did: payload.sub };
    } catch (err) {
      this.logger.debug(`Token verification failed: ${(err as Error).message}`);
      throw new UnauthorizedException('Invalid or expired access token');
    }
  }

  /** Fetch the authoritative user profile from Privy (server-to-server). */
  async getUser(did: string): Promise<PrivyUserProfile> {
    this.assertConfigured();
    const res = await fetch(`https://auth.privy.io/api/v1/users/${did}`, {
      headers: {
        Authorization: `Basic ${Buffer.from(`${this.appId}:${this.appSecret}`).toString('base64')}`,
        'privy-app-id': this.appId,
      },
    });
    if (!res.ok) {
      this.logger.error(`Privy user fetch failed: ${res.status} ${await res.text()}`);
      throw new ServiceUnavailableException('Could not fetch user from Privy');
    }
    const body = (await res.json()) as { id: string; linked_accounts?: PrivyLinkedAccount[] };
    const accounts = body.linked_accounts ?? [];

    const email =
      accounts.find((a) => a.type === 'email')?.address ??
      accounts.find((a) => a.type === 'google_oauth')?.email ??
      null;

    const embedded = accounts.find(
      (a) =>
        a.type === 'wallet' &&
        a.chain_type === 'ethereum' &&
        (a.wallet_client_type === 'privy' || a.connector_type === 'embedded'),
    );

    return {
      did: body.id,
      email: email?.toLowerCase() ?? null,
      embeddedWalletAddress: embedded?.address ?? null,
      googleSubject: accounts.find((a) => a.type === 'google_oauth')?.subject ?? null,
    };
  }
}
