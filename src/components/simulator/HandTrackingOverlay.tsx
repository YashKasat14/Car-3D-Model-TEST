import React, { useEffect, useRef, useState } from 'react';
import { Camera, X, AlertCircle, Hand, Sparkles, Move, Maximize2, Minimize2 } from 'lucide-react';
import { useSimulationStore } from '../../stores/simulationStore';
import { handTrackingEngine, GestureStatus, SingleHandState } from '../../engine/gestures/HandTrackingEngine';

const drawHandSkeleton = (
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  hand: SingleHandState,
  isRight: boolean
) => {
  if (!hand.detected || !hand.skeleton) return;

  const bones = hand.skeleton.bones;
  ctx.save();
  ctx.lineWidth = 2.2;
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
    ctx.moveTo(b.from.x * w, b.from.y * h);
    ctx.lineTo(b.to.x * w, b.to.y * h);
    ctx.stroke();
  }

  // Knuckles
  const lms = hand.skeleton.allLandmarks || [];
  ctx.fillStyle = '#FFFFFF';
  for (let j = 0; j < lms.length; j++) {
    const lm = lms[j];
    ctx.beginPath();
    ctx.arc(lm.x * w, lm.y * h, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Fingertips
  if (hand.thumbTip) {
    ctx.fillStyle = '#F59E0B';
    ctx.beginPath();
    ctx.arc(hand.thumbTip.x * w, hand.thumbTip.y * h, 4, 0, Math.PI * 2);
    ctx.fill();
  }
  if (hand.indexTip) {
    ctx.fillStyle = isRight ? '#10B981' : '#0EA5E9';
    ctx.beginPath();
    ctx.arc(hand.indexTip.x * w, hand.indexTip.y * h, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  // Control dot on camera
  ctx.fillStyle = hand.isPinching ? (isRight ? '#EF4444' : '#38BDF8') : (isRight ? '#10B981' : '#0284C7');
  ctx.beginPath();
  ctx.arc(hand.x * w, hand.y * h, hand.isPinching ? 6 : 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
};

export const HandTrackingOverlay: React.FC = () => {
  const { handTrackingActive, setHandTrackingActive, explodedPercent } = useSimulationStore();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const skeletonCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const leftDotRef = useRef<HTMLDivElement | null>(null);
  const rightDotRef = useRef<HTMLDivElement | null>(null);
  const [status, setStatus] = useState<GestureStatus>(handTrackingEngine.getStatus());
  const [isExpanded, setIsExpanded] = useState(false);
  const lastUiUpdateRef = useRef<number>(0);
  const statusRef = useRef<GestureStatus>(status);
  statusRef.current = status;

  useEffect(() => {
    const unsub = handTrackingEngine.subscribe((st) => {
      // 1. Direct hardware-accelerated 0-delay DOM transform for viewport dots (0ms latency)
      if (leftDotRef.current && st.leftHand.detected) {
        leftDotRef.current.style.transform = `translate3d(${st.leftHand.x * 100}vw, ${st.leftHand.y * 100}vh, 0) translate(-50%, -50%)`;
      }
      if (rightDotRef.current && st.rightHand.detected) {
        rightDotRef.current.style.transform = `translate3d(${st.rightHand.x * 100}vw, ${st.rightHand.y * 100}vh, 0) translate(-50%, -50%)`;
      }

      // 2. High-speed 60 FPS 2D canvas skeleton drawing on webcam monitor (0.1ms latency, 0 React re-renders)
      if (skeletonCanvasRef.current) {
        const ctx = skeletonCanvasRef.current.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, 640, 360);
          if (st.tracking && !st.error) {
            drawHandSkeleton(ctx, 640, 360, st.leftHand, false);
            drawHandSkeleton(ctx, 640, 360, st.rightHand, true);
          }
        }
      }

      // 3. Smart throttled React state dispatch for UI text badges (avoids main-thread DOM thrashing)
      const now = performance.now();
      const prev = statusRef.current;
      const stateChanged =
        st.leftHand.isPinching !== prev.leftHand.isPinching ||
        st.rightHand.isPinching !== prev.rightHand.isPinching ||
        st.leftHand.detected !== prev.leftHand.detected ||
        st.rightHand.detected !== prev.rightHand.detected ||
        st.isDualHandActive !== prev.isDualHandActive ||
        Boolean(st.error) !== Boolean(prev.error);

      if (stateChanged || now - lastUiUpdateRef.current > 75) {
        lastUiUpdateRef.current = now;
        setStatus(st);
      }
    });

    return () => {
      unsub();
    };
  }, []);

  useEffect(() => {
    if (handTrackingActive && videoRef.current) {
      handTrackingEngine.startTracking(videoRef.current);
    } else if (!handTrackingActive) {
      handTrackingEngine.stopTracking();
    }
    return () => {
      // Ensure camera hardware and tracking loop are stopped when component unmounts
      handTrackingEngine.stopTracking();
    };
  }, [handTrackingActive]);

  if (!handTrackingActive) return null;

  const left = status.leftHand;
  const right = status.rightHand;
  const isAnyHandDetected = left.detected || right.detected;

  // Dot sizing helper: exactly 1 dot per hand, becomes small when open, big when pinch is done
  const getDotStyle = (hand: typeof left) => {
    const progress = hand.pinchProgress;
    const isPinch = hand.isPinching;
    const baseSize = Math.round(24 + progress * 28); // 24px -> 52px
    const scale = isPinch ? 1.35 : 0.92 + progress * 0.45;
    return { baseSize, scale, isPinch };
  };

  const leftDot = getDotStyle(left);
  const rightDot = getDotStyle(right);

  return (
    <>
      {/* Floating Webcam Monitor in Top-Right with Increased Camera Area */}
      <div className={`absolute top-16 right-4 z-30 ${isExpanded ? 'w-[520px]' : 'w-88 sm:w-96'} transition-all duration-300 bg-dark-950/95 backdrop-blur-xl rounded-2xl border-2 border-red-500/50 shadow-premium-dark overflow-hidden pointer-events-auto text-white`}>
        <div className="flex items-center justify-between px-3.5 py-2.5 bg-dark-900 border-b border-dark-700">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-white">
            <Camera className="w-3.5 h-3.5 text-red-500 animate-pulse" />
            <span>VISION SENSOR ({isExpanded ? 'THEATER VIEW' : 'WIDE CAMERA VIEW'})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              title={isExpanded ? 'Standard Camera Area' : 'Enlarge Camera Area'}
              className="p-1 rounded text-dark-400 hover:text-white hover:bg-dark-800 transition-colors"
            >
              {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={() => setHandTrackingActive(false)}
              className="p-1 rounded text-dark-400 hover:text-white hover:bg-dark-800 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
          <video
            ref={videoRef}
            id="hand-tracking-webcam-video"
            playsInline
            muted
            className="w-full h-full object-cover transform -scale-x-100"
          />

          {/* High-speed hardware 2D canvas for skeletons: 0 React re-renders, 0ms latency */}
          <canvas
            ref={skeletonCanvasRef}
            id="hand-tracking-skeleton-canvas"
            width={640}
            height={360}
            className="absolute inset-0 w-full h-full pointer-events-none z-10"
          />

          {status.error ? (
            <div className="absolute inset-0 p-3 bg-black/85 flex flex-col items-center justify-center text-center gap-1.5 text-white">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <span className="text-[10px] font-mono leading-tight text-red-400">
                {status.error}
              </span>
              <span className="text-[9px] text-dark-400">Mouse fallback active</span>
            </div>
          ) : !isAnyHandDetected ? (
            <div className="absolute inset-0 p-2 bg-black/75 backdrop-blur-sm flex flex-col items-center justify-center text-center gap-1 text-white z-20">
              <Hand className="w-5 h-5 text-amber-400 animate-pulse" />
              <span className="text-[10px] font-mono font-bold text-amber-300">
                HOLD UP HAND
              </span>
              <span className="text-[9px] text-dark-300 leading-tight">
                Place 1 or 2 hands in view. 1 hand = 1 dot to move objects!
              </span>
            </div>
          ) : (
            <div className="absolute bottom-1 left-2 flex items-center gap-1 text-[9px] font-mono text-emerald-400 bg-black/80 px-1.5 py-0.5 rounded border border-emerald-900/60 z-20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              <span>{status.isDualHandActive ? 'DUAL HANDS ACTIVE' : 'SINGLE HAND ACTIVE'}</span>
            </div>
          )}
        </div>

        {/* Separate Hand Status Badges */}
        <div className="p-2 bg-dark-950 text-[10px] font-mono border-t border-dark-800 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-dark-400">LEFT HAND (1 DOT):</span>
            <span className={`px-1.5 py-0.2 rounded font-bold ${
              left.detected
                ? left.isPinching ? 'text-sky-300 bg-sky-950/80 border border-sky-600/50' : 'text-sky-400'
                : 'text-dark-600'
            }`}>
              {left.detected
                ? (left.isPinching ? (status.isDualHandActive ? 'PINCH (SCREEN)' : 'PINCH (MOVE)') : 'OPEN (FINGERS TRACKED)')
                : 'DISABLED (OUT OF VIEW)'}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-dark-400">RIGHT HAND (1 DOT):</span>
            <span className={`px-1.5 py-0.2 rounded font-bold ${
              right.detected
                ? right.isPinching ? 'text-red-300 bg-red-950/80 border border-red-600/50 animate-pulse' : 'text-emerald-400'
                : 'text-dark-600'
            }`}>
              {right.detected
                ? (right.isPinching ? (status.isDualHandActive ? 'PINCH (SCREEN)' : 'PINCH (MOVE)') : 'OPEN (FINGERS TRACKED)')
                : 'DISABLED (OUT OF VIEW)'}
            </span>
          </div>
        </div>
      </div>

      {/* 3D Viewport Dots: Rendered ONLY when hands are accurately tracked */}
      {status.tracking && !status.error && isAnyHandDetected && (
        <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden">
          {/* Dual Hand Floating Mode Indicator (Clean at bottom-center of viewport, NO line connecting the dots!) */}
          {status.isDualHandActive && (
            <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 pointer-events-none z-30">
              {left.isPinching && right.isPinching ? (
                <div className="px-4 py-1.5 rounded-full bg-red-950/90 border border-red-500 shadow-glow-red text-[11px] font-mono font-bold text-white uppercase whitespace-nowrap flex items-center gap-2 animate-pulse">
                  <Move className="w-3.5 h-3.5 text-red-400" />
                  <span>PINCH BOTH HANDS: MOVE SCREEN • MOVE HANDS FAR: ZOOM OUT</span>
                </div>
              ) : (
                <div className="px-4 py-1.5 rounded-full bg-dark-950/90 border border-amber-500/70 shadow-glow-amber text-[11px] font-mono font-bold text-amber-300 uppercase whitespace-nowrap flex items-center gap-2">
                  <Maximize2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>SPREAD HANDS: EXPLODE ({explodedPercent}%) • CLOSE: COLLIDE</span>
                </div>
              )}
            </div>
          )}

          {/* LEFT HAND: Exactly 1 Dot (Visible ONLY when Left Hand is detected) */}
          {left.detected && (
            <div
              ref={leftDotRef}
              className="fixed left-0 top-0 pointer-events-none select-none z-50 will-change-transform"
              style={{
                transform: `translate3d(${left.x * 100}vw, ${left.y * 100}vh, 0) translate(-50%, -50%)`
              }}
            >
              <div
                style={{
                  width: `${leftDot.baseSize}px`,
                  height: `${leftDot.baseSize}px`,
                  transform: `scale(${leftDot.scale})`
                }}
                className={`relative flex items-center justify-center rounded-full ${
                  leftDot.isPinch
                    ? 'bg-sky-600/40 border-2 border-sky-400 shadow-glow-sky'
                    : 'bg-sky-500/20 border-2 border-sky-400 shadow-sm'
                }`}
              >
                {/* Center Core Dot */}
                <div
                  style={{
                    width: `${leftDot.isPinch ? 12 : 7}px`,
                    height: `${leftDot.isPinch ? 12 : 7}px`
                  }}
                  className={`rounded-full ${leftDot.isPinch ? 'bg-white' : 'bg-sky-400'}`}
                />
                {leftDot.isPinch && (
                  <div className="absolute inset-0 rounded-full border border-sky-400 animate-ping opacity-75" />
                )}
              </div>
              <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[9px] font-mono font-bold text-sky-400 uppercase tracking-tight whitespace-nowrap drop-shadow">
                {leftDot.isPinch ? 'L-PINCH: MOVE OBJECT' : 'LEFT HAND (1 DOT)'}
              </span>
            </div>
          )}

          {/* RIGHT HAND: Exactly 1 Dot (Visible ONLY when Right Hand is detected) */}
          {right.detected && (
            <div
              ref={rightDotRef}
              className="fixed left-0 top-0 pointer-events-none select-none z-50 will-change-transform"
              style={{
                transform: `translate3d(${right.x * 100}vw, ${right.y * 100}vh, 0) translate(-50%, -50%)`
              }}
            >
              <div
                style={{
                  width: `${rightDot.baseSize}px`,
                  height: `${rightDot.baseSize}px`,
                  transform: `scale(${rightDot.scale})`
                }}
                className={`relative flex items-center justify-center rounded-full ${
                  rightDot.isPinch
                    ? 'bg-red-600/40 border-2 border-red-500 shadow-glow-red'
                    : 'bg-emerald-500/20 border-2 border-emerald-400 shadow-sm'
                }`}
              >
                {/* Center Core Dot */}
                <div
                  style={{
                    width: `${rightDot.isPinch ? 12 : 7}px`,
                    height: `${rightDot.isPinch ? 12 : 7}px`
                  }}
                  className={`rounded-full ${rightDot.isPinch ? 'bg-white' : 'bg-emerald-400'}`}
                />
                {rightDot.isPinch && (
                  <div className="absolute inset-0 rounded-full border border-red-400 animate-ping opacity-75" />
                )}
              </div>
              <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[9px] font-mono font-bold uppercase tracking-tight whitespace-nowrap text-red-400">
                {rightDot.isPinch ? 'R-PINCH: MOVE OBJECT' : 'RIGHT HAND (1 DOT)'}
              </span>
            </div>
          )}
        </div>
      )}
    </>
  );
};
