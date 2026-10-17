import { PlanType } from '@blinkshare/shared';

export interface UserRecord {
  id: string;
  email: string;
  password_hash: string;
  plan: PlanType;
  created_at: number;
}

export interface SubscriptionRecord {
  id: string;
  user_id: string;
  provider: string;
  subscription_id: string;
  plan: PlanType;
  status: string;
  current_period_end: number;
  created_at: number;
  updated_at: number;
}

export class UserRepository {
  constructor(private db: D1Database) {}

  async createUser(id: string, email: string, passwordHash: string, now: number): Promise<UserRecord> {
    const query = `
      INSERT INTO users (id, email, password_hash, plan, created_at)
      VALUES (?, ?, ?, 'free', ?)
    `;
    await this.db.prepare(query).bind(id, email.toLowerCase(), passwordHash, now).run();
    return {
      id,
      email: email.toLowerCase(),
      password_hash: passwordHash,
      plan: 'free',
      created_at: now,
    };
  }

  async findByEmail(email: string): Promise<UserRecord | null> {
    return await this.db
      .prepare(`SELECT * FROM users WHERE email = ? LIMIT 1`)
      .bind(email.toLowerCase())
      .first<UserRecord>();
  }

  async findById(id: string): Promise<UserRecord | null> {
    return await this.db
      .prepare(`SELECT * FROM users WHERE id = ? LIMIT 1`)
      .bind(id)
      .first<UserRecord>();
  }

  async updateUserPlan(userId: string, plan: PlanType): Promise<void> {
    await this.db
      .prepare(`UPDATE users SET plan = ? WHERE id = ?`)
      .bind(plan, userId)
      .run();
  }

  async createOrUpdateSubscription(sub: SubscriptionRecord): Promise<void> {
    const query = `
      INSERT INTO subscriptions (id, user_id, provider, subscription_id, plan, status, current_period_end, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        status = excluded.status,
        plan = excluded.plan,
        current_period_end = excluded.current_period_end,
        updated_at = excluded.updated_at
    `;
    await this.db.prepare(query).bind(
      sub.id,
      sub.user_id,
      sub.provider,
      sub.subscription_id,
      sub.plan,
      sub.status,
      sub.current_period_end,
      sub.created_at,
      sub.updated_at
    ).run();
  }

  async getSubscriptionByUserId(userId: string): Promise<SubscriptionRecord | null> {
    return await this.db
      .prepare(`SELECT * FROM subscriptions WHERE user_id = ? ORDER BY created_at DESC LIMIT 1`)
      .bind(userId)
      .first<SubscriptionRecord>();
  }
}
