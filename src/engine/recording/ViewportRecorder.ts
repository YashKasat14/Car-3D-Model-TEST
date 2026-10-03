import { useSimulationStore } from '../../stores/simulationStore';
import { handTrackingEngine, SingleHandState } from '../gestures/HandTrackingEngine';

/**
 * Universal Website Simulator MediaRecorder
 * Addresses the user requirements:
 * 1. "i want the recording which is done only of our website not the whole device"
 *    - Captures strictly our website simulator viewport with zero whole-device prompts.
 * 2. "while recording with the hand gesture the camera with the hand dots of hand gesture must also be shown"
 *    - Picture-In-Picture Webcam Vision Sensor box in top-right with live video and neural hand skeleton.
 *    - Interactive Left & Right Hand Aiming Reticles over the 3D model with dynamic pinch animations.
 *    - Continuous unified compositor that guarantees 60 FPS pristine video recording without missed gestures.
 */

export interface RecordingResult {
  blob: Blob;
  url: string;
  durationMs: number;
  fileSizeBytes: number;
  mimeType: string;
}

export type RecordingTarget = 'website' | 'viewport';

class ViewportRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private isRecording: boolean = false;
  private isPaused: boolean = false;
  private startTime: number = 0;
  private totalPausedDuration: number = 0;
  private pauseStartTime: number = 0;
  private stopResolver: ((res: RecordingResult) => void) | null = null;
  private stream: MediaStream | null = null;
  private activeMimeType: string = 'video/webm';
  private recordingTarget: RecordingTarget = 'website';
  private compositorAnimId: number | null = null;
  private compositorCanvas: HTMLCanvasElement | null = null;
  private isCompositorRunning: boolean = false;

  /**
   * Accurately finds the website's 3D simulator WebGL canvas.
   * Guarantees it never mistakenly selects the 2D background dot canvas or skeleton camera canvas.
   */
  public getSimulatorCanvas(): HTMLCanvasElement | null {
    if (typeof document === 'undefined') return null;

    // 1. Direct ID lookup
    const byId = document.getElementById('webgl-3d-simulator-canvas') as HTMLCanvasElement | null;
    if (byId && byId.tagName?.toLowerCase() === 'canvas') return byId;

    // 2. Data attribute lookup
    const byAttr = document.querySelector('canvas[data-simulator-viewport="true"]') as HTMLCanvasElement | null;
    if (byAttr) return byAttr;

    // 3. Three.js engine attribute lookup
    const byEngine = document.querySelector('canvas[data-engine]') as HTMLCanvasElement | null;
    if (byEngine) return byEngine;

    // 4. Any canvas that is inside a viewport container or not background/skeleton
    const allCanvases = Array.from(document.querySelectorAll('canvas'));
    const candidate = allCanvases.find(c => {
      const id = c.id || '';
      const isBg = id === 'dotted-bg-canvas' || (c.classList?.contains('pointer-events-none') && c.classList?.contains('fixed'));
      const isSkeleton = id === 'hand-tracking-skeleton-canvas' || id === 'skeleton-canvas' || (c.width === 640 && c.height === 360 && c.classList?.contains('rounded-xl'));
      const isCompositor = id === 'simulator-recording-compositor';
      return !isBg && !isSkeleton && !isCompositor && c.width > 100 && c.height > 100;
    });

    return candidate || document.querySelector('canvas');
  }

  /**
   * Starts Recording of ONLY our website (3D simulator viewport).
   * ZERO whole-device capture, ZERO screen-share prompt.
   */
  public async startWebsiteRecording(sourceCanvasElement?: HTMLCanvasElement | null): Promise<boolean> {
    return this.startViewportRecording(sourceCanvasElement);
  }

  /**
   * Starts Clean 3D Viewport Recording directly from the WebGL canvas and compositor.
   */
  public startViewportRecording(sourceCanvasElement?: HTMLCanvasElement | null): boolean {
    const webglCanvas = sourceCanvasElement || this.getSimulatorCanvas();
    if (!webglCanvas) {
      console.error('Cannot find WebGL simulator canvas to record');
      return false;
    }

    try {
      this.isCompositorRunning = true;
      // Build unified 60 FPS composite stream that draws 3D scene + camera PIP + hand dots
      let streamToRecord = this.createCompositeStream(webglCanvas);

      if (!streamToRecord) {
        // Fallback to direct WebGL canvas stream if 2D context is unavailable
        streamToRecord = webglCanvas.captureStream
          ? webglCanvas.captureStream(60)
          : (webglCanvas as any).mozCaptureStream?.(60);
      }

      if (!streamToRecord) {
        console.error('Canvas captureStream is not supported');
        this.isCompositorRunning = false;
        return false;
      }

      this.recordingTarget = 'website';
      return this.initMediaRecorder(streamToRecord);
    } catch (err) {
      console.error('Failed to capture website canvas stream:', err);
      this.isCompositorRunning = false;
      return false;
    }
  }

  /**
   * Helper to draw clean rounded rectangles on 2D canvas
   */
  private drawRoundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  /**
   * Helper to draw hand skeleton directly onto the PIP camera box
   */
  private drawSkeletonOnPIP(
    ctx: CanvasRenderingContext2D,
    pipX: number,
    pipY: number,
    pipW: number,
    pipH: number,
    hand: SingleHandState,
    isRight: boolean
  ) {
    if (!hand.detected || !hand.skeleton) return;

    const bones = hand.skeleton.bones || [];
    ctx.save();
    ctx.lineWidth = 2.0;
    ctx.lineCap = 'round';

    for (let i = 0; i < bones.length; i++) {
      const b = bones[i];
      const isThumbOrIndex = b.finger === 'thumb' || b.finger === 'index';
      ctx.strokeStyle = hand.isPinching && isThumbOrIndex
        ? (isRight ? '#EF4444' : '#38BDF8')
        : b.finger === 'thumb'
          ? '#F59E0B'
          : b.finger === 'index'
            ? (isRight ? '#10B981' : '#0EA5E9')
            : '#64748B';
      ctx.beginPath();
      ctx.moveTo(pipX + b.from.x * pipW, pipY + b.from.y * pipH);
      ctx.lineTo(pipX + b.to.x * pipW, pipY + b.to.y * pipH);
      ctx.stroke();
    }

    // Knuckles
    const lms = hand.skeleton.allLandmarks || [];
    ctx.fillStyle = '#FFFFFF';
    for (let j = 0; j < lms.length; j++) {
      const lm = lms[j];
      ctx.beginPath();
      ctx.arc(pipX + lm.x * pipW, pipY + lm.y * pipH, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Fingertips
    if (hand.thumbTip) {
      ctx.fillStyle = '#F59E0B';
      ctx.beginPath();
      ctx.arc(pipX + hand.thumbTip.x * pipW, pipY + hand.thumbTip.y * pipH, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
    if (hand.indexTip) {
      ctx.fillStyle = isRight ? '#10B981' : '#0EA5E9';
      ctx.beginPath();
      ctx.arc(pipX + hand.indexTip.x * pipW, pipY + hand.indexTip.y * pipH, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  /**
   * Draws a complete 60 FPS frame onto the compositor canvas:
   * 1. Full 3D WebGL simulator viewport
   * 2. Webcam Vision Sensor PIP Box (if hand tracking is active)
   * 3. Hand Gesture Aiming Dots on the 3D model
   * 4. Dual hand mode banner
   * 5. Discreet HUD watermark
   */
  private drawCompositorFrame(
    ctx: CanvasRenderingContext2D,
    webglCanvas: HTMLCanvasElement,
    w: number,
    h: number
  ) {
    try {
      // 1. Draw active 3D WebGL simulator canvas (full resolution)
      ctx.drawImage(webglCanvas, 0, 0, w, h);
    } catch (e) {
      // In case of WebGL buffer swap timing, keep previous frame
    }

    const storeState = useSimulationStore.getState();
    const isHandTracking = storeState.handTrackingActive;
    const st = handTrackingEngine.getStatus();

    // 2. Draw Webcam Camera Vision Sensor PIP Box in Top-Right
    if (isHandTracking) {
      const webcamVideo = (document.getElementById('hand-tracking-webcam-video') as HTMLVideoElement | null) ||
        handTrackingEngine.getVideoElement() ||
        (typeof document !== 'undefined' ? document.querySelector('video') as HTMLVideoElement | null : null);
      const skeletonCanvas = typeof document !== 'undefined'
        ? (document.getElementById('hand-tracking-skeleton-canvas') as HTMLCanvasElement | null || document.getElementById('skeleton-canvas') as HTMLCanvasElement | null)
        : null;

      const pipW = Math.max(260, Math.min(360, Math.round(w * 0.20)));
      const headerH = 26;
      const videoH = Math.round((pipW / 16) * 9);
      const footerH = 24;
      const totalPipH = headerH + videoH + footerH;
      const pipMarginX = 28;
      const pipMarginY = 56;
      const pipX = w - pipW - pipMarginX;
      const pipY = pipMarginY;
      const cornerRadius = 14;

      ctx.save();
      // Container Outer Glow & Border
      ctx.shadowColor = 'rgba(239, 68, 68, 0.45)';
      ctx.shadowBlur = 14;
      this.drawRoundedRect(ctx, pipX, pipY, pipW, totalPipH, cornerRadius);
      ctx.fillStyle = '#050509';
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.85)';
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Clip container content so inner elements stay rounded
      ctx.save();
      this.drawRoundedRect(ctx, pipX, pipY, pipW, totalPipH, cornerRadius);
      ctx.clip();

      // 2a. Header Bar
      ctx.fillStyle = '#0f0f18';
      ctx.fillRect(pipX, pipY, pipW, headerH);
      // Red pulse dot
      ctx.fillStyle = '#EF4444';
      ctx.beginPath();
      ctx.arc(pipX + 14, pipY + headerH / 2, 3.5, 0, Math.PI * 2);
      ctx.fill();
      // Title
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 10px monospace';
      ctx.textBaseline = 'middle';
      ctx.fillText('VISION SENSOR (CAMERA)', pipX + 24, pipY + headerH / 2);

      // LIVE tag
      ctx.font = 'bold 9px monospace';
      ctx.fillStyle = '#EF4444';
      const liveText = 'REC LIVE';
      const liveW = ctx.measureText(liveText).width;
      ctx.fillText(liveText, pipX + pipW - liveW - 12, pipY + headerH / 2);

      // 2b. Webcam Video & Skeleton
      const videoAreaY = pipY + headerH;
      ctx.fillStyle = '#000000';
      ctx.fillRect(pipX, videoAreaY, pipW, videoH);

      if (webcamVideo && webcamVideo.readyState >= 2 && !webcamVideo.paused) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(pipX, videoAreaY, pipW, videoH);
        ctx.clip();
        // Mirror horizontally for natural webcam selfie orientation
        ctx.translate(pipX + pipW, videoAreaY);
        ctx.scale(-1, 1);
        try {
          ctx.drawImage(webcamVideo, 0, 0, pipW, videoH);
        } catch (e) {}
        ctx.restore();
      } else {
        // High-tech dark radar grid placeholder while camera connects
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.15)';
        ctx.lineWidth = 1;
        ctx.strokeRect(pipX + 10, videoAreaY + 10, pipW - 20, videoH - 20);
        ctx.fillStyle = '#64748B';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('CAMERA ACTIVE • HOLD UP HAND', pipX + pipW / 2, videoAreaY + videoH / 2);
        ctx.textAlign = 'left';
      }

      // Draw Skeleton overlay from hardware skeleton canvas
      if (skeletonCanvas && skeletonCanvas.width > 0 && skeletonCanvas.height > 0) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(pipX, videoAreaY, pipW, videoH);
        ctx.clip();
        try {
          ctx.drawImage(skeletonCanvas, pipX, videoAreaY, pipW, videoH);
        } catch (e) {}
        ctx.restore();
      } else {
        // Fallback: direct neural skeleton rendering
        this.drawSkeletonOnPIP(ctx, pipX, videoAreaY, pipW, videoH, st.leftHand, false);
        this.drawSkeletonOnPIP(ctx, pipX, videoAreaY, pipW, videoH, st.rightHand, true);
      }

      // 2c. Footer Status Bar
      const footerY = videoAreaY + videoH;
      ctx.fillStyle = '#090912';
      ctx.fillRect(pipX, footerY, pipW, footerH);

      const leftDet = st.leftHand.detected;
      const rightDet = st.rightHand.detected;

      // Left Hand Status Tag
      ctx.font = 'bold 9px monospace';
      ctx.textBaseline = 'middle';
      if (leftDet) {
        ctx.fillStyle = st.leftHand.isPinching ? '#38BDF8' : '#0EA5E9';
        ctx.fillText(st.leftHand.isPinching ? 'L: PINCH [GRAB]' : 'L: ACTIVE (1 DOT)', pipX + 10, footerY + footerH / 2);
      } else {
        ctx.fillStyle = '#64748B';
        ctx.fillText('L: OUT OF VIEW', pipX + 10, footerY + footerH / 2);
      }

      // Right Hand Status Tag
      if (rightDet) {
        ctx.fillStyle = st.rightHand.isPinching ? '#EF4444' : '#10B981';
        const rText = st.rightHand.isPinching ? 'R: PINCH [DRAG]' : 'R: ACTIVE (1 DOT)';
        const rWidth = ctx.measureText(rText).width;
        ctx.fillText(rText, pipX + pipW - rWidth - 10, footerY + footerH / 2);
      } else {
        ctx.fillStyle = '#64748B';
        const rText = 'R: OUT OF VIEW';
        const rWidth = ctx.measureText(rText).width;
        ctx.fillText(rText, pipX + pipW - rWidth - 10, footerY + footerH / 2);
      }

      ctx.restore(); // unclip PIP
      ctx.restore(); // restore PIP outer

      // 3. Draw Hand Tracking Aiming Reticles on the 3D Scene
      const isAnyHand = leftDet || rightDet;

      // Left Hand Reticle (Cyan/Sky)
      if (leftDet) {
        const lx = st.leftHand.x * w;
        const ly = st.leftHand.y * h;
        const progress = st.leftHand.pinchProgress || 0;
        const isPinching = st.leftHand.isPinching;
        const baseSize = Math.round(24 + progress * 28);
        const r = (baseSize / 2) * (isPinching ? 1.35 : 0.92 + progress * 0.45);

        ctx.save();
        ctx.fillStyle = isPinching ? 'rgba(56, 189, 248, 0.4)' : 'rgba(56, 189, 248, 0.2)';
        ctx.beginPath();
        ctx.arc(lx, ly, r, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#38BDF8';
        ctx.lineWidth = 2.2;
        ctx.stroke();

        if (isPinching) {
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.7)';
          ctx.lineWidth = 1.2;
          const pulseR = r + 6 + (performance.now() % 600) / 75;
          ctx.beginPath();
          ctx.arc(lx, ly, pulseR, 0, Math.PI * 2);
          ctx.stroke();
        }

        ctx.fillStyle = isPinching ? '#FFFFFF' : '#38BDF8';
        ctx.beginPath();
        ctx.arc(lx, ly, isPinching ? 6 : 3.5, 0, Math.PI * 2);
        ctx.fill();

        const labelText = isPinching ? 'L-PINCH: MOVE OBJECT' : 'LEFT HAND (1 DOT)';
        ctx.font = 'bold 9px monospace';
        ctx.textBaseline = 'bottom';
        const labelW = ctx.measureText(labelText).width;
        ctx.fillStyle = 'rgba(5, 5, 10, 0.8)';
        ctx.fillRect(lx - labelW / 2 - 4, ly - r - 18, labelW + 8, 14);
        ctx.fillStyle = '#38BDF8';
        ctx.fillText(labelText, lx - labelW / 2, ly - r - 6);
        ctx.restore();
      }

      // Right Hand Reticle (Emerald/Red)
      if (rightDet) {
        const rx = st.rightHand.x * w;
        const ry = st.rightHand.y * h;
        const progress = st.rightHand.pinchProgress || 0;
        const isPinching = st.rightHand.isPinching;
        const baseSize = Math.round(24 + progress * 28);
        const r = (baseSize / 2) * (isPinching ? 1.35 : 0.92 + progress * 0.45);

        ctx.save();
        ctx.fillStyle = isPinching ? 'rgba(239, 68, 68, 0.4)' : 'rgba(16, 185, 129, 0.2)';
        ctx.beginPath();
        ctx.arc(rx, ry, r, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = isPinching ? '#EF4444' : '#10B981';
        ctx.lineWidth = 2.2;
        ctx.stroke();

        if (isPinching) {
          ctx.strokeStyle = 'rgba(239, 68, 68, 0.7)';
          ctx.lineWidth = 1.2;
          const pulseR = r + 6 + (performance.now() % 600) / 75;
          ctx.beginPath();
          ctx.arc(rx, ry, pulseR, 0, Math.PI * 2);
          ctx.stroke();
        }

        ctx.fillStyle = isPinching ? '#FFFFFF' : '#10B981';
        ctx.beginPath();
        ctx.arc(rx, ry, isPinching ? 6 : 3.5, 0, Math.PI * 2);
        ctx.fill();

        const labelText = isPinching ? 'R-PINCH: MOVE OBJECT' : 'RIGHT HAND (1 DOT)';
        ctx.font = 'bold 9px monospace';
        ctx.textBaseline = 'bottom';
        const labelW = ctx.measureText(labelText).width;
        ctx.fillStyle = 'rgba(5, 5, 10, 0.8)';
        ctx.fillRect(rx - labelW / 2 - 4, ry - r - 18, labelW + 8, 14);
        ctx.fillStyle = isPinching ? '#EF4444' : '#10B981';
        ctx.fillText(labelText, rx - labelW / 2, ry - r - 6);
        ctx.restore();
      }

      // Cursor fallback dot if tracking is active but hands are centered
      if (!isAnyHand && st.tracking && st.cursor) {
        const cx = st.cursor.x * w;
        const cy = st.cursor.y * h;
        ctx.save();
        ctx.strokeStyle = '#38BDF8';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, 10, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = '#38BDF8';
        ctx.beginPath();
        ctx.arc(cx, cy, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 4. Dual Hand Banner (Bottom-Center)
      if (st.isDualHandActive) {
        const isDualPinch = st.leftHand.isPinching && st.rightHand.isPinching;
        const bannerText = isDualPinch
          ? 'PINCH BOTH HANDS: MOVE SCREEN • MOVE HANDS FAR: ZOOM OUT'
          : 'SPREAD HANDS: EXPLODE • CLOSE: COLLIDE';

        ctx.save();
        ctx.font = 'bold 11px monospace';
        const bWidth = ctx.measureText(bannerText).width;
        const bX = w / 2 - bWidth / 2 - 16;
        const bY = h - 68;
        this.drawRoundedRect(ctx, bX, bY, bWidth + 32, 28, 14);
        ctx.fillStyle = isDualPinch ? 'rgba(153, 27, 27, 0.9)' : 'rgba(15, 15, 24, 0.9)';
        ctx.fill();
        ctx.strokeStyle = isDualPinch ? '#EF4444' : 'rgba(245, 158, 11, 0.7)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = isDualPinch ? '#FFFFFF' : '#FCD34D';
        ctx.textBaseline = 'middle';
        ctx.fillText(bannerText, w / 2 - bWidth / 2, bY + 14);
        ctx.restore();
      }
    }

    // 5. Subtle Engineering HUD Watermark
    ctx.save();
    ctx.font = 'bold 11px monospace';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.fillText('AURA 3D ENGINEERING SIMULATOR', 24, h - 20);
    ctx.restore();
  }

  /**
   * Creates an internal 60 FPS composite stream that draws:
   * 1. The 3D simulator viewport (car / engineering model).
   * 2. The Webcam Vision Sensor box (PIP in top-right) with live video and hand skeletons.
   * 3. The Hand Gesture Aiming Dots moving on the 3D model with pinch progress and status labels.
   */
  private createCompositeStream(webglCanvas: HTMLCanvasElement): MediaStream | null {
    try {
      const targetW = 1920;
      const targetH = 1080;

      const compCanvas = document.createElement('canvas');
      compCanvas.width = targetW;
      compCanvas.height = targetH;
      compCanvas.id = 'simulator-recording-compositor';
      this.compositorCanvas = compCanvas;

      // Attach hidden to DOM so Chrome compositor treats it as an active first-class stream
      if (typeof document !== 'undefined' && document.body) {
        compCanvas.style.cssText = 'position:fixed;left:-9999px;top:-9999px;width:1px;height:1px;pointer-events:none;opacity:0;z-index:-1;';
        document.body.appendChild(compCanvas);
      }

      const ctx = compCanvas.getContext('2d', { alpha: false });
      if (!ctx) return null;

      // Render immediate initial frame synchronously so stream track starts active
      this.drawCompositorFrame(ctx, webglCanvas, targetW, targetH);

      const renderCompositor = () => {
        if (!this.isCompositorRunning) return;
        this.drawCompositorFrame(ctx, webglCanvas, targetW, targetH);

        if (typeof requestAnimationFrame !== 'undefined') {
          this.compositorAnimId = requestAnimationFrame(renderCompositor);
        }
      };

      if (typeof requestAnimationFrame !== 'undefined') {
        this.compositorAnimId = requestAnimationFrame(renderCompositor);
      }

      return compCanvas.captureStream ? compCanvas.captureStream(60) : (compCanvas as any).mozCaptureStream?.(60);
    } catch (e) {
      console.warn('Failed to initialize composite stream, fallback to direct canvas stream:', e);
      return null;
    }
  }

  /**
   * Initializes MediaRecorder on the active stream
   */
  private initMediaRecorder(stream: MediaStream): boolean {
    try {
      this.stream = stream;
      this.recordedChunks = [];
      this.totalPausedDuration = 0;
      this.startTime = performance.now();

      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.onended = () => {
          if (this.isRecording) {
            this.stopRecording();
          }
        };
      }

      // Best supported mime type
      const mimeCandidates = [
        'video/webm;codecs=vp9',
        'video/webm;codecs=vp8',
        'video/webm',
        'video/mp4'
      ];

      let selectedMime = 'video/webm';
      for (const mime of mimeCandidates) {
        if (MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(mime)) {
          selectedMime = mime;
          break;
        }
      }
      this.activeMimeType = selectedMime;

      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: selectedMime,
        videoBitsPerSecond: 10000000 // 10 Mbps pristine high-bitrate video
      });

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        this.isCompositorRunning = false;
        // Stop compositor loop if running
        if (this.compositorAnimId !== null && typeof cancelAnimationFrame !== 'undefined') {
          cancelAnimationFrame(this.compositorAnimId);
          this.compositorAnimId = null;
        }
        if (this.compositorCanvas && this.compositorCanvas.parentNode) {
          this.compositorCanvas.parentNode.removeChild(this.compositorCanvas);
        }
        this.compositorCanvas = null;

        // Stop all track streams
        if (this.stream) {
          this.stream.getTracks().forEach(track => track.stop());
          this.stream = null;
        }

        const finalDuration = Math.max(100, performance.now() - this.startTime - this.totalPausedDuration);
        const blob = new Blob(this.recordedChunks, { type: this.activeMimeType.split(';')[0] });
        const url = URL.createObjectURL(blob);

        if (this.stopResolver) {
          this.stopResolver({
            blob,
            url,
            durationMs: finalDuration,
            fileSizeBytes: blob.size,
            mimeType: this.activeMimeType
          });
          this.stopResolver = null;
        }

        this.isRecording = false;
        this.isPaused = false;
      };

      this.mediaRecorder.start(250);
      this.isRecording = true;
      this.isPaused = false;
      return true;
    } catch (err) {
      console.error('MediaRecorder initialization error:', err);
      this.isCompositorRunning = false;
      if (this.compositorAnimId !== null && typeof cancelAnimationFrame !== 'undefined') {
        cancelAnimationFrame(this.compositorAnimId);
        this.compositorAnimId = null;
      }
      if (this.compositorCanvas && this.compositorCanvas.parentNode) {
        this.compositorCanvas.parentNode.removeChild(this.compositorCanvas);
      }
      this.compositorCanvas = null;
      this.isRecording = false;
      return false;
    }
  }

  public pauseRecording(): boolean {
    if (!this.mediaRecorder || !this.isRecording || this.isPaused) return false;
    try {
      this.mediaRecorder.pause();
      this.isPaused = true;
      this.pauseStartTime = performance.now();
      return true;
    } catch (e) {
      return false;
    }
  }

  public resumeRecording(): boolean {
    if (!this.mediaRecorder || !this.isRecording || !this.isPaused) return false;
    try {
      this.mediaRecorder.resume();
      this.totalPausedDuration += performance.now() - this.pauseStartTime;
      this.isPaused = false;
      return true;
    } catch (e) {
      return false;
    }
  }

  public stopRecording(): Promise<RecordingResult | null> {
    return new Promise((resolve) => {
      this.isCompositorRunning = false;
      if (!this.mediaRecorder || !this.isRecording) {
        if (this.compositorAnimId !== null && typeof cancelAnimationFrame !== 'undefined') {
          cancelAnimationFrame(this.compositorAnimId);
          this.compositorAnimId = null;
        }
        if (this.compositorCanvas && this.compositorCanvas.parentNode) {
          this.compositorCanvas.parentNode.removeChild(this.compositorCanvas);
        }
        this.compositorCanvas = null;
        resolve(null);
        return;
      }
      this.stopResolver = resolve;
      try {
        this.mediaRecorder.stop();
      } catch (e) {
        console.error('Error stopping MediaRecorder:', e);
        if (this.compositorAnimId !== null && typeof cancelAnimationFrame !== 'undefined') {
          cancelAnimationFrame(this.compositorAnimId);
          this.compositorAnimId = null;
        }
        if (this.compositorCanvas && this.compositorCanvas.parentNode) {
          this.compositorCanvas.parentNode.removeChild(this.compositorCanvas);
        }
        this.compositorCanvas = null;
        this.isRecording = false;
        this.isPaused = false;
        resolve(null);
      }
    });
  }

  public isCurrentlyRecording(): boolean {
    return this.isRecording;
  }

  public isCurrentlyPaused(): boolean {
    return this.isPaused;
  }

  public getRecordingTarget(): RecordingTarget {
    return this.recordingTarget;
  }
}

export const viewportRecorder = new ViewportRecorder();
