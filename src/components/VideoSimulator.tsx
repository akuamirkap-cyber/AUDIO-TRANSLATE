import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Youtube, Instagram, Sparkles, Volume2, Upload } from 'lucide-react';
import { SubtitleItem } from '../types';
import { liveTranslator } from '../services/translator';

interface VideoSimulatorProps {
  onSimulateSubtitle: (subtitle: SubtitleItem) => void;
  targetLang: string;
}

interface DemoClip {
  id: string;
  platform: 'youtube' | 'instagram';
  title: string;
  creator: string;
  lang: string;
  flag: string;
  videoUrl?: string;
  subtitles: { time: number; text: string; indonesian: string }[];
}

const DEMO_CLIPS: DemoClip[] = [
  {
    id: 'yt-english-tech',
    platform: 'youtube',
    title: 'Top 5 AI Gadgets That Will Change Everything!',
    creator: 'TechUnboxed HD',
    lang: 'English',
    flag: '🇺🇸',
    subtitles: [
      { time: 0, text: "Hey guys! Welcome back to the channel. Today we're reviewing the craziest new AI tech.", indonesian: "Halo teman-teman! Selamat datang kembali. Hari ini kita mengulas teknologi AI terbaru paling gila." },
      { time: 3, text: "Look at this sleek design. When you tap the screen, it instantly recognizes any audio in the room.", indonesian: "Lihat desain elegannya. Saat layarnya disentuh, alat ini langsung mengenali semua suara di ruangan." },
      { time: 7, text: "The translation speed is literally zero latency, which blew my mind completely.", indonesian: "Kecepatan terjemahannya benar-benar tanpa jeda, yang bikin saya sangat kagum." },
      { time: 11, text: "Make sure you hit that subscribe button down below for more exclusive tech breakdowns!", indonesian: "Pastikan kalian klik tombol subscribe di bawah untuk ulasan teknologi eksklusif lainnya!" },
    ],
  },
  {
    id: 'ig-japanese-food',
    platform: 'instagram',
    title: 'Tokyo Street Food: Crispy Wagyu Katsu Sando 🥩',
    creator: '@tokyoeats_official',
    lang: 'Japanese',
    flag: '🇯🇵',
    subtitles: [
      { time: 0, text: "みなさんこんにちは！今日は東京の隠れ家的なカツサンド店に来ました。", indonesian: "Halo semuanya! Hari ini saya berkunjung ke kedai katsu sando tersembunyi di Tokyo." },
      { time: 3, text: "見てください、この極上の霜降り和牛！外はサクサク、中はジューシーです。", indonesian: "Coba lihat, daging wagyu marmer istimewa ini! Luarnya renyah, dalamnya sangat empuk berair." },
      { time: 7, text: "一口食べると、肉汁が口いっぱいに広がって本当に美味しいです！", indonesian: "Satu gigitan saja, sari dagingnya langsung memenuhi mulut dan rasanya luar biasa lezat!" },
      { time: 11, text: "東京に来たら絶対に食べるべき逸品ですね。保存して友達と来てね！", indonesian: "Wajib dicoba kalau kalian ke Tokyo. Simpan video ini dan ajak teman kalian ya!" },
    ],
  },
  {
    id: 'yt-korean-vlog',
    platform: 'youtube',
    title: 'Seoul Night Market Walk & Spicy Tteokbokki',
    creator: 'SeoulVibes 24',
    lang: 'Korean',
    flag: '🇰🇷',
    subtitles: [
      { time: 0, text: "안녕하세요 여러분! 오늘은 밤의 동대문 야시장에 나왔습니다.", indonesian: "Halo semuanya! Malam ini saya sedang berada di pasar malam Dongdaemun." },
      { time: 3, text: "여기 매콤한 떡볶이 냄새가 정말 예술이에요. 벌써 군침이 돕니다.", indonesian: "Aroma tteokbokki pedas di sini benar-benar menggoda selera. Bikin ngiler banget." },
      { time: 7, text: "매운맛이 강하지만 달콤해서 계속 먹게 되네요. 완전 추천합니다!", indonesian: "Meskipun pedasnya mantap tapi manis gurih, bikin ketagihan. Sangat direkomendasikan!" },
      { time: 11, text: "영상 즐겁게 보셨다면 좋아요와 알림 설정 부탁드립니다!", indonesian: "Jika kalian menikmati video ini, jangan lupa like dan aktifkan lonceng notifikasi ya!" },
    ],
  },
  {
    id: 'ig-spanish-travel',
    platform: 'instagram',
    title: 'Hidden Gem in Barcelona: La Sagrada Familia View 🇪🇸',
    creator: '@viajeros_del_mundo',
    lang: 'Spanish',
    flag: '🇪🇸',
    subtitles: [
      { time: 0, text: "¡Hola a todos! Miren este rincón secreto con la mejor vista de Barcelona.", indonesian: "Halo semuanya! Lihat sudut rahasia ini dengan pemandangan terbaik kota Barcelona." },
      { time: 3, text: "La arquitectura aquí es absolutamente impresionante y la luz del atardecer es mágica.", indonesian: "Arsitektur di sini benar-benar menakjubkan dan cahaya matahari terbenamnya begitu magis." },
      { time: 7, text: "Si vienes a España, este es un lugar imperdible que debes visitar sí o sí.", indonesian: "Jika kamu ke Spanyol, tempat ini wajib banget kamu kunjungi tanpa terkecuali." },
      { time: 11, text: "Comparte este reel con la persona que te acompañará en tu próximo viaje.", indonesian: "Bagikan reel ini ke orang yang ingin kamu ajak di liburan berikutnya." },
    ],
  },
];

