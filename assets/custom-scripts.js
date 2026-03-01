(() => {
  const ROOT_SELECTOR = '[data-lang-dropdown]';
  const INIT_FLAG = 'langDropdownInitialized';

  function getEls(root) {
    const form = root.closest('form');
    const button = root.querySelector('[data-lang-dropdown-button]');
    const list = root.querySelector('[data-lang-dropdown-list]');
    const valueEl = root.querySelector('[data-lang-dropdown-value]');
    const flagEl = root.querySelector('[data-lang-dropdown-flag]');
    const nativeSelect = root.querySelector('select[name="language_code"]');

    return { form, button, list, valueEl, flagEl, nativeSelect };
  }

  function setOpen(root, open) {
    const { button, list } = getEls(root);
    if (!button || !list) return;

    button.setAttribute('aria-expanded', open ? 'true' : 'false');
    list.hidden = !open;
  }

  function syncButtonFromSelected(root) {
    const { valueEl, flagEl, list, nativeSelect } = getEls(root);
    if (!valueEl || !list || !nativeSelect) return;

    const selectedLi = list.querySelector('[data-lang-value][aria-selected="true"]');
    const selectedOption = nativeSelect.selectedOptions?.[0];

    valueEl.textContent = selectedLi?.querySelector('.lang-dropdown__label')?.textContent?.trim()
      || selectedOption?.textContent?.trim()
      || '';

    if (flagEl) {
      const emoji = selectedLi?.dataset.flagEmoji
        || selectedLi?.querySelector('.lang-dropdown__flag')?.textContent?.trim()
        || '';
      flagEl.textContent = emoji;
    }
  }

  function selectValue(root, newValue) {
    const { form, list, nativeSelect } = getEls(root);
    if (!form || !list || !nativeSelect) return;

    nativeSelect.value = newValue;

    const allLi = Array.from(list.querySelectorAll('[data-lang-value]'));
    for (const li of allLi) {
      li.setAttribute('aria-selected', li.dataset.langValue === newValue ? 'true' : 'false');
    }

    syncButtonFromSelected(root);
    form.submit();
  }

  function closeAll(exceptRoot = null) {
    document.querySelectorAll(ROOT_SELECTOR).forEach((root) => {
      if (exceptRoot && root === exceptRoot) return;
      setOpen(root, false);
    });
  }

  function init(root) {
    if (!(root instanceof HTMLElement)) return;
    if (root.dataset[INIT_FLAG] === 'true') return;
    root.dataset[INIT_FLAG] = 'true';

    const { form, button, list, valueEl, nativeSelect } = getEls(root);
    if (!form || !button || !list || !valueEl || !nativeSelect) return;

    setOpen(root, false);
    syncButtonFromSelected(root);

    button.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      const willOpen = list.hidden;
      closeAll(root);
      setOpen(root, willOpen);

      if (willOpen) {
        const selected = list.querySelector('[data-lang-value][aria-selected="true"]')
          || list.querySelector('[data-lang-value]');
        selected?.focus?.();
      }
    });

    list.addEventListener('click', (e) => {
      const target = e.target instanceof Element ? e.target : null;
      const li = target?.closest?.('[data-lang-value]');
      if (!(li instanceof HTMLElement)) return;

      e.preventDefault();
      e.stopPropagation();

      selectValue(root, li.dataset.langValue);
    });

    list.addEventListener('keydown', (e) => {
      const target = e.target instanceof Element ? e.target : null;
      const current = target?.closest?.('[data-lang-value]');
      const items = Array.from(list.querySelectorAll('[data-lang-value]'));

      if (!items.length) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        setOpen(root, false);
        button.focus();
        return;
      }

      if (!(current instanceof HTMLElement)) return;

      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        selectValue(root, current.dataset.langValue);
        return;
      }

      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        const idx = items.indexOf(current);
        const nextIdx = e.key === 'ArrowDown'
          ? Math.min(items.length - 1, idx + 1)
          : Math.max(0, idx - 1);
        items[nextIdx]?.focus?.();
      }
    });
  }

  function initAll() {
    document.querySelectorAll(ROOT_SELECTOR).forEach(init);
  }

  // Закрытие по клику снаружи и Escape (один раз на документ)
  document.addEventListener('click', () => closeAll(null));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeAll(null);
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }

  document.addEventListener('shopify:section:load', initAll);
  document.addEventListener('shopify:section:reorder', initAll);
  document.addEventListener('shopify:block:select', initAll);
})();