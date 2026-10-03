import React, { useEffect, useRef } from 'react';

export const DottedBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const staticCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef<{
    x: number;
    y: number;
    targetX: number;
    targetY: number;
    active: boolean;
  }>({
    x: -2000,
    y: -2000,
    targetX: -2000,
    targetY: -2000,
    active: false
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    // Create an offscreen canvas to cache all static resting dots
    const staticCanvas = document.createElement('canvas');
    staticCanvasRef.current = staticCanvas;
    const staticCtx = staticCanvas.getContext('2d', { alpha: true });

    let animationFrameId: number;
    const SPACING = 28;
    const INFLUENCE_RADIUS = 150;

    const handleResize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = window.innerWidth;
      const height = window.innerHeight;

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Pre-render static resting dots into offscreen canvas
      if (staticCtx) {
        staticCanvas.width = Math.floor(width * dpr);
        staticCanvas.height = Math.floor(height * dpr);
        staticCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
        staticCtx.clearRect(0, 0, width, height);

        const cols = Math.ceil(width / SPACING) + 1;
        const rows = Math.ceil(height / SPACING) + 1;

        staticCtx.beginPath();
        for (let r = 0; r < rows; r++) {
          const y = r * SPACING;
          for (let c = 0; c < cols; c++) {
            const x = c * SPACING;
            staticCtx.moveTo(x + 1.1, y);
            staticCtx.arc(x, y, 1.1, 0, Math.PI * 2);
          }
        }
        // Subtle resting crimson dot matrix on deep noir background
        staticCtx.fillStyle = 'rgba(239, 68, 68, 0.16)';
        staticCtx.fill();
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    const updateCoords = (clientX: number, clientY: number) => {
      const m = mouseRef.current;
      m.targetX = clientX;
      m.targetY = clientY;

      if (!m.active) {
        m.x = clientX;
        m.y = clientY;
        m.active = true;
      }
    };

    const handlePointerMove = (e: PointerEvent | MouseEvent) => {
      updateCoords(e.clientX, e.clientY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches && e.touches.length > 0) {
        updateCoords(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const handlePointerLeave = () => {
      mouseRef.current.active = false;
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('mousemove', handlePointerMove, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('mouseleave', handlePointerLeave);

    const render = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      ctx.clearRect(0, 0, width, height);

      // 1. Draw cached static resting dot background in 1 draw call
      if (staticCanvasRef.current) {
        ctx.drawImage(staticCanvasRef.current, 0, 0, width, height);
      }

      const m = mouseRef.current;
      if (m.active) {
        // Smooth responsive spring towards mouse
        m.x += (m.targetX - m.x) * 0.4;
        m.y += (m.targetY - m.y) * 0.4;

        // 2. Flowing Ambient Radial Red Glow directly behind the cursor (kept as it is)
        const auraGradient = ctx.createRadialGradient(m.x, m.y, 4, m.x, m.y, 220);
        auraGradient.addColorStop(0, 'rgba(239, 68, 68, 0.32)');
        auraGradient.addColorStop(0.3, 'rgba(220, 38, 38, 0.16)');
        auraGradient.addColorStop(0.65, 'rgba(153, 27, 27, 0.05)');
        auraGradient.addColorStop(1, 'rgba(5, 5, 8, 0)');

        ctx.fillStyle = auraGradient;
        ctx.fillRect(0, 0, width, height);

        // 3. Local Bounding Box Active Dots Calculation around cursor
        const startCol = Math.max(0, Math.floor((m.x - INFLUENCE_RADIUS) / SPACING));
        const endCol = Math.min(Math.ceil(width / SPACING), Math.ceil((m.x + INFLUENCE_RADIUS) / SPACING));
        const startRow = Math.max(0, Math.floor((m.y - INFLUENCE_RADIUS) / SPACING));
        const endRow = Math.min(Math.ceil(height / SPACING), Math.ceil((m.y + INFLUENCE_RADIUS) / SPACING));

        const radiusSq = INFLUENCE_RADIUS * INFLUENCE_RADIUS;

        for (let r = startRow; r <= endRow; r++) {
          const y = r * SPACING;
          for (let c = startCol; c <= endCol; c++) {
            const x = c * SPACING;
            const dx = x - m.x;
            const dy = y - m.y;
            const dSq = dx * dx + dy * dy;

            if (dSq < radiusSq) {
              const dist = Math.sqrt(dSq);
              const norm = 1 - dist / INFLUENCE_RADIUS;
              const maxInf = norm * norm * 1.4;

              if (maxInf > 0.04) {
                const radius = 1.2 + maxInf * 3.4;
                ctx.beginPath();
                ctx.arc(x, y, radius, 0, Math.PI * 2);

                // Smooth gradient from fiery neon red to warm ruby
                const alpha = Math.min(1, 0.45 + maxInf * 0.55);
                const greenVal = Math.round(30 + Math.min(1, maxInf) * 40);
                ctx.fillStyle = `rgba(255, ${greenVal}, 40, ${alpha})`;
                ctx.fill();

                // Super-intense central core dot for peak points
                if (maxInf > 0.6) {
                  ctx.beginPath();
                  ctx.arc(x, y, radius * 0.45, 0, Math.PI * 2);
                  ctx.fillStyle = `rgba(255, 230, 230, ${Math.min(1, maxInf)})`;
                  ctx.fill();
                }
              }
            }
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('mouseleave', handlePointerLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      id="dotted-bg-canvas"
      data-background-canvas="true"
      className="fixed inset-0 pointer-events-none z-0"
      style={{
        background: 'radial-gradient(ellipse at 50% 30%, #090910 0%, #050508 100%)'
      }}
    />
  );
};
