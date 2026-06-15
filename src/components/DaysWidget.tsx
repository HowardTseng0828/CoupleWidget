import React, { useState } from 'react';
import { WidgetContainer } from './WidgetContainer';
import { AppIcon } from './icons';

interface DaysWidgetProps {
  startDate: string;
  updateDate: (date: string) => void;
  partnerName: string;
}

export const DaysWidget: React.FC<DaysWidgetProps> = ({
  startDate,
  updateDate,
  partnerName,
}) => {
  const [isEditing, setIsEditing] = useState(false);

  // Calculate days passed
  const getDaysPassed = () => {
    const start = new Date(startDate);
    const today = new Date();
    // Reset hours to calculate exact day boundaries
    start.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    const diffTime = today.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 ? diffDays : 0;
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateDate(e.target.value);
  };

  return (
    <>
      <WidgetContainer
        title="Love Counter"
        icon="heart"
        size="2x2"
        onClick={() => setIsEditing(true)}
      >
        <div className="flex flex-col items-center justify-center h-full gap-3 py-2">
          <div className="brand-mark">
            <AppIcon name="heart" className="w-5 h-5" />
          </div>

          <div className="flex flex-col items-center">
            <span className="stat-number text-[color:var(--primary)]">
              {getDaysPassed()}
            </span>
            <span className="stat-label mt-1">
              Days Together
            </span>
          </div>

          <span className="text-xs text-[color:var(--text-muted)] text-center line-clamp-1">
            with {partnerName}
          </span>
        </div>
      </WidgetContainer>

      {isEditing && (
        <div className="fixed inset-0 bg-[#6b4a5a]/30 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="dialog-panel w-full max-w-sm p-6 flex flex-col gap-4">
            <h3 className="text-lg font-bold text-center">設定紀念日開始日期</h3>
            <div className="flex flex-col gap-2">
              <label className="text-[12px] text-text-secondary">開始相愛的那一天</label>
              <input 
                type="date" 
                value={startDate} 
                onChange={handleDateChange}
                className="glass-input"
              />
            </div>
            <button 
              onClick={() => setIsEditing(false)}
              className="glass-button primary w-full mt-2"
            >
              確定
            </button>
          </div>
        </div>
      )}
    </>
  );
};
