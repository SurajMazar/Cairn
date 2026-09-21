import type { ReactNode } from 'react';
import ui from '../styles/ui.module.css';

interface EmptyStateProps {
  title: string;
  body: string;
  action?: ReactNode;
}

export function EmptyState({ title, body, action }: EmptyStateProps) {
  return (
    <div className={ui.empty}>
      <p className={ui.emptyTitle}>{title}</p>
      <p className={ui.emptyBody}>{body}</p>
      {action}
    </div>
  );
}
