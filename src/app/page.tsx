'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronRight } from 'lucide-react';
import { CAROUSEL_SLIDES } from '@/lib/carousel-slides';

export default function Home() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [hasScrolled, setHasScrolled] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);

  const prefersReducedMotion = typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel) return;

    const handleScroll = () => {
      setHasScrolled(true);
      const scrollLeft = carousel.scrollLeft;
      const cardWidth = carousel.offsetWidth * 0.86;
      const gap = 12;
      const slideIndex = Math.round(scrollLeft / (cardWidth + gap));
      setActiveSlide(Math.min(slideIndex, CAROUSEL_SLIDES.length - 1));
    };

    carousel.addEventListener('scroll', handleScroll);
    return () => carousel.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#faf8f4' }}>
      {/* Header */}
      <div className="px-4 pt-safe-top pb-4 flex items-center" style={{ paddingTop: 'max(18px, env(safe-area-inset-top))' }}>
        <div className="w-[48px] h-[48px] rounded-[9px] overflow-hidden flex-shrink-0">
          <img
            src="/pcc.png"
            alt="PCC Logo"
            className="w-full h-full object-contain"
          />
        </div>
        <div className="ml-3 flex flex-col justify-center">
          <h1 className="font-fraunces font-semibold text-[19px] leading-tight" style={{ color: '#152420' }}>
            Pentecost Convention Centre
          </h1>
          <p className="text-[13px] mt-[1px]" style={{ color: '#4b5a55' }}>
            Visitor check-in
          </p>
        </div>
      </div>

      {/* Carousel */}
      <div className="flex-1 overflow-hidden">
        <div
          ref={carouselRef}
          className="flex overflow-x-auto snap-x snap-mandatory gap-3 px-4 pb-2"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {CAROUSEL_SLIDES.map((slide, index) => (
            <div
              key={index}
              className="flex-shrink-0 snap-center rounded-[16px] overflow-hidden relative"
              style={{ width: '86vw', aspectRatio: '4/5' }}
            >
              <img
                src={slide.image}
                alt={slide.heading}
                className="w-full h-full object-cover"
              />
              <div
                className="absolute inset-0"
                style={{
                  background: 'linear-gradient(to bottom, transparent 0%, rgba(13, 59, 32, 0.3) 50%, rgba(13, 59, 32, 0.85) 100%)'
                }}
              />
              <div className="absolute bottom-0 left-0 right-0 p-5 pb-[22px]">
                <div className="w-[26px] h-[26px] rounded-full flex items-center justify-center mb-3" style={{ backgroundColor: '#c99a3f' }}>
                  <span className="font-bold text-[14px]" style={{ color: '#0d3b20' }}>{slide.badge}</span>
                </div>
                <h2 className="font-fraunces font-semibold text-[22px] text-white mb-2">
                  {slide.heading}
                </h2>
                <p className="text-[14px] text-white opacity-88 leading-snug">
                  {slide.text}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Progress Indicator */}
        <div className="flex justify-center gap-[6px] mb-2">
          {CAROUSEL_SLIDES.map((_, index) => (
            <div
              key={index}
              className="transition-all duration-300"
              style={{
                width: index === activeSlide ? '18px' : '6px',
                height: '6px',
                borderRadius: '4px',
                backgroundColor: index === activeSlide ? '#14532d' : '#d1d5db'
              }}
            />
          ))}
        </div>

        {/* Swipe Hint */}
        {!hasScrolled && !prefersReducedMotion && (
          <div className="flex items-center justify-center gap-2 text-[12px]" style={{ color: '#4b5a55' }}>
            <span>Swipe to see all steps</span>
            <ChevronRight className="w-4 h-4 animate-pulse" />
          </div>
        )}
      </div>

      {/* Bottom Action Area */}
      <div className="px-4 pb-safe-bottom" style={{ paddingBottom: 'max(14px, env(safe-area-inset-bottom) + 18px)' }}>
        <Link
          href="/register"
          className="flex items-center justify-center gap-2 w-full py-[17px] rounded-[14px] text-white font-semibold text-[16px] transition-all active:scale-95"
          style={{
            backgroundColor: '#1d4ed8',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
          }}
        >
          Check in
          <ArrowRight className="w-5 h-5" />
        </Link>
        <p className="text-center text-[13px] mt-3" style={{ color: '#4b5a55' }}>
          Trouble with the form?{' '}
          <span className="font-bold cursor-pointer" style={{ color: '#1d4ed8' }}>
            Ask the officer at the gate
          </span>
        </p>
      </div>
    </div>
  );
}
