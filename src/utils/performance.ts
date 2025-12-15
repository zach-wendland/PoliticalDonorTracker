// Performance monitoring utilities for development and debugging

/**
 * Performance metrics collector
 */
interface PerformanceMetrics {
  apiCalls: Map<string, { count: number; totalMs: number; errors: number }>;
  cacheStats: { hits: number; misses: number };
  d3Metrics: { tickCount: number; avgTickMs: number; lastFps: number };
}

const metrics: PerformanceMetrics = {
  apiCalls: new Map(),
  cacheStats: { hits: 0, misses: 0 },
  d3Metrics: { tickCount: 0, avgTickMs: 0, lastFps: 0 },
};

/**
 * Track API call performance
 */
export function trackApiCall(
  endpoint: string,
  durationMs: number,
  success: boolean
): void {
  if (!import.meta.env.DEV) return;

  const existing = metrics.apiCalls.get(endpoint) || { count: 0, totalMs: 0, errors: 0 };
  existing.count++;
  existing.totalMs += durationMs;
  if (!success) existing.errors++;
  metrics.apiCalls.set(endpoint, existing);
}

/**
 * Track cache hit/miss
 */
export function trackCacheAccess(hit: boolean): void {
  if (!import.meta.env.DEV) return;

  if (hit) {
    metrics.cacheStats.hits++;
  } else {
    metrics.cacheStats.misses++;
  }
}

/**
 * Track D3 simulation tick performance
 */
export function trackD3Tick(tickMs: number): void {
  if (!import.meta.env.DEV) return;

  metrics.d3Metrics.tickCount++;
  const totalMs = metrics.d3Metrics.avgTickMs * (metrics.d3Metrics.tickCount - 1) + tickMs;
  metrics.d3Metrics.avgTickMs = totalMs / metrics.d3Metrics.tickCount;
}

/**
 * Update D3 FPS measurement
 */
export function updateD3Fps(fps: number): void {
  if (!import.meta.env.DEV) return;
  metrics.d3Metrics.lastFps = fps;
}

/**
 * Get current performance metrics
 */
export function getPerformanceMetrics(): PerformanceMetrics {
  return {
    apiCalls: new Map(metrics.apiCalls),
    cacheStats: { ...metrics.cacheStats },
    d3Metrics: { ...metrics.d3Metrics },
  };
}

/**
 * Get cache hit rate as percentage
 */
export function getCacheHitRate(): number {
  const total = metrics.cacheStats.hits + metrics.cacheStats.misses;
  if (total === 0) return 0;
  return (metrics.cacheStats.hits / total) * 100;
}

/**
 * Get average API response time for an endpoint
 */
export function getAvgApiResponseTime(endpoint: string): number {
  const data = metrics.apiCalls.get(endpoint);
  if (!data || data.count === 0) return 0;
  return data.totalMs / data.count;
}

/**
 * Reset all metrics
 */
export function resetMetrics(): void {
  metrics.apiCalls.clear();
  metrics.cacheStats.hits = 0;
  metrics.cacheStats.misses = 0;
  metrics.d3Metrics.tickCount = 0;
  metrics.d3Metrics.avgTickMs = 0;
  metrics.d3Metrics.lastFps = 0;
}

/**
 * Log performance summary to console (dev only)
 */
export function logPerformanceSummary(): void {
  if (!import.meta.env.DEV) return;

  console.group('[Performance Summary]');

  console.log('Cache Hit Rate:', `${getCacheHitRate().toFixed(1)}%`);
  console.log('Cache Stats:', metrics.cacheStats);

  console.log('D3 Simulation:');
  console.log('  - Tick Count:', metrics.d3Metrics.tickCount);
  console.log('  - Avg Tick:', `${metrics.d3Metrics.avgTickMs.toFixed(2)}ms`);
  console.log('  - Last FPS:', metrics.d3Metrics.lastFps.toFixed(1));

  console.log('API Calls:');
  metrics.apiCalls.forEach((data, endpoint) => {
    const avgMs = data.totalMs / data.count;
    console.log(`  - ${endpoint}: ${data.count} calls, ${avgMs.toFixed(0)}ms avg, ${data.errors} errors`);
  });

  console.groupEnd();
}

/**
 * Create a timed wrapper for async functions
 */
export function withTiming<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  label: string
): T {
  return (async (...args: Parameters<T>) => {
    const start = performance.now();
    let success = true;
    try {
      return await fn(...args);
    } catch (error) {
      success = false;
      throw error;
    } finally {
      const duration = performance.now() - start;
      trackApiCall(label, duration, success);
      if (import.meta.env.DEV) {
        console.debug(`[${label}] ${duration.toFixed(0)}ms ${success ? '✓' : '✗'}`);
      }
    }
  }) as T;
}

/**
 * FPS counter class for D3 visualization
 */
export class FpsCounter {
  private frameCount = 0;
  private lastTime = performance.now();
  private fps = 0;
  private readonly updateInterval: number;

  constructor(updateIntervalMs = 1000) {
    this.updateInterval = updateIntervalMs;
  }

  tick(): number {
    this.frameCount++;
    const now = performance.now();
    const elapsed = now - this.lastTime;

    if (elapsed >= this.updateInterval) {
      this.fps = (this.frameCount / elapsed) * 1000;
      this.frameCount = 0;
      this.lastTime = now;
      updateD3Fps(this.fps);
    }

    return this.fps;
  }

  getFps(): number {
    return this.fps;
  }

  reset(): void {
    this.frameCount = 0;
    this.lastTime = performance.now();
    this.fps = 0;
  }
}
