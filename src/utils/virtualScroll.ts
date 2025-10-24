interface VirtualScrollConfig<T = unknown> {
  itemHeight: number;
  containerHeight: number;
  overscan?: number; // Number of items to render outside viewport
  renderItem: (index: number, item: T) => string;
}

interface VirtualScrollState {
  scrollTop: number;
  startIndex: number;
  endIndex: number;
  offsetY: number;
}

export class VirtualScroller<T = unknown> {
  private container: HTMLElement;
  private config: VirtualScrollConfig<T>;
  private items: T[] = [];
  private state: VirtualScrollState;
  private scrollElement!: HTMLElement;
  private spacerBefore!: HTMLElement;
  private spacerAfter!: HTMLElement;
  private viewport!: HTMLElement;
  private onScroll: () => void;

  constructor(container: HTMLElement, config: VirtualScrollConfig<T>) {
    this.container = container;
    this.config = {
      overscan: 5,
      ...config,
    };

    this.state = {
      scrollTop: 0,
      startIndex: 0,
      endIndex: 0,
      offsetY: 0,
    };

    this.setupDOM();
    this.onScroll = this.handleScroll.bind(this);
    this.attachEventListeners();
  }

  private setupDOM(): void {
    this.container.innerHTML = "";
    this.container.style.overflow = "auto";
    this.container.style.height = `${this.config.containerHeight}px`;
    this.container.style.position = "relative";

    // Create scroll element
    this.scrollElement = document.createElement("div");
    this.scrollElement.style.position = "relative";
    this.container.appendChild(this.scrollElement);

    // Create spacers
    this.spacerBefore = document.createElement("div");
    this.spacerAfter = document.createElement("div");

    // Create viewport for visible items
    this.viewport = document.createElement("div");
    this.viewport.style.position = "relative";

    this.scrollElement.appendChild(this.spacerBefore);
    this.scrollElement.appendChild(this.viewport);
    this.scrollElement.appendChild(this.spacerAfter);
  }

  private attachEventListeners(): void {
    this.container.addEventListener("scroll", this.onScroll, { passive: true });
  }

  private detachEventListeners(): void {
    this.container.removeEventListener("scroll", this.onScroll);
  }

  private handleScroll(): void {
    const scrollTop = this.container.scrollTop;

    if (Math.abs(scrollTop - this.state.scrollTop) < this.config.itemHeight) {
      return; // Don't update for small scrolls
    }

    this.state.scrollTop = scrollTop;
    this.updateVisibleRange();
    this.render();
  }

  private updateVisibleRange(): void {
    const { scrollTop } = this.state;
    const { itemHeight, containerHeight, overscan = 5 } = this.config;

    const startIndex = Math.max(
      0,
      Math.floor(scrollTop / itemHeight) - overscan,
    );
    const visibleItemCount = Math.ceil(containerHeight / itemHeight);
    const endIndex = Math.min(
      this.items.length - 1,
      startIndex + visibleItemCount + overscan * 2,
    );

    this.state.startIndex = startIndex;
    this.state.endIndex = endIndex;
    this.state.offsetY = startIndex * itemHeight;
  }

  private render(): void {
    const { startIndex, endIndex, offsetY } = this.state;
    const { itemHeight } = this.config;

    // Update spacers
    this.spacerBefore.style.height = `${offsetY}px`;
    this.spacerAfter.style.height = `${(this.items.length - endIndex - 1) * itemHeight}px`;

    // Render visible items
    const fragment = document.createDocumentFragment();

    for (let i = startIndex; i <= endIndex; i++) {
      const item = this.items[i];
      if (!item) continue;

      const itemElement = document.createElement("div");
      itemElement.style.position = "absolute";
      itemElement.style.top = `${(i - startIndex) * itemHeight}px`;
      itemElement.style.width = "100%";
      itemElement.style.height = `${itemHeight}px`;
      itemElement.innerHTML = this.config.renderItem(i, item);

      fragment.appendChild(itemElement);
    }

    this.viewport.innerHTML = "";
    this.viewport.appendChild(fragment);
  }

  public setItems(items: T[]): void {
    this.items = items;
    this.updateVisibleRange();
    this.updateTotalHeight();
    this.render();
  }

  private updateTotalHeight(): void {
    const totalHeight = this.items.length * this.config.itemHeight;
    this.scrollElement.style.height = `${totalHeight}px`;
  }

  public scrollToIndex(
    index: number,
    alignment: "start" | "center" | "end" = "start",
  ): void {
    const { itemHeight } = this.config;
    const { containerHeight } = this.config;

    let scrollTop: number;

    switch (alignment) {
      case "center":
        scrollTop = index * itemHeight - containerHeight / 2 + itemHeight / 2;
        break;
      case "end":
        scrollTop = index * itemHeight - containerHeight + itemHeight;
        break;
      default:
        scrollTop = index * itemHeight;
    }

    this.container.scrollTop = Math.max(0, scrollTop);
  }

  public scrollToBottom(): void {
    this.container.scrollTop = this.items.length * this.config.itemHeight;
  }

  public getVisibleRange(): { start: number; end: number } {
    return {
      start: this.state.startIndex,
      end: this.state.endIndex,
    };
  }

  public updateConfig(config: Partial<VirtualScrollConfig<T>>): void {
    this.config = { ...this.config, ...config };
    this.updateVisibleRange();
    this.updateTotalHeight();
    this.render();
  }

  public destroy(): void {
    this.detachEventListeners();
    this.container.innerHTML = "";
  }
}

// Utility function to create virtual scroller
export function createVirtualScroller<T = unknown>(
  container: HTMLElement,
  config: VirtualScrollConfig<T>,
): VirtualScroller<T> {
  return new VirtualScroller(container, config);
}
