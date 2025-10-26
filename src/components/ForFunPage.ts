import {
  forFunSlides,
  type ForFunSlide,
  getBentoCardSize,
} from "@/config/forFunContent";

type BentoCardSize = ReturnType<typeof getBentoCardSize>;

interface BentoCardPosition {
  column: string;
  row: string;
}

const DEFAULT_ACCENT_COLORS = [
  "var(--color-neon-cyan)",
  "var(--color-neon-magenta)",
  "var(--color-neon-lime)",
  "var(--color-neon-orange)",
];

const AUTO_POSITION: BentoCardPosition = { column: "auto", row: "auto" };

const BENTO_CARD_POSITIONS: BentoCardPosition[] = [
  { column: "1 / span 7", row: "1 / span 4" },
  { column: "8 / span 5", row: "1 / span 2" },
  { column: "8 / span 5", row: "3 / span 3" },
  { column: "1 / span 4", row: "5 / span 3" },
  { column: "5 / span 3", row: "5 / span 3" },
  { column: "8 / span 5", row: "6 / span 2" },
  { column: "1 / span 12", row: "8 / span 3" },
];

const BENTO_SIZE_CLASS_MAP: Record<BentoCardSize, string> = {
  xl: "bento-card-xl",
  lg: "bento-card-lg",
  md: "bento-card-md",
  sm: "bento-card-sm",
  tall: "bento-card-tall",
  wide: "bento-card-wide",
};

const resolveCardPosition = (index: number): BentoCardPosition => {
  const totalPositions = BENTO_CARD_POSITIONS.length;

  if (totalPositions === 0) {
    return AUTO_POSITION;
  }

  if (index >= totalPositions) {
    return AUTO_POSITION;
  }

  const safeIndex =
    ((index % totalPositions) + totalPositions) % totalPositions;

  return BENTO_CARD_POSITIONS[safeIndex] ?? AUTO_POSITION;
};

const resolveCardSize = (slide: ForFunSlide, index: number): BentoCardSize =>
  slide.size ?? getBentoCardSize(index);

const resolveAccentColor = (slide: ForFunSlide, index: number): string => {
  if (slide.accentColor) {
    return slide.accentColor;
  }

  if (DEFAULT_ACCENT_COLORS.length === 0) {
    return "var(--color-neon-cyan)";
  }

  const safeIndex =
    ((index % DEFAULT_ACCENT_COLORS.length) + DEFAULT_ACCENT_COLORS.length) %
    DEFAULT_ACCENT_COLORS.length;

  return DEFAULT_ACCENT_COLORS[safeIndex] ?? "var(--color-neon-cyan)";
};

const renderBentoCard = (slide: ForFunSlide, index: number): string => {
  const position = resolveCardPosition(index);
  const size = resolveCardSize(slide, index);
  const accent = resolveAccentColor(slide, index);
  const sizeClass = BENTO_SIZE_CLASS_MAP[size] ?? BENTO_SIZE_CLASS_MAP.md;
  const isClickable = slide.link && slide.external;
  const isArtCard = index === 0;
  const clickableClass =
    isClickable || isArtCard ? "bento-card--clickable" : "";
  const styleParts = [
    `grid-column: ${position.column}`,
    `grid-row: ${position.row}`,
    `--bento-card-accent: ${accent}`,
  ];

  return `
    <article
      class="bento-card ${sizeClass} ${clickableClass}"
      data-bento-card
      data-card-index="${index}"
      data-link="${slide.link || ""}"
      data-external="${slide.external ? "true" : "false"}"
      role="listitem"
      tabindex="0"
      style="${styleParts.join("; ")}"
    >
      <span class="bento-card__label">${slide.category}</span>
      <h3 class="bento-card__title">${slide.title}</h3>
      <div
        class="bento-card__media"
        data-bento-card-media
        role="img"
        aria-label="${slide.title} background"
        data-background-image="${slide.backgroundImage}"
      ></div>
    </article>
  `;
};

const renderBentoGrid = (): string => `
  <section class="bento-grid-container" role="list">
    ${forFunSlides.map((slide, index) => renderBentoCard(slide, index)).join("")}
  </section>
`;

const renderForFunIntro = (): string => {
  const featuredSlide = forFunSlides[0];
  const heroTitle = featuredSlide?.title ?? "Creative Playground";
  const heroCategory = featuredSlide?.category ?? "Experimental Concepts";
  const totalSlides = forFunSlides.length;
  const explorationsLabel = totalSlides
    ? `${totalSlides} experimental ${totalSlides === 1 ? "piece" : "explorations"}`
    : "Experimental explorations";

  return `
    <header class="for-fun-hero">
      <p class="for-fun-hero__eyebrow">${heroCategory}</p>
      <h1 class="for-fun-hero__title">${heroTitle}</h1>
      <p class="for-fun-hero__subtitle">
        ${explorationsLabel} that flex the neon-brutalist design system. Tap into playful motion, bold gradients, and tactile interfaces—no carousel required.
      </p>
    </header>
  `;
};

export const renderForFunPage = (): string => `
  <div
    data-for-fun-root
    class="for-fun-page"
  >
    ${renderForFunIntro()}
    ${renderBentoGrid()}
  </div>
`;

