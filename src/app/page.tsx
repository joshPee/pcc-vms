'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronRight, ChevronLeft, ShieldCheck } from 'lucide-react';
import { CAROUSEL_SLIDES } from '@/lib/carousel-slides';

export default function Home() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [hasScrolled, setHasScrolled] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);

  // Smoothly scroll to a specific slide
  const scrollToSlide = useCallback((index: number) => {
    const carousel = carouselRef.current;
    if (!carousel) return;
    const slides = carousel.children;
    if (slides[index]) {
      (slides[index] as HTMLElement).scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
      setActiveSlide(index);
      setHasScrolled(true);
    }
  }, []);

  const handlePrev = () => {
    const prev = Math.max(0, activeSlide - 1);
    scrollToSlide(prev);
  };

  const handleNext = () => {
    const next = Math.min(CAROUSEL_SLIDES.length - 1, activeSlide + 1);
    scrollToSlide(next);
  };

  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel) return;

    let timeoutId: NodeJS.Timeout;
    const handleScroll = () => {
      setHasScrolled(true);

      // Debounce slightly to ensure smooth calculation during touch inertia
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        if (!carousel) return;
        const children = Array.from(carousel.children) as HTMLElement[];
        if (children.length === 0) return;

        const carouselCenter = carousel.scrollLeft + carousel.offsetWidth / 2;
        let closestIdx = 0;
        let minDistance = Infinity;

        children.forEach((child, idx) => {
          const childCenter = child.offsetLeft + child.offsetWidth / 2;
          const distance = Math.abs(carouselCenter - childCenter);
          if (distance < minDistance) {
            minDistance = distance;
            closestIdx = idx;
          }
        });

        setActiveSlide(closestIdx);
      }, 50);
    };

    carousel.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      carousel.removeEventListener('scroll', handleScroll);
      clearTimeout(timeoutId);
    };
  }, []);

  return (
    <main
      className="h-dvh min-h-dvh w-full overflow-hidden flex flex-col justify-between"
      style={{ backgroundColor: '#FAF8F4' }}
    >
      <div className="w-full max-w-md sm:max-w-lg mx-auto flex-1 flex flex-col justify-between h-full px-4 sm:px-6">
        {/* Header */}
        <header
          className="pt-[max(14px,env(safe-area-inset-top))] pb-2 sm:pb-3 flex items-center justify-between flex-shrink-0"
        >
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 sm:w-16 sm:h-16 flex-shrink-0">
              <img
                src="/pcc.png"
                alt="PCC Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex flex-col">
              <h1 className="font-fraunces font-semibold text-[17px] sm:text-[19px] text-[#152420] leading-tight tracking-tight">
                Pentecost Convention Centre
              </h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#1a3a6e]" />
                <p className="text-[12px] sm:text-[13px] text-[#556960] font-medium tracking-wide">
                  Visitor Check-in
                </p>
              </div>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#1a3a6e]/5 border border-[#1a3a6e]/10 text-[#1a3a6e] text-xs font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Official Gate Pass</span>
          </div>
        </header>

        {/* Carousel Area */}
        <section
          aria-label="How Check-in Works"
          className="flex-1 min-h-0 flex flex-col justify-center my-auto relative py-1 sm:py-2"
        >
          {/* Desktop Arrow Controls */}
          {activeSlide > 0 && (
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Previous step"
              className="hidden sm:flex absolute -left-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white/90 backdrop-blur-xs shadow-md border border-stone-200 items-center justify-center text-[#152420] hover:bg-white hover:scale-105 transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          {activeSlide < CAROUSEL_SLIDES.length - 1 && (
            <button
              type="button"
              onClick={handleNext}
              aria-label="Next step"
              className="hidden sm:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white/90 backdrop-blur-xs shadow-md border border-stone-200 items-center justify-center text-[#152420] hover:bg-white hover:scale-105 transition-all"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}

          {/* Cards Container */}
          <div
            ref={carouselRef}
            tabIndex={0}
            aria-label="Visitor steps carousel"
            className="flex overflow-x-auto snap-x snap-mandatory gap-3 px-1 py-1 scroll-smooth focus:outline-hidden"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch',
            }}
          >
            {CAROUSEL_SLIDES.map((slide, index) => (
              <article
                key={index}
                aria-roledescription="slide"
                aria-label={`Step ${index + 1} of ${CAROUSEL_SLIDES.length}: ${slide.heading}`}
                className="flex-shrink-0 snap-center rounded-[20px] overflow-hidden relative shadow-lg shadow-black/8 border border-black/5"
                style={{
                  width: 'min(84vw, 360px)',
                  height: 'min(50vh, 380px)',
                  minHeight: '260px',
                }}
              >
                <img
                  src={slide.image}
                  alt={slide.heading}
                  className="w-full h-full object-cover"
                />

                {/* Multi-layered gradient for optimal legibility */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background:
                      'linear-gradient(to bottom, rgba(0,0,0,0.05) 0%, rgba(8,44,33,0.35) 45%, rgba(8,44,33,0.92) 85%, rgba(8,44,33,0.98) 100%)',
                  }}
                />

                {/* Card Content */}
                <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5 flex flex-col justify-end">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center mb-2.5 shadow-xs"
                    style={{ backgroundColor: '#C89B3C' }}
                  >
                    <span
                      className="font-bold text-[13px] leading-none"
                      style={{ color: '#152d56' }}
                    >
                      {slide.badge}
                    </span>
                  </div>
                  <h2 className="font-fraunces font-semibold text-[20px] sm:text-[22px] text-white leading-tight mb-1.5 drop-shadow-xs">
                    {slide.heading}
                  </h2>
                  <p className="text-[13px] sm:text-[14px] text-white/90 leading-snug line-clamp-3">
                    {slide.text}
                  </p>
                </div>
              </article>
            ))}
          </div>

          {/* Dots Indicator & Swipe Hint */}
          <div className="mt-3 flex flex-col items-center gap-1.5 flex-shrink-0">
            {/* Interactive Dots */}
            <div
              className="flex justify-center items-center gap-2"
              role="tablist"
              aria-label="Slide indicators"
            >
              {CAROUSEL_SLIDES.map((slide, index) => {
                const isActive = index === activeSlide;
                return (
                  <button
                    key={index}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    aria-label={`Jump to step ${index + 1}: ${slide.heading}`}
                    onClick={() => scrollToSlide(index)}
                    className="p-1 -m-1 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#1a3a6e] rounded-full"
                  >
                    <span
                      className="block transition-all duration-300 rounded-full"
                      style={{
                        width: isActive ? '22px' : '6px',
                        height: '6px',
                        backgroundColor: isActive ? '#1a3a6e' : '#D1D5DB',
                      }}
                    />
                  </button>
                );
              })}
            </div>

            {/* Zero-CLS Swipe Hint with smooth fade */}
            <div
              className={`h-5 flex items-center justify-center gap-1.5 text-[12px] text-[#556960] transition-opacity duration-300 ${
                hasScrolled ? 'opacity-0 pointer-events-none' : 'opacity-100'
              }`}
            >
              <span>Swipe to see all steps</span>
              <ChevronRight className="w-3.5 h-3.5 animate-pulse text-[#1a3a6e]" />
            </div>
          </div>
        </section>

        {/* Bottom Action Area */}
        <footer
          className="flex-shrink-0 pt-2 pb-[max(14px,calc(env(safe-area-inset-bottom)+12px))]"
        >
          <Link
            href="/register"
            className="group flex items-center justify-center gap-2 w-full py-3.5 sm:py-4 rounded-2xl text-white font-semibold text-[16px] transition-all duration-200 active:scale-[0.98] shadow-md hover:shadow-xl hover:brightness-105"
            style={{
              backgroundColor: '#1a3a6e',
              boxShadow: '0 4px 14px rgba(11, 61, 46, 0.28)',
            }}
          >
            <span>Check in</span>
            <ArrowRight className="w-5 h-5 transition-transform duration-200 group-hover:translate-x-1" />
          </Link>

          <p className="text-center text-[12.5px] sm:text-[13px] mt-2.5 text-[#556960]">
            Trouble with the form?{' '}
            <span
              className="font-semibold cursor-pointer underline decoration-[#1a3a6e]/40 hover:decoration-[#1a3a6e] transition-colors"
              style={{ color: '#1a3a6e' }}
            >
              Ask the officer at the gate
            </span>
          </p>
        </footer>
      </div>
    </main>
  );
}

