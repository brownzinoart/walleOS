import { prefersReducedMotion } from '@/utils/performance';

const ANIMATION_WPM = 350;
const BACKLOG_FAST_THRESHOLD = 150;
const FAST_INTERVAL_FACTOR = 0.5;
const MIN_FAST_INTERVAL = 8;

export interface MessageAnimatorProgressPayload {
  newTokens: string[];
  startIndex: number;
  revealedTokens: number;
  totalTokens: number;
}

export interface MessageAnimatorCallbacks {
  onProgress: (payload: MessageAnimatorProgressPayload) => void;
  onComplete?: () => void;
  onCancel?: () => void;
}

export interface MessageAnimatorOptions {
  id: string;
  content: string;
  callbacks: MessageAnimatorCallbacks;
}

export class MessageAnimator {
  private tokens: string[];
  private total: number;
  private index = 0;
  private running = false;
  private paused = false;
  private cancelled = false;
  private lastTime = 0;
  private frameId: number | null = null;
  private readonly baseIntervalMs: number;
  private readonly fastIntervalMs: number;
  private intervalMs: number; // ms between token reveals
  private callbacks: MessageAnimatorCallbacks;
  // Throttle DOM updates to ~30fps to avoid O(n^2) re-render cost
  private lastRenderTime = 0;
  private readonly minRenderDelta = 1000 / 30;
  private previousRevealCount = 0;

  constructor(options: MessageAnimatorOptions) {
    // Split preserving whitespace
    this.tokens = splitPreservingWhitespace(options.content);
    this.total = this.tokens.length;
    this.callbacks = options.callbacks;
    this.baseIntervalMs = toIntervalMs();
    this.fastIntervalMs = toFastInterval(this.baseIntervalMs);
    this.intervalMs = this.baseIntervalMs;
  }

  start(): void {
    if (this.running) return;
    if (this.cancelled) return;

    // Respect reduced motion
    if (prefersReducedMotion()) {
      this.index = this.total;
      this.emitProgress();
      this.callbacks.onComplete?.();
      return;
    }

    this.running = true;
    this.paused = false;
    this.lastTime = performance.now();
    this.lastRenderTime = 0;
    this.previousRevealCount = this.index;
    this.updatePacing();

    const tick = (now: number) => {
      if (!this.running || this.paused || this.cancelled) return;

      const elapsed = now - this.lastTime;

      if (elapsed >= this.intervalMs) {
        const steps = Math.max(1, Math.floor(elapsed / this.intervalMs));
        this.revealNext(steps);
        this.lastTime = now;
      }

      if (this.running && !this.paused && !this.cancelled) {
        this.frameId = requestAnimationFrame(tick);
      }
    };

    this.frameId = requestAnimationFrame(tick);
  }

  pause(): void {
    if (!this.running || this.paused) return;
    this.paused = true;
    if (this.frameId !== null) cancelAnimationFrame(this.frameId);
    this.frameId = null;
  }

  resume(): void {
    if (!this.running || !this.paused) return;
    this.paused = false;
    this.lastTime = performance.now();
    this.updatePacing();
    this.frameId = requestAnimationFrame((t) => this.loop(t));
  }

  skip(): void {
    if (this.cancelled) return;
    this.index = this.total;
    this.emitProgress();
    this.lastRenderTime = performance.now();
    this.finish();
  }

  cancel(): void {
    if (this.cancelled) return;
    this.cancelled = true;
    this.running = false;
    this.paused = false;
    if (this.frameId !== null) cancelAnimationFrame(this.frameId);
    this.frameId = null;
    this.callbacks.onCancel?.();
  }

  private loop(now: number): void {
    if (!this.running || this.paused || this.cancelled) return;
    const elapsed = now - this.lastTime;
    if (elapsed >= this.intervalMs) {
      const steps = Math.max(1, Math.floor(elapsed / this.intervalMs));
      this.revealNext(steps);
      this.lastTime = now;
    }
    if (this.running && !this.paused && !this.cancelled) {
      this.frameId = requestAnimationFrame((t) => this.loop(t));
    }
  }

  private revealNext(steps: number): void {
    const nextIndex = Math.min(this.total, this.index + steps);
    this.index = nextIndex;
    this.updatePacing();

    // Frame-skip to cap updates at ~30fps
    const now = performance.now();
    if (now - this.lastRenderTime >= this.minRenderDelta || this.index >= this.total) {
      this.emitProgress();
      this.lastRenderTime = now;
    }

    if (this.index >= this.total) {
      this.finish();
    }
  }

  private finish(): void {
    this.running = false;
    this.paused = false;
    if (this.frameId !== null) cancelAnimationFrame(this.frameId);
    this.frameId = null;
    // Ensure final render occurred
    if (this.index >= this.total && this.lastRenderTime === 0) {
      this.emitProgress();
    }
    this.callbacks.onComplete?.();
  }

  private updatePacing(): void {
    if (backlogExceedsThreshold(this.total, this.index)) {
      this.intervalMs = this.fastIntervalMs;
    } else {
      this.intervalMs = this.baseIntervalMs;
    }
  }

  private emitProgress(): void {
    const startIndex = this.previousRevealCount;
    const endIndex = this.index;

    if (endIndex <= startIndex) {
      return;
    }

    const newTokens = this.tokens.slice(startIndex, endIndex);
    this.previousRevealCount = endIndex;

    this.callbacks.onProgress({
      newTokens,
      startIndex,
      revealedTokens: endIndex,
      totalTokens: this.total,
    });
  }
}

export function createMessageAnimator(options: MessageAnimatorOptions): MessageAnimator {
  return new MessageAnimator(options);
}

function toIntervalMs(): number {
  const msPerWord = 60000 / ANIMATION_WPM;
  // Reveal per token (word or whitespace); prioritize words by using a floor on ms
  return Math.max(16, Math.floor(msPerWord));
}

function toFastInterval(baseInterval: number): number {
  return Math.max(MIN_FAST_INTERVAL, Math.floor(baseInterval * FAST_INTERVAL_FACTOR));
}

export function splitPreservingWhitespace(content: string): string[] {
  // Split into words and whitespace, preserving order
  // Example: "Hello  world!" -> ["Hello", "  ", "world!"]
  return content.split(/(\s+)/).filter((t) => t.length > 0);
}

function backlogExceedsThreshold(total: number, index: number): boolean {
  return total - index > BACKLOG_FAST_THRESHOLD;
}
