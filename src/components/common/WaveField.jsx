import { useEffect, useRef } from 'react';

export default function WaveField({ speaking = false, animationEnabled = true, className = '' }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!context) return undefined;
    const width = canvas.clientWidth || 480;
    const height = canvas.clientHeight || 150;
    const scale = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = width * scale;
    canvas.height = height * scale;
    context.scale(scale, scale);
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const count = width < 420 ? 54 : 92;
    let frame = 0;
    let start = null;
    const draw = (time) => {
      if (start === null) start = time;
      const elapsed = (time - start) / 1000;
      const pulse = speaking ? 1 + 0.22 * Math.sin(elapsed * 2.2) : 0.72;
      context.clearRect(0, 0, width, height);
      for (let line = 0; line < 3; line += 1) {
        for (let index = 0; index < count; index += 1) {
          const progress = index / (count - 1);
          const x = 18 + progress * (width - 36);
          const envelope = Math.sin(Math.PI * progress);
          const amplitude = (12 + line * 10) * envelope * pulse;
          const phase = progress * Math.PI * 5.4 - elapsed * (speaking ? 2.5 : 0.65) + line * 0.7;
          const y = height / 2 + Math.sin(phase) * amplitude;
          const radius = 0.9 + 1.25 * envelope + (speaking ? Math.max(0, Math.sin(phase * 1.7)) * 0.5 : 0);
          context.beginPath();
          context.arc(x, y, radius, 0, Math.PI * 2);
          context.fillStyle = line === 1 ? `rgba(224,168,75,${0.18 + envelope * 0.6})` : `rgba(104,184,177,${0.16 + envelope * 0.62})`;
          context.fill();
        }
      }
    };
    draw(0);
    if (!reducedMotion && animationEnabled) {
      const animate = (time) => {
        draw(time);
        frame = window.requestAnimationFrame(animate);
      };
      frame = window.requestAnimationFrame(animate);
    }
    return () => window.cancelAnimationFrame(frame);
  }, [speaking, animationEnabled]);
  return <canvas ref={canvasRef} aria-hidden="true" className={`block h-36 w-full ${className}`} />;
}
