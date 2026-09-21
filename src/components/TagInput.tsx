import { useMemo, useState, type KeyboardEvent } from 'react';
import { useLibrary } from '../context/LibraryContext';
import { Icon } from './Icon';
import styles from './form.module.css';
import ui from '../styles/ui.module.css';

interface TagInputProps {
  value: string[];
  onChange: (names: string[]) => void;
  id?: string;
}

/** Works in tag names; ids are resolved once, on save. */
export function TagInput({ value, onChange, id }: TagInputProps) {
  const { tags } = useLibrary();
  const [draft, setDraft] = useState('');

  const suggestions = useMemo(() => {
    const taken = new Set(value.map((name) => name.toLowerCase()));
    const query = draft.trim().toLowerCase();
    return tags
      .filter((tag) => !taken.has(tag.name.toLowerCase()))
      .filter((tag) => (query ? tag.name.toLowerCase().includes(query) : true))
      .slice(0, 8);
  }, [tags, value, draft]);

  const add = (raw: string) => {
    const name = raw.trim().replace(/^#/, '');
    if (!name) return;
    if (value.some((item) => item.toLowerCase() === name.toLowerCase())) {
      setDraft('');
      return;
    }
    onChange([...value, name]);
    setDraft('');
  };

  const remove = (name: string) => {
    onChange(value.filter((item) => item !== name));
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      add(draft);
      return;
    }
    if (event.key === 'Backspace' && draft === '' && value.length > 0) {
      remove(value[value.length - 1]);
    }
  };

  return (
    <div>
      <div className={styles.tagBox}>
        {value.map((name) => (
          <span key={name} className={ui.chip}>
            {name}
            <button
              type="button"
              className={ui.chipRemove}
              onClick={() => remove(name)}
              aria-label={`Remove tag ${name}`}
            >
              <Icon name="close" size={11} />
            </button>
          </span>
        ))}
        <input
          id={id}
          className={styles.tagInput}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={onKeyDown}
          onBlur={() => add(draft)}
          placeholder={value.length === 0 ? 'Type a tag, then press Enter' : 'Add another'}
          autoComplete="off"
        />
      </div>
      {suggestions.length > 0 ? (
        <div className={styles.suggestions}>
          {suggestions.map((tag) => (
            <button key={tag.id} type="button" className={ui.chip} onClick={() => add(tag.name)}>
              {tag.name}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
