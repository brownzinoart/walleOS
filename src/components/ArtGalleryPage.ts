// Type declaration for LocomotiveScroll
import { ART_GALLERY_IMAGES } from "@/config/artGalleryImages";

type LocomotiveScrollOptions = {
  el: Element | null;
  direction?: string;
  smooth?: boolean;
  lerp?: number;
  tablet?: Record<string, unknown>;
  smartphone?: Record<string, unknown>;
};

type LocomotiveScrollInstance = {
  destroy: () => void;
};

type LocomotiveScrollStatic = new (
  options: LocomotiveScrollOptions,
) => LocomotiveScrollInstance;

declare global {
  interface Window {
    LocomotiveScroll?: LocomotiveScrollStatic;
  }
}

export const renderArtGalleryPage = (): string => {
  const galleryItems = ART_GALLERY_IMAGES.map((item, index) => {
    const itemClasses = [
      "item",
      `-${item.variant}`,
      item.isHorizontal ? "-horizontal" : "",
    ]
      .filter(Boolean)
      .join(" ");

    const imagePath = `/playground/optimized/${item.filename}`;
    const fetchPriority = index === 0 ? "high" : "low";
    const aspectRatio = (item.width / item.height).toFixed(4);

    return `
            <div
              class="${itemClasses}"
              data-scroll
              data-scroll-speed="${item.scrollSpeed}"
              style="--aspect-ratio: ${aspectRatio};"
            >
              <img
                class="image"
                src="${imagePath}"
                alt="${item.alt}"
                width="${item.width}"
                height="${item.height}"
                loading="lazy"
                decoding="async"
                fetchpriority="${fetchPriority}"
              >
            </div>
    `;
  }).join("");

  return `
    <div class='art-gallery-container'>
      <button class="back-button" onclick="history.back()">
        Back
      </button>

      <main class="art-gallery-content">
        <div class='scroll-animations-example' data-scroll-container>
          <div class='scrollsection' data-scroll-section style='--gallery-count: ${ART_GALLERY_IMAGES.length};'>
            ${galleryItems}
          </div>
        </div>
      </main>
    </div>
  `;
};

class ArtGalleryScroll {
  private scroll: LocomotiveScrollInstance | null = null;
  private images: NodeListOf<HTMLImageElement>;
  private root: HTMLElement;
  private mediaQuery: MediaQueryList | null = null;
  private isLoadingLocomotive = false;
  private readonly handleMediaQueryChange = (
    _event: MediaQueryListEvent,
  ): void => {
    this.updateScrollMode();
  };

  constructor(root: HTMLElement) {
    this.root = root;
    this.images = this.root.querySelectorAll<HTMLImageElement>(".image");
    this.init();
    setTimeout(this.showImages.bind(this), 200);
  }

  private init() {
    if (typeof window === "undefined") return;

    this.mediaQuery = window.matchMedia("(max-width: 1024px)");

    const query = this.mediaQuery;

    if (typeof query.addEventListener === "function") {
      query.addEventListener("change", this.handleMediaQueryChange);
    } else if (typeof query.addListener === "function") {
      query.addListener(this.handleMediaQueryChange);
    }

    this.updateScrollMode();
  }

  private updateScrollMode() {
    const useLocomotive = this.shouldUseLocomotive();

    this.root.classList.toggle("is-native", !useLocomotive);

    if (useLocomotive) {
      this.enableLocomotive();
    } else {
      this.disableLocomotive();
    }

    this.attachImageClickHandlers();
  }

  private shouldUseLocomotive(): boolean {
    if (typeof window === "undefined") return false;
    if (!this.mediaQuery) return true;
    return !this.mediaQuery.matches;
  }

  private async loadLocomotiveScroll(): Promise<void> {
    return new Promise((resolve) => {
      // Load CSS
      const css = document.createElement("link");
      css.rel = "stylesheet";
      css.href =
        "https://unpkg.com/locomotive-scroll@4.0.6/dist/locomotive-scroll.min.css";
      document.head.appendChild(css);

      // Load JS
      const js = document.createElement("script");
      js.src =
        "https://unpkg.com/locomotive-scroll@4.0.6/dist/locomotive-scroll.min.js";
      js.onload = () => resolve();
      document.head.appendChild(js);
    });
  }

  private enableLocomotive() {
    if (typeof window === "undefined") return;
    if (this.scroll) return;

    const initialize = () => {
      const ScrollConstructor = window.LocomotiveScroll;
      if (!ScrollConstructor) return;

      const element = this.root.querySelector(".scroll-animations-example");
      if (!element) return;

      this.scroll = new ScrollConstructor({
        el: element,
        direction: "horizontal",
        smooth: true,
        lerp: 0.05,
        tablet: {
          smooth: true,
        },
        smartphone: {
          smooth: true,
        },
      });
    };

    if (window.LocomotiveScroll) {
      initialize();
      return;
    }

    if (this.isLoadingLocomotive) return;
    this.isLoadingLocomotive = true;

    void this.loadLocomotiveScroll().then(() => {
      this.isLoadingLocomotive = false;
      if (this.shouldUseLocomotive()) {
        initialize();
      }
    });
  }

  private disableLocomotive() {
    if (!this.scroll) return;
    this.scroll.destroy();
    this.scroll = null;
  }

  private attachImageClickHandlers() {
    this.images = this.root.querySelectorAll<HTMLImageElement>(".image");

    this.images.forEach((image) => {
      if (image.dataset["clickBound"] === "true") return;

      image.addEventListener("click", () => {
        image.classList.add("-clicked");
        this.hideImages();
      });

      image.dataset["clickBound"] = "true";
    });
  }

  private showImages() {
    this.images.forEach((image) => {
      image.classList.remove("-clicked");
      image.classList.add("-active");
    });
  }

  private hideImages() {
    this.images.forEach((image) => {
      image.classList.remove("-active");
    });

    setTimeout(this.showImages.bind(this), 2000);
  }

  public destroy() {
    this.disableLocomotive();

    if (this.mediaQuery) {
      const query = this.mediaQuery;

      if (typeof query.removeEventListener === "function") {
        query.removeEventListener("change", this.handleMediaQueryChange);
      } else if (typeof query.removeListener === "function") {
        query.removeListener(this.handleMediaQueryChange);
      }
    }

    this.mediaQuery = null;
  }
}

let artGalleryInstance: ArtGalleryScroll | null = null;

export const initArtGalleryPage = (): void => {
  const root = document.querySelector<HTMLElement>(".art-gallery-container");
  if (!root) return;

  artGalleryInstance = new ArtGalleryScroll(root);
};

export const cleanupArtGalleryPage = (): void => {
  if (artGalleryInstance) {
    artGalleryInstance.destroy();
    artGalleryInstance = null;
  }
};
