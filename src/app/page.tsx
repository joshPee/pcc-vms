'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';

const slides = [
  {
    image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=600&fit=crop',
    title: 'Welcome to PCC',
    subtitle: 'Pentecost Convention Centre'
  },
  {
    image: 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=800&h=600&fit=crop',
    title: 'Quick Check-In',
    subtitle: 'Scan QR code or fill the form'
  },
  {
    image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=600&fit=crop',
    title: 'Your Visit Matters',
    subtitle: 'Register to get started'
  }
];

export default function Home() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Image Carousel */}
      <div className="relative h-[50vh] overflow-hidden">
        {slides.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentSlide ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <img
              src={slide.image}
              alt={slide.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-black/70" />
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center px-4">
              <h1 className="text-4xl sm:text-5xl font-bold mb-2">{slide.title}</h1>
              <p className="text-lg sm:text-xl opacity-90">{slide.subtitle}</p>
            </div>
          </div>
        ))}
        
        {/* Navigation Arrows */}
        <button
          onClick={prevSlide}
          className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 backdrop-blur-sm p-2 rounded-full text-white transition-colors"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 backdrop-blur-sm p-2 rounded-full text-white transition-colors"
        >
          <ChevronRight className="w-6 h-6" />
        </button>

        {/* Dots Indicator */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentSlide ? 'bg-white' : 'bg-white/50'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Content Section */}
      <div className="flex-1 px-4 py-8 flex items-center justify-center bg-white">
        <div className="max-w-md mx-auto text-center w-full">
          {/* Logo */}
          <div className="w-32 h-32 mx-auto mb-4">
            <img
              src="/pcc.png"
              alt="PCC Logo"
              className="object-contain w-full h-full"
            />
          </div>

          {/* Small Label */}
          <p className="text-[13px] text-muted-foreground mb-2">
            Pentecost Convention Centre
          </p>

          {/* Main Heading */}
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">
            Visitor Management System
          </h2>

          {/* Three-band Accent Bar */}
          <div
            className="w-[60px] h-[3px] mx-auto mb-6 rounded-full"
            style={{
              background: 'linear-gradient(90deg, #1E3A8A 0 33%, #C89B3C 33% 66%, #D8CFB8 66% 100%)'
            }}
          />

          {/* Helper Text */}
          <p className="text-sm text-muted-foreground mb-6">
            Please select an option below
          </p>

          {/* Action Buttons */}
          <div className="space-y-6 w-full">
            <div className="space-y-2">
              <Link
                href="/register"
                className="flex items-center justify-center gap-3 w-full py-4 px-6 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity min-h-[48px]"
                style={{ backgroundColor: '#0F6E56' }}
              >
                <ArrowRight className="w-5 h-5" />
                CHECK IN
              </Link>
              <p className="text-xs text-muted-foreground">
                For visitors arriving
              </p>
            </div>
            <div className="space-y-2">
              <Link
                href="/check-out"
                className="flex items-center justify-center gap-3 w-full py-4 px-6 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity min-h-[48px]"
                style={{ backgroundColor: '#185FA5' }}
              >
                <ArrowLeft className="w-5 h-5" />
                CHECK OUT
              </Link>
              <p className="text-xs text-muted-foreground">
                For visitors leaving
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
