import React, { useState } from 'react';
import { AppIcon } from './icons';

interface LoginResult {
  success: boolean;
  message?: string;
}

interface LoginScreenProps {
  onLogin: (email: string, name: string) => Promise<LoginResult>;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async () => {
    const cleanEmail = email.trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setMessage('請先輸入有效的 Email。');
      return;
    }

    setIsLoading(true);
    setMessage('');
    const result = await onLogin(cleanEmail, name.trim());
    setIsLoading(false);

    if (!result.success) {
      setMessage(result.message || '登入失敗，請稍後再試。');
      return;
    }

    if (result.message) {
      setMessage(result.message);
    }
  };

  return (
    <div className="canvas-shell login-screen">
      <div className="glass-panel login-card flex flex-col items-center text-center gap-6">
        <div className="flex flex-col items-center gap-3">
          <div className="brand-mark">
            <AppIcon name="heart" className="w-5 h-5" />
          </div>
          <h1 className="text-2xl font-extrabold text-[color:var(--text-primary)]">
            Couple Widget
          </h1>
          <p className="text-sm text-text-secondary leading-relaxed">
            用 Cloudflare 儲存你們的日期、喝水、照片與配對資料。
          </p>
        </div>

        <div className="login-form-row flex flex-col gap-3 text-left">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-text-secondary ml-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="glass-input"
              autoComplete="email"
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-text-secondary ml-1">暱稱</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="可留空，預設使用 Email 名稱"
              className="glass-input"
              autoComplete="nickname"
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            />
          </div>
        </div>

        <div className="login-form-row flex flex-col gap-3">
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="glass-button primary w-full py-3.5 text-base rounded-lg disabled:opacity-60"
          >
            {isLoading ? '登入中...' : '登入 / 建立帳號'}
          </button>

          {message && (
            <p className="text-[11px] text-[color:var(--text-secondary)] leading-relaxed">
              {message}
            </p>
          )}
        </div>

        <p className="text-[10px] text-muted leading-relaxed">
          同一個 Email 會回到同一個 Cloudflare 帳號。邀請另一半請進入設定產生配對碼。
        </p>
      </div>
    </div>
  );
};
