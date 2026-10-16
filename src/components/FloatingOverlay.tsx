import React, { useState, useRef, useEffect } from 'react';
import { SubtitleItem, SubtitleSettings } from '../types';
import { Volume2, Move, Maximize2, Minimize2, Eye, EyeOff, X } from 'lucide-react';
import { liveTranslator } from '../services/translator';

interface FloatingOverlayProps {
  currentSubtitle: SubtitleItem | null;
  settings: SubtitleSettings;
  onUpdateSettings: (newSettings: Partial<SubtitleSettings>) => void;
  onClose?: () => void;
}

export const FloatingOverlay: React.FC<FloatingOverlayProps> = ({
  currentSubtitle,
  settings,
  onUpdateSettings,
  onClose,
}) => {
  const [position, setPosition] = useState(() => ({
    x: 20,
    y: Math.max(80, (typeof window !== 'undefined' ? window.innerHeight : 700) - 220),
  }));
  const [isDragging, setIsDragging] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; posX: number; posY: number }>({
    startX: 0,
    startY: 0,
    posX: 20,
    posY: Math.max(80, (typeof window !== 'undefined' ? window.innerHeight : 700) - 220),
  });

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      posX: position.x,
      posY: position.y,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    const nextX = Math.max(10, Math.min(window.innerWidth - 320, dragRef.current.posX + dx));
    const nextY = Math.max(10, Math.min(window.innerHeight - 100, dragRef.current.posY + dy));
    setPosition({ x: nextX, y: nextY });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
  };

  // Font size classes
  const fontSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg font-semibold',
    xl: 'text-xl font-bold',
    '2xl': 'text-2xl font-extrabold',
  };

  const speakText = () => {
    if (currentSubtitle?.translatedText) {
      liveTranslator.speak(currentSubtitle.translatedText, 'id-ID');
    }
  };

  return (
    <div
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        touchAction: 'none',
      }}
      className={`fixed z-50 transition-shadow duration-200 select-none ${
        isDragging ? 'shadow-2xl scale-[1.01]' : 'shadow-xl'
      }`}
    >
      <div
        className="backdrop-blur-md rounded-2xl border border-indigo-500/30 overflow-hidden text-white flex flex-col"
        style={{
          backgroundColor: `rgba(15, 23, 42, ${settings.bgOpacity})`,
          minWidth: isMinimized ? '220px' : '340px',
          maxWidth: '560px',
        }}
      >
        {/* Drag handle header */}
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-indigo-900/60 via-purple-900/60 to-slate-900/60 border-b border-indigo-500/20 cursor-move"
        >
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs font-bold tracking-wider text-indigo-200 uppercase">
              Subtitle Overlay (IG & YT)
            </span>
            <Move className="w-3.5 h-3.5 text-indigo-400/80" />
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onUpdateSettings({ showOriginal: !settings.showOriginal })}
              title={settings.showOriginal ? 'Sembunyikan teks asli' : 'Tampilkan teks asli'}
              className="p-1 hover:bg-white/10 rounded text-slate-300 hover:text-white"
            >
              {settings.showOriginal ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={speakText}
              title="Dengarkan suara terjemahan"
              className="p-1 hover:bg-white/10 rounded text-slate-300 hover:text-white"
            >
              <Volume2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1 hover:bg-white/10 rounded text-slate-300 hover:text-white"
            >
              {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="p-1 hover:bg-red-500/20 rounded text-slate-300 hover:text-red-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Content area */}
        {!isMinimized && (
          <div className="p-3.5 space-y-2">
            {/* Main Translated Subtitle */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] text-cyan-400 font-medium">
                <span>Terjemahan ({currentSubtitle?.targetLang?.toUpperCase() || 'ID'})</span>
                {currentSubtitle?.timestamp && (
                  <span className="text-slate-400 text-[10px]">{currentSubtitle.timestamp}</span>
                )}
              </div>
              <div
                className={`${fontSizes[settings.fontSize]} leading-snug text-white font-medium drop-shadow-md`}
              >
                {currentSubtitle?.translatedText || (
                  <span className="text-slate-400 italic font-normal text-sm">
                    Mendengarkan suara video... Mulai putar video Instagram atau YouTube.
                  </span>
                )}
              </div>
            </div>

            {/* Original Transcribed Text */}
            {settings.showOriginal && currentSubtitle?.originalText && (
              <div className="pt-1.5 border-t border-slate-700/40 text-xs text-slate-300 font-normal italic">
                <span className="text-[10px] text-indigo-300 block font-sans not-italic uppercase mb-0.5">
                  Teks Asli ({currentSubtitle.sourceLang}):
                </span>
                "{currentSubtitle.originalText}"
              </div>
            )}
          </div>
        )}

        {isMinimized && (
          <div className="px-3 py-1.5 text-xs text-slate-300 truncate">
            {currentSubtitle?.translatedText || 'Live Subtitle Aktif'}
          </div>
        )}
      </div>
    </div>
  );
};
