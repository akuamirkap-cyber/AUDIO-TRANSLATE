/**
 * Picture-in-Picture Subtitle Manager
 * Allows subtitles to float on top of other applications (Instagram, YouTube, etc.)
 * Supports both Document Picture-in-Picture API and Video Canvas PiP fallback.
 */

export class PiPSubtitleManager {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D | null;
  private video: HTMLVideoElement | null = null;
  private stream: MediaStream | null = null;
  private isPiPActive = false;
  private docPiPWindow: Window | null = null;
  private currentOriginal = '';
  private currentTranslated = '';
  private sourceLang = 'EN';
  private targetLang = 'ID';
  private animFrameId: number | null = null;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = 640;
    this.canvas.height = 240;
    this.ctx = this.canvas.getContext('2d');
  }

  private ensureVideoElement(): HTMLVideoElement {
    if (!this.video) {
      this.video = document.createElement('video');
      this.video.muted = true;
      this.video.playsInline = true;
      this.video.autoplay = true;
      this.video.style.position = 'fixed';
      this.video.style.width = '1px';
      this.video.style.height = '1px';
      this.video.style.opacity = '0';
      this.video.style.pointerEvents = 'none';
      this.video.style.top = '-9999px';
    }

    if (typeof document !== 'undefined' && document.body && !document.body.contains(this.video)) {
      document.body.appendChild(this.video);
    }

    return this.video;
  }

  public updateSubtitles(original: string, translated: string, source: string = 'EN', target: string = 'ID') {
    this.currentOriginal = original;
    this.currentTranslated = translated;
    this.sourceLang = source.toUpperCase();
    this.targetLang = target.toUpperCase();

    // If using Document PiP window
    if (this.docPiPWindow && !this.docPiPWindow.closed) {
      const origEl = this.docPiPWindow.document.getElementById('pip-orig');
      const transEl = this.docPiPWindow.document.getElementById('pip-trans');
      if (origEl) origEl.textContent = original;
      if (transEl) transEl.textContent = translated || 'Mendengarkan suara video...';
    }

    // Render to Canvas
    this.renderCanvas();
  }

  private renderCanvas() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // Background gradient with rounded appearance
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, w, h);

    // Accent header bar
    const grad = ctx.createLinearGradient(0, 0, w, 0);
    grad.addColorStop(0, '#6366f1');
    grad.addColorStop(0.5, '#a855f7');
    grad.addColorStop(1, '#ec4899');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, 8);

    // Tag Pill
    ctx.fillStyle = '#312e81';
    ctx.beginPath();
    ctx.roundRect(24, 20, 160, 28, 8);
    ctx.fill();

    ctx.fillStyle = '#a5b4fc';
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.fillText(`● LIVE: ${this.sourceLang} → ${this.targetLang}`, 34, 39);

    // Translated Main Subtitle
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 22px system-ui, sans-serif';
    const mainText = this.currentTranslated || 'Mendengarkan audio layar...';
    this.wrapText(ctx, mainText, 24, 85, w - 48, 28);

    // Original Transcribed Subtitle
    if (this.currentOriginal) {
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'italic 16px system-ui, sans-serif';
      this.wrapText(ctx, `"${this.currentOriginal}"`, 24, 175, w - 48, 22);
    }
  }

  private wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
    const words = text.split(' ');
    let line = '';
    let currentY = y;

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;
      if (testWidth > maxWidth && n > 0) {
        ctx.fillText(line, x, currentY);
        line = words[n] + ' ';
        currentY += lineHeight;
        if (currentY > y + lineHeight * 2) {
          ctx.fillText(line + '...', x, currentY);
          return;
        }
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, x, currentY);
  }

  public async startFloatingPiP(): Promise<boolean> {
    try {
      // 1. Try Document Picture-in-Picture (Chrome 116+ & Android)
      if (typeof window !== 'undefined' && 'documentPictureInPicture' in window) {
        try {
          const docPiP = (window as any).documentPictureInPicture;
          const pipWin = await docPiP.requestWindow({
            width: 480,
            height: 220,
          });

          this.docPiPWindow = pipWin;
          this.isPiPActive = true;

          const style = pipWin.document.createElement('style');
          style.textContent = `
            body {
              margin: 0;
              padding: 16px;
              background-color: #0b0f19;
              color: white;
              font-family: system-ui, -apple-system, sans-serif;
              display: flex;
              flex-direction: column;
              justify-content: center;
              box-sizing: border-box;
              user-select: none;
            }
            .badge {
              display: inline-flex;
              align-items: center;
              gap: 6px;
              background: #312e81;
              color: #a5b4fc;
              font-size: 11px;
              font-weight: 700;
              padding: 4px 10px;
              border-radius: 9999px;
              margin-bottom: 8px;
              width: fit-content;
            }
            .translated {
              font-size: 18px;
              font-weight: 700;
              color: #38bdf8;
              line-height: 1.35;
              text-shadow: 0 2px 4px rgba(0,0,0,0.8);
              margin-bottom: 6px;
            }
            .original {
              font-size: 13px;
              color: #94a3b8;
              font-style: italic;
              line-height: 1.3;
            }
            .pulse {
              width: 8px;
              height: 8px;
              background: #22c55e;
              border-radius: 50%;
              animation: blink 1.5s infinite;
            }
            @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
          `;
          pipWin.document.head.appendChild(style);

          pipWin.document.body.innerHTML = `
            <div class="badge"><span class="pulse"></span> LIVE SUBTITLE (${this.sourceLang} → ${this.targetLang})</div>
            <div id="pip-trans" class="translated">${this.currentTranslated || 'Mendengarkan suara video...'}</div>
            <div id="pip-orig" class="original">${this.currentOriginal}</div>
          `;

          pipWin.addEventListener('pagehide', () => {
            this.isPiPActive = false;
            this.docPiPWindow = null;
          });

          return true;
        } catch (docErr) {
          console.warn('Document PiP not available in this frame, trying Video PiP fallback:', docErr);
        }
      }

      // 2. Video Element PiP fallback
      const videoEl = this.ensureVideoElement();
      this.renderCanvas();

      if (typeof (this.canvas as any).captureStream === 'function') {
        this.stream = (this.canvas as any).captureStream(30);
        videoEl.srcObject = this.stream;
        await videoEl.play().catch(() => {});

        // Continual rendering loop
        const loop = () => {
          this.renderCanvas();
          this.animFrameId = requestAnimationFrame(loop);
        };
        this.animFrameId = requestAnimationFrame(loop);

        if (typeof (videoEl as any).requestPictureInPicture === 'function') {
          await videoEl.requestPictureInPicture();
          this.isPiPActive = true;

          videoEl.addEventListener(
            'leavepictureinpicture',
            () => {
              this.isPiPActive = false;
              if (this.animFrameId) {
                cancelAnimationFrame(this.animFrameId);
                this.animFrameId = null;
              }
            },
            { once: true }
          );

          return true;
        }
      }

      return false;
    } catch (err) {
      console.warn('Picture-in-Picture mode not supported or allowed in this frame:', err);
      return false;
    }
  }

  public stopFloatingPiP() {
    if (this.docPiPWindow && !this.docPiPWindow.closed) {
      try {
        this.docPiPWindow.close();
      } catch {}
      this.docPiPWindow = null;
    }
    if (typeof document !== 'undefined' && document.pictureInPictureElement) {
      document.exitPictureInPicture().catch(() => {});
    }
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    this.isPiPActive = false;
  }

  public get isActive(): boolean {
    return this.isPiPActive || (this.docPiPWindow !== null && !this.docPiPWindow.closed);
  }
}

export const pipSubtitleManager = new PiPSubtitleManager();
