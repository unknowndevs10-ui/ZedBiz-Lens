import { useEffect, useState } from 'react';
import { ArrowDown, ArrowLeft, ArrowRight, Pause, Play } from 'lucide-react';
import Button from '../common/Button';

const slides = [
  {
    eyebrow: 'For Zambia's business community',
    title: <>Zambia's businesses, <span>connected.</span></>,
    description: 'From market stalls to neighborhood shops, bring everyday business records into a clearer picture with ZedBiz Lens.',
    image: 'https://images.pexels.com/photos/28112436/pexels-photo-28112436.jpeg?auto=compress&cs=tinysrgb&w=1800',
    alt: 'Market trader selling tomatoes at an outdoor stall',
    credit: 'Photo: Kayode Adedeji � Pexels',
  },
  {
    eyebrow: 'A clearer view of daily trade',
    title: <>Everyday trade. <span>Better understood.</span></>,
    description: 'Keep sales, costs and business activity together, so owners can see what is happening and choose their next step.',
    image: 'https://images.pexels.com/photos/20068076/pexels-photo-20068076.jpeg?auto=compress&cs=tinysrgb&w=1800',
    alt: 'Small business owner standing at an outdoor market stall',
    credit: 'Photo: Victor Oluwayoju � Pexels',
  },
  {
    eyebrow: 'One business ecosystem',
    title: <>Independent businesses. <span>One brighter picture.</span></>,
    description: 'ZedBiz brings practical records and useful insights closer together for Zambia's traders, shops and growing businesses.',
    image: 'https://images.pexels.com/photos/40977565/pexels-photo-40977565.jpeg?auto=compress&cs=tinysrgb&w=1800',
    alt: 'Shopkeeper seated inside a small neighborhood convenience store',
    credit: 'Photo: Taiye Salawu � Pexels',
  },
];

const networkNodes = [
  { label: 'Market traders', className: 'hero-network__node--market' },
  { label: 'Local shops', className: 'hero-network__node--shops' },
  { label: 'Growing services', className: 'hero-network__node--services' },
];

export default function Hero() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [paused, setPaused] = useState(false);
  const [interacting, setInteracting] = useState(false);
  const slide = slides[activeSlide];

  useEffect(() => {
    if (paused || interacting || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const timer = window.setInterval(() => setActiveSlide((current) => (current + 1) % slides.length), 6500);
    return () => window.clearInterval(timer);
  }, [paused, interacting]);

  const moveSlide = (step) => setActiveSlide((current) => (current + step + slides.length) % slides.length);

  return (
    <section className="landing-hero relative overflow-hidden border-b border-line" onMouseEnter={() => setInteracting(true)} onMouseLeave={() => setInteracting(false)} onFocusCapture={() => setInteracting(true)} onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setInteracting(false); }}>
      <div className="landing-hero__glow" aria-hidden="true" />
      <div className="mx-auto grid max-w-7xl items-center gap-9 px-5 py-9 sm:px-8 sm:py-12 lg:min-h-[620px] lg:grid-cols-[.9fr_1.1fr] lg:gap-12 lg:py-14">
        <div className="relative z-10 max-w-xl">
          <p className="eyebrow flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-accent" /> {slide.eyebrow}</p>
          <div key={activeSlide} className="hero-copy-enter">
            <h1 className="mt-5 text-[2.7rem] font-extrabold leading-[1.04] tracking-[-.05em] sm:text-6xl lg:text-[4.35rem]">{slide.title}</h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-ink-muted sm:text-lg">{slide.description}</p>
          </div>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button to="/login" size="lg" icon={ArrowRight}>Open your workspace</Button>
            <a href="#workflow" className="inline-flex h-12 items-center gap-2 rounded-md border border-line bg-[#121a1b]/70 px-5 text-sm font-bold text-ink transition-colors hover:border-brand-500 focus-ring">See how it works <ArrowDown className="h-4 w-4" /></a>
          </div>
          <div className="mt-8 flex items-center gap-3 text-xs text-ink-muted">
            <div className="flex items-center gap-1.5" role="group" aria-label="Homepage slides">
              {slides.map((item, index) => (
                <button key={item.eyebrow} type="button" onClick={() => setActiveSlide(index)} className={`hero-slide-dot ${index === activeSlide ? 'is-active' : ''}`} aria-label={`Show slide ${index + 1}: ${item.eyebrow}`} aria-current={index === activeSlide ? 'true' : undefined} />
              ))}
            </div>
            <span aria-hidden="true">0{activeSlide + 1} <span className="text-ink-muted/60">/ 0{slides.length}</span></span>
            <div className="ml-auto flex items-center gap-1">
              <button type="button" className="hero-control" onClick={() => moveSlide(-1)} aria-label="Previous slide"><ArrowLeft className="h-4 w-4" /></button>
              <button type="button" className="hero-control" onClick={() => moveSlide(1)} aria-label="Next slide"><ArrowRight className="h-4 w-4" /></button>
              <button type="button" className="hero-control" onClick={() => setPaused((current) => !current)} aria-label={paused ? 'Play slides' : 'Pause slides'} title={paused ? 'Play slides' : 'Pause slides'}>{paused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}</button>
            </div>
          </div>
        </div>

        <div className="relative min-h-[340px] sm:min-h-[450px] lg:min-h-[510px]" role="group" aria-label="Representative businesses connected through ZedBiz Lens">
          <div className="hero-photo-frame absolute inset-0 overflow-hidden rounded-[1.6rem] border border-white/10 bg-[#121a1b] shadow-pop">
            <img key={slide.image} className="hero-photo" src={slide.image} alt={slide.alt} fetchPriority="high" />
            <div className="hero-photo-shade" aria-hidden="true" />
            <div className="absolute inset-x-0 bottom-0 z-10 flex items-end justify-between gap-4 p-5 sm:p-7">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-white/65">ZedBiz Lens � Zambia</p>
                <p className="mt-1.5 text-xl font-extrabold tracking-tight text-white sm:text-2xl">A connected business picture.</p>
              </div>
              <div className="hidden rounded-xl border border-white/15 bg-black/30 px-3 py-2.5 text-right backdrop-blur-md sm:block">
                <p className="text-[10px] font-bold uppercase tracking-wider text-white/60">The idea</p>
                <p className="mt-1 text-xs font-bold text-white">Records <span className="text-accent">�</span> insight <span className="text-accent">�</span> growth</p>
              </div>
            </div>
          </div>

          <svg className="hero-network-lines" viewBox="0 0 500 370" fill="none" aria-hidden="true">
            <path d="M251 180 95 72M251 180 405 82M251 180 390 303" />
            <circle cx="251" cy="180" r="82" />
            <circle className="hero-network-pulse" cx="251" cy="180" r="82" />
          </svg>
          <div className="hero-network__hub" aria-hidden="true"><span className="hero-network__hub-mark">Z</span><span>ZedBiz</span></div>
          {networkNodes.map((node) => <div key={node.label} className={`hero-network__node ${node.className}`} aria-hidden="true"><span />{node.label}</div>)}
          <span className="hero-photo-credit">{slide.credit} � Representative African stock photography</span>
        </div>
      </div>
    </section>
  );
}

