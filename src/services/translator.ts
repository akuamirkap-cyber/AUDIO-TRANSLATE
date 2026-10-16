import { SubtitleItem } from '../types';
import { encodeWAV, downsampleBuffer } from './wavEncoder';

export class LiveTranslatorService {
  private recognition: any = null;
  private isListening = false;
  private displayStream: MediaStream | null = null;
  private micStream: MediaStream | null = null;
  private onSubtitleCallback: ((subtitle: SubtitleItem) => void) | null = null;
  private onStatusCallback: ((status: string, isError?: boolean) => void) | null = null;
  private onAudioLevelCallback: ((level: number) => void) | null = null;

  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private scriptProcessor: ScriptProcessorNode | null = null;
  private audioAnimFrame: number | null = null;

  // Buffer for raw PCM audio capture
  private pcmChunks: Float32Array[] = [];
  private totalSamples = 0;
  private lastSoundDetectedAt = 0;
  private isProcessingAudio = false;

  private targetLang = 'id';
  private sourceLang = 'auto';
  private lastTranscribed = '';
  private translationCache = new Map<string, string>();
  private autoSpeak = false;

  constructor() {
    this.initSpeechRecognition();
  }

  private initSpeechRecognition() {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.maxAlternatives = 1;
      this.recognition.lang = this.sourceLang === 'auto' ? 'en-US' : this.getSpeechLangCode(this.sourceLang);

      this.recognition.onresult = async (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        const textToProcess = (finalTranscript || interimTranscript).trim();

        if (textToProcess && textToProcess !== this.lastTranscribed) {
          if (finalTranscript) {
            this.lastTranscribed = textToProcess;
            await this.processTranslation(textToProcess);
          } else {
            // Quick interim preview
            if (this.onSubtitleCallback) {
              this.onSubtitleCallback({
                id: 'interim',
                timestamp: new Date().toLocaleTimeString(),
                originalText: textToProcess,
                translatedText: 'Menerjemahkan...',
                sourceLang: this.sourceLang,
                targetLang: this.targetLang,
              });
            }
          }
        }
      };

      this.recognition.onerror = (event: any) => {
        console.warn('Speech recognition status:', event.error);
        if (event.error === 'not-allowed') {
          // Inside an iframe or when mic is blocked, inform user and keep PCM audio capture running
          this.reportStatus(
            'Catatan: Web Speech API dibatasi di bingkai iframe. Menggunakan sistem tangkap audio cerdas (WAV + Gemini AI)...',
            false
          );
        } else if (event.error === 'network') {
          this.reportStatus('Koneksi suara lambat. Tetap mendengarkan...', false);
        }
      };

      this.recognition.onend = () => {
        if (this.isListening) {
          setTimeout(() => {
            if (this.isListening && this.recognition) {
              try {
                this.recognition.start();
              } catch {}
            }
          }, 400);
        }
      };
    }
  }

  public setLanguages(source: string, target: string) {
    this.sourceLang = source;
    this.targetLang = target;
    if (this.recognition) {
      this.recognition.lang = source === 'auto' ? 'en-US' : this.getSpeechLangCode(source);
    }
  }

  public setAutoSpeak(enabled: boolean) {
    this.autoSpeak = enabled;
  }

  private getSpeechLangCode(code: string): string {
    const map: Record<string, string> = {
      en: 'en-US',
      id: 'id-ID',
      ja: 'ja-JP',
      ko: 'ko-KR',
      zh: 'zh-CN',
      es: 'es-ES',
      ar: 'ar-SA',
      fr: 'fr-FR',
      de: 'de-DE',
      ru: 'ru-RU',
    };
    return map[code] || 'en-US';
  }

  public onSubtitle(callback: (subtitle: SubtitleItem) => void) {
    this.onSubtitleCallback = callback;
  }

  public onStatus(callback: (status: string, isError?: boolean) => void) {
    this.onStatusCallback = callback;
  }

  public onAudioLevel(callback: (level: number) => void) {
    this.onAudioLevelCallback = callback;
  }

  private reportStatus(msg: string, isError = false) {
    if (this.onStatusCallback) {
      this.onStatusCallback(msg, isError);
    }
  }

  /**
   * Start capturing audio from Screen/Tab (captures YouTube / Instagram tab audio)
   */
  public async startScreenAudioCapture(): Promise<boolean> {
    try {
      this.reportStatus('Pilih Tab "YouTube" dan centang "Bagikan audio tab" (Share audio)...');

      if (!navigator.mediaDevices || typeof navigator.mediaDevices.getDisplayMedia !== 'function') {
        this.reportStatus('Browser tidak mendukung tangkap layar. Beralih ke mode Mikrofon/Speaker...', false);
        return await this.startMicCapture();
      }

      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true, // Crucial for YouTube / Instagram tab sound
      });

      this.displayStream = stream;

      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length === 0) {
        this.reportStatus(
          'PENTING: Anda belum mencentang "Bagikan audio" / "Share audio" saat memilih tab YouTube. Ulangi & centang agar suara tertangkap.',
          true
        );
      } else {
        this.reportStatus('Audio YouTube/Layar terhubung! Sedang mendengarkan & menerjemahkan ke Bahasa Indonesia...');
      }

      // Attach audio processor to capture tab audio stream
      await this.setupAudioStreamProcessor(stream);

      // Handle user stopping screen share via browser bar
      if (stream.getVideoTracks().length > 0) {
        stream.getVideoTracks()[0].onended = () => {
          this.stop();
        };
      }

      this.isListening = true;
      return true;
    } catch (err: any) {
      console.warn('Display media capture error:', err);
      const isPolicyDisallowed =
        err?.name === 'NotAllowedError' &&
        (err?.message?.includes('permissions policy') ||
          err?.message?.includes('disallowed') ||
          err?.message?.includes('denied'));

      if (isPolicyDisallowed) {
        this.reportStatus(
          'Izin tangkap layar dibatasi oleh bingkai peramban. Beralih otomatis ke Mikrofon/Speaker HP...',
          false
        );
      } else {
        this.reportStatus(
          'Batal menangkap layar. Beralih otomatis ke mode Mikrofon/Speaker HP...',
          false
        );
      }

      return await this.startMicCapture();
    }
  }

  public getActiveSource(): 'screen' | 'mic' | 'none' {
    if (this.displayStream) return 'screen';
    if (this.micStream) return 'mic';
    return 'none';
  }

  /**
   * Start capturing audio from Microphone or Speaker
   */
  public async startMicCapture(): Promise<boolean> {
    try {
      this.reportStatus('Menghubungkan mikrofon/suara speaker...');
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      this.micStream = stream;
      await this.setupAudioStreamProcessor(stream);
      this.startSpeechRecognition();

      this.isListening = true;
      this.reportStatus('Mikrofon aktif! Letakkan HP dekat speaker YouTube / Instagram.');
      return true;
    } catch (err: any) {
      console.error('Mic capture error:', err);
      this.reportStatus('Izin mikrofon diperlukan. Pastikan Anda mengizinkan akses mikrofon di peramban.', true);
      return false;
    }
  }

  private startSpeechRecognition() {
    if (this.recognition) {
      try {
        this.recognition.start();
      } catch {}
    }
  }

  /**
   * Audio Stream Processor
   * Captures raw PCM audio directly from YouTube tab or microphone,
   * detects speech volume, and sends lossless 16kHz WAV clips to Gemini API.
   */
  private async setupAudioStreamProcessor(stream: MediaStream) {
    try {
      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length === 0) {
        this.reportStatus(
          'PENTING: Tidak ada audio terdeteksi! Saat memilih tab YouTube di pop-up browser, pastikan Anda mencentang "Bagikan audio tab" / "Share tab audio".',
          true
        );
        return;
      }

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      this.audioContext = new AudioCtx();

      // Ensure AudioContext is running (crucial in Chrome / iframe policies)
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      const source = this.audioContext.createMediaStreamSource(stream);

      // Gain node for amplifying quiet YouTube/speech audio
      const gainNode = this.audioContext.createGain();
      gainNode.gain.value = 2.5;

      // Analyser for visual feedback
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 64;

      source.connect(gainNode);
      gainNode.connect(this.analyser);

      // ScriptProcessor for collecting PCM audio samples
      this.scriptProcessor = this.audioContext.createScriptProcessor(4096, 1, 1);
      gainNode.connect(this.scriptProcessor);
      this.scriptProcessor.connect(this.audioContext.destination);

      const inputSampleRate = this.audioContext.sampleRate;
      this.pcmChunks = [];
      this.totalSamples = 0;
      this.lastSoundDetectedAt = Date.now();

      this.scriptProcessor.onaudioprocess = (e) => {
        if (!this.isListening) return;

        const inputData = e.inputBuffer.getChannelData(0);

        // Calculate volume / energy
        let sum = 0;
        for (let i = 0; i < inputData.length; i++) {
          sum += inputData[i] * inputData[i];
        }
        const rms = Math.sqrt(sum / inputData.length);
        const volume = Math.min(100, Math.round(rms * 500));

        if (this.onAudioLevelCallback) {
          this.onAudioLevelCallback(volume);
        }

        // Voice activity detection threshold (sensitive)
        if (volume > 4) {
          this.lastSoundDetectedAt = Date.now();
        }

        // Buffer audio samples
        this.pcmChunks.push(new Float32Array(inputData));
        this.totalSamples += inputData.length;

        // Process audio chunk when:
        // 1. We have accumulated ~3 seconds of audio (~130,000 samples)
        // OR
        // 2. We have at least 1.2s of audio and a natural pause occurred
        const durationSec = this.totalSamples / inputSampleRate;
        const silenceDuration = Date.now() - this.lastSoundDetectedAt;

        const shouldFlush =
          durationSec >= 3.2 ||
          (durationSec >= 1.2 && silenceDuration > 500 && this.lastSoundDetectedAt > 0);

        if (shouldFlush && !this.isProcessingAudio) {
          this.flushAudioBuffer(inputSampleRate);
        }
      };
    } catch (e) {
      console.warn('Audio stream processor setup error:', e);
    }
  }

  private async flushAudioBuffer(inputSampleRate: number) {
    if (this.pcmChunks.length === 0 || this.isProcessingAudio) return;

    this.isProcessingAudio = true;
    const chunksToProcess = [...this.pcmChunks];
    const sampleCount = this.totalSamples;

    // Reset buffer for next speech segment
    this.pcmChunks = [];
    this.totalSamples = 0;

    try {
      // Merge all chunks into a single Float32Array
      const merged = new Float32Array(sampleCount);
      let offset = 0;
      for (const chunk of chunksToProcess) {
        merged.set(chunk, offset);
        offset += chunk.length;
      }

      // Downsample to 16kHz for speech recognition
      const downsampled = downsampleBuffer(merged, inputSampleRate, 16000);

      // Encode to valid 16-bit Mono WAV
      const wavBlob = encodeWAV(downsampled, 16000);

      // Only send if buffer contains audio (> 4KB is at least 0.125s of audio)
      if (wavBlob.size > 5000) {
        await this.sendWavToGemini(wavBlob);
      }
    } catch (err) {
      console.warn('Error flushing audio buffer:', err);
    } finally {
      this.isProcessingAudio = false;
    }
  }

  /**
   * Manual force capture: flushes current audio buffer immediately or waits 2s to capture current speech
   */
  public async forceCaptureSample(): Promise<void> {
    if (!this.audioContext || !this.isListening) {
      this.reportStatus('Penerjemah belum aktif. Klik "Mulai Terjemahkan" terlebih dahulu.', true);
      return;
    }
    this.reportStatus('Sedang mengambil sampel audio layar/mikrofon...');
    if (this.pcmChunks.length > 0 && this.totalSamples > 8000) {
      await this.flushAudioBuffer(this.audioContext.sampleRate);
      this.reportStatus('Sampel audio dikirim ke AI Gemini...');
    } else {
      setTimeout(async () => {
        if (this.audioContext && this.isListening) {
          await this.flushAudioBuffer(this.audioContext.sampleRate);
          this.reportStatus('Sampel audio dikirim ke AI Gemini...');
        }
      }, 2500);
    }
  }

  private async sendWavToGemini(blob: Blob) {
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Data = (reader.result as string) || '';
        try {
          const res = await fetch('/api/transcribe-audio', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              audioData: base64Data,
              mimeType: 'audio/wav',
              targetLang: this.targetLang,
            }),
          });

          if (res.ok) {
            const data = await res.json();
            if (data.originalText && data.translatedText) {
              const subItem: SubtitleItem = {
                id: `audio-${Date.now()}`,
                timestamp: new Date().toLocaleTimeString(),
                originalText: data.originalText,
                translatedText: data.translatedText,
                sourceLang: data.detectedLanguage || this.sourceLang,
                targetLang: this.targetLang,
              };

              if (this.onSubtitleCallback) {
                this.onSubtitleCallback(subItem);
              }

              // Auto-speak translated Indonesian speech if enabled
              if (this.autoSpeak) {
                this.speak(data.translatedText, 'id-ID');
              }
            }
          }
        } catch (fetchErr) {
          console.warn('WAV transcription fetch non-fatal:', fetchErr);
        }
      };
      reader.readAsDataURL(blob);
    } catch (e) {
      console.warn('WAV reader error:', e);
    }
  }

  public async processTranslation(originalText: string) {
    if (!originalText || !originalText.trim()) return;

    const trimmed = originalText.trim();

    // Check cache
    const cacheKey = `${this.sourceLang}_${this.targetLang}_${trimmed}`;
    if (this.translationCache.has(cacheKey)) {
      const cached = this.translationCache.get(cacheKey)!;
      const subItem: SubtitleItem = {
        id: Date.now().toString(),
        timestamp: new Date().toLocaleTimeString(),
        originalText: trimmed,
        translatedText: cached,
        sourceLang: this.sourceLang,
        targetLang: this.targetLang,
      };

      if (this.onSubtitleCallback) {
        this.onSubtitleCallback(subItem);
      }

      if (this.autoSpeak) {
        this.speak(cached, 'id-ID');
      }
      return;
    }

    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: trimmed,
          sourceLang: this.sourceLang,
          targetLang: this.targetLang,
        }),
      });

      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();

      const translated = data.translatedText || trimmed;
      this.translationCache.set(cacheKey, translated);

      const subItem: SubtitleItem = {
        id: Date.now().toString(),
        timestamp: new Date().toLocaleTimeString(),
        originalText: trimmed,
        translatedText: translated,
        sourceLang: data.detectedLanguage || this.sourceLang,
        targetLang: this.targetLang,
        sentiment: data.sentiment,
      };

      if (this.onSubtitleCallback) {
        this.onSubtitleCallback(subItem);
      }

      if (this.autoSpeak) {
        this.speak(translated, 'id-ID');
      }
    } catch (err: any) {
      console.error('Translation error:', err);
      if (this.onSubtitleCallback) {
        this.onSubtitleCallback({
          id: Date.now().toString(),
          timestamp: new Date().toLocaleTimeString(),
          originalText: trimmed,
          translatedText: `[Gagal koneksi terjemahan]: ${trimmed}`,
          sourceLang: this.sourceLang,
          targetLang: this.targetLang,
        });
      }
    }
  }

  /**
   * Speak Indonesian translation out loud
   */
  public speak(text: string, lang = 'id-ID') {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      // Select natural Indonesian voice if available
      const voices = window.speechSynthesis.getVoices();
      const idVoice = voices.find(
        (v) =>
          v.lang.startsWith('id') ||
          v.lang.includes('ID') ||
          v.name.toLowerCase().includes('indonesia')
      );
      if (idVoice) {
        utterance.voice = idVoice;
      }

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('TTS error:', e);
    }
  }

  public stop() {
    this.isListening = false;
    this.isProcessingAudio = false;
    this.pcmChunks = [];
    this.totalSamples = 0;

    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {}
    }
    if (this.displayStream) {
      this.displayStream.getTracks().forEach((t) => t.stop());
      this.displayStream = null;
    }
    if (this.micStream) {
      this.micStream.getTracks().forEach((t) => t.stop());
      this.micStream = null;
    }
    if (this.scriptProcessor) {
      this.scriptProcessor.disconnect();
      this.scriptProcessor = null;
    }
    if (this.audioAnimFrame) {
      cancelAnimationFrame(this.audioAnimFrame);
      this.audioAnimFrame = null;
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }
    this.reportStatus('Penerjemah dihentikan.');
  }

  public get active(): boolean {
    return this.isListening;
  }
}

export const liveTranslator = new LiveTranslatorService();
