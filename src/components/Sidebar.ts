import {
  branding,
  navigation,
  contact,
  featuredProjects,
} from "@/config/content";
import { renderThemeToggle } from "./ThemeToggle";
import type { NavigationItem, SocialLink } from "@/types";
import {
  prefersReducedMotion,
  observeIntersection,
  addWillChange,
  removeWillChange,
} from "@/utils/performance";
import type { RouteComponentId } from "@/utils/router";
import { createEventManager } from "@/utils/eventManager";

const NEON_COLORS = [
  "var(--color-neon-cyan)",
  "var(--color-neon-magenta)",
  "var(--color-neon-lime)",
  "var(--color-neon-orange)",
];
const FALLBACK_NEON_COLOR = "var(--color-neon-cyan)";

const SIDEBAR_SELECTOR = "[data-sidebar]";
const NAV_ITEM_SELECTOR = "[data-sidebar-nav-item]";
const SOCIAL_LINK_SELECTOR = "[data-sidebar-social-link]";
const BRANDING_SELECTOR = "[data-sidebar-branding]";
const ANNOUNCER_SELECTOR = "[data-sidebar-announcer]";
const SKIP_LINK_SELECTOR = "[data-sidebar-skip]";

interface SidebarState {
  activeNavId: string | null;
  activeProjectId: string | null;
  isProjectsExpanded: boolean;
}

type ProjectNavItem = {
  id: RouteComponentId;
  label: string;
};

const PROJECT_TOGGLE_SELECTOR = "[data-sidebar-project-toggle]";
const PROJECT_LINK_SELECTOR = "[data-sidebar-project-link]";
const PROJECT_LIST_SELECTOR = "[data-sidebar-project-list]";

const getInitialHashRoute = (): string | null => {
  if (typeof window === "undefined") {
    return null;
  }

  const rawHash = window.location.hash ?? "";
  const normalized = rawHash.startsWith("#") ? rawHash.slice(1) : rawHash;
  return normalized.length > 0 ? normalized : null;
};

const projectNavItems: ProjectNavItem[] = (() => {
  const overviewItem: ProjectNavItem = { id: "projects", label: "Overview" };

  const seen = new Set<RouteComponentId>(["projects"]);
  const detailedItems = featuredProjects
    .filter(
      (project) =>
        typeof project.detailRoute === "string" &&
        project.detailRoute.length > 0,
    )
    .map((project) => ({
      id: project.detailRoute as RouteComponentId,
      label: project.title,
    }))
    .filter((project) => {
      if (seen.has(project.id)) {
        return false;
      }

      seen.add(project.id);
      return true;
    });

  return [overviewItem, ...detailedItems];
})();

const initialRoute = getInitialHashRoute();
const initialProjectRoute =
  initialRoute && projectNavItems.some((item) => item.id === initialRoute)
    ? initialRoute
    : null;
const initialNavId = initialProjectRoute
  ? "projects"
  : (navigation[0]?.id ?? null);

const sidebarState: SidebarState = {
  activeNavId: initialNavId,
  activeProjectId: initialProjectRoute,
  isProjectsExpanded: Boolean(initialProjectRoute),
};

const navItemRefs = new Map<string, HTMLButtonElement>();
const projectNavRefs = new Map<string, HTMLButtonElement>();
const sectionRefs = new Map<string, HTMLElement>();

let sidebarRoot: HTMLElement | null = null;
let announcerRef: HTMLElement | null = null;
let brandingRef: HTMLElement | null = null;
let skipLinkRef: HTMLAnchorElement | null = null;
let brandingColorInterval: number | null = null;
let sectionObserverCleanup: (() => void) | null = null;
const eventManager = createEventManager();
let projectToggleRef: HTMLButtonElement | null = null;
let projectListRef: HTMLElement | null = null;

const emitActiveChange = (navId: string, label: string, silent?: boolean) => {
  if (!silent) {
    document.dispatchEvent(
      new CustomEvent("sidebar:active-change", {
        detail: { id: navId, label },
      }),
    );
  }

  if (announcerRef && !prefersReducedMotion()) {
    announcerRef.textContent = `Focused on ${label}`;
  }
};

const emitNavigationEvent = (navId: string) => {
  document.dispatchEvent(
    new CustomEvent("sidebar:navigate", {
      detail: { id: navId },
    }),
  );
};

const findSectionTarget = (navId: string): HTMLElement | null => {
  const cached = sectionRefs.get(navId);

  if (cached) {
    return cached;
  }

  const section =
    document.querySelector<HTMLElement>(`[data-section-id="${navId}"]`) ??
    document.getElementById(navId);

  if (section) {
    sectionRefs.set(navId, section);
  }

  return section ?? null;
};

