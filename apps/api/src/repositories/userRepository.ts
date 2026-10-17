import { PlanType } from '@blinkshare/shared';

export interface UserRecord {
  id: string;
  email: string;
  password_hash: string;
  plan: PlanType;
  created_at: number;
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
}
