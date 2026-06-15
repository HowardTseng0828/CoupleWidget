import React, { useState } from 'react';
import { WidgetContainer } from './WidgetContainer';
import { AppIcon } from './icons';
import type { SyncData } from '../hooks/useSync';

interface SettingsWidgetProps {
  state: SyncData;
  isMockMode: boolean;
  canInstall: boolean;
  triggerInstall: () => void;
  updateProfile: (name: string, avatar: string) => void;
  changeBg: (index: number) => void;
  generatePairCode: () => Promise<string>;
  pairWithCode: (code: string) => Promise<boolean>;
  resetApp: () => void;
}

export const SettingsWidget: React.FC<SettingsWidgetProps> = ({
  state,
  isMockMode,
  canInstall,
  triggerInstall,
  updateProfile,
  changeBg,
  generatePairCode,
  pairWithCode,
  resetApp,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [editName, setEditName] = useState(state.user.name);
  const [editAvatar, setEditAvatar] = useState(state.user.avatar);
  const [inputCode, setInputCode] = useState('');
  const [loadingCode, setLoadingCode] = useState(false);

  const backgroundOptions = [
    { name: 'Canvas', index: 1, class: 'bg-gradient-1' },
    { name: 'Paper', index: 2, class: 'bg-gradient-2' },
    { name: 'Slate', index: 3, class: 'bg-gradient-3' },
    { name: 'Sage', index: 4, class: 'bg-gradient-4' },
  ];

  const handleSaveProfile = () => {
    updateProfile(editName, editAvatar);
    alert('個人檔案已更新！');
  };

  const handleGenerateCode = async () => {
    setLoadingCode(true);
    await generatePairCode();
    setLoadingCode(false);
  };

  const handlePair = async () => {
    if (!inputCode) return;
    setLoadingCode(true);
    const success = await pairWithCode(inputCode);
    setLoadingCode(false);
    if (success) {
      alert('配對成功！');
      setInputCode('');
    }
  };

  const selectRandomAvatar = () => {
    const randomSeed = Math.random().toString(36).substring(7);
    const newAvatar = `https://api.dicebear.com/7.x/adventurer/svg?seed=${randomSeed}`;
    setEditAvatar(newAvatar);
  };

  return (
    <>
      <WidgetContainer
        title="Settings & Pair"
        icon="settings"
        size="2x2"
        onClick={() => setIsOpen(true)}
      >
        <div className="flex flex-col h-full justify-center items-center text-center gap-3 py-2">
          {/* Avatar and name */}
          <div className="flex flex-col items-center gap-2">
            <div className="relative">
              <img
                src={state.user.avatar}
                alt="Avatar"
                className="w-16 h-16 rounded-full border-2 border-[color:var(--primary-line)] object-cover"
              />
              <div className="absolute bottom-0 right-0 w-5 h-5 bg-accent rounded-full border-2 border-white flex items-center justify-center text-white">
                <AppIcon name="settings" className="w-3 h-3" />
              </div>
            </div>
            <span className="text-base font-bold text-[color:var(--text-primary)] truncate max-w-[120px]">
              {state.user.name}
            </span>
          </div>

          {/* Pairing status badge */}
          <div className="flex flex-col items-center w-full gap-1.5">
            <span className={`status-badge uppercase ${
              state.paired && !isMockMode
                ? 'bg-emerald-500/12 text-emerald-700 border border-emerald-500/25'
                : isMockMode
                ? 'bg-accent/12 text-accent border border-accent/25'
                : 'bg-amber-500/12 text-amber-700 border border-amber-500/25'
            }`}>
              {state.paired && !isMockMode ? '已連線' : isMockMode ? '模擬對象中' : '單身中'}
            </span>
            <span className="text-[11px] text-[color:var(--text-muted)] truncate max-w-[130px]">
              {state.paired && !isMockMode ? 'Cloudflare 雲端' : isMockMode ? '點此進入配對設定' : '點此獲取配對碼'}
            </span>
          </div>
        </div>
      </WidgetContainer>

      {/* Settings Dialog Overlay */}
      {isOpen && (
        <div className="settings-overlay">
          <div className="dialog-panel settings-dialog">
            <div className="settings-dialog-header">
              <div>
                <span className="canvas-kicker">Account</span>
                <h3 className="text-lg font-bold">個人與配對設定</h3>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="settings-close-button"
                aria-label="關閉"
              >
                <AppIcon name="close" className="w-4 h-4" />
              </button>
            </div>

            {/* Profile Section */}
            <div className="settings-section">
              <h4 className="text-[13px] font-bold uppercase tracking-wider text-muted">我的檔案</h4>
              
              <div className="settings-profile-row">
                <button className="settings-avatar-button" onClick={selectRandomAvatar} aria-label="隨機產生頭貼">
                  <img 
                    src={editAvatar} 
                    alt="Avatar preview" 
                    className="w-14 h-14 rounded-full border-2 border-primary object-cover"
                  />
                  <div className="absolute bottom-0 right-0 bg-primary w-5 h-5 rounded-full flex items-center justify-center text-white shadow-md">
                    <AppIcon name="dice" className="w-3 h-3" />
                  </div>
                </button>
                
                <div className="settings-field">
                  <input 
                    type="text" 
                    value={editName} 
                    onChange={(e) => setEditName(e.target.value)}
                    className="glass-input text-sm py-2 px-3"
                    placeholder="輸入名稱"
                  />
                  <span className="text-[9px] text-muted">點骰子或輸入名稱以隨機產生頭貼</span>
                </div>
              </div>
              
              <button 
                onClick={handleSaveProfile}
                className="glass-button text-xs py-2 w-full border-primary/20 text-primary hover:bg-primary/5"
              >
                保存檔案修改
              </button>
            </div>

            {/* Pairing Section */}
            <div className="settings-section">
              <h4 className="text-[13px] font-bold uppercase tracking-wider text-muted">邀請另一半 (情侶配對)</h4>
              
              {state.paired && !isMockMode ? (
                <div className="settings-success-card">
                  已成功配對！您的 Couple ID 是：<br />
                  <span className="settings-code-block">{state.coupleId}</span>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {/* Generate Code */}
                  <div className="settings-pair-row">
                    <button 
                      onClick={handleGenerateCode}
                      disabled={loadingCode}
                      className="glass-button text-xs py-2 flex-1 border-secondary/20"
                    >
                      {loadingCode ? '請稍後...' : state.pairCode ? '您的配對碼 (點此更新)' : '生成我的配對碼'}
                    </button>
                    {state.pairCode && (
                      <span className="pair-code-chip">
                        {state.pairCode}
                      </span>
                    )}
                  </div>

                  {/* Input Code */}
                  <div className="settings-pair-row">
                    <input 
                      type="text" 
                      value={inputCode}
                      onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                      placeholder="輸入另一半的配對碼"
                      className="glass-input text-sm py-2 px-3 flex-1"
                    />
                    <button 
                      onClick={handlePair}
                      disabled={loadingCode}
                      className="glass-button primary text-xs py-2 px-5"
                    >
                      配對
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Background Theme Selector */}
            <div className="settings-section">
              <h4 className="text-[13px] font-bold uppercase tracking-wider text-muted">背景主題</h4>
              <div className="settings-theme-grid">
                {backgroundOptions.map((bg) => (
                  <button 
                    key={bg.index}
                    onClick={() => changeBg(bg.index)}
                    className={`py-2.5 px-3 rounded-xl text-xs font-semibold text-left transition-all border ${
                      state.bgIndex === bg.index 
                        ? 'border-primary bg-primary/10 shadow-lg shadow-primary/5' 
                        : 'border-[color:var(--card-border)] bg-white/50 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${bg.class} border border-[color:var(--card-border)]`} />
                      {bg.name}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* General buttons */}
            <div className="settings-actions">
              {canInstall && (
                <button 
                  onClick={triggerInstall}
                  className="glass-button primary text-xs py-2.5 w-full"
                >
                  新增應用到手機桌面
                </button>
              )}
              <button 
                onClick={resetApp}
                className="glass-button danger-button text-xs py-2 w-full"
              >
                重置並清除所有資料
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
