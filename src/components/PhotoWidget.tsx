import React, { useRef, useState } from 'react';
import { WidgetContainer } from './WidgetContainer';
import { AppIcon } from './icons';
import type { UserState } from '../hooks/useSync';

interface PhotoWidgetProps {
  userState: UserState;
  partnerState: UserState | null;
  uploadPhoto: (base64Photo: string) => void;
}

export const PhotoWidget: React.FC<PhotoWidgetProps> = ({
  userState,
  partnerState,
  uploadPhoto,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isViewingFull, setIsViewingFull] = useState(false);
  const [activePhoto, setActivePhoto] = useState<string | null>(null);

  
  // Check if user has uploaded a photo today
  const hasSharedToday = !!userState.photo;
  
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Convert file to compressed base64
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 400;
        const MAX_HEIGHT = 400;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          // High compression jpeg to keep string small for KV database
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.6);
          uploadPhoto(compressedBase64);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const openCamera = () => {
    if (hasSharedToday) {
      // Allow viewing user's own photo instead
      setActivePhoto(userState.photo);
      setIsViewingFull(true);
      return;
    }
    fileInputRef.current?.click();
  };

  const viewPartnerPhoto = () => {
    if (partnerState?.photo) {
      setActivePhoto(partnerState.photo);
      setIsViewingFull(true);
    }
  };

  return (
    <>
      <WidgetContainer
        title="Locket Photo"
        icon="camera"
        size="2x2"
      >
        <div className="photo-widget">
          {/* Polaroid Frame */}
          <div className="photo-frame w-[120px] p-1.5 pb-5 relative">
            {partnerState?.photo ? (
              <img
                src={partnerState.photo}
                alt="Partner's daily locket"
                className="w-full h-[90px] object-cover rounded-md cursor-pointer"
                onClick={viewPartnerPhoto}
              />
            ) : (
              <div
                className="w-full h-[90px] bg-[color:var(--surface-soft)] border border-[color:var(--card-border)] rounded-md flex flex-col items-center justify-center gap-2 text-[11px] text-[color:var(--text-muted)] font-bold px-1 cursor-pointer"
                onClick={openCamera}
              >
                <AppIcon name="camera" className="w-5 h-5" />
                尚未傳送
              </div>
            )}
            <div className="text-[8px] text-[color:var(--text-secondary)] font-bold mt-1.5 text-center font-mono tracking-wide">
              {partnerState?.photoTime ? `RECEIVED ${partnerState.photoTime}` : 'AWAITING DAILY'}
            </div>
          </div>

          {/* Action buttons */}
          <div className="photo-action">
            <button
              onClick={openCamera}
              className={`text-xs w-full py-2 px-3 rounded-xl font-bold transition-all border ${
                hasSharedToday
                  ? 'bg-emerald-500/12 border-emerald-500/30 text-emerald-700'
                  : 'bg-primary/10 border-primary/25 text-primary hover:bg-primary/15'
              }`}
            >
              {hasSharedToday ? '已拍照 (點此看自己)' : '拍照傳給對方'}
            </button>
            <input 
              type="file"
              ref={fileInputRef}
              onChange={handlePhotoSelect}
              accept="image/*"
              capture="environment"
              className="hidden"
            />
          </div>
        </div>
      </WidgetContainer>

      {/* Full Screen Photo Modal */}
      {isViewingFull && activePhoto && (
        <div 
          className="fixed inset-0 bg-black/95 backdrop-blur-md z-50 flex flex-col items-center justify-center p-4"
          onClick={() => setIsViewingFull(false)}
        >
          <div className="relative max-w-sm w-full bg-white p-3 pb-12 rounded-lg shadow-2xl transform rotate-[1deg] aspect-square flex flex-col">
            <img 
              src={activePhoto} 
              alt="Expanded view" 
              className="w-full h-full object-cover rounded-md"
            />
            <div className="absolute bottom-3 left-0 right-0 text-center text-sm font-bold text-gray-800 font-mono">
              {activePhoto === userState.photo ? 'MY DAILY SHOT' : `${partnerState?.name || 'PARTNER'}'S DAILY SHOT`}
            </div>
          </div>
          <p className="text-white/70 text-xs mt-6">點擊任何地方關閉</p>
        </div>
      )}
    </>
  );
};
