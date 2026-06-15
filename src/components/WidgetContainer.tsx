import React from 'react';
import { AppIcon, type IconName } from './icons';

interface WidgetContainerProps {
  title: string;
  icon?: IconName; // 標題前的小圖示，讓每張卡頭部風格一致
  size: '2x2' | '4x2' | '4x4';
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export const WidgetContainer: React.FC<WidgetContainerProps> = ({
  title,
  icon,
  size,
  children,
  onClick,
  className = '',
}) => {
  const sizeClass =
    size === '2x2' ? 'widget-2x2' :
    size === '4x2' ? 'widget-4x2' : 'widget-4x4';

  return (
    <div
      className={`glass-panel ${sizeClass} ${className} flex flex-col select-none`}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      {/* 卡片頭部：固定留白 + 統一字級，標題不再貼左被裁 */}
      <div className="widget-header">
        {icon && (
          <span className="widget-icon">
            <AppIcon name={icon} className="w-3.5 h-3.5" />
          </span>
        )}
        <span className="text-[12px] font-bold tracking-[0.14em] text-[color:var(--text-muted)] uppercase truncate">
          {title}
        </span>
      </div>

      {/* 內容區：左右留白與頭部對齊 */}
      <div className="widget-body">
        {children}
      </div>
    </div>
  );
};
