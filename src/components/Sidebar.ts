import { branding, navigation, contact } from '@/config/content';
import type { NavigationItem, SocialLink } from '@/types';
import { prefersReducedMotion, observeIntersection, rafThrottle, addWillChange, removeWillChange } from '@/utils/performance';

const NEON_COLORS = ['var(--color-neon-cyan)', 'var(--color-neon-magenta)', 'var(--color-neon-lime)', 'var(--color-neon-orange)'];

const SIDEBAR_SELECTOR = '[data-sidebar]';
const NAV_ITEM_SELECTOR = '[data-sidebar-nav-item]';
const NAV_CONTAINER_SELECTOR = '[data-sidebar-nav-container]';
const NAV_SCROLLABLE_SELECTOR = '[data-sidebar-nav-scrollable]';
const SOCIAL_LINK_SELECTOR = '[data-sidebar-social-link]';
const BRANDING_SELECTOR = '[data-sidebar-branding]';
const ANNOUNCER_SELECTOR = '[data-sidebar-announcer]';
const SKIP_LINK_SELECTOR = '[data-sidebar-skip]';


interface SidebarState {
  activeNavId: string | null;
}

const sidebarState: SidebarState = {
  activeNavId: navigation[0]?.id ?? null,
};

const navItemRefs = new Map<string, HTMLButtonElement>();
const sectionRefs = new Map<string, HTMLElement>();

let sidebarRoot: HTMLElement | null = null;
let navContainerRef: HTMLElement | null = null;
let navScrollableRef: HTMLElement | null = null;
let announcerRef: HTMLElement | null = null;
let brandingRef: HTMLElement | null = null;
let skipLinkRef: HTMLAnchorElement | null = null;
let brandingColorInterval: number | null = null;
let sectionObserverCleanup: (() => void) | null = null;

const emitActiveChange = (navId: string, label: string, silent?: boolean) => {
  if (!silent) {
    document.dispatchEvent(
      new CustomEvent('sidebar:active-change', {
        detail: { id: navId, label },
      })
    );
  }

  if (announcerRef && !prefersReducedMotion()) {
    announcerRef.textContent = `Focused on ${label}`;
  }
};

const emitNavigationEvent = (navId: string) => {
  document.dispatchEvent(
    new CustomEvent('sidebar:navigate', {
      detail: { id: navId },
    })
  );
};

const findSectionTarget = (navId: string): HTMLElement | null => {
  const cached = sectionRefs.get(navId);

  if (cached) {
    return cached;
  }

  const section = document.querySelector<HTMLElement>(`[data-section-id="${navId}"]`) ?? document.getElementById(navId);

  if (section) {
    sectionRefs.set(navId, section);
  }

  return section ?? null;
};

const cacheSidebarElements = () => {
  sidebarRoot = document.querySelector<HTMLElement>(SIDEBAR_SELECTOR);
  navContainerRef = sidebarRoot?.querySelector<HTMLElement>(NAV_CONTAINER_SELECTOR) ?? null;
  navScrollableRef = sidebarRoot?.querySelector<HTMLElement>(NAV_SCROLLABLE_SELECTOR) ?? null;
  announcerRef = sidebarRoot?.querySelector<HTMLElement>(ANNOUNCER_SELECTOR) ?? null;
  brandingRef = sidebarRoot?.querySelector<HTMLElement>(BRANDING_SELECTOR) ?? null;
  skipLinkRef = sidebarRoot?.querySelector<HTMLAnchorElement>(SKIP_LINK_SELECTOR) ?? null;

  navItemRefs.clear();

  sidebarRoot?.querySelectorAll<HTMLButtonElement>(NAV_ITEM_SELECTOR).forEach((item) => {
    const navId = item.dataset.navId;

    if (navId) {
      navItemRefs.set(navId, item);
    }
  });
};

const resetBrandingCycle = () => {
  if (brandingColorInterval) {
    window.clearInterval(brandingColorInterval);
    brandingColorInterval = null;
  }
};