export const VideoSimulator: React.FC<VideoSimulatorProps> = ({ onSimulateSubtitle, targetLang }) => {
  const [selectedClip, setSelectedClip] = useState<DemoClip>(DEMO_CLIPS[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [customInput, setCustomInput] = useState('');
  const [isTranslatingCustom, setIsTranslatingCustom] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const lastTriggeredTimeRef = useRef<number | null>(null);

  // Interval timer for playback progression
  useEffect(() => {
    if (!isPlaying) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    timerRef.current = setInterval(() => {
      setCurrentTime((prev) => {
        if (prev >= 14) {
          return 15;
        }
        return prev + 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isPlaying]);

  // Effect to dispatch subtitles and handle video end safely
  useEffect(() => {
    if (!isPlaying) return;

    if (currentTime >= 15) {
      setIsPlaying(false);
      setCurrentTime(0);
      lastTriggeredTimeRef.current = null;
      return;
    }

    const currentSub = [...selectedClip.subtitles]
      .reverse()
      .find((s) => s.time <= currentTime);

    if (currentSub && lastTriggeredTimeRef.current !== currentSub.time) {
      lastTriggeredTimeRef.current = currentSub.time;
      
      // Simulate real actor voice
      const langVoiceMap: Record<string, string> = {
        English: 'en-US',
        Japanese: 'ja-JP',
        Korean: 'ko-KR',
        Spanish: 'es-ES',
      };
      const voiceLang = langVoiceMap[selectedClip.lang] || 'en-US';
      liveTranslator.speak(currentSub.text, voiceLang);

      onSimulateSubtitle({
        id: `${selectedClip.id}-${currentSub.time}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: new Date().toLocaleTimeString(),
        originalText: currentSub.text,
        translatedText: currentSub.indonesian,
        sourceLang: selectedClip.lang,
        targetLang: targetLang,
      });
    }
  }, [currentTime, isPlaying, selectedClip, targetLang, onSimulateSubtitle]);

  const handleSelectClip = (clip: DemoClip) => {
    setIsPlaying(false);
    setCurrentTime(0);
    lastTriggeredTimeRef.current = null;
    setSelectedClip(clip);
  };

  const handleCustomTranslate = async () => {
    if (!customInput.trim()) return;
    setIsTranslatingCustom(true);
    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: customInput.trim(),
          sourceLang: 'auto',
          targetLang: targetLang,
        }),
      });
      const data = await res.json();
      onSimulateSubtitle({
        id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: new Date().toLocaleTimeString(),
        originalText: customInput.trim(),
        translatedText: data.translatedText || customInput,
        sourceLang: data.detectedLanguage || 'Auto',
        targetLang: targetLang,
      });
      setCustomInput('');
    } catch (e) {
      console.error(e);
    } finally {
      setIsTranslatingCustom(false);
    }
  };

  const activeSubtitle = [...selectedClip.subtitles]
    .reverse()
    .find((s) => s.time <= currentTime) || selectedClip.subtitles[0];

  return (
    <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-pink-400" />
            Simulator Uji Coba Video Layar (Instagram & YouTube)
          </h2>
          <p className="text-xs text-slate-400">
            Coba putar video di bawah untuk melihat bagaimana subtitle melayang menerjemahkan suara secara langsung
          </p>
        </div>

        {/* Preset Selector Badges */}
        <div className="flex flex-wrap gap-1.5">
          {DEMO_CLIPS.map((clip) => (
            <button
              key={clip.id}
              onClick={() => handleSelectClip(clip)}
              className={`text-xs px-2.5 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 border ${
                selectedClip.id === clip.id
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
            >
              <span>{clip.flag}</span>
              <span>{clip.lang}</span>
              {clip.platform === 'youtube' ? (
                <Youtube className="w-3.5 h-3.5 text-red-400" />
              ) : (
                <Instagram className="w-3.5 h-3.5 text-pink-400" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Mock Video Player Screen */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/80 border border-slate-800 aspect-video md:aspect-[21/9] flex flex-col justify-between p-4 shadow-2xl">
        {/* Mock App Header */}
        <div className="flex items-center justify-between z-10">
          <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
            {selectedClip.platform === 'youtube' ? (
              <span className="flex items-center gap-1 text-red-400 text-xs font-bold">
                <Youtube className="w-4 h-4" /> YouTube Video
              </span>
            ) : (
              <span className="flex items-center gap-1 text-pink-400 text-xs font-bold">
                <Instagram className="w-4 h-4" /> Instagram Reels
              </span>
            )}
            <span className="text-slate-500">•</span>
            <span className="text-xs text-slate-300 font-medium">{selectedClip.creator}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Audio Layar Aktif
            </span>
          </div>
        </div>

        {/* Mock Waveform / Center visual */}
        <div className="flex flex-col items-center justify-center text-center my-auto py-2 z-10 space-y-2">
          <div className="text-xs font-bold tracking-wider text-indigo-400 uppercase">
            {selectedClip.title}
          </div>
          
          {isPlaying && (
            <div className="flex items-center gap-1 h-8 my-1">
              {[40, 75, 95, 60, 85, 100, 50, 70, 90, 65, 80, 45, 90, 70, 85].map((h, i) => (
                <div
                  key={i}
                  className="w-1.5 bg-gradient-to-t from-indigo-500 to-pink-500 rounded-full animate-pulse"
                  style={{
                    height: `${(h * (0.4 + (i % 3) * 0.3))}%`,
                    animationDelay: `${i * 0.08}s`,
                  }}
                />
              ))}
            </div>
          )}

          {/* Real-time Subtitle Display inside the Mock Player */}
          <div className="max-w-xl mx-auto bg-black/85 backdrop-blur-md border border-indigo-500/40 px-4 py-2.5 rounded-xl shadow-2xl">
            <div className="text-sm md:text-base font-bold text-cyan-300 drop-shadow">
              "{activeSubtitle.indonesian}"
            </div>
            <div className="text-xs text-slate-400 italic mt-0.5">
              Original ({selectedClip.lang}): "{activeSubtitle.text}"
            </div>
          </div>
        </div>

        {/* Video Control Bar */}
        <div className="flex items-center justify-between gap-3 bg-black/70 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/10 z-10">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            <button
              onClick={() => {
                setIsPlaying(false);
                setCurrentTime(0);
                lastTriggeredTimeRef.current = null;
              }}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <span className="text-xs text-slate-300 font-mono">
              00:{currentTime.toString().padStart(2, '0')} / 00:15
            </span>
          </div>

          {/* Progress track */}
          <div className="flex-1 mx-3 bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-indigo-500 to-pink-500 h-full transition-all duration-300"
              style={{ width: `${(currentTime / 15) * 100}%` }}
            />
          </div>

          <div className="text-xs text-slate-400 hidden sm:block">
            {selectedClip.lang} → Bahasa Indonesia
          </div>
        </div>
      </div>

      {/* Quick Text Translator tester */}
      <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
        <input
          type="text"
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleCustomTranslate()}
          placeholder="Atau ketik/tempel kalimat video di sini untuk dites terjemahannya..."
          className="flex-1 w-full bg-slate-950/70 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
        />
        <button
          onClick={handleCustomTranslate}
          disabled={isTranslatingCustom || !customInput.trim()}
          className="w-full sm:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap shadow-md"
        >
          <Sparkles className="w-3.5 h-3.5" />
          {isTranslatingCustom ? 'Menerjemahkan...' : 'Tes Terjemah Langsung'}
        </button>
      </div>

      {/* Instant 1-Click Test Prompts */}
      <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-400">
        <span className="font-semibold text-slate-400">Coba 1-Klik:</span>
        <button
          onClick={() => {
            setCustomInput("What's up guys! Welcome back to another tech review.");
          }}
          className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-indigo-300 border border-slate-700 transition-colors"
        >
          🇺🇸 "What's up guys! Welcome back..."
        </button>
        <button
          onClick={() => {
            setCustomInput("みなさんこんにちは！この和牛は本当に美味しいです！");
          }}
          className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-pink-300 border border-slate-700 transition-colors"
        >
          🇯🇵 "みなさんこんにちは！この和牛..."
        </button>
        <button
          onClick={() => {
            setCustomInput("안녕하세요 여러분! 오늘 서울 날씨가 너무 좋네요.");
          }}
          className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-emerald-300 border border-slate-700 transition-colors"
        >
          🇰🇷 "안녕하세요 여러분! 오늘 서울..."
        </button>
      </div>
    </div>
  );
};
