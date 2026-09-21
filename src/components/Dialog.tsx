import { useCallback, useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from './Icon';
import styles from './dialog.module.css';
import ui from '../styles/ui.module.css';

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  variant?: 'center' | 'side';
  wide?: boolean;
  children: ReactNode;
  footer?: ReactNode;
  spreadFooter?: boolean;
  initialFocus?: 'first' | 'none';
}

/**
 * Follows the ARIA dialog pattern: focus moves in on open, Tab is trapped,
 * Escape closes, and focus returns to whatever opened it.
 */
export function Dialog({
  open,
  onClose,
  title,
  subtitle,
  variant = 'center',
  wide = false,
  children,
  footer,
  spreadFooter = false,
  initialFocus = 'first',
}: DialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const titleId = useRef(`dialog-title-${Math.random().toString(36).slice(2, 8)}`).current;

  useEffect(() => {
    if (!open) return undefined;
    returnFocusRef.current = document.activeElement as HTMLElement | null;

    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';

    const node = dialogRef.current;
    if (node && initialFocus === 'first') {
      const target = node.querySelector<HTMLElement>(FOCUSABLE);
      (target ?? node).focus();
    } else {
      node?.focus();
    }

    return () => {
      document.body.style.overflow = overflow;
      returnFocusRef.current?.focus?.();
    };
  }, [open, initialFocus]);

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key !== 'Tab') return;

      const node = dialogRef.current;
      if (!node) return;
      const focusable = Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (element) => element.offsetParent !== null || element === document.activeElement,
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    },
    [onClose],
  );

  if (!open) return null;

  return createPortal(
    <div
      className={`${styles.backdrop} ${variant === 'side' ? styles.side : styles.center}`}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        className={`${styles.dialog} ${wide ? styles.wide : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onKeyDown={onKeyDown}
      >
        <header className={styles.header}>
          <div>
            <h2 className={styles.title} id={titleId}>
              {title}
            </h2>
            {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
          </div>
          <button type="button" className={ui.iconBtn} onClick={onClose} aria-label="Close dialog">
            <Icon name="close" />
          </button>
        </header>
        <div className={styles.body}>{children}</div>
        {footer ? (
          <footer className={`${styles.footer} ${spreadFooter ? styles.footerSpread : ''}`}>{footer}</footer>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
