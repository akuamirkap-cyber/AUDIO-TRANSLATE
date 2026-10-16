import React from 'react';
import { Layers, ExternalLink, Radio, Smartphone, Volume2, VolumeX } from 'lucide-react';

interface NavbarProps {
  isPiPActive: boolean;
  onTogglePiP: () => void;
  onOpenApkGuide: () => void;
  isActive: boolean;
  statusMessage: string;
  autoSpeak: boolean;
  onToggleAutoSpeak: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  isPiPActive,
  onTogglePiP,
  onOpenApkGuide,
  isActive,
  statusMessage,
  autoSpeak,
  onToggleAutoSpeak,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-lg border-b border-slate-800">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-2">
        {/* Logo and Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-600/30 shrink-0">
            <Radio className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-white text-base tracking-tight">
                ScreenLingo
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                AI LIVE
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Penerjemah Suara Layar Instagram & YouTube
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Auto Speak Indonesian voice toggle */}
          <button
            onClick={onToggleAutoSpeak}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border ${
              autoSpeak
                ? 'bg-amber-600/30 text-amber-300 border-amber-500/50 shadow-sm'
                : 'bg-slate-900 text-slate-400 hover:text-white border-slate-800'
            }`}
            title={autoSpeak ? 'Suara Terjemahan Bahasa Indonesia AKTIF' : 'Aktifkan Suara Terjemahan Bahasa Indonesia'}
          >
            {autoSpeak ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden md:inline">
              {autoSpeak ? 'Suara ID: Aktif' : 'Suara ID: Mati'}
            </span>
          </button>

          {/* Open in Standalone Tab button (bypasses iframe sandbox) */}
          <a
            href={typeof window !== 'undefined' ? window.location.href : '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 flex items-center gap-1.5 transition-colors"
            title="Buka di tab browser baru untuk izin penuh tanpa batasan bingkai (iframe)"
          >
            <ExternalLink className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Tab Baru (Izin Penuh)</span>
          </a>

          {/* PiP Floating Window button */}
          <button
            onClick={onTogglePiP}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border ${
              isPiPActive
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30'
                : 'bg-slate-900 text-slate-300 hover:text-white border-slate-700 hover:border-slate-600'
            }`}
            title="Munculkan jendela subtitle melayang di atas aplikasi lain"
          >
            <Layers className="w-4 h-4 text-indigo-400" />
            <span className="hidden sm:inline">
              {isPiPActive ? 'Tutup PiP' : 'Subtitle Melayang (PiP)'}
            </span>
            <span className="sm:hidden">PiP</span>
          </button>

          {/* APK Guide button */}
          <button
            onClick={onOpenApkGuide}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white flex items-center gap-1.5 transition-all shadow-md shadow-emerald-950/40 shrink-0"
          >
            <Smartphone className="w-4 h-4" />
            <span className="hidden sm:inline">Pasang APK</span>
            <span className="sm:hidden">APK</span>
          </button>
        </div>
      </div>

      {/* Global Status Banner if listening */}
      {isActive && (
        <div className="bg-indigo-950/70 border-t border-indigo-500/20 px-4 py-1.5 text-center text-xs text-indigo-200 flex items-center justify-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          <span>{statusMessage || 'Mendengarkan audio layar secara langsung...'}</span>
        </div>
      )}
    </header>
  );
};
