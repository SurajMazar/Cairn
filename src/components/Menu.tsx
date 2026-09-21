import { useCallback, useEffect, useRef, useState } from 'react';
import { Icon } from './Icon';
import styles from './menu.module.css';
import ui from '../styles/ui.module.css';

export interface MenuItem {
  label: string;
  onSelect: () => void;
  danger?: boolean;
  separatorBefore?: boolean;
}

interface MenuProps {
  label: string;
  items: MenuItem[];
}

/**
 * A small menu following the ARIA menu button pattern: arrow keys move through
 * the items, Escape closes and returns focus, and a click elsewhere dismisses.
 */
export function Menu({ label, items }: MenuProps) {
  const [open, setOpen] = useState(false);
  const [dropUp, setDropUp] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const close = useCallback(
    (returnFocus = true) => {
      setOpen(false);
      if (returnFocus) buttonRef.current?.focus();
    },
    [],
  );

  useEffect(() => {
    if (!open) return undefined;

    const onPointerDown = (event: PointerEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onScrollOrResize = () => setOpen(false);

    document.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('resize', onScrollOrResize);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('resize', onScrollOrResize);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    // Flip above the button when there is not enough room below it.
    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) setDropUp(window.innerHeight - rect.bottom < 200);
    const first = listRef.current?.querySelector<HTMLButtonElement>('button');
    first?.focus();
  }, [open]);

  const onListKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.stopPropagation();
      close();
      return;
    }
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;

    event.preventDefault();
    const buttons = Array.from(listRef.current?.querySelectorAll<HTMLButtonElement>('button') ?? []);
    if (buttons.length === 0) return;
    const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
    const next =
      event.key === 'ArrowDown'
        ? buttons[(index + 1) % buttons.length]
        : buttons[(index - 1 + buttons.length) % buttons.length];
    next.focus();
  };

  return (
    <div className={styles.wrap} ref={wrapRef}>
      <button
        ref={buttonRef}
        type="button"
        className={ui.iconBtn}
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        title={label}
        onClick={() => setOpen((value) => !value)}
      >
        <Icon name="more" />
      </button>

      {open ? (
        <div
          ref={listRef}
          className={`${styles.list} ${dropUp ? styles.listUp : ''}`}
          role="menu"
          aria-label={label}
          onKeyDown={onListKeyDown}
        >
          {items.map((item) => (
            <div key={item.label}>
              {item.separatorBefore ? <div className={styles.separator} role="separator" /> : null}
              <button
                type="button"
                role="menuitem"
                className={`${styles.item} ${item.danger ? styles.itemDanger : ''}`}
                onClick={() => {
                  close(false);
                  item.onSelect();
                }}
              >
                {item.label}
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