const cacheSidebarElements = () => {
  sidebarRoot = document.querySelector<HTMLElement>(SIDEBAR_SELECTOR);
  announcerRef =
    sidebarRoot?.querySelector<HTMLElement>(ANNOUNCER_SELECTOR) ?? null;
  brandingRef =
    sidebarRoot?.querySelector<HTMLElement>(BRANDING_SELECTOR) ?? null;
  skipLinkRef =
    sidebarRoot?.querySelector<HTMLAnchorElement>(SKIP_LINK_SELECTOR) ?? null;

  navItemRefs.clear();
  projectNavRefs.clear();

  sidebarRoot
    ?.querySelectorAll<HTMLButtonElement>(NAV_ITEM_SELECTOR)
    .forEach((item) => {
      const navId = item.dataset["navId"];

      if (navId) {
        navItemRefs.set(navId, item);
      }
    });

  sidebarRoot
    ?.querySelectorAll<HTMLButtonElement>(PROJECT_LINK_SELECTOR)
    .forEach((item) => {
      const navId = item.dataset["projectId"];

      if (navId) {
        projectNavRefs.set(navId, item);
      }
    });

  projectToggleRef =
    sidebarRoot?.querySelector<HTMLButtonElement>(PROJECT_TOGGLE_SELECTOR) ??
    null;
  projectListRef =
    sidebarRoot?.querySelector<HTMLElement>(PROJECT_LIST_SELECTOR) ?? null;
};

const resetBrandingCycle = () => {
  if (brandingColorInterval) {
    eventManager.clearInterval(brandingColorInterval);
    brandingColorInterval = null;
  }
};

const setupBrandingInteractions = () => {
  if (!brandingRef) {
    return;
  }

  let colorIndex = 0;

  const cycleColors = () => {
    const nextColor =
      NEON_COLORS[colorIndex % NEON_COLORS.length] ?? FALLBACK_NEON_COLOR;
    brandingRef?.style.setProperty("--branding-accent", nextColor);
    colorIndex += 1;
  };

  eventManager.addEventListener(brandingRef, "pointerenter", () => {
    if (brandingRef) {
      addWillChange(brandingRef, ["transform", "text-shadow"]);
    }
    cycleColors();
    resetBrandingCycle();
    brandingColorInterval = eventManager.setInterval(cycleColors, 1200);
  });

  eventManager.addEventListener(brandingRef, "pointermove", (event) => {
    if (!brandingRef) {
      return;
    }

    const rect = brandingRef.getBoundingClientRect();

    if (!rect) {
      return;
    }

    const offsetX = (event as PointerEvent).clientX - rect.left;
    const offsetY = (event as PointerEvent).clientY - rect.top;

    brandingRef.style.setProperty(
      "--branding-glow-x",
      `${(offsetX / rect.width - 0.5) * 40}px`,
    );
    brandingRef.style.setProperty(
      "--branding-glow-y",
      `${(offsetY / rect.height - 0.5) * 40}px`,
    );
  });

  eventManager.addEventListener(brandingRef, "pointerleave", () => {
    resetBrandingCycle();
    brandingRef?.style.setProperty(
      "--branding-accent",
      "var(--color-branding-base, var(--color-neon-cyan))",
    );
    brandingRef?.style.setProperty("--branding-glow-x", "0px");
    brandingRef?.style.setProperty("--branding-glow-y", "0px");
    if (brandingRef) {
      removeWillChange(brandingRef);
    }
  });
};

const setupSocialLinkInteractions = () => {
  const socialLinks =
    sidebarRoot?.querySelectorAll<HTMLAnchorElement>(SOCIAL_LINK_SELECTOR);

  if (!socialLinks || socialLinks.length === 0) {
    return;
  }

  let hoverSequence = 0;

  socialLinks.forEach((link) => {
    link.addEventListener("pointerenter", () => {
      hoverSequence += 1;
      link.style.setProperty("--hover-sequence", String(hoverSequence));
      addWillChange(link, ["transform"]);
    });

    link.addEventListener("pointerleave", () => {
      removeWillChange(link);
    });

    link.addEventListener("focus", () => {
      addWillChange(link, ["transform"]);
    });

    link.addEventListener("blur", () => {
      removeWillChange(link);
    });
  });
};

const getProjectNavLabel = (projectId: string | null): string => {
  if (!projectId) {
    return "Projects";
  }

  const matched = projectNavItems.find((item) => item.id === projectId);
  return matched?.label ?? "Projects";
};