const setupBrandingInteractions = () => {
  if (!brandingRef) {
    return;
  }

  let colorIndex = 0;

  const cycleColors = () => {
    brandingRef?.style.setProperty('--branding-accent', NEON_COLORS[colorIndex % NEON_COLORS.length]);
    colorIndex += 1;
  };

  brandingRef.addEventListener('pointerenter', () => {
    if (brandingRef) {
      addWillChange(brandingRef, ['transform', 'text-shadow']);
    }
    cycleColors();
    resetBrandingCycle();
    brandingColorInterval = window.setInterval(cycleColors, 1200);
  });

  brandingRef.addEventListener('pointermove', (event) => {
    if (!brandingRef) {
      return;
    }

    const rect = brandingRef.getBoundingClientRect();

    if (!rect) {
      return;
    }

    const offsetX = event.clientX - rect.left;
    const offsetY = event.clientY - rect.top;

    brandingRef.style.setProperty('--branding-glow-x', `${((offsetX / rect.width) - 0.5) * 40}px`);
    brandingRef.style.setProperty('--branding-glow-y', `${((offsetY / rect.height) - 0.5) * 40}px`);
  });

  brandingRef.addEventListener('pointerleave', () => {
    resetBrandingCycle();
    brandingRef?.style.setProperty('--branding-accent', 'var(--color-neon-cyan)');
    brandingRef?.style.setProperty('--branding-glow-x', '0px');
    brandingRef?.style.setProperty('--branding-glow-y', '0px');
    if (brandingRef) {
      removeWillChange(brandingRef);
    }
  });
};

const setupSocialLinkInteractions = () => {
  const socialLinks = sidebarRoot?.querySelectorAll<HTMLAnchorElement>(SOCIAL_LINK_SELECTOR);

  if (!socialLinks || socialLinks.length === 0) {
    return;
  }

  let hoverSequence = 0;

  socialLinks.forEach((link) => {
    link.addEventListener('pointerenter', () => {
      hoverSequence += 1;
      link.style.setProperty('--hover-sequence', String(hoverSequence));
      addWillChange(link, ['transform']);
    });

    link.addEventListener('pointerleave', () => {
      removeWillChange(link);
    });

    link.addEventListener('focus', () => {
      addWillChange(link, ['transform']);
    });

    link.addEventListener('blur', () => {
      removeWillChange(link);
    });
  });
};

const updateScrollIndicators = () => {
  if (!navScrollableRef || !navContainerRef) {
    return;
  }

  const topIndicator = navContainerRef.querySelector<HTMLElement>('[data-scroll-indicator="top"]');
  const bottomIndicator = navContainerRef.querySelector<HTMLElement>('[data-scroll-indicator="bottom"]');

  if (!topIndicator || !bottomIndicator) {
    return;
  }

  const { scrollTop, scrollHeight, clientHeight } = navScrollableRef;

  topIndicator.classList.toggle('is-visible', scrollTop > 8);
  bottomIndicator.classList.toggle('is-visible', scrollTop + clientHeight < scrollHeight - 8);
};

const setupScrollIndicators = () => {
  if (!navScrollableRef) {
    return;
  }

  updateScrollIndicators();
  const throttled = rafThrottle(updateScrollIndicators);

  navScrollableRef.addEventListener('scroll', throttled);
  window.addEventListener('resize', throttled);
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
      const targetSection = topEntry.target as HTMLElement;
      const matchedNav = Array.from(sectionRefs.entries()).find(([, section]) => section === targetSection);

      if (matchedNav && matchedNav[0] !== sidebarState.activeNavId) {
        const navId = matchedNav[0];
        const navItem = navItemRefs.get(navId);
        const label = navItem?.dataset.navLabel ?? navId;
        // Prevent projects tab from being activated during homepage scrolling
        // Only allow projects tab activation if currently not on home, or if explicitly navigating to projects
        if (navId === 'projects' && sidebarState.activeNavId === 'home') {
          return;
        }

        setActiveNavItem(navId, { silent: true });
        emitActiveChange(navId, label, true);
      }
    },
    { rootMargin: '-40% 0px -40% 0px', threshold: [0.1, 0.25, 0.5, 0.75] }
  );
};

interface SetActiveOptions {
  silent?: boolean;
}

export const setActiveNavItem = (itemId: string | null, options: SetActiveOptions = {}) => {
  if (!itemId || !navItemRefs.has(itemId)) {
    return;
  }

  if (sidebarState.activeNavId === itemId) {
    return;
  }

  const nextItem = navItemRefs.get(itemId);

  if (!nextItem) {
    return;
  }

  navItemRefs.forEach((item, id) => {
    const isActive = id === itemId;
    item.classList.toggle('is-active', isActive);
    item.setAttribute('aria-current', isActive ? 'page' : 'false');
    item.setAttribute('aria-pressed', String(isActive));
  });

  sidebarState.activeNavId = itemId;
  const label = nextItem.dataset.navLabel ?? itemId;
  emitActiveChange(itemId, label, options.silent);
};

