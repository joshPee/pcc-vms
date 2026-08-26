'use client';

import Link from 'next/link';
import { ArrowRight, ArrowLeft } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen px-4 flex items-center justify-center">
      <div className="max-w-md mx-auto text-center">
          {/* Logo */}
          <div className="w-48 h-48 mx-auto mb-6">
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
  );
}
