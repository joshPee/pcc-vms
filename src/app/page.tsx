'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { CAROUSEL_SLIDES } from '@/lib/carousel-slides';

const AUTO_ADVANCE_INTERVAL = 6000;
const SWIPE_THRESHOLD = 50;

export default function Home() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);

  const prefersReducedMotion = typeof window !== 'undefined' 
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
    : false;

  useEffect(() => {
    if (prefersReducedMotion || isPaused) return;

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % CAROUSEL_SLIDES.length);
    }, AUTO_ADVANCE_INTERVAL);

    return () => clearInterval(timer);
  }, [isPaused, prefersReducedMotion]);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % CAROUSEL_SLIDES.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + CAROUSEL_SLIDES.length) % CAROUSEL_SLIDES.length);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') nextSlide();
    if (e.key === 'ArrowLeft') prevSlide();
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(0);
    setTouchStart(e.targetTouches[0].clientX);
    setIsPaused(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    if (distance > SWIPE_THRESHOLD) nextSlide();
    if (distance < -SWIPE_THRESHOLD) prevSlide();
    setIsPaused(false);
  };

  const goToSlide = (index: number) => setCurrentSlide(index);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header with Logo */}
      <div className="px-4 py-4 flex items-center justify-center border-b border-gray-100">
        <div className="w-16 h-16">
          <img
            src="/pcc.png"
            alt="PCC Logo"
            className="object-contain w-full h-full"
          />
        </div>
        <div className="ml-3">
          <h1 className="text-lg font-bold text-gray-900">Pentecost Convention Centre</h1>
          <p className="text-sm text-gray-600">Visitor Management System</p>
        </div>
      </div>

      {/* Carousel */}
      <div
        ref={carouselRef}
        className="relative flex-1 overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="region"
        aria-roledescription="carousel"
        aria-label="Welcome information carousel"
      >
        {CAROUSEL_SLIDES.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentSlide ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <img
              src={slide.image}
              alt={slide.heading}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center px-4">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 max-w-3xl">
                {slide.heading}
              </h2>
              <p className="text-lg sm:text-xl md:text-2xl opacity-90 max-w-2xl">
                {slide.text}
              </p>
            </div>
          </div>
        ))}

        {/* Dot Indicators */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
          {CAROUSEL_SLIDES.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-3 h-3 rounded-full transition-all ${
                index === currentSlide
                  ? 'bg-white w-8'
                  : 'bg-white/50 hover:bg-white/70'
              }`}
              aria-label={`Go to slide ${index + 1}`}
              aria-current={index === currentSlide ? 'true' : 'false'}
            />
          ))}
        </div>
      </div>

      {/* Check In Button - Full width, always visible */}
      <div className="px-4 py-6 bg-white border-t border-gray-100">
        <Link
          href="/register"
          className="flex items-center justify-center gap-3 w-full py-4 px-6 text-white font-bold rounded-lg hover:opacity-90 transition-opacity min-h-[56px] text-lg"
          style={{ backgroundColor: '#0F6E56' }}
        >
          <ArrowRight className="w-6 h-6" />
          CHECK IN
        </Link>
      </div>

      {/* Footer with Security Staff Login */}
      <div className="px-4 py-4 bg-gray-50 border-t border-gray-100">
        <p className="text-center text-sm text-gray-600">
          <Link
            href="/admin/login"
            className="text-blue-700 hover:underline font-medium"
          >
            Security staff login
          </Link>
        </p>
      </div>
    </div>
  );
}
