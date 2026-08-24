'use client';

import Link from 'next/link';
import { ArrowRight, ArrowLeft } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-white px-4 py-4 flex items-center justify-center">
      <div className="max-w-md mx-auto text-center">
          {/* Logo */}
          <div className="w-48 h-48 mx-auto mb-0">
            <img
              src="/pcc.png"
              alt="PCC Logo"
              className="object-contain w-full h-full"
            />
          </div>

        {/* Primary Heading */}
        <h1 className="font-fraunces font-bold text-2xl sm:text-3xl text-ink mb-2">
          PENTECOST CONVENTION CENTRE
        </h1>

        {/* Three-band Divider */}
        <div
          className="w-[120px] h-[6px] mx-auto mb-4"
          style={{
            background: 'linear-gradient(90deg, #1E3A8A 0 33%, #C89B3C 33% 66%, #D8CFB8 66% 100%)'
          }}
        />

        {/* Secondary Subtitle */}
        <h2 className="font-fraunces text-base sm:text-lg text-royal-blue mb-3 font-medium">
          Visitor Management System
        </h2>
        
        {/* Tertiary Label */}
        <p className="font-ibm-plex-mono text-xs sm:text-sm text-royal-blue uppercase tracking-wider mb-8">
          Check-In & Check-Out
        </p>

        {/* Action Buttons */}
        <div className="space-y-4 w-3/4 mx-auto">
          <Link
            href="/register"
            className="flex items-center justify-center gap-3 w-full py-4 px-6 bg-green-700 text-white font-semibold rounded-sm hover:bg-green-800 transition-colors min-h-[48px]"
          >
            <ArrowRight className="w-5 h-5" />
            CHECK IN
          </Link>
          <Link
            href="/check-out"
            className="flex items-center justify-center gap-3 w-full py-4 px-6 bg-amber-700 text-white font-semibold rounded-sm hover:bg-amber-800 transition-colors min-h-[48px]"
          >
            <ArrowLeft className="w-5 h-5" />
            CHECK OUT
          </Link>
        </div>

        {/* Instructional Text */}
        <p className="font-ibm-plex-sans text-sm text-ink leading-relaxed w-3/4 mx-auto mt-8">
          Please select an option below to continue.
        </p>
      </div>
    </div>
  );
}