const setProjectsExpanded = (shouldExpand: boolean) => {
  sidebarState.isProjectsExpanded = shouldExpand;

  if (projectToggleRef) {
    projectToggleRef.setAttribute("aria-expanded", String(shouldExpand));
    projectToggleRef.classList.toggle("is-expanded", shouldExpand);
  }

  if (projectListRef) {
    projectListRef.toggleAttribute("hidden", !shouldExpand);
    projectListRef.setAttribute("aria-hidden", String(!shouldExpand));
  }
};

const setActiveProjectNavItem = (projectId: string | null) => {
  sidebarState.activeProjectId = projectId;

  projectNavRefs.forEach((button, id) => {
    const isActive = projectId === id;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-current", isActive ? "page" : "false");
  });
};

const toggleProjectsExpanded = () => {
  setProjectsExpanded(!sidebarState.isProjectsExpanded);
};

const handleProjectsToggleActivation = () => {
  if (!sidebarState.isProjectsExpanded) {
    handleProjectNavActivation("projects", { scrollToTop: true });
    return;
  }

  toggleProjectsExpanded();
};

const handleProjectNavActivation = (
  projectId: RouteComponentId,
  options: ProjectNavActivationOptions = {},
) => {
  setProjectsExpanded(true);
  setActiveProjectNavItem(projectId);

  // Import router functions dynamically to avoid circular dependencies
  import("@/utils/router")
    .then(({ navigateTo }) => {
      navigateTo(projectId);
      if (options.scrollToTop) {
        requestAnimationFrame(() => {
          window.scrollTo({ top: 0, left: 0, behavior: "auto" });
        });
      }
      setActiveNavItem(projectId);
      emitNavigationEvent(projectId);
    })
    .catch(() => {
      // Swallow navigation errors; router will handle invalid routes separately
    });
};

const findSectionNodes = () => {
  sectionRefs.clear();

  navigation.forEach((item) => {
    const section = findSectionTarget(item.id);

    if (section) {
      sectionRefs.set(item.id, section);
    }
  });
};

const setupSectionObserver = () => {
  sectionObserverCleanup?.();

  if (sectionRefs.size === 0) {
    return;
  }

  const sections = Array.from(sectionRefs.values());

  sectionObserverCleanup = observeIntersection(
    sections,
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

      if (visible.length === 0) {
        return;
      }

      const topEntry = visible[0];
      if (!topEntry) {
        return;
      }
      const targetSection = topEntry.target as HTMLElement;
      const matchedNav = Array.from(sectionRefs.entries()).find(
        ([, section]) => section === targetSection,
      );

      if (matchedNav && matchedNav[0] !== sidebarState.activeNavId) {
        const navId = matchedNav[0];
        const navItem = navItemRefs.get(navId);
        const label = navItem?.dataset["navLabel"] ?? navId;
        // Prevent projects tab from being activated during homepage scrolling
        // Only allow projects tab activation if currently not on home, or if explicitly navigating to projects
        if (navId === "projects" && sidebarState.activeNavId === "home") {
          return;
        }

        setActiveNavItem(navId, { silent: true });
        emitActiveChange(navId, label, true);
      }
    },
    { rootMargin: "-40% 0px -40% 0px", threshold: [0.1, 0.25, 0.5, 0.75] },
  );
};

interface SetActiveOptions {
  silent?: boolean;
}

interface ProjectNavActivationOptions {
  scrollToTop?: boolean;
}

const isProjectRouteId = (routeId: string): routeId is RouteComponentId => {
  return projectNavItems.some((item) => item.id === routeId);
};

export const setActiveNavItem = (
  itemId: string | null,
  options: SetActiveOptions = {},
) => {
  if (!itemId) {
    return;
  }

  const projectRoute = isProjectRouteId(itemId);
  const navId = projectRoute ? "projects" : itemId;

  if (!navItemRefs.has(navId)) {
    return;
  }

  const nextItem = navItemRefs.get(navId);

  if (!nextItem) {
    return;
  }

  if (sidebarState.activeNavId !== navId) {
    navItemRefs.forEach((item, id) => {
      const isActive = id === navId;
      item.classList.toggle("is-active", isActive);
      item.setAttribute("aria-current", isActive ? "page" : "false");
      item.setAttribute("aria-pressed", String(isActive));
    });

    sidebarState.activeNavId = navId;
  }

  if (projectRoute) {
    setProjectsExpanded(true);
    setActiveProjectNavItem(itemId);
  } else {
    setActiveProjectNavItem(null);
  }

  const label = projectRoute
    ? getProjectNavLabel(itemId)
    : (nextItem.dataset["navLabel"] ?? navId);
  emitActiveChange(navId, label, options.silent);
};

