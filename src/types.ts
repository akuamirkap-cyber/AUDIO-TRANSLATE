export type AudioSourceType = 'screen' | 'mic' | 'video_file' | 'demo';

export interface SubtitleItem {
  id: string;
  timestamp: string;
  originalText: string;
  translatedText: string;
  sourceLang: string;
  targetLang: string;
  confidence?: number;
  sentiment?: string;
}

export interface SubtitleSettings {
  fontSize: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  textColor: string;
  bgColor: string;
  bgOpacity: number;
  showOriginal: boolean;
  autoSpeak: boolean;
  voicePitch: number;
  voiceRate: number;
  position: 'bottom' | 'top' | 'middle';
}

export interface LanguageOption {
  code: string;
  name: string;
  flag: string;
  speechCode: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'id', name: 'Bahasa Indonesia', flag: '🇮🇩', speechCode: 'id-ID' },
  { code: 'en', name: 'English (US)', flag: '🇺🇸', speechCode: 'en-US' },
  { code: 'ja', name: 'Japanese (日本語)', flag: '🇯🇵', speechCode: 'ja-JP' },
  { code: 'ko', name: 'Korean (한국어)', flag: '🇰🇷', speechCode: 'ko-KR' },
  { code: 'zh', name: 'Chinese (中文)', flag: '🇨🇳', speechCode: 'zh-CN' },
  { code: 'es', name: 'Spanish (Español)', flag: '🇪🇸', speechCode: 'es-ES' },
  { code: 'ar', name: 'Arabic (العربية)', flag: '🇸🇦', speechCode: 'ar-SA' },
  { code: 'fr', name: 'French (Français)', flag: '🇫🇷', speechCode: 'fr-FR' },
  { code: 'de', name: 'German (Deutsch)', flag: '🇩🇪', speechCode: 'de-DE' },
  { code: 'ru', name: 'Russian (Русский)', flag: '🇷🇺', speechCode: 'ru-RU' },
];

export const SOURCE_LANGUAGES: LanguageOption[] = [
  { code: 'auto', name: 'Deteksi Otomatis (Auto)', flag: '🌐', speechCode: 'en-US' },
  { code: 'en', name: 'English', flag: '🇺🇸', speechCode: 'en-US' },
  { code: 'ja', name: 'Japanese (日本語)', flag: '🇯🇵', speechCode: 'ja-JP' },
  { code: 'ko', name: 'Korean (한국어)', flag: '🇰🇷', speechCode: 'ko-KR' },
  { code: 'zh', name: 'Mandarin (中文)', flag: '🇨🇳', speechCode: 'zh-CN' },
  { code: 'es', name: 'Spanish (Español)', flag: '🇪🇸', speechCode: 'es-ES' },
  { code: 'ar', name: 'Arabic (العربية)', flag: '🇸🇦', speechCode: 'ar-SA' },
  { code: 'id', name: 'Bahasa Indonesia', flag: '🇮🇩', speechCode: 'id-ID' },
];
