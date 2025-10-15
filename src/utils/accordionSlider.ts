type CleanupFn = () => void;

export interface AccordionSliderOptions {
  defaultActiveId?: string;
  panelSelector?: string;
  attributeName?: string;
}

const ACTIVE_ATTRIBUTE = 'data-slider-active-id';
const PANEL_SELECTOR_DEFAULT = '[data-slider-panel]';
const PANEL_ID_ATTRIBUTE = 'panelId';

const activeInstances = new Map<HTMLElement, CleanupFn>();

const resolveRootElement = (root: string | HTMLElement): HTMLElement | null => {
  if (typeof document === 'undefined') {
    return null;
  }

  if (typeof root === 'string') {
    return document.querySelector<HTMLElement>(root);
  }

  return root;
};

const setActive = (root: HTMLElement, nextId: string | null, attributeName: string) => {
  if (!nextId) {
    root.removeAttribute(attributeName);
    return;
  }

  root.setAttribute(attributeName, nextId);
};

export const initAccordionSlider = (
  rootElement: string | HTMLElement,
  options: AccordionSliderOptions = {},
): void => {
  const root = resolveRootElement(rootElement);

  if (!root) {
    return;
  }

  destroyAccordionSlider(root);

  const panelSelector = options.panelSelector ?? PANEL_SELECTOR_DEFAULT;
  const attributeName = options.attributeName ?? ACTIVE_ATTRIBUTE;
  const panels = Array.from(root.querySelectorAll<HTMLElement>(panelSelector));

  if (panels.length === 0) {
    return;
  }

  const listeners: CleanupFn[] = [];
  const getPanelId = (panel: HTMLElement) => panel.dataset[PANEL_ID_ATTRIBUTE] ?? null;

  const [firstPanel] = panels;
  const initialPanelId = firstPanel ? getPanelId(firstPanel) : null;

  let activeId = options.defaultActiveId ?? initialPanelId;

  const syncPanelState = () => {
    panels.forEach((panel) => {
      const isActive = getPanelId(panel) === activeId;
      panel.classList.toggle('is-active', isActive);
      panel.setAttribute('aria-expanded', String(isActive));
      panel.setAttribute('tabindex', isActive ? '0' : '-1');
    });
  };

  setActive(root, activeId, attributeName);
  syncPanelState();

  const activatePanel = (panelId: string | null) => {
    if (!panelId || panelId === activeId) {
      return;
    }

    activeId = panelId;
    setActive(root, activeId, attributeName);
    syncPanelState();
  };

  const registerPanelListeners = (panel: HTMLElement) => {
    const panelId = getPanelId(panel);

    if (!panelId) {
      return;
    }

    const handlePointer = () => activatePanel(panelId);
    const handleFocus = () => activatePanel(panelId);
    const handleClick = () => activatePanel(panelId);

    panel.addEventListener('pointerenter', handlePointer);
    panel.addEventListener('focus', handleFocus);
    panel.addEventListener('click', handleClick);

    listeners.push(() => {
      panel.removeEventListener('pointerenter', handlePointer);
      panel.removeEventListener('focus', handleFocus);
      panel.removeEventListener('click', handleClick);
    });
  };

  panels.forEach((panel) => registerPanelListeners(panel));

  const handleKeyDown = (event: KeyboardEvent) => {
    const { key } = event;

    if (key !== 'ArrowLeft' && key !== 'ArrowRight') {
      return;
    }

    event.preventDefault();

    const currentIndex = panels.findIndex((panel) => getPanelId(panel) === activeId);

    if (currentIndex === -1) {
      return;
    }

    const delta = key === 'ArrowLeft' ? -1 : 1;
    const nextIndex = (currentIndex + delta + panels.length) % panels.length;
    const nextPanel = panels[nextIndex];

    if (!nextPanel) {
      return;
    }

    const nextId = getPanelId(nextPanel);

    if (nextId) {
      activatePanel(nextId);
      nextPanel.focus({ preventScroll: true });
    }
  };

  root.addEventListener('keydown', handleKeyDown);
  listeners.push(() => root.removeEventListener('keydown', handleKeyDown));

  activeInstances.set(root, () => {
    listeners.forEach((cleanup) => cleanup());
    listeners.length = 0;
    activeInstances.delete(root);
  });
};

export const destroyAccordionSlider = (rootElement: string | HTMLElement): void => {
  const root = resolveRootElement(rootElement);

  if (!root) {
    return;
  }

  const cleanup = activeInstances.get(root);
  cleanup?.();
};
