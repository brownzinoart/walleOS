declare module 'locomotive-scroll' {
  export interface LocomotiveScrollOptions {
    el: HTMLElement;
    smooth?: boolean;
    lerp?: number;
    multiplier?: number;
    smartphone?: {
      smooth?: boolean;
      breakpoint?: number;
    };
    tablet?: {
      smooth?: boolean;
      breakpoint?: number;
    };
    [key: string]: unknown;
  }

  export interface LocomotiveScrollInstance {
    update(): void;
    destroy(): void;
    on(event: string, callback: (...args: unknown[]) => void): void;
    off(event: string, callback: (...args: unknown[]) => void): void;
    scrollTo(target: number | string | HTMLElement, options?: Record<string, unknown>): void;
    scroll?: {
      instance?: {
        scroll?: {
          x?: number;
          y?: number;
        };
      };
    };
  }

  export default class LocomotiveScroll implements LocomotiveScrollInstance {
    constructor(options: LocomotiveScrollOptions);
    update(): void;
    destroy(): void;
    on(event: string, callback: (...args: unknown[]) => void): void;
    off(event: string, callback: (...args: unknown[]) => void): void;
    scrollTo(target: number | string | HTMLElement, options?: Record<string, unknown>): void;
    scroll?: {
      instance?: {
        scroll?: {
          x?: number;
          y?: number;
        };
      };
    };
  }
}
