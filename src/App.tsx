import { useEffect, useState } from 'react';
import { useSync } from './hooks/useSync';
import { DaysWidget } from './components/DaysWidget';
import { StepsWidget } from './components/StepsWidget';
import { WaterWidget } from './components/WaterWidget';
import { PhotoWidget } from './components/PhotoWidget';
import { MapWidget } from './components/MapWidget';
import { SettingsWidget } from './components/SettingsWidget';
import { LoginScreen } from './components/LoginScreen';
import { AppIcon } from './components/icons';

const hasStoredAccount = () => {
  if (localStorage.getItem('couple_widget_logged_in') !== '1') return false;

  try {
    const localState = localStorage.getItem('couple_widget_state');
    if (!localState) return false;
    const parsed = JSON.parse(localState) as { user?: { email?: string } };
    return !!parsed.user?.email;
  } catch {
    return false;
  }
};

function App() {
  const {
    state,
    isMockMode,
    canInstall,
    triggerInstall,
    loginWithAccount,
    updateProfile,
    changeBg,
    updateAnniversary,
    logWater,
    logSteps,
    uploadPhoto,
    generatePairCode,
    pairWithCode,
    resetApp,
  } = useSync();

  // 登入狀態：先用 localStorage 記住，之後接真 Google OAuth 再換成 token
  const [isLoggedIn, setIsLoggedIn] = useState(
    () => hasStoredAccount()
  );

  const handleLogin = async (email: string, name: string) => {
    const result = await loginWithAccount(email, name);
    if (!result.success) {
      return result;
    }

    localStorage.setItem('couple_widget_logged_in', '1');
    setIsLoggedIn(true);
    return result;
  };

  // Dynamically update document body background class based on active theme index
  useEffect(() => {
    const bgClasses = ['bg-gradient-1', 'bg-gradient-2', 'bg-gradient-3', 'bg-gradient-4'];
    const currentClass = bgClasses[state.bgIndex - 1] || 'bg-gradient-1';
    
    // Remove all possible bg classes
    bgClasses.forEach((cls) => document.body.classList.remove(cls));
    // Add active one
    document.body.classList.add(currentClass);
  }, [state.bgIndex]);

  const partnerName = state.partner?.name || '另一半';

  // 未登入 → 顯示登入頁
  if (!isLoggedIn) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div className="canvas-shell flex-1 flex flex-col min-h-screen">
      <header className="canvas-topbar">
        <div className="flex items-center gap-3 min-w-0">
          <span className="brand-mark small">
            <AppIcon name="heart" className="w-4 h-4" />
          </span>
          <div className="flex flex-col min-w-0">
            <h1 className="text-xl font-extrabold tracking-normal text-[color:var(--text-primary)] leading-tight">
              Couple Widget
            </h1>
            <span className="text-[10px] text-muted tracking-[0.16em] uppercase font-bold truncate">
              {isMockMode ? 'Mock partner active' : 'Connected Cloudflare'}
            </span>
          </div>
        </div>

        <div className="canvas-presence">
          <span className="text-primary font-bold truncate max-w-[72px]">{state.user.name}</span>
          <span className="w-1.5 h-1.5 rounded-full bg-[color:var(--border-strong)] shrink-0" />
          <span className="text-secondary font-bold truncate max-w-[72px]">{partnerName}</span>
        </div>
      </header>

      <main className="canvas-main">
        <section className="canvas-board">
          <div className="canvas-board-header">
            <div>
              <p className="canvas-kicker">Shared workspace</p>
              <h2>今天的兩人狀態</h2>
            </div>
            <div className="canvas-date">
              {new Date().toLocaleDateString('zh-TW', {
                month: 'short',
                day: 'numeric',
                weekday: 'short',
              })}
            </div>
          </div>

          <div className="dashboard-grid w-full">
          
          {/* Row 1: Anniversary Days + Steps */}
          <DaysWidget 
            startDate={state.anniversaryDate} 
            updateDate={updateAnniversary}
            partnerName={partnerName}
          />
          
          <StepsWidget 
            userState={state.user}
            partnerState={state.partner}
            logSteps={logSteps}
          />

          {/* Row 2: Growing Flower Water Tracker */}
          <WaterWidget 
            userState={state.user}
            partnerState={state.partner}
            logWater={logWater}
          />

          {/* Row 3: Daily Polaroid Photo + Settings/Profile */}
          <PhotoWidget 
            userState={state.user}
            partnerState={state.partner}
            uploadPhoto={uploadPhoto}
          />

          <SettingsWidget 
            state={state}
            isMockMode={isMockMode}
            canInstall={canInstall}
            triggerInstall={triggerInstall}
            updateProfile={updateProfile}
            changeBg={changeBg}
            generatePairCode={generatePairCode}
            pairWithCode={pairWithCode}
            resetApp={resetApp}
          />

          {/* Row 4: Geolocation Map/Radar */}
          <MapWidget 
            userState={state.user}
            partnerState={state.partner}
          />

          </div>
        </section>
      </main>

      {/* Install banner if PWA is installable and not yet installed */}
      {canInstall && (
        <div className="fixed bottom-4 left-4 right-4 max-w-[468px] mx-auto z-40 bg-white/92 backdrop-blur-xl border border-[color:var(--card-border)] p-3 rounded-xl flex items-center justify-between shadow-[0_18px_45px_-32px_rgba(47,35,44,0.9)]">
          <div className="flex items-center gap-2.5">
            <span className="widget-icon">
              <AppIcon name="spark" className="w-3.5 h-3.5" />
            </span>
            <div className="flex flex-col">
              <span className="text-xs font-bold">加到桌面變成 Widget！</span>
              <span className="text-[9px] text-text-secondary">像原生 App 一樣全螢幕使用</span>
            </div>
          </div>
          <button 
            onClick={triggerInstall}
            className="glass-button primary text-[10px] py-1.5 px-3 rounded-lg"
          >
            安裝
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
