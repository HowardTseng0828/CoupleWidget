import React, { useState, useEffect } from 'react';
import { WidgetContainer } from './WidgetContainer';
import type { UserState } from '../hooks/useSync';

interface StepsWidgetProps {
  userState: UserState;
  partnerState: UserState | null;
  logSteps: (amount: number) => void;
}

type DeviceMotionEventWithPermission = typeof DeviceMotionEvent & {
  requestPermission?: () => Promise<'granted' | 'denied' | 'prompt'>;
};

export const StepsWidget: React.FC<StepsWidgetProps> = ({
  userState,
  partnerState,
  logSteps,
}) => {
  const [isSimulating, setIsSimulating] = useState(false);
  const jointGoal = 12000;
  const partnerSteps = partnerState?.steps || 0;
  const totalSteps = userState.steps + partnerSteps;
  const goalPercentage = Math.min(Math.round((totalSteps / jointGoal) * 100), 100);

  // Simulation mode
  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      // Simulate 15-35 steps every second
      const randomSteps = Math.floor(Math.random() * 20) + 15;
      logSteps(randomSteps);
    }, 1000);

    return () => clearInterval(interval);
  }, [isSimulating, logSteps]);

  // Shake to step detector
  useEffect(() => {
    let lastX = 0, lastY = 0, lastZ = 0;
    let lastTime = 0;
    const SHAKE_THRESHOLD = 15; // sensitivity

    const handleMotionEvent = (event: DeviceMotionEvent) => {
      const acceleration = event.accelerationIncludingGravity;
      if (!acceleration) return;

      const currentTime = Date.now();
      if ((currentTime - lastTime) > 100) {
        const diffTime = currentTime - lastTime;
        lastTime = currentTime;

        const x = acceleration.x || 0;
        const y = acceleration.y || 0;
        const z = acceleration.z || 0;

        const speed = Math.abs(x + y + z - lastX - lastY - lastZ) / diffTime * 10000;

        if (speed > SHAKE_THRESHOLD) {
          // Add 5 steps per shake
          logSteps(5);
        }

        lastX = x;
        lastY = y;
        lastZ = z;
      }
    };

    // Request permissions for iOS if needed
    const requestDeviceMotion = async () => {
      const deviceMotionEvent = DeviceMotionEvent as DeviceMotionEventWithPermission;
      if (
        typeof window !== 'undefined' &&
        typeof deviceMotionEvent.requestPermission === 'function'
      ) {
        try {
          const permissionState = await deviceMotionEvent.requestPermission();
          if (permissionState === 'granted') {
            window.addEventListener('devicemotion', handleMotionEvent);
          }
        } catch (e) {
          console.warn('DeviceMotion permission request failed or rejected:', e);
        }
      } else {
        window.addEventListener('devicemotion', handleMotionEvent);
      }
    };

    requestDeviceMotion();
    return () => window.removeEventListener('devicemotion', handleMotionEvent);
  }, [logSteps]);

  return (
    <WidgetContainer
      title="Steps Sync"
      icon="shoe"
      size="2x2"
    >
      <div className="steps-widget">
        {/* Simulate button */}
        <div className="steps-action">
          <button
            onClick={() => setIsSimulating(!isSimulating)}
            className={`pill-button ${
              isSimulating
                ? '!bg-accent/15 !border-accent !text-accent'
                : ''
            }`}
          >
            {isSimulating ? 'Jogging...' : 'Simulate Walk'}
          </button>
        </div>

        {/* Steps comparison */}
        <div className="steps-stats">
          <div className="stat-row">
            <span className="text-[color:var(--text-secondary)] truncate max-w-[55%]">我</span>
            <span className="font-extrabold text-accent text-base">{userState.steps.toLocaleString()}</span>
          </div>
          <div className="stat-row">
            <span className="text-[color:var(--text-secondary)] truncate max-w-[55%]">{partnerState?.name || '另一半'}</span>
            <span className="font-extrabold text-secondary text-base">{partnerSteps.toLocaleString()}</span>
          </div>
        </div>

        {/* Combined progress bar */}
        <div className="steps-progress">
          <div className="progress-track">
            <div className="progress-fill transition-all duration-500" style={{ width: `${goalPercentage}%` }} />
          </div>
          <div className="progress-meta">
            <span>Joint Goal</span>
            <span className="font-bold text-[color:var(--text-secondary)]">{goalPercentage}%</span>
          </div>
        </div>
      </div>
    </WidgetContainer>
  );
};
