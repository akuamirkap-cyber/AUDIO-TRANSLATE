import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { AudioSourceSelector } from './components/AudioSourceSelector';
import { FloatingOverlay } from './components/FloatingOverlay';
import { VideoSimulator } from './components/VideoSimulator';
import { SubtitleCustomizer } from './components/SubtitleCustomizer';
import { SubtitleHistory } from './components/SubtitleHistory';
import { ApkGuideModal } from './components/ApkGuideModal';
import { SubtitleItem, SubtitleSettings, AudioSourceType } from './types';
import { liveTranslator } from './services/translator';
import { pipSubtitleManager } from './services/pipManager';
import { Radio, Sparkles, Smartphone, Layers, CheckCircle2, AlertCircle } from 'lucide-react';

export default function App() {
  const [isActive, setIsActive] = useState(false);
  const [currentSource, setCurrentSource] = useState<AudioSourceType>('mic');
  const [audioLevel, setAudioLevel] = useState(0);
  const [statusMessage, setStatusMessage] = useState('Penerjemah siap digunakan.');
  const [isErrorMessage, setIsErrorMessage] = useState(false);

  const [sourceLang, setSourceLang] = useState('auto');
  const [targetLang, setTargetLang] = useState('id');

  const [currentSubtitle, setCurrentSubtitle] = useState<SubtitleItem | null>(null);
  const [history, setHistory] = useState<SubtitleItem[]>([]);

  const [isApkGuideOpen, setIsApkGuideOpen] = useState(false);
  const [isPiPActive, setIsPiPActive] = useState(false);
  const [canInstallPWA, setCanInstallPWA] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  const [settings, setSettings] = useState<SubtitleSettings>({
    fontSize: 'lg',
    textColor: '#ffffff',
    bgColor: '#0f172a',
    bgOpacity: 0.9,
    showOriginal: true,
    autoSpeak: false,
    voicePitch: 1,
    voiceRate: 1,
    position: 'bottom',
  });

  // Listen to PWA install prompt
  useEffect(() => {
    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstallPWA(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  // Wire up LiveTranslator callbacks
  useEffect(() => {
    liveTranslator.onSubtitle((sub) => {
      setCurrentSubtitle(sub);

      // Only save final translations to history with deduplication
      if (sub.id !== 'interim' && sub.translatedText && !sub.translatedText.startsWith('[Gagal')) {
        setHistory((prev) => {
          if (prev.some((item) => item.id === sub.id)) return prev;
          return [sub, ...prev.slice(0, 49)];
        });
      }

      // Sync with PiP window
      pipSubtitleManager.updateSubtitles(
        sub.originalText,
        sub.translatedText,
        sub.sourceLang,
        sub.targetLang
      );
    });

    liveTranslator.onStatus((msg, isErr) => {
      setStatusMessage(msg);
      setIsErrorMessage(!!isErr);
    });

    liveTranslator.onAudioLevel((lvl) => {
      setAudioLevel(lvl);
    });

    liveTranslator.setLanguages(sourceLang, targetLang);
  }, [sourceLang, targetLang]);

  // Sync autoSpeak setting with liveTranslator
  useEffect(() => {
    liveTranslator.setAutoSpeak(settings.autoSpeak);
  }, [settings.autoSpeak]);

  // Update languages in translator
  const handleChangeSourceLang = (lang: string) => {
    setSourceLang(lang);
    liveTranslator.setLanguages(lang, targetLang);
  };

  const handleChangeTargetLang = (lang: string) => {
    setTargetLang(lang);
    liveTranslator.setLanguages(sourceLang, lang);
  };

  // Toggle listening
  const handleToggleActive = async () => {
    if (isActive) {
      liveTranslator.stop();
      setIsActive(false);
      setAudioLevel(0);
    } else {
      let started = false;
      if (currentSource === 'screen') {
        started = await liveTranslator.startScreenAudioCapture();
        const activeSrc = liveTranslator.getActiveSource();
        if (activeSrc === 'mic') {
          setCurrentSource('mic');
        }
      } else if (currentSource === 'mic') {
        started = await liveTranslator.startMicCapture();
      } else if (currentSource === 'demo') {
        started = true;
        setStatusMessage('Mode Simulator Reels/YouTube aktif. Putar video contoh di bawah.');
      }

      if (started) {
        setIsActive(true);
      }
    }
  };

  const handleSelectSource = async (source: AudioSourceType) => {
    setCurrentSource(source);
    if (isActive) {
      liveTranslator.stop();
      setIsActive(false);
      setAudioLevel(0);
      setStatusMessage(`Beralih ke mode ${source}. Klik Mulai untuk aktifkan.`);
    }
  };

  // Picture-in-Picture floating toggle
  const handleTogglePiP = async () => {
    if (isPiPActive) {
      pipSubtitleManager.stopFloatingPiP();
      setIsPiPActive(false);
    } else {
      const ok = await pipSubtitleManager.startFloatingPiP();
      if (ok) {
        setIsPiPActive(true);
      } else {
        setStatusMessage(
          'Jendela Picture-in-Picture dibatasi pada bingkai peramban ini. Subtitle overlay melayang di dalam layar tetap aktif!'
        );
      }
    }
  };

  // Install PWA
  const handleInstallPWA = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setCanInstallPWA(false);
        setDeferredPrompt(null);
      }
    } else {
      setIsApkGuideOpen(true);
    }
  };

  // Subtitle from video simulator with deduplication
  const handleSimulateSubtitle = React.useCallback(
    (sub: SubtitleItem) => {
      setCurrentSubtitle(sub);
      setHistory((prev) => {
        if (prev.some((item) => item.id === sub.id)) return prev;
        return [sub, ...prev.slice(0, 49)];
      });
      pipSubtitleManager.updateSubtitles(
        sub.originalText,
        sub.translatedText,
        sub.sourceLang,
        sub.targetLang
      );
      if (settings.autoSpeak && sub.translatedText) {
        setTimeout(() => {
          liveTranslator.speak(sub.translatedText, 'id-ID');
        }, 1200);
      }
    },
    [settings.autoSpeak]
  );

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        isPiPActive={isPiPActive}
        onTogglePiP={handleTogglePiP}
        onOpenApkGuide={() => setIsApkGuideOpen(true)}
        isActive={isActive}
        statusMessage={statusMessage}
        autoSpeak={settings.autoSpeak}
        onToggleAutoSpeak={() =>
          setSettings((prev) => ({ ...prev, autoSpeak: !prev.autoSpeak }))
        }
      />

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6 space-y-6">
        {/* Hero Banner */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-950/80 via-purple-950/50 to-slate-900 border border-indigo-500/30 p-6 md:p-8 shadow-2xl">
          <div className="relative z-10 max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-pink-400" />
              Penerjemah Suara Layar Otomatis (Reels, Shorts, Video)
            </div>

            <h1 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Terjemahkan Setiap Suara di Layar <span className="bg-gradient-to-r from-indigo-400 via-pink-400 to-amber-300 bg-clip-text text-transparent">Instagram & YouTube</span> Secara Real-Time
            </h1>

            <p className="text-sm md:text-base text-slate-300 leading-relaxed">
              Mendengarkan audio video asing dan langsung menampilkan subtitle Bahasa Indonesia melayang di atas layar ponsel atau laptop Anda.
            </p>

            {/* 3 Steps summary pills */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-2.5 flex items-center gap-2.5 text-xs text-slate-300">
                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center shrink-0 text-[11px]">1</span>
                <span>Pilih sumber suara (Layar/Tab atau Speaker)</span>
              </div>
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-2.5 flex items-center gap-2.5 text-xs text-slate-300">
                <span className="w-5 h-5 rounded-full bg-purple-600 text-white font-bold flex items-center justify-center shrink-0 text-[11px]">2</span>
                <span>Buka Subtitle Melayang (PiP)</span>
              </div>
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-2.5 flex items-center gap-2.5 text-xs text-slate-300">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0 text-[11px]">3</span>
                <span>Buka IG / YT & nikmati terjemahannya</span>
              </div>
            </div>
          </div>
        </section>

        {/* Audio Source Selector & Activator */}
        <AudioSourceSelector
          currentSource={currentSource}
          isActive={isActive}
          audioLevel={audioLevel}
          onSelectSource={handleSelectSource}
          onToggleActive={handleToggleActive}
          onCaptureSample={() => liveTranslator.forceCaptureSample()}
        />

        {/* Video Simulator (Allows instant test with IG Reels / YT clips) */}
        <VideoSimulator
          onSimulateSubtitle={handleSimulateSubtitle}
          targetLang={targetLang}
        />

        {/* Subtitle Settings & Customization */}
        <SubtitleCustomizer
          settings={settings}
          onUpdateSettings={(newSet) => setSettings((prev) => ({ ...prev, ...newSet }))}
          sourceLang={sourceLang}
          targetLang={targetLang}
          onChangeSourceLang={handleChangeSourceLang}
          onChangeTargetLang={handleChangeTargetLang}
        />

        {/* Subtitle Log / History */}
        <SubtitleHistory
          history={history}
          onClear={() => setHistory([])}
        />
      </main>

      {/* In-app Draggable Floating Overlay (Always visible when active or has subtitle) */}
      <FloatingOverlay
        currentSubtitle={currentSubtitle}
        settings={settings}
        onUpdateSettings={(newSet) => setSettings((prev) => ({ ...prev, ...newSet }))}
      />

      {/* APK & Mobile Installation Modal */}
      <ApkGuideModal
        isOpen={isApkGuideOpen}
        onClose={() => setIsApkGuideOpen(false)}
        onInstallPWA={handleInstallPWA}
        canInstallPWA={canInstallPWA}
      />

      {/* Footer */}
      <footer className="mt-12 border-t border-slate-800 py-6 text-center text-xs text-slate-500">
        <p>ScreenLingo • Solusi Penerjemah Audio Layar & Video Instagram / YouTube Berbasis AI Gemini</p>
      </footer>
    </div>
  );
}
