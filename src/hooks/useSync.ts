import { useState, useEffect, useRef } from 'react';

export interface UserState {
  id: string;
  email?: string;
  name: string;
  avatar: string;
  water: number;
  steps: number;
  photo: string;
  photoTime: string;
  lat: number;
  lng: number;
  lastActive: number;
}

export interface SyncData {
  anniversaryDate: string;
  bgIndex: number;
  user: UserState;
  partner: UserState | null;
  paired: boolean;
  pairCode: string;
  coupleId: string;
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

interface SyncResponseBody {
  anniversaryDate?: string;
  bgIndex?: number;
  partnerState?: UserState | null;
}

interface PairCreateResponse {
  pairCode?: string;
  coupleId?: string;
}

interface PairJoinResponse {
  coupleId?: string;
  error?: string;
}

interface PairStatusResponse {
  paired?: boolean;
  coupleId?: string;
}

interface AuthResponse {
  user?: {
    id: string;
    email: string;
    name: string;
    avatar: string;
  };
  paired?: boolean;
  coupleId?: string;
  error?: string;
}

const DEFAULT_AVATAR_USER = 'https://api.dicebear.com/7.x/adventurer/svg?seed=Howard';
const DEFAULT_AVATAR_PARTNER = 'https://api.dicebear.com/7.x/adventurer/svg?seed=Honey';

// Generate a random ID
const generateId = () => Math.random().toString(36).substring(2, 11);

// Helper to generate a cute Canvas-based drawing for a daily photo
const generateCuteMockPhoto = (partnerName: string): string => {
  const canvas = document.createElement('canvas');
  canvas.width = 300;
  canvas.height = 300;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Gradient background
  const grad = ctx.createLinearGradient(0, 0, 300, 300);
  grad.addColorStop(0, '#ff758c');
  grad.addColorStop(1, '#ff7eb3');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 300, 300);

  // Drawing sun/heart
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(150, 150, 40, 0, Math.PI * 2);
  ctx.fill();

  // Draw two little cats or smiling faces
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 16px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`Good morning from ${partnerName}!`, 150, 230);
  
  // Return base64 URL
  return canvas.toDataURL('image/jpeg');
};

