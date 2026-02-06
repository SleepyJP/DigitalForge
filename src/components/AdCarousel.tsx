'use client';

import { useState, useEffect } from 'react';

interface Ad {
  title: string;
  description: string;
  cta: string;
  link: string;
  gradient: string;
  icon: string;
}

const ads: Ad[] = [
  {
    title: 'PUMP.pHuD',
    description: 'Launch your memecoin with bonding curves',
    cta: 'Start Pumping',
    link: 'https://pump.phud.farm',
    gradient: 'from-orange-600 via-red-600 to-pink-600',
    icon: 'rocket_launch',
  },
  {
    title: 'pD-Ai Predictions',
    description: 'Binary prediction markets powered by AI',
    cta: 'Make Predictions',
    link: 'https://pd-ai.phud.farm',
    gradient: 'from-purple-600 via-blue-600 to-cyan-600',
    icon: 'psychology',
  },
  {
    title: 'TranscenDEX',
    description: 'Concentrated liquidity on Internet Computer',
    cta: 'Trade Now',
    link: 'https://transcendex.io',
    gradient: 'from-green-600 via-teal-600 to-cyan-600',
    icon: 'swap_horiz',
  },
  {
    title: 'Paisley Protocol',
    description: 'Bend dont break - Modular DeFi infrastructure',
    cta: 'Learn More',
    link: 'https://paisley.phud.farm',
    gradient: 'from-cyan-600 via-blue-600 to-purple-600',
    icon: 'hub',
  },
];

export default function AdCarousel() {
  const [current, setCurrent] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % ads.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const goTo = (index: number) => {
    setCurrent(index);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const goNext = () => goTo((current + 1) % ads.length);
  const goPrev = () => goTo((current - 1 + ads.length) % ads.length);

  return (
    <div className="relative overflow-hidden rounded-2xl">
      {/* Slides Container */}
      <div
        className="flex transition-transform duration-500 ease-out"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {ads.map((ad, index) => (
          <div
            key={index}
            className={`min-w-full p-8 bg-gradient-to-r ${ad.gradient}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-white/20 flex items-center justify-center">
                  <span className="material-icons text-4xl text-white">{ad.icon}</span>
                </div>
                <div>
                  <h3 className="text-2xl md:text-3xl font-orbitron font-bold text-white">
                    {ad.title}
                  </h3>
                  <p className="text-white/80 font-rajdhani text-lg">
                    {ad.description}
                  </p>
                </div>
              </div>
              <a
                href={ad.link}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:flex items-center gap-2 px-6 py-3 bg-white/20 hover:bg-white/30 rounded-xl text-white font-rajdhani font-semibold transition-all"
              >
                {ad.cta}
                <span className="material-icons text-lg">arrow_forward</span>
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={goPrev}
        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white transition-all"
      >
        <span className="material-icons">chevron_left</span>
      </button>
      <button
        onClick={goNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white transition-all"
      >
        <span className="material-icons">chevron_right</span>
      </button>

      {/* Dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {ads.map((_, index) => (
          <button
            key={index}
            onClick={() => goTo(index)}
            className={`w-2 h-2 rounded-full transition-all ${
              current === index
                ? 'bg-white w-6'
                : 'bg-white/50 hover:bg-white/70'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
