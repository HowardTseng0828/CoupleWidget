import React from 'react';

export type IconName =
  | 'heart'
  | 'shoe'
  | 'flower'
  | 'camera'
  | 'map'
  | 'settings'
  | 'spark'
  | 'drop'
  | 'close'
  | 'dice';

interface AppIconProps {
  name: IconName;
  className?: string;
}

export const AppIcon: React.FC<AppIconProps> = ({ name, className = '' }) => {
  const common = {
    className,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  };

  switch (name) {
    case 'heart':
      return (
        <svg {...common}>
          <path d="M19.4 5.6c-1.7-1.7-4.4-1.7-6.1 0L12 6.9l-1.3-1.3c-1.7-1.7-4.4-1.7-6.1 0s-1.7 4.4 0 6.1L12 19l7.4-7.3c1.7-1.7 1.7-4.4 0-6.1Z" />
        </svg>
      );
    case 'shoe':
      return (
        <svg {...common}>
          <path d="M4 14.5c2.8.6 5.5.5 8.1-.4l2.8 2.7c.7.7 1.6 1.1 2.6 1.1H21v1H6.1A3.1 3.1 0 0 1 3 15.8v-1.5c0-.6.5-.9 1-.8Z" />
          <path d="M8.5 14.7 7 9.5h3.4l1.9 4.7" />
          <path d="M14.7 16.5c1.6-.8 3.2-.8 4.8 0" />
        </svg>
      );
    case 'flower':
      return (
        <svg {...common}>
          <path d="M12 12c2.7-2.7 2.7-5.4 0-8-2.7 2.6-2.7 5.3 0 8Z" />
          <path d="M12 12c2.7 2.7 5.4 2.7 8 0-2.6-2.7-5.3-2.7-8 0Z" />
          <path d="M12 12c-2.7 2.7-5.4 2.7-8 0 2.6-2.7 5.3-2.7 8 0Z" />
          <path d="M12 12v8" />
          <path d="M12 17c-2.4-.3-4.1-1.4-5-3.2" />
        </svg>
      );
    case 'camera':
      return (
        <svg {...common}>
          <path d="M6.5 7.5 8 5h8l1.5 2.5H20a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9.5a2 2 0 0 1 2-2h2.5Z" />
          <circle cx="12" cy="14" r="3.5" />
        </svg>
      );
    case 'map':
      return (
        <svg {...common}>
          <path d="M12 21s6-5.4 6-11a6 6 0 0 0-12 0c0 5.6 6 11 6 11Z" />
          <circle cx="12" cy="10" r="2.2" />
        </svg>
      );
    case 'settings':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1-2 3.4-.2-.1a1.6 1.6 0 0 0-1.8-.3l-.8.3a1.6 1.6 0 0 0-1 1.5V22h-4v-.3a1.6 1.6 0 0 0-1-1.5l-.8-.3a1.6 1.6 0 0 0-1.8.3l-.2.1-2-3.4.1-.1A1.6 1.6 0 0 0 4.6 15l-.4-.8a1.6 1.6 0 0 0-1.5-1H2v-4h.7a1.6 1.6 0 0 0 1.5-1l.4-.8a1.6 1.6 0 0 0-.3-1.8l-.1-.1 2-3.4.2.1a1.6 1.6 0 0 0 1.8.3l.8-.3A1.6 1.6 0 0 0 10 1h4v.3a1.6 1.6 0 0 0 1 1.5l.8.3a1.6 1.6 0 0 0 1.8-.3l.2-.1 2 3.4-.1.1a1.6 1.6 0 0 0-.3 1.8l.4.8a1.6 1.6 0 0 0 1.5 1h.7v4h-.7a1.6 1.6 0 0 0-1.5 1l-.4.8Z" />
        </svg>
      );
    case 'spark':
      return (
        <svg {...common}>
          <path d="M12 2 9.8 8.8 3 11l6.8 2.2L12 20l2.2-6.8L21 11l-6.8-2.2L12 2Z" />
        </svg>
      );
    case 'drop':
      return (
        <svg {...common}>
          <path d="M12 3s6 6.4 6 11a6 6 0 0 1-12 0c0-4.6 6-11 6-11Z" />
        </svg>
      );
    case 'close':
      return (
        <svg {...common}>
          <path d="M18 6 6 18" />
          <path d="m6 6 12 12" />
        </svg>
      );
    case 'dice':
      return (
        <svg {...common}>
          <rect x="4" y="4" width="16" height="16" rx="3" />
          <circle cx="9" cy="9" r="1" fill="currentColor" stroke="none" />
          <circle cx="15" cy="15" r="1" fill="currentColor" stroke="none" />
          <circle cx="15" cy="9" r="1" fill="currentColor" stroke="none" />
          <circle cx="9" cy="15" r="1" fill="currentColor" stroke="none" />
        </svg>
      );
  }
};
