import { useMemo, useRef, useState } from 'react';
import type { LibraryData, OpenLinksIn, SortKey, ThemeChoice, ViewMode } from '../types';
import { SEARCH_ENGINES, SEARCH_ENGINE_IDS, type SearchEngineId } from '../lib/searchEngines';
import { useLibrary } from '../context/LibraryContext';
import { useUi } from '../context/UiContext';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { isStandalone } from '../hooks/useOpenSite';
import { SORT_LABELS } from '../lib/search';
import { buildExport, downloadJson, exportFilename, parseImport, type ImportReport } from '../storage/transfer';
import { STORAGE_VERSION } from '../storage';
import styles from './settings.module.css';
import page from '../styles/page.module.css';
import ui from '../styles/ui.module.css';

const THEMES: Array<{ value: ThemeChoice; label: string }> = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

const VIEWS: Array<{ value: ViewMode; label: string }> = [
  { value: 'list', label: 'List' },
  { value: 'grid', label: 'Grid' },
];

const OPEN_MODES: Array<{ value: OpenLinksIn; label: string }> = [
  { value: 'newTab', label: 'New tab' },
  { value: 'sameTab', label: 'Same window' },
];

export function SettingsPage() {
  const {
    bookmarks,
    categories,
    tags,
    preferences,
    setPreferences,
    storageAvailable,
    importLibrary,
    resetLibrary,
    loadSampleData,
  } = useLibrary();
  const { notify } = useUi();

  const fileRef = useRef<HTMLInputElement>(null);
  const [report, setReport] = useState<ImportReport | null>(null);
  const [pendingData, setPendingData] = useState<LibraryData | null>(null);
  const [confirmReplace, setConfirmReplace] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const noteCount = bookmarks.reduce((total, bookmark) => total + bookmark.notes.length, 0);
  const installed = isStandalone();

  const approximateSize = useMemo(() => {
    const bytes = new Blob([JSON.stringify({ bookmarks, categories, tags })]).size;
    if (bytes < 1024) return `${bytes} bytes`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  }, [bookmarks, categories, tags]);

  const onFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const parsed = parseImport(text);
    setReport(parsed);
    setPendingData(parsed.ok && parsed.data ? parsed.data : null);
  };

  const clearImport = () => {
    setReport(null);
    setPendingData(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const runImport = (mode: 'merge' | 'replace') => {
    if (!pendingData) return;
    const result = importLibrary(pendingData, mode);
    notify(
      mode === 'replace'
        ? `Library replaced with ${result.added} websites.`
        : `Merged ${result.added} new websites and updated ${result.updated}.`,
    );
    clearImport();
  };

  return (
    <>
      <header className={page.header}>
        <h1 className={page.title}>Settings</h1>
        <p className={page.lede}>
          Everything in this library is stored in this browser, on this device. There is no account and
          nothing is uploaded, so export a copy if the data matters to you.
        </p>
      </header>

      <section className={styles.block}>
        <h2 className={styles.blockTitle}>Appearance and defaults</h2>

        <div className={styles.setting}>
          <div className={styles.settingText}>
            <p className={styles.settingName}>Theme</p>
            <p className={styles.settingHint}>System follows your operating system setting.</p>
          </div>
          <div className={styles.segmented} role="group" aria-label="Theme">
            {THEMES.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`${styles.segment} ${
                  preferences.theme === option.value ? styles.segmentOn : ''
                }`}
                onClick={() => setPreferences({ theme: option.value })}
                aria-pressed={preferences.theme === option.value}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.setting}>
          <div className={styles.settingText}>
            <p className={styles.settingName}>Search the web with</p>
            <p className={styles.settingHint}>
              {SEARCH_ENGINES[preferences.searchEngine].appIntercepts
                ? 'Searches open in a new browser tab. On a phone with the Google app installed, the system may hand the search to that app instead, which a web page cannot prevent. The other engines here are not claimed by an app, so they always land in a tab.'
                : 'Searches open in a new browser tab. No installed app claims this engine, so it will not be intercepted on a phone.'}
            </p>
          </div>
          <select
            className={ui.select}
            style={{ width: 'auto' }}
            value={preferences.searchEngine}
            onChange={(event) => setPreferences({ searchEngine: event.target.value as SearchEngineId })}
            aria-label="Search the web with"
          >
            {SEARCH_ENGINE_IDS.map((id) => (
              <option key={id} value={id}>
                {SEARCH_ENGINES[id].label}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.setting}>
          <div className={styles.settingText}>
            <p className={styles.settingName}>Open saved websites in</p>
            <p className={styles.settingHint}>
              {installed
                ? 'You are running this as an installed app. A new tab hands the link to an in-app browser you can back out of; same window replaces this view and relies on the back gesture to return. Your library is untouched either way.'
                : 'A new tab keeps this page where it is. Same window replaces it, which suits an installed app on a phone.'}
            </p>
          </div>
          <div className={styles.segmented} role="group" aria-label="Open saved websites in">
            {OPEN_MODES.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`${styles.segment} ${
                  preferences.openLinksIn === option.value ? styles.segmentOn : ''
                }`}
                onClick={() => setPreferences({ openLinksIn: option.value })}
                aria-pressed={preferences.openLinksIn === option.value}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.setting}>
          <div className={styles.settingText}>
            <p className={styles.settingName}>Default layout</p>
            <p className={styles.settingHint}>List is denser; grid is easier to scan visually.</p>
          </div>
          <div className={styles.segmented} role="group" aria-label="Default layout">
            {VIEWS.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`${styles.segment} ${
                  preferences.viewMode === option.value ? styles.segmentOn : ''
                }`}
                onClick={() => setPreferences({ viewMode: option.value })}
                aria-pressed={preferences.viewMode === option.value}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.setting}>
          <div className={styles.settingText}>
            <p className={styles.settingName}>Default sorting</p>
            <p className={styles.settingHint}>
              Recently updated keeps whatever you last worked on at the top.
            </p>
          </div>
          <select
            className={ui.select}
            style={{ width: 'auto' }}
            value={preferences.sortKey}
            onChange={(event) => setPreferences({ sortKey: event.target.value as SortKey })}
            aria-label="Default sorting"
          >
            {(Object.keys(SORT_LABELS) as SortKey[]).map((key) => (
              <option key={key} value={key}>
                {SORT_LABELS[key]}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.setting}>
          <div className={styles.settingText}>
            <p className={styles.settingName}>Load favicons from the web</p>
            <p className={styles.settingHint}>
              Off by default. Turning this on asks a third party icon service for each saved domain,
              which tells that service which sites you have saved.
            </p>
          </div>
          <div className={styles.segmented} role="group" aria-label="Load favicons from the web">
            <button
              type="button"
              className={`${styles.segment} ${!preferences.loadRemoteFavicons ? styles.segmentOn : ''}`}
              onClick={() => setPreferences({ loadRemoteFavicons: false })}
              aria-pressed={!preferences.loadRemoteFavicons}
            >
              Off
            </button>
            <button
              type="button"
              className={`${styles.segment} ${preferences.loadRemoteFavicons ? styles.segmentOn : ''}`}
              onClick={() => setPreferences({ loadRemoteFavicons: true })}
              aria-pressed={preferences.loadRemoteFavicons}
            >
              On
            </button>
          </div>
        </div>
      </section>

      <section className={styles.block}>
        <h2 className={styles.blockTitle}>Your data</h2>
        <div className={styles.figures}>
          <div>
            <p className={styles.figureValue}>{bookmarks.length}</p>
            <p className={styles.figureLabel}>Websites</p>
          </div>
          <div>
            <p className={styles.figureValue}>{noteCount}</p>
            <p className={styles.figureLabel}>Notes</p>
          </div>
          <div>
            <p className={styles.figureValue}>{categories.length}</p>
            <p className={styles.figureLabel}>Categories</p>
          </div>
          <div>
            <p className={styles.figureValue}>{tags.length}</p>
            <p className={styles.figureLabel}>Tags</p>
          </div>
          <div>
            <p className={styles.figureValue}>{approximateSize}</p>
            <p className={styles.figureLabel}>Stored</p>
          </div>
        </div>
        <p className={styles.blockBody}>
          {storageAvailable
            ? `Saved in this browser under local storage format v${STORAGE_VERSION}. Clearing site data for this page removes it.`
            : 'This browser is blocking local storage, so nothing is being saved between visits.'}
        </p>

        {bookmarks.length === 0 ? (
          <>
            <p className={styles.blockBody}>
              A new library starts empty. If you want something to look at while trying the app out,
              this fills it with fifteen example websites, with categories, tags and notes.
            </p>
            <button
              type="button"
              className={ui.btn}
              onClick={() => {
                loadSampleData();
                notify('Sample library loaded.');
              }}
            >
              Load the sample library
            </button>
          </>
        ) : null}
      </section>

      <section className={styles.block}>
        <h2 className={styles.blockTitle}>Export</h2>
        <p className={styles.blockBody}>
          Download everything as a single JSON file: websites, notes, categories and tags. Keep it
          somewhere safe, or use it to move your library to another browser.
        </p>
        <button
          type="button"
          className={ui.btn}
          onClick={() => {
            downloadJson(exportFilename(), buildExport({ bookmarks, categories, tags }));
            notify('Export downloaded.');
          }}
        >
          Export collection
        </button>
      </section>

      <section className={styles.block}>
        <h2 className={styles.blockTitle}>Import</h2>
        <p className={styles.blockBody}>
          Choose a JSON file exported from this app. It is checked before anything is written, and you
          decide whether to merge it with what you already have or replace everything.
        </p>

        <input
          ref={fileRef}
          className={styles.fileInput}
          type="file"
          accept="application/json,.json"
          onChange={onFile}
          aria-label="Choose a library file to import"
        />

        {report ? (
          <div className={styles.report} style={{ marginTop: 'var(--space-4)' }}>
            {report.ok ? (
              <>
                <p className={styles.reportTitle}>This file contains</p>
                <div className={styles.reportList}>
                  <span>
                    {report.counts.bookmarks} websites, {report.counts.notes} notes,{' '}
                    {report.counts.categories} categories, {report.counts.tags} tags
                  </span>
                  {report.warnings.map((warning) => (
                    <span key={warning} className={styles.warning}>
                      {warning}
                    </span>
                  ))}
                </div>
                <div className={styles.actions}>
                  <button type="button" className={`${ui.btn} ${ui.btnPrimary}`} onClick={() => runImport('merge')}>
                    Merge with existing data
                  </button>
                  <button type="button" className={`${ui.btn} ${ui.btnDanger}`} onClick={() => setConfirmReplace(true)}>
                    Replace existing data
                  </button>
                  <button type="button" className={ui.btn} onClick={clearImport}>
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className={styles.reportTitle}>This file could not be imported</p>
                <div className={styles.reportList}>
                  <span className={styles.warning}>{report.error}</span>
                </div>
                <button type="button" className={ui.btn} onClick={clearImport}>
                  Choose another file
                </button>
              </>
            )}
          </div>
        ) : null}
      </section>

      <section className={styles.dangerZone}>
        <h2 className={styles.blockTitle}>Danger zone</h2>
        <p className={styles.blockBody}>
          Resetting permanently removes every bookmark, note, category and tag stored in this browser.
          Export first if you might want any of it back.
        </p>
        <button type="button" className={`${ui.btn} ${ui.btnDanger}`} onClick={() => setConfirmReset(true)}>
          Reset local library
        </button>
      </section>

      <ConfirmDialog
        open={confirmReplace}
        title="Replace your library?"
        description={`Your ${bookmarks.length} saved websites and ${noteCount} notes will be removed and replaced with the contents of this file. This cannot be undone.`}
        confirmLabel="Replace everything"
        danger
        onCancel={() => setConfirmReplace(false)}
        onConfirm={() => {
          setConfirmReplace(false);
          runImport('replace');
        }}
      />

      <ConfirmDialog
        open={confirmReset}
        title="Reset local library?"
        description="This permanently removes all bookmarks, notes, categories and tags stored in this browser."
        confirmLabel="Reset everything"
        danger
        onCancel={() => setConfirmReset(false)}
        onConfirm={() => {
          resetLibrary();
          setConfirmReset(false);
          notify('Local library reset.');
        }}
      />
    </>
  );
}