export const handleNavActivation = (
  itemId: string,
  behavior: ScrollBehavior = "smooth",
) => {
  // Import router functions dynamically to avoid circular dependencies
  import("@/utils/router").then(({ navigateTo }) => {
    // Route to dedicated pages (including home) so URL reflects active tab
    if (
      itemId === "home" ||
      itemId === "projects" ||
      itemId === "resume" ||
      itemId === "for-fun"
    ) {
      navigateTo(itemId);
      setActiveNavItem(itemId);
      emitNavigationEvent(itemId);
      return;
    }

    // For home and other sections, use traditional scroll behavior
    const target = findSectionTarget(itemId);
    const motionSafe: ScrollBehavior = prefersReducedMotion()
      ? "auto"
      : behavior;

    if (target) {
      target.scrollIntoView({ behavior: motionSafe, block: "start" });
    }

    setActiveNavItem(itemId);
    emitNavigationEvent(itemId);
  });
};

const setupNavItemInteractions = () => {
  navItemRefs.forEach((item, id) => {
    if (id === "projects" && projectNavItems.length > 0) {
      return;
    }

    item.addEventListener("click", (event) => {
      event.preventDefault();
      handleNavActivation(id);
    });

    item.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        handleNavActivation(id);
      }
    });
  });
};

const setupProjectNavInteractions = () => {
  if (projectNavItems.length === 0) {
    return;
  }

  const shouldExpand =
    sidebarState.isProjectsExpanded || Boolean(sidebarState.activeProjectId);
  setProjectsExpanded(shouldExpand);

  if (projectToggleRef) {
    projectToggleRef.addEventListener("click", (event) => {
      event.preventDefault();
      handleProjectsToggleActivation();
    });

    projectToggleRef.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        handleProjectsToggleActivation();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        setProjectsExpanded(true);
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        setProjectsExpanded(false);
      }
    });
  }

  projectNavRefs.forEach((button, id) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      handleProjectNavActivation(id as RouteComponentId);
    });

    button.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        handleProjectNavActivation(id as RouteComponentId);
      }
    });
  });
};

const setupSkipLink = () => {
  if (!skipLinkRef) {
    return;
  }

  skipLinkRef.addEventListener("focus", () => {
    skipLinkRef?.classList.add("is-visible");
  });

  skipLinkRef.addEventListener("blur", () => {
    skipLinkRef?.classList.remove("is-visible");
  });
};

export const initSidebarInteractions = (): void => {
  cacheSidebarElements();

  if (!sidebarRoot) {
    return;
  }

  setupSkipLink();
  setupBrandingInteractions();
  setupSocialLinkInteractions();
  setupNavItemInteractions();
  setupProjectNavInteractions();

  findSectionNodes();
  setupSectionObserver();

  if (sidebarState.activeNavId) {
    setActiveNavItem(sidebarState.activeNavId, { silent: true });
  }
};

const renderProjectsNav = (item: NavigationItem, isActive: boolean): string => {
  const expanded =
    sidebarState.isProjectsExpanded || Boolean(sidebarState.activeProjectId);
  const navLabel = escapeHtml(item.label);
  const subItems = projectNavItems
    .map((project) => {
      const isProjectActive = sidebarState.activeProjectId === project.id;
      return `
        <button
          type="button"
          class="sidebar-projects-subnav-item${isProjectActive ? " is-active" : ""}"
          data-sidebar-project-link
          data-project-id="${escapeHtml(project.id)}"
          aria-current="${isProjectActive ? "page" : "false"}"
        >
          <span class="sidebar-projects-subnav-bullet" aria-hidden="true"></span>
          <span class="sidebar-projects-subnav-label">${escapeHtml(project.label)}</span>
        </button>
      `;
    })
    .join("");

  return `
    <div class="sidebar-projects-group" data-sidebar-projects>
      <button
        type="button"
        class="sidebar-nav-item sidebar-projects-toggle${isActive ? " is-active" : ""}${expanded ? " is-expanded" : ""} focus:outline-none"
        data-sidebar-nav-item
        data-sidebar-project-toggle
        data-nav-id="${item.id}"
        data-nav-label="${navLabel}"
        aria-pressed="${isActive}"
        aria-current="${isActive ? "page" : "false"}"
        aria-expanded="${expanded}"
        aria-controls="sidebar-projects-list"
      >
        <span class="sidebar-nav-item-icon" aria-hidden="true">${item.icon}</span>
        <span class="sidebar-nav-item-label text-sm font-medium tracking-wide">${item.label}</span>
        <span class="sidebar-projects-toggle-icon" aria-hidden="true">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5.25 3.75L10.25 8L5.25 12.25" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </span>
      </button>
      <div
        class="sidebar-projects-subnav${expanded ? " is-expanded" : ""}"
        id="sidebar-projects-list"
        data-sidebar-project-list
        role="group"
        aria-label="Project shortcuts"
        aria-hidden="${expanded ? "false" : "true"}"
        ${expanded ? "" : "hidden"}
      >
        ${subItems}
      </div>
    </div>
  `;
};

