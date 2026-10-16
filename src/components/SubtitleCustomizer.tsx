import React from 'react';
import { SubtitleSettings, SUPPORTED_LANGUAGES, SOURCE_LANGUAGES } from '../types';
import { Settings, Sliders, Type, Palette, Globe2 } from 'lucide-react';

interface SubtitleCustomizerProps {
  settings: SubtitleSettings;
  onUpdateSettings: (newSettings: Partial<SubtitleSettings>) => void;
  sourceLang: string;
  targetLang: string;
  onChangeSourceLang: (lang: string) => void;
  onChangeTargetLang: (lang: string) => void;
}

export const SubtitleCustomizer: React.FC<SubtitleCustomizerProps> = ({
  settings,
  onUpdateSettings,
  sourceLang,
  targetLang,
  onChangeSourceLang,
  onChangeTargetLang,
}) => {
  return (
    <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
      <div className="flex items-center gap-2">
        <Settings className="w-5 h-5 text-indigo-400" />
        <h2 className="text-lg font-bold text-white">Pengaturan Subtitle Layar</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Language Selection: Source */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Globe2 className="w-3.5 h-3.5 text-indigo-400" />
            Bahasa Suara Layar:
          </label>
          <select
            value={sourceLang}
            onChange={(e) => onChangeSourceLang(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
          >
            {SOURCE_LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.flag} {l.name}
              </option>
            ))}
          </select>
        </div>

        {/* Language Selection: Target */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Globe2 className="w-3.5 h-3.5 text-cyan-400" />
            Terjemahkan Ke:
          </label>
          <select
            value={targetLang}
            onChange={(e) => onChangeTargetLang(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
          >
            {SUPPORTED_LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.flag} {l.name}
              </option>
            ))}
          </select>
        </div>

        {/* Font Size */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Type className="w-3.5 h-3.5 text-purple-400" />
            Ukuran Teks Subtitle:
          </label>
          <select
            value={settings.fontSize}
            onChange={(e) => onUpdateSettings({ fontSize: e.target.value as any })}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="sm">Kecil (Compact)</option>
            <option value="md">Sedang (Standar)</option>
            <option value="lg">Besar (Jelas)</option>
            <option value="xl">Sangat Besar (Layar Penuh)</option>
            <option value="2xl">Ekstra Besar (Bioskop)</option>
          </select>
        </div>

        {/* Background Opacity */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Palette className="w-3.5 h-3.5 text-pink-400" />
            Transparansi Latar: ({Math.round(settings.bgOpacity * 100)}%)
          </label>
          <input
            type="range"
            min="0.3"
            max="1.0"
            step="0.05"
            value={settings.bgOpacity}
            onChange={(e) => onUpdateSettings({ bgOpacity: parseFloat(e.target.value) })}
            className="w-full accent-indigo-500 mt-2"
          />
        </div>
      </div>

      {/* Auto-TTS Voice Option */}
      <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="text-xs font-bold text-white">
            Bacakan Terjemahan Otomatis (Suara Bahasa Indonesia)
          </div>
          <span className="text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
            Fitur Suara Aktif
          </span>
        </div>
        <button
          onClick={() => onUpdateSettings({ autoSpeak: !settings.autoSpeak })}
          className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all border ${
            settings.autoSpeak
              ? 'bg-amber-600 text-white border-amber-500 shadow-md shadow-amber-900/30'
              : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
          }`}
        >
          {settings.autoSpeak ? 'Suara Aktif (Dengarkan Terjemahan)' : 'Nonaktifkan Suara'}
        </button>
      </div>
    </div>
  );
};