export const handleNavActivation = (itemId: string, behavior: ScrollBehavior = 'smooth') => {
  // Import router functions dynamically to avoid circular dependencies
  import('@/utils/router').then(({ navigateTo }) => {
    // For projects, resume, and other dedicated pages, use routing
    if (itemId === 'projects' || itemId === 'resume') {
      navigateTo(itemId);
      setActiveNavItem(itemId);
      emitNavigationEvent(itemId);
      return;
    }

    // For home and other sections, use traditional scroll behavior
    const target = findSectionTarget(itemId);
    const motionSafe: ScrollBehavior = prefersReducedMotion() ? 'auto' : behavior;

    if (target) {
      target.scrollIntoView({ behavior: motionSafe, block: 'start' });
    }

    setActiveNavItem(itemId);
    emitNavigationEvent(itemId);
  });
};

const setupNavItemInteractions = () => {
  navItemRefs.forEach((item, id) => {
    item.addEventListener('click', (event) => {
      event.preventDefault();
      handleNavActivation(id);
    });

    item.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handleNavActivation(id);
      }
    });
  });
};

const setupSkipLink = () => {
  if (!skipLinkRef) {
    return;
  }

  skipLinkRef.addEventListener('focus', () => {
    skipLinkRef?.classList.add('is-visible');
  });

  skipLinkRef.addEventListener('blur', () => {
    skipLinkRef?.classList.remove('is-visible');
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
  setupScrollIndicators();
  setupNavItemInteractions();

  findSectionNodes();
  setupSectionObserver();

  if (sidebarState.activeNavId) {
    setActiveNavItem(sidebarState.activeNavId, { silent: true });
  }
};

const renderNavItem = (item: NavigationItem, isActive: boolean): string => `
  <button
    type="button"
    class="sidebar-nav-item${isActive ? ' is-active' : ''} focus:outline-none"
    data-sidebar-nav-item
    data-nav-id="${item.id}"
    data-nav-label="${escapeHtml(item.label)}"
    aria-pressed="${isActive}"
    aria-current="${isActive ? 'page' : 'false'}"
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
  const emailLink = contact.email ? `mailto:${contact.email}` : '#';
  const activeNavId = sidebarState.activeNavId ?? navigation[0]?.id ?? '';

  return `
    <aside
      class="sidebar flex h-full flex-col justify-between border-r border-[var(--color-border,#222)] bg-gray-900 p-6 text-white"
      role="navigation"
      aria-label="Main navigation"
      data-sidebar
    >
      <a href="#main-content" class="sidebar-skip-link" data-sidebar-skip>Skip to main content</a>
      <div class="flex flex-col gap-10">
        <div class="sidebar-branding group cursor-pointer" data-sidebar-branding>
          <span
            class="sidebar-branding-title text-heading-2 font-black tracking-tight"
            style="--branding-accent: var(--color-neon-cyan);"
          >
            ${branding.name}
          </span>
          <p class="sidebar-branding-tagline mt-3 max-w-xs text-sm text-gray-400">
            ${branding.tagline}
          </p>
        </div>
        <div class="sidebar-nav-container relative" data-sidebar-nav-container>
          <div class="sidebar-scroll-indicator sidebar-scroll-indicator--top" data-scroll-indicator="top"></div>
         <div class="sidebar-nav-scroll" data-sidebar-nav-scrollable>
           <nav class="sidebar-nav" aria-label="Primary navigation">
              ${navigation.map((item) => renderNavItem(item, item.id === activeNavId)).join('')}
            </nav>
          </div>
          <div class="sidebar-scroll-indicator sidebar-scroll-indicator--bottom" data-scroll-indicator="bottom"></div>
        </div>
      </div>
      <div class="mt-10 border-t border-[var(--color-border,#222)] pt-6 text-sm text-gray-400">
        <div class="flex flex-col gap-3">
          <a
            class="font-medium text-white transition-colors hover:text-[var(--color-neon-cyan)] focus-visible:text-[var(--color-neon-cyan)]"
            href="${emailLink}"
          >
            ${contact.email}
          </a>
          <div class="sidebar-socials" aria-label="Social links">
            ${contact.socials.map(renderSocialLink).join('')}
          </div>
        </div>
        <span class="sr-only" aria-live="polite" data-sidebar-announcer></span>
      </div>
    </aside>
  `;
};

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
