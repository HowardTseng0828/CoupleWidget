import React from 'react';
import { WidgetContainer } from './WidgetContainer';
import { AppIcon } from './icons';
import type { UserState } from '../hooks/useSync';

interface WaterWidgetProps {
  userState: UserState;
  partnerState: UserState | null;
  logWater: (amount: number) => void;
}

export const WaterWidget: React.FC<WaterWidgetProps> = ({
  userState,
  partnerState,
  logWater,
}) => {
  
  // 依喝水量決定成長階段（0=種子 ... 5=黃金花）
  const getFlowerStage = (water: number) => {
    if (water <= 0) return { stage: 0, name: '種子' };
    if (water < 250) return { stage: 1, name: '發芽' };
    if (water < 750) return { stage: 2, name: '小葉子' };
    if (water < 1200) return { stage: 3, name: '花苞' };
    if (water < 1800) return { stage: 4, name: '盛開' };
    return { stage: 5, name: '黃金花' };
  };

  // 精緻 SVG 花：依 stage 長出莖、葉、花苞、盛開、黃金花
  const FlowerSVG = ({ stage }: { stage: number }) => {
    const golden = stage >= 5;
    const petal = golden ? '#ffd56b' : '#ff8fab';
    const petalEdge = golden ? '#ffb74d' : '#ff6f9c';
    const center = golden ? '#fff3c4' : '#ffe08a';
    // 莖隨階段長高（從盆口往上）
    const stemTopY = [88, 70, 56, 42, 30, 26][stage];
    const showStem = stage >= 1;
    const showLeafL = stage >= 2;
    const showLeafR = stage >= 3;
    const showBud = stage >= 3 && stage < 4;
    const showBloom = stage >= 4;

    return (
      <svg viewBox="0 0 100 110" width="84" height="92" className="overflow-visible">
        {/* 莖 */}
        {showStem && (
          <line x1="50" y1="88" x2="50" y2={stemTopY} stroke="#7ec98a" strokeWidth="4"
            strokeLinecap="round" className="transition-all duration-700" />
        )}
        {/* 左葉 */}
        {showLeafL && (
          <path d={`M50 ${stemTopY + 26} Q34 ${stemTopY + 18} 30 ${stemTopY + 30} Q42 ${stemTopY + 34} 50 ${stemTopY + 26} Z`}
            fill="#8fd9a8" />
        )}
        {/* 右葉 */}
        {showLeafR && (
          <path d={`M50 ${stemTopY + 18} Q66 ${stemTopY + 10} 70 ${stemTopY + 22} Q58 ${stemTopY + 26} 50 ${stemTopY + 18} Z`}
            fill="#7ec98a" />
        )}
        {/* 花苞 */}
        {showBud && (
          <g className="transition-all duration-500">
            <ellipse cx="50" cy={stemTopY - 2} rx="9" ry="13" fill={petal} />
            <ellipse cx="50" cy={stemTopY - 2} rx="4" ry="11" fill={petalEdge} opacity="0.5" />
          </g>
        )}
        {/* 盛開花朵（5 瓣 + 花心） */}
        {showBloom && (
          <g style={{ transformOrigin: `50px ${stemTopY}px` }} className="animate-[bloom_0.8s_ease]">
            {[0, 72, 144, 216, 288].map((deg) => (
              <ellipse key={deg} cx="50" cy={stemTopY - 13} rx="8" ry="13" fill={petal}
                stroke={petalEdge} strokeWidth="1.5"
                transform={`rotate(${deg} 50 ${stemTopY})`} />
            ))}
            <circle cx="50" cy={stemTopY} r="7.5" fill={center} stroke={petalEdge} strokeWidth="1" />
            {golden && <circle cx="50" cy={stemTopY} r="11" fill="none" stroke="#ffd56b" strokeWidth="1.5" opacity="0.6" />}
          </g>
        )}
        {/* 花盆 */}
        <path d="M34 88 L66 88 L62 106 Q50 109 38 106 Z" fill="#e89a8a" />
        <rect x="31" y="84" width="38" height="7" rx="3" fill="#f4ab9b" />
      </svg>
    );
  };

  const renderFlower = (water: number, name: string) => {
    const f = getFlowerStage(water);
    return (
      <div className="flex flex-col items-center flex-1 h-full justify-between gap-1">
        <span className="text-sm font-bold text-[color:var(--text-secondary)] truncate max-w-[90px]">{name}</span>

        <div className="flex items-end justify-center h-[92px]">
          <FlowerSVG stage={f.stage} />
        </div>

        <div className="flex flex-col items-center">
          <span className="text-base font-extrabold text-primary">{water.toLocaleString()} ml</span>
          <span className="text-xs text-[color:var(--text-muted)]">{f.name}</span>
        </div>
      </div>
    );
  };

  return (
    <WidgetContainer
      title="Water & Flowers"
      icon="flower"
      size="4x2"
    >
      <div className="flex items-center justify-between h-full gap-2">
        {/* Left Side: User's Flower */}
        {renderFlower(userState.water, '我')}
        
        {/* Center: Controls to drink water */}
        <div className="flex flex-col justify-center items-center gap-2 px-2">
          <AppIcon name="drop" className="water-drop mb-1" />
          <button
            onClick={() => logWater(250)}
            className="pill-button"
          >
            +250ml
          </button>
          <button
            onClick={() => logWater(500)}
            className="pill-button"
          >
            +500ml
          </button>
        </div>

        {/* Right Side: Partner's Flower */}
        {renderFlower(partnerState?.water || 0, partnerState?.name || '另一半')}
      </div>
    </WidgetContainer>
  );
};
