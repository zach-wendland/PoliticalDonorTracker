// Cache interface for dependency injection
// Allows services to use any cache implementation

export interface ICache {
  get<T>(key: string): T | null;
  set<T>(key: string, data: T, ttlMinutes?: number): void;
  has(key: string): boolean;
  delete(key: string): void;
  clear(): void;
}

export interface CacheStats {
  total: number;
  valid: number;
  expired: number;
}

export interface ICacheWithStats extends ICache {
  clearExpired(): void;
  getStats(): CacheStats;
}
