import { useEffect, useState } from 'react';
import { applyUpdate, dismissUpdate, onUpdateReady } from '../lib/serviceWorker';
import styles from './shell.module.css';
import ui from '../styles/ui.module.css';

/**
 * Shown when a newer build has finished downloading in the background. The
 * update is not applied until it is accepted, so it cannot interrupt anything.
 */
export function UpdateBanner() {
  const [ready, setReady] = useState(false);

  useEffect(() => onUpdateReady(setReady), []);

  if (!ready) return null;

  return (
    <div className={styles.updateBar} role="status">
      <span className={styles.updateText}>A new version of Cairn is ready.</span>
      <button
        type="button"
        className={`${ui.btn} ${ui.btnSmall}`}
        onClick={() => {
          dismissUpdate();
          setReady(false);
        }}
      >
        Later
      </button>
      <button type="button" className={`${ui.btn} ${ui.btnSmall} ${ui.btnPrimary}`} onClick={applyUpdate}>
        Reload now
      </button>
    </div>
  );
}
