/**
 * A deliberately small icon set. Icons are used for controls that would
 * otherwise have no visible affordance (close, back, star) and never as
 * decoration beside text that already says what it is.
 */
export type IconName =
  | 'search'
  | 'star'
  | 'starFilled'
  | 'plus'
  | 'close'
  | 'menu'
  | 'back'
  | 'forward'
  | 'refresh'
  | 'external'
  | 'chevronDown'
  | 'chevronRight'
  | 'list'
  | 'grid'
  | 'check'
  | 'trash'
  | 'edit'
  | 'note';

const PATHS: Record<IconName, JSX.Element> = {
  search: (
    <>
      <circle cx="7.5" cy="7.5" r="5" />
      <path d="M11.2 11.2 14.5 14.5" />
    </>
  ),
  star: <path d="M8 1.9 9.9 6l4.4.5-3.3 3 .9 4.4L8 11.7 4.1 13.9l.9-4.4-3.3-3L6.1 6z" />,
  starFilled: (
    <path
      d="M8 1.9 9.9 6l4.4.5-3.3 3 .9 4.4L8 11.7 4.1 13.9l.9-4.4-3.3-3L6.1 6z"
      fill="currentColor"
    />
  ),
  plus: <path d="M8 3v10M3 8h10" />,
  close: <path d="M4 4l8 8M12 4l-8 8" />,
  menu: <path d="M2.5 4.5h11M2.5 8h11M2.5 11.5h11" />,
  back: <path d="M9.5 3.5 5 8l4.5 4.5" />,
  forward: <path d="M6.5 3.5 11 8l-4.5 4.5" />,
  refresh: (
    <>
      <path d="M13 8a5 5 0 1 1-1.6-3.7" />
      <path d="M13.2 2.6v2.8h-2.8" />
    </>
  ),
  external: (
    <>
      <path d="M12.5 8.8v3.7a1 1 0 0 1-1 1h-8a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1h3.7" />
      <path d="M9.5 2.5h4v4M13.5 2.5 7.6 8.4" />
    </>
  ),
  chevronDown: <path d="M4 6.5 8 10.5l4-4" />,
  chevronRight: <path d="M6.5 4 10.5 8l-4 4" />,
  list: <path d="M2.5 4.5h11M2.5 8h11M2.5 11.5h11" />,
  grid: (
    <>
      <rect x="2.5" y="2.5" width="4.5" height="4.5" />
      <rect x="9" y="2.5" width="4.5" height="4.5" />
      <rect x="2.5" y="9" width="4.5" height="4.5" />
      <rect x="9" y="9" width="4.5" height="4.5" />
    </>
  ),
  check: <path d="M3 8.5 6.5 12 13 4.5" />,
  trash: (
    <>
      <path d="M2.8 4.3h10.4M6 4.3V2.8h4v1.5M4.3 4.3l.6 9h6.2l.6-9" />
    </>
  ),
  edit: (
    <>
      <path d="M11.2 2.6 13.4 4.8 5.6 12.6l-3 .8.8-3z" />
    </>
  ),
  note: (
    <>
      <path d="M3.5 2.5h9v11h-9z" />
      <path d="M5.8 5.6h4.4M5.8 8h4.4M5.8 10.4h2.6" />
    </>
  ),
};

interface IconProps {
  name: IconName;
  size?: number;
  className?: string;
}

export function Icon({ name, size = 16, className }: IconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {PATHS[name]}
    </svg>
  );
}
