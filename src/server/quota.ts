import fs from 'fs';
import path from 'path';
import { DailyQuota } from '../types';

const QUOTA_FILE = path.resolve(process.cwd(), 'storage', 'quota.json');
const DEFAULT_DAILY_LIMIT = 250; // 250 Free Cloud Images per day

export class DailyQuotaManager {
  private limit: number;
  private usedToday: number = 0;
  private lastResetDate: string = '';

  constructor(limit = DEFAULT_DAILY_LIMIT) {
    this.limit = limit;
    this.loadState();
    this.checkAndReset();
  }

  private getTodayUtcDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  private loadState() {
    try {
      if (fs.existsSync(QUOTA_FILE)) {
        const raw = fs.readFileSync(QUOTA_FILE, 'utf-8');
        const data = JSON.parse(raw);
        this.usedToday = data.usedToday || 0;
        this.lastResetDate = data.lastResetDate || this.getTodayUtcDate();
        this.limit = data.totalLimit || this.limit;
      } else {
        this.lastResetDate = this.getTodayUtcDate();
        this.saveState();
      }
    } catch {
      this.lastResetDate = this.getTodayUtcDate();
      this.usedToday = 0;
    }
  }

  private saveState() {
    try {
      const dir = path.dirname(QUOTA_FILE);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(
        QUOTA_FILE,
        JSON.stringify(
          {
            totalLimit: this.limit,
            usedToday: this.usedToday,
            lastResetDate: this.lastResetDate,
          },
          null,
          2
        )
      );
    } catch (e) {
      console.warn('Could not save quota state:', e);
    }
  }

  public checkAndReset() {
    const today = this.getTodayUtcDate();
    if (this.lastResetDate !== today) {
      this.lastResetDate = today;
      this.usedToday = 0;
      this.saveState();
    }
  }

  public canProcess(count = 1): boolean {
    this.checkAndReset();
    return this.usedToday + count <= this.limit;
  }

  public recordProcessed(count = 1): boolean {
    this.checkAndReset();
    if (this.usedToday + count <= this.limit) {
      this.usedToday += count;
      this.saveState();
      return true;
    }
    return false;
  }

  public getQuota(): DailyQuota {
    this.checkAndReset();
    // Next reset is at 24:00 UTC
    const now = new Date();
    const nextReset = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0));
    return {
      totalLimit: this.limit,
      usedToday: this.usedToday,
      remainingToday: Math.max(0, this.limit - this.usedToday),
      resetTimeUtc: nextReset.toISOString(),
      lastResetDate: this.lastResetDate,
    };
  }

  public setLimit(newLimit: number) {
    this.limit = newLimit;
    this.saveState();
  }
}

export const quotaManager = new DailyQuotaManager();
