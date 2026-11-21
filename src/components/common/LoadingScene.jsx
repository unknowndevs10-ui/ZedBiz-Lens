import { LogoMark } from './Logo';

export default function LoadingScene({ label = 'Preparing your workspace' }) {
  const bars = [16, 25, 35, 22, 31, 18, 27, 14, 24];

  return (
    <main className="loading-scene min-h-screen bg-[#0b1011] px-5" role="status" aria-live="polite" aria-label={label}>
      <div className="loading-scene__content">
        <div className="loading-scene__mark"><LogoMark size={42} /></div>
        <div className="loading-scene__wave" aria-hidden="true">
          {bars.map((height, index) => <span key={index} style={{ '--wave-height': `${height}px`, '--wave-delay': `${index * 75}ms` }} />)}
        </div>
        <p className="loading-scene__label">{label}</p>
        <div className="loading-scene__track" aria-hidden="true"><span /></div>
      </div>
    </main>
  );
}

