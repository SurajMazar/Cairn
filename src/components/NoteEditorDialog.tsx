import { useEffect, useRef, useState } from 'react';
import { Dialog } from './Dialog';
import ui from '../styles/ui.module.css';

interface NoteEditorDialogProps {
  open: boolean;
  mode: 'add' | 'edit';
  siteTitle: string;
  initialContent?: string;
  onSave: (content: string) => void;
  onClose: () => void;
}

export function NoteEditorDialog({
  open,
  mode,
  siteTitle,
  initialContent = '',
  onSave,
  onClose,
}: NoteEditorDialogProps) {
  const [content, setContent] = useState(initialContent);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) setContent(initialContent);
  }, [open, initialContent]);

  useEffect(() => {
    if (!open) return;
    const id = window.setTimeout(() => {
      const node = textareaRef.current;
      node?.focus();
      node?.setSelectionRange(node.value.length, node.value.length);
    }, 0);
    return () => window.clearTimeout(id);
  }, [open]);

  const save = () => {
    if (!content.trim()) return;
    onSave(content);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={mode === 'add' ? 'Add note' : 'Edit note'}
      subtitle={siteTitle}
      initialFocus="none"
      footer={
        <>
          <button type="button" className={ui.btn} onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className={`${ui.btn} ${ui.btnPrimary}`}
            onClick={save}
            disabled={!content.trim()}
          >
            {mode === 'add' ? 'Save note' : 'Save changes'}
          </button>
        </>
      }
    >
      <div className={ui.field}>
        <label className={ui.label} htmlFor="note-content">
          Note
        </label>
        <textarea
          id="note-content"
          ref={textareaRef}
          className={ui.textarea}
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="What is worth remembering about this website?"
          onKeyDown={(event) => {
            if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') save();
          }}
        />
        <p className={ui.hint}>
          Notes are searchable, so write the words you would look for later. Press Command or Control
          with Return to save.
        </p>
      </div>
    </Dialog>
  );
}
