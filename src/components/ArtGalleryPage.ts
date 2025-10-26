// Type declaration for LocomotiveScroll
declare global {
  interface Window {
    LocomotiveScroll: any;
  }
}

export const renderArtGalleryPage = (): string => {
  return `
    <div class='art-gallery-container'>
      <button class="back-button" onclick="history.back()">
        Back
      </button>

      <main class="art-gallery-content">
        <div class='scroll-animations-example' data-scroll-container>
          <div class='scrollsection' data-scroll-section>
            <div class='item -normal' data-scroll data-scroll-speed="2">
              <img class='image' src='https://picsum.photos/id/1005/300/400'>
            </div>
            <div class='item -big' data-scroll data-scroll-speed="1">
              <img class='image' src='https://picsum.photos/id/1019/600/800'>
            </div>
            <div class='item -small -horizontal' data-scroll data-scroll-speed="4">
              <img class='image' src='https://picsum.photos/id/1027/400/300'>
            </div>
            <div class='item -normal' data-scroll data-scroll-speed="3">
              <img class='image' src='https://picsum.photos/id/1028/300/400'>
            </div>
            <div class='item -normal -horizontal' data-scroll data-scroll-speed="2">
              <img class='image' src='https://picsum.photos/id/1041/400/300'>
            </div>
            <div class='item -big -horizontal' data-scroll data-scroll-speed="4">
              <img class='image' src='https://picsum.photos/id/1042/800/600'>
            </div>
            <div class='item -small' data-scroll data-scroll-speed="2">
              <img class='image' src='https://picsum.photos/id/1049/300/400'>
            </div>
            <div class='item -normal -horizontal' data-scroll data-scroll-speed="1">
              <img class='image' src='https://picsum.photos/id/1056/300/400'>
            </div>
            <div class='item -small -horizontal' data-scroll data-scroll-speed="3">
              <img class='image' src='https://picsum.photos/id/1062/400/300'>
            </div>
            <div class='item -big' data-scroll data-scroll-speed="1">
              <img class='image' src='https://picsum.photos/id/1068/600/800'>
            </div>
            <div class='item -normal -horizontal' data-scroll data-scroll-speed="2">
              <img class='image' src='https://picsum.photos/id/1069/400/300'>
            </div>
            <div class='item -normal -horizontal' data-scroll data-scroll-speed="1">
              <img class='image' src='https://picsum.photos/id/1072/300/400'>
            </div>
            <div class='item -small -horizontal' data-scroll data-scroll-speed="4">
              <img class='image' src='https://picsum.photos/id/1075/400/300'>
            </div>
            <div class='item -big' data-scroll data-scroll-speed="3">
              <img class='image' src='https://picsum.photos/id/1081/600/800'>
            </div>
            <div class='item -normal -horizontal' data-scroll data-scroll-speed="2">
              <img class='image' src='https://picsum.photos/id/111/400/300'>
            </div>
            <div class='item -small -horizontal' data-scroll data-scroll-speed="4">
              <img class='image' src='https://picsum.photos/id/129/400/300'>
            </div>
            <div class='item -big' data-scroll data-scroll-speed="2">
              <img class='image' src='https://picsum.photos/id/137/600/800'>
            </div>
            <div class='item -normal -horizontal' data-scroll data-scroll-speed="1">
              <img class='image' src='https://picsum.photos/id/141/300/400'>
            </div>
            <div class='item -small -horizontal' data-scroll data-scroll-speed="3">
              <img class='image' src='https://picsum.photos/id/145/400/300'>
            </div>
            <div class='item -normal' data-scroll data-scroll-speed="1">
              <img class='image' src='https://picsum.photos/id/147/300/400'>
            </div>
          </div>
        </div>
      </main>
    </div>
  `;
};

class ArtGalleryScroll {
  private scroll: any;
  private images: NodeListOf<Element> = document.querySelectorAll(".image");
  private root: HTMLElement;

  constructor(root: HTMLElement) {
    this.root = root;
    this.init();
    setTimeout(this.showImages.bind(this), 1000);
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

    this.scroll = new window.LocomotiveScroll({
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
