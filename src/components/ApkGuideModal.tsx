import React from 'react';
import { X, Smartphone, Download, Layers, ShieldCheck, CheckCircle2, ArrowRight, ExternalLink } from 'lucide-react';

interface ApkGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInstallPWA?: () => void;
  canInstallPWA?: boolean;
}

export const ApkGuideModal: React.FC<ApkGuideModalProps> = ({
  isOpen,
  onClose,
  onInstallPWA,
  canInstallPWA = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-indigo-500/30 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-indigo-900/60 to-purple-900/60 border-b border-indigo-500/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-600 text-white shadow-lg">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white">
                Panduan APK & Subtitle Layar Instagram/YouTube
              </h3>
              <p className="text-xs text-indigo-300">
                Cara pasang di HP Android & aktifkan subtitle melayang di atas aplikasi lain
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-slate-300 text-sm">
          {/* Method 1: Instant Install as Android WebAPK */}
          <div className="bg-slate-950/70 border border-indigo-500/30 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                  1
                </span>
                <h4 className="font-bold text-white text-sm">
                  Pasang Langsung ke HP (WebAPK 1-Klik)
                </h4>
              </div>
              <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                Rekomendasi
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Aplikasi ini sudah berstandar PWA (Progressive Web App) dengan manifest Android resmi. Saat dipasang, ikon ScreenLingo akan muncul di menu HP Anda layaknya APK native tanpa membuka browser.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              {canInstallPWA && onInstallPWA ? (
                <button
                  onClick={onInstallPWA}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-all shadow-md"
                >
                  <Download className="w-4 h-4" />
                  Instal Aplikasi ScreenLingo Sekarang
                </button>
              ) : (
                <div className="text-xs text-slate-300 bg-slate-900 p-2.5 rounded-lg border border-slate-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    Di Chrome Android: Tekan titik tiga (⋮) di pojok kanan atas lalu pilih <b>"Tambahkan ke Layar Utama"</b> atau <b>"Instal Aplikasi"</b>.
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Method 2: Floating Overlay / Picture-in-Picture */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-purple-600 text-white font-bold text-xs flex items-center justify-center">
                2
              </span>
              <h4 className="font-bold text-white text-sm">
                Cara Munculkan Subtitle Melayang Saat Buka Instagram / YouTube
              </h4>
            </div>
            <ul className="text-xs space-y-2 text-slate-400">
              <li className="flex items-start gap-2">
                <ArrowRight className="w-3.5 h-3.5 text-purple-400 mt-0.5 shrink-0" />
                <span>
                  <b>Langkah 1:</b> Klik tombol <b>"Mulai Terjemahkan Suara Layar"</b> di aplikasi ini.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <ArrowRight className="w-3.5 h-3.5 text-purple-400 mt-0.5 shrink-0" />
                <span>
                  <b>Langkah 2:</b> Klik tombol <b>"Buka Jendela Melayang (PiP)"</b> di bilah atas. Jendela subtitle kecil akan muncul melayang di layar Anda.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <ArrowRight className="w-3.5 h-3.5 text-purple-400 mt-0.5 shrink-0" />
                <span>
                  <b>Langkah 3:</b> Buka aplikasi Instagram atau YouTube Anda. Subtitle melayang akan tetap berada di atas video dan menerjemahkan setiap suara yang keluar!
                </span>
              </li>
            </ul>
          </div>

          {/* Method 3: Built-in Android Live Caption Feature */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-cyan-600 text-white font-bold text-xs flex items-center justify-center">
                3
              </span>
              <h4 className="font-bold text-white text-sm">
                Fitur Rahasia Android: Teks Otomatis Sistem (Live Caption)
              </h4>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Jika HP Android Anda (Samsung, Xiaomi, Pixel, Oppo, Vivo) menjalankan Android 10+:
            </p>
            <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 text-xs space-y-1 text-slate-300">
              <p>1. Buka <b>Pengaturan HP (Settings)</b> → <b>Aksesibilitas (Accessibility)</b></p>
              <p>2. Pilih <b>Teks Otomatis (Live Caption)</b> lalu aktifkan.</p>
              <p>3. Aktifkan juga opsi <b>"Terjemahan Teks Langsung" (Live Translate)</b> ke Bahasa Indonesia.</p>
              <p className="text-cyan-400 text-[11px] pt-1">
                Subtitle otomatis akan langsung muncul di setiap video Instagram & YouTube tanpa jeda!
              </p>
            </div>
          </div>

          {/* Method 4: Build standalone .apk via PWABuilder */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-white text-xs flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-400" />
                Ingin Mengemas Menjadi File .APK Mandiri?
              </h4>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Anda dapat mengemas URL aplikasi ini menjadi file APK mandiri kapan saja menggunakan tool resmi Microsoft <b>PWABuilder.com</b> atau <b>Bubblewrap CLI (Google)</b> secara gratis dan langsung install di HP.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-colors"
          >
            Mengerti & Siap Pakai
          </button>
        </div>
      </div>
    </div>
  );
};
