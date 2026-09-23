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
        className="relative flex-1 flex items-center justify-center px-4 py-8 max-w-2xl mx-auto w-full"
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
        <div className="text-center space-y-6 w-full">
          {/* Image */}
          <div className="flex justify-center">
            <div className="w-full max-w-md h-48 rounded-lg overflow-hidden shadow-lg">
              <img
                src={CAROUSEL_SLIDES[currentSlide].image}
                alt={CAROUSEL_SLIDES[currentSlide].heading}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Slide Content */}
          <div className="space-y-3">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
              {CAROUSEL_SLIDES[currentSlide].heading}
            </h2>
            <p className="text-base sm:text-lg text-gray-600 max-w-lg mx-auto">
              {CAROUSEL_SLIDES[currentSlide].text}
            </p>
          </div>

          {/* Dot Indicators */}
          <div className="flex justify-center gap-2">
            {CAROUSEL_SLIDES.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-3 h-3 rounded-full transition-all ${
                  index === currentSlide
                    ? 'bg-blue-700 w-8'
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
                aria-label={`Go to slide ${index + 1}`}
                aria-current={index === currentSlide ? 'true' : 'false'}
              />
            ))}
          </div>
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
