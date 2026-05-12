/* ============================================================
   TOOLTIP — Simple hover tooltip
   ============================================================ */

import { type ReactNode, useState } from 'react';

interface TooltipProps {
  content: string;
  children: ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export function Tooltip({ content, children, position = 'top' }: TooltipProps) {
  const [visible, setVisible] = useState(false);

  let posClasses = '';
  switch (position) {
    case 'top': posClasses = 'bottom-full left-1/2 -translate-x-1/2 mb-1.5'; break;
    case 'bottom': posClasses = 'top-full left-1/2 -translate-x-1/2 mt-1.5'; break;
    case 'left': posClasses = 'top-1/2 right-full -translate-y-1/2 mr-1.5'; break;
    case 'right': posClasses = 'top-1/2 left-full -translate-y-1/2 ml-1.5'; break;
  }

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && (
        <div
          className={[
            'absolute z-50 px-2 py-1',
            'text-[11px] font-medium text-text-primary whitespace-nowrap',
            'bg-surface-overlay border border-border-default rounded-md',
            'shadow-md pointer-events-none',
            'animate-fade-in',
            posClasses,
          ].join(' ')}
        >
          {content}
        </div>
      )}
    </div>
  );
}
