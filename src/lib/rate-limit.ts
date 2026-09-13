import "server-only";

type Entry = { count: number; resetsAt: number };
const memory = new Map<string, Entry>();

export interface RateLimiter {
  consume(key: string, limit: number, windowMs: number): Promise<boolean>;
}

const developmentLimiter: RateLimiter = {
  async consume(key, limit, windowMs) {
    const now = Date.now();
    const current = memory.get(key);
    if (!current || current.resetsAt <= now) {
      memory.set(key, { count: 1, resetsAt: now + windowMs });
      return true;
    }
    if (current.count >= limit) return false;
    current.count += 1;
    return true;
  },
};

export function getRateLimiter(): RateLimiter {
  // Production deployments should replace this process-local implementation with Redis/Upstash.
  return developmentLimiter;
}
