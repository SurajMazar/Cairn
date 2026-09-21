import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { Bookmark } from '../types';
import { BookmarkFormDialog, type BookmarkFormPrefill } from '../components/BookmarkFormDialog';
import styles from '../components/toast.module.css';

interface ToastAction {
  label: string;
  onClick: () => void;
}

interface Toast {
  id: number;
  message: string;
  action?: ToastAction;
}

interface UiContextValue {
  notify: (message: string, action?: ToastAction) => void;
  openAddBookmark: (prefill?: BookmarkFormPrefill) => void;
  openEditBookmark: (bookmark: Bookmark) => void;
}

const UiContext = createContext<UiContextValue | null>(null);

export function UiProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Bookmark | null>(null);
  const [prefill, setPrefill] = useState<BookmarkFormPrefill | undefined>(undefined);
  const nextId = useRef(1);

  const notify = useCallback((message: string, action?: ToastAction) => {
    const id = nextId.current++;
    setToasts((current) => [...current, { id, message, action }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 5000);
  }, []);

  const openAddBookmark = useCallback((next?: BookmarkFormPrefill) => {
    setEditing(null);
    setPrefill(next);
    setFormOpen(true);
  }, []);

  const openEditBookmark = useCallback((bookmark: Bookmark) => {
    setPrefill(undefined);
    setEditing(bookmark);
    setFormOpen(true);
  }, []);

  const value = useMemo(
    () => ({ notify, openAddBookmark, openEditBookmark }),
    [notify, openAddBookmark, openEditBookmark],
  );

  return (
    <UiContext.Provider value={value}>
      {children}
      <BookmarkFormDialog
        open={formOpen}
        bookmark={editing}
        prefill={prefill}
        onClose={() => setFormOpen(false)}
        onSaved={notify}
      />
      <div className={styles.region} role="status" aria-live="polite">
        {toasts.map((toast) => (
          <div key={toast.id} className={styles.toast}>
            <span>{toast.message}</span>
            {toast.action ? (
              <button
                type="button"
                className={styles.action}
                onClick={() => {
                  toast.action?.onClick();
                  setToasts((current) => current.filter((item) => item.id !== toast.id));
                }}
              >
                {toast.action.label}
              </button>
            ) : null}
          </div>
        ))}
      </div>
    </UiContext.Provider>
  );
}

export function useUi(): UiContextValue {
  const context = useContext(UiContext);
  if (!context) throw new Error('useUi must be used inside UiProvider');
  return context;
}
