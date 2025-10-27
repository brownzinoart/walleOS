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

  constructor(root: HTMLElement) {
    this.root = root;
    this.images = this.root.querySelectorAll<HTMLImageElement>(".image");
    this.init();
    setTimeout(this.showImages.bind(this), 200);
  }

  private init() {
    // Dynamically load Locomotive Scroll if not already loaded
    if (typeof window !== "undefined" && !window.LocomotiveScroll) {
      this.loadLocomotiveScroll().then(() => {
        this.setupScroll();
      });
    } else {
      this.setupScroll();
    }
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

  private setupScroll() {
    if (typeof window === "undefined" || !window.LocomotiveScroll) return;

    const ScrollConstructor = window.LocomotiveScroll;
    if (!ScrollConstructor) return;

    this.scroll = new ScrollConstructor({
      el: this.root.querySelector(".scroll-animations-example"),
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

    this.images = this.root.querySelectorAll(".image");

    [].forEach.call(this.images, (image: HTMLElement) => {
      image.addEventListener("click", () => {
        image.classList.add("-clicked");
        this.hideImages();
      });
    });
  }

  private showImages() {
    [].forEach.call(this.images, (image: HTMLElement) => {
      image.classList.remove("-clicked");
      image.classList.add("-active");
    });
  }

  private hideImages() {
    [].forEach.call(this.images, (image: HTMLElement) => {
      image.classList.remove("-active");
    });

    setTimeout(this.showImages.bind(this), 2000);
  }

  public destroy() {
    if (this.scroll) {
      this.scroll.destroy();
    }
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