export const useSync = () => {
  // Load initial state from localStorage or use defaults
  const [state, setState] = useState<SyncData>(() => {
    const local = localStorage.getItem('couple_widget_state');
    if (local) {
      try {
        const parsed = JSON.parse(local);
        // Ensure IDs exist
        if (!parsed.user?.id) parsed.user.id = generateId();
        return parsed;
      } catch (e) {
        console.error(e);
      }
    }
    
    // Default initial state
    const today = new Date();
    const hundredDaysAgo = new Date();
    hundredDaysAgo.setDate(today.getDate() - 100);
    
    return {
      anniversaryDate: hundredDaysAgo.toISOString().split('T')[0],
      bgIndex: 1,
      user: {
        id: generateId(),
        email: '',
        name: 'Howard',
        avatar: DEFAULT_AVATAR_USER,
        water: 0,
        steps: 1250,
        photo: '',
        photoTime: '',
        lat: 25.033964, // Taipei 101 as default
        lng: 121.564468,
        lastActive: Date.now(),
      },
      partner: null,
      paired: false,
      pairCode: '',
      coupleId: '',
    };
  });

  const [isMockMode, setIsMockMode] = useState(true);
  const [installPromptEvent, setInstallPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const syncInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('couple_widget_state', JSON.stringify(state));
  }, [state]);

  // Capture PWA Install Prompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPromptEvent(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const triggerInstall = () => {
    if (installPromptEvent) {
      installPromptEvent.prompt();
      installPromptEvent.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the PWA install prompt');
        }
        setInstallPromptEvent(null);
      });
    } else {
      alert('請在瀏覽器設定中選擇「新增至主畫面」！在 iOS Safari 上，請點選「分享」按鈕，然後點選「加入主畫面」。');
    }
  };

  const loginWithAccount = async (email: string, name: string) => {
    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          name,
          avatar: state.user.avatar,
        }),
      });

      const data = await response.json() as AuthResponse;

      if (!response.ok || !data.user) {
        return {
          success: false,
          message: data.error || '登入失敗，請稍後再試。',
        };
      }

      setIsMockMode(false);
      setState((prev) => ({
        ...prev,
        user: {
          ...prev.user,
          id: data.user!.id,
          email: data.user!.email,
          name: data.user!.name,
          avatar: data.user!.avatar,
          lastActive: Date.now(),
        },
        paired: !!data.paired,
        coupleId: data.coupleId || '',
        partner: data.paired ? prev.partner : null,
      }));

      return { success: true };
    } catch {
      const fallbackName = name.trim() || email.trim().split('@')[0] || '我';
      setIsMockMode(true);
      setState((prev) => ({
        ...prev,
        user: {
          ...prev.user,
          email,
          name: fallbackName,
          lastActive: Date.now(),
        },
      }));

      return {
        success: true,
        message: '目前是本機離線模式；部署到 Cloudflare 後會使用雲端帳號。',
      };
    }
  };

  // Determine if we are online/offline and check backend connectivity
  useEffect(() => {
    const checkBackend = async () => {
      try {
        const res = await fetch('/api/pair?check=1', { method: 'GET' });
        if (res.status === 200) {
          setIsMockMode(false);
          console.log('Connected to Cloudflare Pages backend. KV Pairing active.');
        } else {
          setIsMockMode(true);
          console.log('Running in client-side Mock Partner mode.');
        }
      } catch {
        setIsMockMode(true);
        console.log('Backend unreachable. Running in Mock Partner mode.');
      }
    };
    
    checkBackend();
  }, []);

  useEffect(() => {
    if (!isMockMode || state.partner) return;

    const timer = window.setTimeout(() => {
      setState((prev) => {
        if (prev.partner) return prev;
        return {
          ...prev,
          paired: true,
          coupleId: 'mock-couple-id',
          partner: {
            id: 'mock-partner-id',
            name: 'Honey',
            avatar: DEFAULT_AVATAR_PARTNER,
            water: 500,
            steps: 4200,
            photo: generateCuteMockPhoto('Honey'),
            photoTime: '10:15',
            lat: 25.040000, // Slightly offset from Taipei 101
            lng: 121.570000,
            lastActive: Date.now(),
          },
        };
      });
    }, 0);

    return () => window.clearTimeout(timer);
  }, [isMockMode, state.partner]);

  // Set up synchronization logic
  useEffect(() => {
    if (isMockMode) {
      // Mock partner simulation interval (simulates steps growing, walking, and location moving)
      const mockTimer = setInterval(() => {
        setState((prev) => {
          if (!prev.partner) return prev;
          
          // Micro-movement in location (simulates walking around Taipei)
          const latOffset = (Math.random() - 0.5) * 0.0004;
          const lngOffset = (Math.random() - 0.5) * 0.0004;
          
          // Steps increase randomly (10 to 50 steps every tick)
          const stepsInc = Math.floor(Math.random() * 40) + 10;
          
          // Water increments occasionally
          const waterInc = Math.random() > 0.85 ? 250 : 0;

          return {
            ...prev,
            partner: {
              ...prev.partner,
              steps: prev.partner.steps + stepsInc,
              water: prev.partner.water + waterInc,
              lat: prev.partner.lat + latOffset,
              lng: prev.partner.lng + lngOffset,
              lastActive: Date.now(),
            },
          };
        });
      }, 5000);

      return () => clearInterval(mockTimer);
    } else {
      // REAL Backend Synchronization
      const performSync = async () => {
        if (!state.paired || !state.coupleId) return;
        
        try {
          const response = await fetch('/api/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: state.user.id,
              coupleId: state.coupleId,
              userState: state.user,
              anniversaryDate: state.anniversaryDate,
              bgIndex: state.bgIndex,
            }),
          });
          
          if (response.ok) {
          const data = await response.json() as SyncResponseBody;
          setState((prev) => ({
            ...prev,
            anniversaryDate: data.anniversaryDate || prev.anniversaryDate,
              bgIndex: data.bgIndex !== undefined ? data.bgIndex : prev.bgIndex,
              partner: data.partnerState || null,
            }));
          }
        } catch (e) {
          console.error('Error during real-time sync with backend:', e);
        }
      };

      performSync();
      syncInterval.current = setInterval(performSync, 7000);
      return () => {
        if (syncInterval.current) clearInterval(syncInterval.current);
      };
    }
  }, [isMockMode, state.paired, state.coupleId, state.user, state.anniversaryDate, state.bgIndex]);

  useEffect(() => {
    if (isMockMode || state.paired || !state.pairCode || !state.user.id) return;

    const checkPairStatus = async () => {
      try {
        const response = await fetch(`/api/pair?status=1&userId=${encodeURIComponent(state.user.id)}`);
        if (!response.ok) return;

        const data = await response.json() as PairStatusResponse;
        if (!data.paired || !data.coupleId) return;

        setState((prev) => ({
          ...prev,
          paired: true,
          coupleId: data.coupleId || prev.coupleId,
        }));
      } catch (error) {
        console.error('Failed to check pair status:', error);
      }
    };

    checkPairStatus();
    const timer = window.setInterval(checkPairStatus, 5000);
    return () => window.clearInterval(timer);
  }, [isMockMode, state.paired, state.pairCode, state.user.id]);

  // Geolocation watch
  useEffect(() => {
    if (!navigator.geolocation) return;

    const success = (position: GeolocationPosition) => {
      setState((prev) => ({
        ...prev,
        user: {
          ...prev.user,
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          lastActive: Date.now(),
        },
      }));
    };

    const error = (err: GeolocationPositionError) => {
      console.warn(`Geolocation error (${err.code}): ${err.message}`);
    };

    const watchId = navigator.geolocation.watchPosition(success, error, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    });

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  // Update User Profile
  const updateProfile = (name: string, avatar: string) => {
    setState((prev) => ({
      ...prev,
      user: { ...prev.user, name, avatar },
    }));
  };

  // Change Background
  const changeBg = (index: number) => {
    setState((prev) => ({ ...prev, bgIndex: index }));
  };

  // Update anniversary date
  const updateAnniversary = (date: string) => {
    setState((prev) => ({ ...prev, anniversaryDate: date }));
  };

  // Log water intake
  const logWater = (amount: number) => {
    setState((prev) => ({
      ...prev,
      user: { ...prev.user, water: prev.user.water + amount },
    }));
  };

  // Log walking steps
  const logSteps = (amount: number) => {
    setState((prev) => ({
      ...prev,
      user: { ...prev.user, steps: prev.user.steps + amount },
    }));
  };

  // Upload/Submit Daily Photo
  const uploadPhoto = (base64Photo: string) => {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    setState((prev) => ({
      ...prev,
      user: {
        ...prev.user,
        photo: base64Photo,
        photoTime: timeStr,
      },
    }));
  };

  // Pairing Flow: Create Couple Space
  const generatePairCode = async () => {
    if (isMockMode) {
      // In mock mode, we are automatically paired with mock partner
      return 'MOCK-123';
    }
    
    try {
      const response = await fetch('/api/pair', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', userId: state.user.id }),
      });
      if (response.ok) {
        const data = await response.json() as PairCreateResponse;
        setState((prev) => ({
          ...prev,
          pairCode: data.pairCode || prev.pairCode,
          coupleId: data.coupleId || prev.coupleId,
        }));
        return data.pairCode || '';
      }
    } catch (e) {
      console.error('Failed to generate pair code:', e);
    }
    return '';
  };

  // Pairing Flow: Enter Code to connect
  const pairWithCode = async (code: string) => {
    if (isMockMode) {
      alert('模擬模式中已自動為您建立對象！');
      return true;
    }
    
    try {
      const response = await fetch('/api/pair', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'join', code, userId: state.user.id }),
      });
      if (response.ok) {
        const data = await response.json() as PairJoinResponse;
        setState((prev) => ({
          ...prev,
          paired: true,
          coupleId: data.coupleId || prev.coupleId,
          pairCode: code,
        }));
        return true;
      } else {
        const data = await response.json() as PairJoinResponse;
        alert(data.error || '配對失敗，請檢查代碼是否正確。');
      }
    } catch (e) {
      console.error('Failed to join couple:', e);
      alert('網路連線失敗');
    }
    return false;
  };

  // Unpair / Reset (useful to disconnect or reset mock)
  const resetApp = () => {
    if (window.confirm('確定要清除所有資料並重新開始嗎？')) {
      localStorage.removeItem('couple_widget_state');
      localStorage.removeItem('couple_widget_logged_in'); // 一併登出回到登入頁
      window.location.reload();
    }
  };

  return {
    state,
    isMockMode,
    canInstall: !!installPromptEvent,
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
  };
};