const renderNavItem = (item: NavigationItem, isActive: boolean): string => `
  <button
    type="button"
    class="sidebar-nav-item${isActive ? " is-active" : ""} focus:outline-none"
    data-sidebar-nav-item
    data-nav-id="${item.id}"
    data-nav-label="${escapeHtml(item.label)}"
    aria-pressed="${isActive}"
    aria-current="${isActive ? "page" : "false"}"
  >
    <span class="sidebar-nav-item-icon" aria-hidden="true">${item.icon}</span>
    <span class="sidebar-nav-item-label text-sm font-medium tracking-wide">${item.label}</span>
  </button>
`;

const renderSocialLink = (link: SocialLink): string => `
  <a
    class="sidebar-social-link focus-visible:outline-none"
    href="${link.url}"
    target="_blank"
    rel="noopener noreferrer"
    aria-label="${link.platform}"
    data-sidebar-social-link
  >
    <span aria-hidden="true">${link.icon}</span>
    <span class="sidebar-social-tooltip" role="presentation">${link.platform}</span>
  </a>
`;

export const renderSidebar = (): string => {
  const emailLink = contact.email ? `mailto:${contact.email}` : "#";
  const activeNavId = sidebarState.activeNavId ?? navigation[0]?.id ?? "";
  const navMarkup = navigation
    .map((item) => {
      const isActive = item.id === activeNavId;

      if (item.id === "projects" && projectNavItems.length > 0) {
        return renderProjectsNav(item, isActive);
      }

      return renderNavItem(item, isActive);
    })
    .join("");

  return `
    <aside
      class="sidebar flex h-full flex-col border-r border-default bg-surface-secondary p-3 text-primary md:p-5 lg:p-6"
      role="navigation"
      aria-label="Main navigation"
      data-sidebar
    >
      <button
        type="button"
        class="sidebar-close-button md:hidden lg:hidden fixed top-4 right-4 z-50 w-12 h-12 flex items-center justify-center rounded-lg border-2 border-neon-cyan bg-surface-secondary hover:bg-surface-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-neon-cyan transition-all"
        data-mobile-nav-close
        aria-label="Close navigation menu"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-neon-cyan">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
      <a href="#main-content" class="sidebar-skip-link" data-sidebar-skip>Skip to main content</a>
      <div class="sidebar-content flex flex-col gap-3">
        <div class="sidebar-header">
          <div class="sidebar-branding group cursor-pointer" data-sidebar-branding>
            <span
              class="sidebar-branding-title text-xl font-black tracking-tight md:text-heading-2"
              style="--branding-accent: var(--color-branding-base, var(--color-neon-cyan));"
            >
              ${branding.name}
            </span>
            <p class="sidebar-branding-tagline mt-1 max-w-xs text-sm text-secondary">
              ${branding.tagline}
            </p>
          </div>
        </div>
        <div class="sidebar-nav-container" data-sidebar-nav-container>
          <nav class="sidebar-nav" aria-label="Primary navigation">
            ${navMarkup}
          </nav>
        </div>
      </div>
      <div class="sidebar-footer">
      <div class="sidebar-theme-toggle-wrapper">
        ${renderThemeToggle()}
      </div>
      <div class="sidebar-footer-divider" aria-hidden="true"></div>
        <div class="sidebar-utilities">
          <div class="text-sm text-secondary">
            <div class="flex flex-col gap-2 pt-3">
              <a
                class="font-medium text-primary transition-colors hover:text-[var(--color-neon-cyan)] focus-visible:text-[var(--color-neon-cyan)]"
                href="${emailLink}"
              >
                ${contact.email}
              </a>
              <div class="sidebar-socials" aria-label="Social links">
                ${contact.socials.map(renderSocialLink).join("")}
              </div>
            </div>
            <span class="sr-only" aria-live="polite" data-sidebar-announcer></span>
          </div>
        </div>
      </div>
    </aside>
  `;
};

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

// Cleanup function for Sidebar component
export const cleanupSidebar = () => {
  resetBrandingCycle();
  eventManager.cleanup();
  if (sectionObserverCleanup) {
    sectionObserverCleanup();
    sectionObserverCleanup = null;
  }
};
