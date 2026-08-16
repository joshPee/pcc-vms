import Link from 'next/link';
import { sql } from '@/lib/db';

export default async function Home() {
  const activeEventResult = await sql`SELECT name, date, registration_open FROM events WHERE status = 'ACTIVE' LIMIT 1`;
  const activeEvent = activeEventResult.length > 0 ? activeEventResult[0] : null;

  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-4 sm:px-6 py-6 sm:py-8">
      <div className="max-w-md w-full text-center">
        {/* Logo */}
        <div className="w-44 h-44 mx-auto mb-1">
          <img
            src="/qcc.png"
            alt="QCC Logo"
            className="object-contain w-full h-full"
          />
        </div>

        {/* School Name */}
        <h1 className="font-fraunces font-semibold text-xl sm:text-2xl text-ink mb-3">
          QCC TRAINING SCHOOL
        </h1>
        
        {/* Event Title */}
        <h2 className="font-fraunces text-lg sm:text-xl text-forest mb-3 uppercase">
          {activeEvent ? activeEvent.name : "NO ACTIVE MEETING"}
        </h2>
        
        {/* Event Date */}
        <p className="font-ibm-plex-mono text-base sm:text-lg text-brick font-medium mb-5 uppercase">
          {activeEvent ? new Date(activeEvent.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : ""}
        </p>

        {/* Three-band Divider */}
        <div 
          className="w-[120px] h-[6px] mx-auto mb-6"
          style={{
            background: 'linear-gradient(90deg, #0B3D2E 0 33%, #C89B3C 33% 66%, #D8CFB8 66% 100%)'
          }}
        />

        {/* Register Button */}
        {activeEvent?.registration_open ? (
          <>
            <Link
              href="/register"
              className="inline-block w-full py-3 px-6 bg-forest text-white font-semibold rounded-sm hover:bg-forest-deep transition-colors mb-6"
            >
              REGISTER NOW
            </Link>

            {/* Supporting Text */}
            <p className="font-ibm-plex-sans text-sm sm:text-base text-ink leading-relaxed px-2 sm:px-0">
              Already registered? Keep your code and present it at the registration desk.
            </p>
          </>
        ) : (
          <div className="bg-amber-50 text-amber-800 border border-amber-200 p-4 rounded-md mb-6">
            Registration is currently closed for this event.
          </div>
        )}
      </div>
    </div>
  );
}
