import { PlanType, UserProfile } from '@blinkshare/shared';
import { Env } from '../types/env';
import { UserRepository } from '../repositories/userRepository';
import { generateSecureId, hashPassword, verifyPassword } from '../lib/crypto';
import { getCurrentTimestamp } from '../lib/clock';

export interface AuthSession {
  userId: string;
  email: string;
  plan: PlanType;
  exp: number;
}

export class AuthService {
  private userRepo: UserRepository;

  constructor(private env: Env) {
    this.userRepo = new UserRepository(env.DB);
  }

  private async getHmacKey(secret: string): Promise<CryptoKey> {
    const enc = new TextEncoder();
    return await crypto.subtle.importKey(
      'raw',
      enc.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign', 'verify']
    );
  }

  async createSessionToken(session: AuthSession): Promise<string> {
    const secret = this.env.SESSION_SECRET || 'blinkshare-default-session-secret-32chars!';
    const payload = JSON.stringify(session);
    const encodedPayload = btoa(payload).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

    const key = await this.getHmacKey(secret);
    const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(encodedPayload));
    const encodedSig = btoa(String.fromCharCode(...new Uint8Array(signature)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    return `${encodedPayload}.${encodedSig}`;
  }

  async verifySessionToken(token: string): Promise<AuthSession | null> {
    try {
      const [encodedPayload, encodedSig] = token.split('.');
      if (!encodedPayload || !encodedSig) return null;

      const secret = this.env.SESSION_SECRET || 'blinkshare-default-session-secret-32chars!';
      const key = await this.getHmacKey(secret);

      // Decode signature
      const rawSigStr = atob(encodedSig.replace(/-/g, '+').replace(/_/g, '/'));
      const sigBytes = new Uint8Array(rawSigStr.length);
      for (let i = 0; i < rawSigStr.length; i++) {
        sigBytes[i] = rawSigStr.charCodeAt(i);
      }

      const valid = await crypto.subtle.verify(
        'HMAC',
        key,
        sigBytes,
        new TextEncoder().encode(encodedPayload)
      );

      if (!valid) return null;

      const payloadStr = atob(encodedPayload.replace(/-/g, '+').replace(/_/g, '/'));
      const session = JSON.parse(payloadStr) as AuthSession;

      const now = getCurrentTimestamp(this.env);
      if (session.exp && now >= session.exp) {
        return null; // Expired
      }

      return session;
    } catch {
      return null;
    }
  }

  async register(email: string, passwordPlain: string): Promise<{ token: string; user: UserProfile }> {
    const existing = await this.userRepo.findByEmail(email);
    if (existing) {
      const err = new Error('An account with this email already exists');
      (err as any).status = 409;
      throw err;
    }

    const userId = generateSecureId(16);
    const passwordHash = await hashPassword(passwordPlain);
    const now = getCurrentTimestamp(this.env);

    const user = await this.userRepo.createUser(userId, email, passwordHash, now);

    const session: AuthSession = {
      userId: user.id,
      email: user.email,
      plan: user.plan,
      exp: now + 86400 * 30, // 30 days
    };

    const token = await this.createSessionToken(session);

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        plan: user.plan,
        createdAt: user.created_at,
        sharesCreatedToday: 0,
        dailyQuotaRemaining: 10,
      },
    };
  }

  async login(email: string, passwordPlain: string): Promise<{ token: string; user: UserProfile }> {
    const user = await this.userRepo.findByEmail(email);
    if (!user) {
      const err = new Error('Invalid email or password');
      (err as any).status = 401;
      throw err;
    }

    const valid = await verifyPassword(passwordPlain, user.password_hash);
    if (!valid) {
      const err = new Error('Invalid email or password');
      (err as any).status = 401;
      throw err;
    }

    const now = getCurrentTimestamp(this.env);
    const session: AuthSession = {
      userId: user.id,
      email: user.email,
      plan: user.plan,
      exp: now + 86400 * 30,
    };

    const token = await this.createSessionToken(session);

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        plan: user.plan,
        createdAt: user.created_at,
        sharesCreatedToday: 0,
        dailyQuotaRemaining: user.plan === 'pro' ? 500 : user.plan === 'plus' ? 100 : 10,
      },
    };
  }

  async getProfile(userId: string): Promise<UserProfile | null> {
    const user = await this.userRepo.findById(userId);
    if (!user) return null;

    return {
      id: user.id,
      email: user.email,
      plan: user.plan,
      createdAt: user.created_at,
      sharesCreatedToday: 0,
      dailyQuotaRemaining: user.plan === 'pro' ? 500 : user.plan === 'plus' ? 100 : 10,
    };
  }
}
