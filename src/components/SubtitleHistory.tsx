import React, { useState } from 'react';
import { SubtitleItem } from '../types';
import { History, Copy, Check, Volume2, Trash2, ArrowRight } from 'lucide-react';
import { liveTranslator } from '../services/translator';

interface SubtitleHistoryProps {
  history: SubtitleItem[];
  onClear: () => void;
}

export const SubtitleHistory: React.FC<SubtitleHistoryProps> = ({ history, onClear }) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyAll = () => {
    const fullText = history
      .map((item) => `[${item.timestamp}] (${item.sourceLang} → ${item.targetLang})\nAsli: ${item.originalText}\nTerjemahan: ${item.translatedText}\n`)
      .join('\n');
    navigator.clipboard.writeText(fullText);
    setCopiedId('all');
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-indigo-400" />
          <h2 className="text-lg font-bold text-white">Riwayat Terjemahan Suara Layar</h2>
          <span className="text-xs bg-slate-800 text-indigo-300 font-semibold px-2 py-0.5 rounded-full border border-slate-700">
            {history.length} Kalimat
          </span>
        </div>

        {history.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyAll}
              className="text-xs px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1.5 transition-colors border border-slate-700"
            >
              {copiedId === 'all' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>Salin Semua</span>
            </button>
            <button
              onClick={onClear}
              className="text-xs px-2.5 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-300 flex items-center gap-1.5 transition-colors border border-red-900/40"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hapus</span>
            </button>
          </div>
        )}
      </div>

      {history.length === 0 ? (
        <div className="text-center py-10 px-4 border border-dashed border-slate-800 rounded-xl space-y-2">
          <p className="text-sm font-medium text-slate-400">Belum ada suara layar yang diterjemahkan</p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Aktifkan penerjemah suara layar atau putar simulator video Instagram/YouTube di atas untuk melihat kalimat yang diterjemahkan di sini.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
          {history.map((item, index) => (
            <div
              key={`${item.id}-${index}`}
              className="bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 rounded-xl p-3.5 transition-colors space-y-1.5"
            >
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-indigo-400">{item.sourceLang}</span>
                  <ArrowRight className="w-3 h-3 text-slate-600" />
                  <span className="font-semibold text-cyan-400">{item.targetLang}</span>
                  <span>•</span>
                  <span>{item.timestamp}</span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => liveTranslator.speak(item.translatedText, 'id-ID')}
                    className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
                    title="Dengarkan terjemahan"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleCopy(item.translatedText, item.id)}
                    className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
                    title="Salin terjemahan"
                  >
                    {copiedId === item.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Translation */}
              <div className="text-sm font-semibold text-cyan-300">
                {item.translatedText}
              </div>

              {/* Original */}
              <div className="text-xs text-slate-400 italic">
                "{item.originalText}"
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