let cardBackgroundObserver: IntersectionObserver | null = null;

const applyCardBackground = (card: HTMLElement): void => {
  const media = card.querySelector<HTMLElement>("[data-bento-card-media]");
  if (!media) return;

  const backgroundImage = media.dataset["backgroundImage"];
  const isLoaded = media.dataset["bgLoaded"] === "true";

  if (!backgroundImage || isLoaded) {
    return;
  }

  media.style.backgroundImage = `url('${backgroundImage}')`;
  media.dataset["bgLoaded"] = "true";
};

const hydrateCardBackgrounds = (cards: HTMLElement[]): void => {
  cards.forEach(applyCardBackground);
};

export const initForFunPageInteractions = (): void => {
  const root = document.querySelector<HTMLElement>("[data-for-fun-root]");
  if (!root) {
    return;
  }

  const cards = Array.from(
    root.querySelectorAll<HTMLElement>("[data-bento-card]"),
  );
  if (cards.length === 0) {
    return;
  }

  // Handle external link clicks
  const handleCardClick = (event: MouseEvent, card: HTMLElement): void => {
    const link = card.dataset["link"];
    const isExternal = card.dataset["external"] === "true";
    const cardIndex = card.dataset["cardIndex"];

    // Check if this is the art card (Personal Hobby)
    if (cardIndex === "0") {
      event.preventDefault();
      event.stopPropagation();
      window.location.hash = "#for-fun/art-gallery";
      return;
    }

    if (link && isExternal) {
      event.preventDefault();
      event.stopPropagation();
      window.open(link, "_blank", "noopener,noreferrer");
    }
  };

  const handleCardKeydown = (event: KeyboardEvent, card: HTMLElement): void => {
    if (event.key === "Enter" || event.key === " ") {
      const link = card.dataset["link"];
      const isExternal = card.dataset["external"] === "true";
      const cardIndex = card.dataset["cardIndex"];

      // Check if this is the art card (Personal Hobby)
      if (cardIndex === "0") {
        event.preventDefault();
        event.stopPropagation();
        window.location.hash = "#art-gallery";
        return;
      }

      if (link && isExternal) {
        event.preventDefault();
        event.stopPropagation();
        window.open(link, "_blank", "noopener,noreferrer");
      }
    }
  };

  // Add click and keyboard handlers to cards with external links or art card
  cards.forEach((card) => {
    const link = card.dataset["link"];
    const isExternal = card.dataset["external"] === "true";
    const cardIndex = card.dataset["cardIndex"];
    const isArtCard = cardIndex === "0";

    if ((link && isExternal) || isArtCard) {
      card.addEventListener("click", (e) => handleCardClick(e, card));
      card.addEventListener("keydown", (e) => handleCardKeydown(e, card));

      if (isArtCard) {
        card.setAttribute("role", "button");
        card.setAttribute("aria-label", "View art gallery");
        card.setAttribute("tabindex", "0");
      } else {
        card.setAttribute("role", "link");
        card.setAttribute("aria-label", `External link to ${link}`);
      }
    }
  });

  if (
    typeof window === "undefined" ||
    typeof IntersectionObserver === "undefined"
  ) {
    hydrateCardBackgrounds(cards);
    return;
  }

  cardBackgroundObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const card = entry.target as HTMLElement;
          applyCardBackground(card);
          observer.unobserve(card);
        }
      });
    },
    { rootMargin: "0px 0px 150px 0px", threshold: 0.15 },
  );

  cards.forEach((card) => {
    const media = card.querySelector<HTMLElement>("[data-bento-card-media]");
    if (media?.dataset["bgLoaded"] === "true") {
      return;
    }

    cardBackgroundObserver?.observe(card);
  });
};

export const getCurrentSubroute = (): string | null => {
  if (typeof window === "undefined") return null;

  // Check URL search params for subroute
  const urlParams = new URLSearchParams(window.location.search);
  const subroute = urlParams.get("subroute");

  if (subroute) return subroute;

  // Check hash for subroute (fallback)
  const hash = window.location.hash;
  if (hash.includes("subroute=")) {
    const hashParams = new URLSearchParams(hash.split("?")[1] || "");
    return hashParams.get("subroute");
  }

  return null;
};

export const cleanupForFunPage = (): void => {
  if (cardBackgroundObserver) {
    cardBackgroundObserver.disconnect();
    cardBackgroundObserver = null;
  }

  // Clean up event listeners
  const root = document.querySelector<HTMLElement>("[data-for-fun-root]");
  if (root) {
    const cards = Array.from(
      root.querySelectorAll<HTMLElement>("[data-bento-card]"),
    );
    cards.forEach((card) => {
      const link = card.dataset["link"];
      const isExternal = card.dataset["external"] === "true";
      const cardIndex = card.dataset["cardIndex"];
      const isArtCard = cardIndex === "0";

      if ((link && isExternal) || isArtCard) {
        // Clone the node to remove all event listeners
        const newCard = card.cloneNode(true);
        card.parentNode?.replaceChild(newCard, card);
      }
    });
  }
};
