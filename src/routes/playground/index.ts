import {
  playgroundSlides,
  type PlaygroundSlide,
  getBentoCardSize,
} from "@/config/playgroundContent";

// Mobile detection utility (matches Layout.ts pattern)
const isDesktop = (): boolean => {
  if (typeof window === 'undefined' || !window.matchMedia) return true; // Default to desktop during SSR/tests
  return window.matchMedia('(min-width: 1024px)').matches;
};

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
  { column: "1 / span 12", row: "8 / span 2" },
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

const resolveCardSize = (slide: PlaygroundSlide, index: number): BentoCardSize =>
  slide.size ?? getBentoCardSize(index);

const resolveAccentColor = (slide: PlaygroundSlide, index: number): string => {
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

const renderBentoCard = (slide: PlaygroundSlide, index: number): string => {
  const position = resolveCardPosition(index);
  const size = resolveCardSize(slide, index);
  const accent = resolveAccentColor(slide, index);
  const sizeClass = BENTO_SIZE_CLASS_MAP[size] ?? BENTO_SIZE_CLASS_MAP.md;
  const isClickable = slide.link && slide.external;
  const isArtCard = index === 0;
  const isGamesCard = index === 6;
  const clickableClass =
    isClickable || isArtCard || isGamesCard ? "bento-card--clickable" : "";
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

const renderBentoGrid = (): string => {
  const isMobile = !isDesktop();

  return `
    <section class="bento-grid-container" role="list">
      ${playgroundSlides
        .map((slide, originalIndex) => {
          // Hide games card (index 6) on mobile
          if (isMobile && originalIndex === 6) {
            return '';
          }
          return renderBentoCard(slide, originalIndex);
        })
        .join("")}
    </section>
  `;
};

const renderPlaygroundIntro = (): string => `
  <header class="playground-hero playground-hero--single">
    <p class="playground-hero__eyebrow">HOBBIES & RECOGNITION</p>
    <h1 class="playground-hero__title">The Playground</h1>
    <p class="playground-hero__subtitle">
      A look at some of my off-the-clock hobbies and on-the-clock recognitions.
    </p>
  </header>
`;

const render = (): string => `
  <div
    data-playground-root
    class="playground-page"
  >
    ${renderPlaygroundIntro()}
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

const init = (): void => {
  const root = document.querySelector<HTMLElement>("[data-playground-root]");
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
      window.location.hash = "#playground/art-gallery";
      return;
    }

    // Check if this is the games card (Take a Break)
    if (cardIndex === "6") {
      event.preventDefault();
      event.stopPropagation();
      window.location.hash = "#playground/games";
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
        window.location.hash = "#playground/art-gallery";
        return;
      }

      // Check if this is the games card (Take a Break)
      if (cardIndex === "6") {
        event.preventDefault();
        event.stopPropagation();
        window.location.hash = "#playground/games";
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
    const isGamesCard = cardIndex === "6";

    if ((link && isExternal) || isArtCard || isGamesCard) {
      card.addEventListener("click", (e) => handleCardClick(e, card));
      card.addEventListener("keydown", (e) => handleCardKeydown(e, card));

      if (isArtCard) {
        card.setAttribute("role", "button");
        card.setAttribute("aria-label", "View art gallery");
        card.setAttribute("tabindex", "0");
      } else if (isGamesCard) {
        card.setAttribute("role", "button");
        card.setAttribute("aria-label", "Play interactive games");
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

const cleanup = (): void => {
  if (cardBackgroundObserver) {
    cardBackgroundObserver.disconnect();
    cardBackgroundObserver = null;
  }

  // Clean up event listeners
  const root = document.querySelector<HTMLElement>("[data-playground-root]");
  if (root) {
    const cards = Array.from(
      root.querySelectorAll<HTMLElement>("[data-bento-card]"),
    );
    cards.forEach((card) => {
      const link = card.dataset["link"];
      const isExternal = card.dataset["external"] === "true";
      const cardIndex = card.dataset["cardIndex"];
      const isArtCard = cardIndex === "0";
      const isGamesCard = cardIndex === "6";

      if ((link && isExternal) || isArtCard || isGamesCard) {
        // Clone the node to remove all event listeners
        const newCard = card.cloneNode(true);
        card.parentNode?.replaceChild(newCard, card);
      }
    });
  }
};

export { render, init, cleanup };
