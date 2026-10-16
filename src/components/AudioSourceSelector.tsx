import React from 'react';
import { Monitor, Mic, PlaySquare, Smartphone, Volume2, ShieldCheck } from 'lucide-react';
import { AudioSourceType } from '../types';

interface AudioSourceSelectorProps {
  currentSource: AudioSourceType;
  isActive: boolean;
  audioLevel: number;
  onSelectSource: (source: AudioSourceType) => void;
  onToggleActive: () => void;
  onCaptureSample?: () => void;
}

export const AudioSourceSelector: React.FC<AudioSourceSelectorProps> = ({
  currentSource,
  isActive,
  audioLevel,
  onSelectSource,
  onToggleActive,
  onCaptureSample,
}) => {
  return (
    <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Volume2 className="w-5 h-5 text-indigo-400" />
            Pilih Sumber Suara Layar
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Pilih bagaimana aplikasi menangkap suara dari Instagram, YouTube, atau aplikasi lainnya
          </p>
        </div>

        {/* Live Audio Visualizer meter */}
        {isActive && (
          <div className="flex items-center gap-2 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-indigo-500/30">
            <div className="flex items-end gap-1 h-4">
              <div
                className="w-1 bg-emerald-400 rounded-full transition-all duration-75"
                style={{ height: `${Math.max(15, audioLevel * 0.9)}%` }}
              />
              <div
                className="w-1 bg-emerald-400 rounded-full transition-all duration-75"
                style={{ height: `${Math.max(25, audioLevel * 1.1)}%` }}
              />
              <div
                className="w-1 bg-cyan-400 rounded-full transition-all duration-75"
                style={{ height: `${Math.max(10, audioLevel * 0.7)}%` }}
              />
              <div
                className="w-1 bg-indigo-400 rounded-full transition-all duration-75"
                style={{ height: `${Math.max(20, audioLevel * 1.2)}%` }}
              />
            </div>
            <span className="text-xs font-semibold text-emerald-400">
              Audio: {audioLevel > 5 ? `${audioLevel}%` : 'Mendengarkan...'}
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {/* Source 1: Screen / Tab Audio */}
        <button
          onClick={() => onSelectSource('screen')}
          className={`flex flex-col text-left p-4 rounded-xl border transition-all ${
            currentSource === 'screen'
              ? 'bg-gradient-to-b from-indigo-950/80 to-slate-900 border-indigo-500 shadow-lg shadow-indigo-950/50'
              : 'bg-slate-950/50 border-slate-800 hover:border-slate-700 text-slate-300'
          }`}
        >
          <div className="flex items-center justify-between w-full mb-2">
            <div
              className={`p-2.5 rounded-lg ${
                currentSource === 'screen' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'
              }`}
            >
              <Monitor className="w-5 h-5" />
            </div>
            {currentSource === 'screen' && (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Tab Browser / PC
              </span>
            )}
          </div>
          <span className="font-bold text-white text-sm">Audio Tab & Layar</span>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Menangkap langsung audio tab YouTube/IG di Chrome PC/Laptop (centang "Share tab audio").
          </p>
        </button>

        {/* Source 2: Mic / Phone Speaker */}
        <button
          onClick={() => onSelectSource('mic')}
          className={`flex flex-col text-left p-4 rounded-xl border transition-all ${
            currentSource === 'mic'
              ? 'bg-gradient-to-b from-indigo-950/80 to-slate-900 border-indigo-500 shadow-lg shadow-indigo-950/50'
              : 'bg-slate-950/50 border-slate-800 hover:border-slate-700 text-slate-300'
          }`}
        >
          <div className="flex items-center justify-between w-full mb-2">
            <div
              className={`p-2.5 rounded-lg ${
                currentSource === 'mic' ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400'
              }`}
            >
              <Mic className="w-5 h-5" />
            </div>
            {currentSource === 'mic' && (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Paling Praktis untuk HP
              </span>
            )}
          </div>
          <span className="font-bold text-white text-sm">Mikrofon / Speaker HP</span>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Mendengarkan suara video Instagram/YouTube yang keluar dari speaker HP atau perangkat di sekitar Anda.
          </p>
        </button>

        {/* Source 3: Interactive Video Simulator */}
        <button
          onClick={() => onSelectSource('demo')}
          className={`flex flex-col text-left p-4 rounded-xl border transition-all ${
            currentSource === 'demo'
              ? 'bg-gradient-to-b from-indigo-950/80 to-slate-900 border-indigo-500 shadow-lg shadow-indigo-950/50'
              : 'bg-slate-950/50 border-slate-800 hover:border-slate-700 text-slate-300'
          }`}
        >
          <div className="flex items-center justify-between w-full mb-2">
            <div
              className={`p-2.5 rounded-lg ${
                currentSource === 'demo' ? 'bg-pink-600 text-white' : 'bg-slate-800 text-slate-400'
              }`}
            >
              <PlaySquare className="w-5 h-5" />
            </div>
            {currentSource === 'demo' && (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30">
                Uji Coba Cepat
              </span>
            )}
          </div>
          <span className="font-bold text-white text-sm">Simulasi Reels & YouTube</span>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Tes langsung dengan video contoh Instagram Reels & YouTube (Inggris, Jepang, Korea) tanpa pindah tab.
          </p>
        </button>
      </div>

      {/* YouTube / Tab Audio Instruction Helper */}
      {currentSource === 'screen' && (
        <div className="bg-indigo-950/40 border border-indigo-500/30 rounded-xl p-3 text-xs text-slate-300 space-y-1.5 animate-fade-in">
          <div className="font-bold text-indigo-300 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
            Panduan Menangkap Suara YouTube di Tab Lain:
          </div>
          <ol className="list-decimal list-inside space-y-1 text-slate-300 pl-1 text-[11px] leading-relaxed">
            <li>Klik tombol <b>"Mulai Terjemahkan Suara Layar"</b> di bawah.</li>
            <li>Di jendela pop-up Chrome, pilih tab <b>"Tab Chrome"</b> lalu klik tab <b>YouTube</b> Anda.</li>
            <li>
              <span className="text-amber-300 font-semibold underline">WAJIB:</span> Centang kotak <b>"Bagikan audio tab" / "Share tab audio"</b> di pojok kiri bawah pop-up browser!
            </li>
            <li>Putar video YouTube — suara digitalnya akan langsung diterjemahkan ke Bahasa Indonesia.</li>
          </ol>
        </div>
      )}

      {/* Main Activation Action Bar */}
      <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-800">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Privasi aman: Audio diproses real-time dengan model AI Gemini.</span>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {isActive && onCaptureSample && (
            <button
              onClick={onCaptureSample}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center gap-1.5 transition-all shadow-md shadow-indigo-900/40"
              title="Ambil rekaman 3 detik dari suara YouTube/layar sekarang untuk diterjemahkan langsung"
            >
              <Mic className="w-4 h-4 text-amber-300 animate-pulse" />
              <span>Terjemahkan Audio Sekarang (3 Detik)</span>
            </button>
          )}

          <button
            onClick={onToggleActive}
            className={`w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg ${
              isActive
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-900/40'
                : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-indigo-900/50'
            }`}
          >
            {isActive ? (
              <>
                <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping"></span>
                Hentikan Penerjemah
              </>
            ) : (
              <>
                <Smartphone className="w-4 h-4" />
                Mulai Terjemahkan Suara Layar
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
