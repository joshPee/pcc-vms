'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Register() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [organisation, setOrganisation] = useState('');
  const [position, setPosition] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState(false);
  const [pendingSubmission, setPendingSubmission] = useState<any>(null);
  const [activeEvent, setActiveEvent] = useState<any>(null);
  const [fetchingEvent, setFetchingEvent] = useState(true);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const response = await fetch('/api/events/active');
        const data = await response.json();
        setActiveEvent(data);
      } catch (error) {
        console.error('Error fetching event:', error);
      } finally {
        setFetchingEvent(false);
      }
    };
    fetchEvent();
  }, []);

  const validateInput = (value: string) => {
    if (!value || value.trim().length < 2) {
      return 'Please enter at least 2 characters';
    }
    if (/^\d+$/.test(value.trim())) {
      return 'Please enter a valid name (numbers only are not allowed)';
    }
    return '';
  };

  const handleSubmit = async (e: React.FormEvent, forceSubmit = false) => {
    e.preventDefault();
    setError('');
    setDuplicateWarning(false);

    const nameError = validateInput(fullName);
    const orgError = validateInput(organisation);
    const posError = validateInput(position);

    if (nameError || orgError || posError) {
      setError(nameError || orgError || posError);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: fullName.trim(),
          organisation: organisation.trim(),
          position: position.trim(),
          phone: phone.trim(),
          forceSubmit,
        }),
      });

      const data = await response.json();
      console.log('Registration API response:', data);

      if (!response.ok) {
        if (data.duplicate) {
          setDuplicateWarning(true);
          setPendingSubmission(data);
          setError('A similar registration already exists. Submit anyway?');
        } else {
          setError(data.error || 'Registration failed');
        }
      } else {
        console.log('Redirecting with:', { code: data.registrationCode, name: data.fullName });
        router.push(`/register/success?code=${data.registrationCode}&name=${encodeURIComponent(data.fullName)}`);
      }
    } catch (error) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSubmit(e, true);
  };

  const handleViewExisting = () => {
    if (pendingSubmission?.existingCode) {
      router.push(`/register/success?code=${pendingSubmission.existingCode}&name=${encodeURIComponent(pendingSubmission.fullName)}`);
    }
  };

  return (
    <div className="min-h-screen bg-cream px-4 py-8">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="font-fraunces font-medium text-2xl text-ink mb-2">
            QCC TRAINING SCHOOL
          </h1>
          {fetchingEvent ? (
            <div className="h-12 w-3/4 mx-auto bg-line/50 animate-pulse rounded-md mt-4"></div>
          ) : (
            <>
              <h2 className="font-fraunces text-lg text-forest mb-2 uppercase">
                {activeEvent?.name || "NO ACTIVE MEETING"}
              </h2>
              <p className="font-ibm-plex-mono text-brick uppercase">
                {activeEvent?.date ? new Date(activeEvent.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : ""}
              </p>
            </>
          )}
        </div>

        {fetchingEvent ? (
           <div className="bg-white p-6 border border-line rounded-sm min-h-[400px] flex items-center justify-center">
             <div className="animate-spin rounded-full h-12 w-12 border-4 border-forest border-t-transparent"></div>
           </div>
        ) : !activeEvent?.registration_open ? (
          <div className="bg-amber-50 text-amber-800 p-6 border border-amber-200 rounded-sm text-center">
            <h3 className="font-bold text-lg mb-2">Registration Closed</h3>
            <p>We are not currently accepting registrations for this event.</p>
          </div>
        ) : (
          <div className="bg-white p-6 border border-line rounded-sm">
            <p className="font-ibm-plex-sans text-sm text-ink mb-6">
              Please fill out the form to receive your check-in code.
            </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && !duplicateWarning && (
              <div className="bg-brick/10 border border-brick text-brick px-4 py-3 rounded-sm">
                {error}
              </div>
            )}

            {duplicateWarning && (
              <div className="bg-gold/20 border border-gold text-forest px-4 py-3 rounded-sm">
                {error}
                <div className="mt-3 flex gap-2">
                  {pendingSubmission?.existingCode && (
                    <button
                      onClick={handleViewExisting}
                      className="px-4 py-2 bg-blue-600 text-white rounded-sm hover:bg-blue-700"
                    >
                      View Existing Registration
                    </button>
                  )}
                  <button
                    onClick={handleForceSubmit}
                    className="px-4 py-2 bg-forest text-white rounded-sm hover:bg-forest-deep"
                  >
                    Yes, Submit Anyway
                  </button>
                  <button
                    onClick={() => {
                      setDuplicateWarning(false);
                      setError('');
                    }}
                    className="px-4 py-2 bg-cream text-ink border border-line rounded-sm hover:bg-sage"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <div>
              <label htmlFor="fullName" className="block text-xs font-semibold text-forest uppercase tracking-widest mb-2">
                Full Name *
              </label>
              <input
                id="fullName"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-3 text-base border border-line bg-cream rounded-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-gold transition-all duration-200"
                placeholder="Enter your full name"
                autoComplete="name"
              />
            </div>

            <div>
              <label htmlFor="organisation" className="block text-xs font-semibold text-forest uppercase tracking-widest mb-2">
                Organisation *
              </label>
              <input
                id="organisation"
                type="text"
                required
                value={organisation}
                onChange={(e) => setOrganisation(e.target.value)}
                className="w-full px-4 py-3 text-base border border-line bg-cream rounded-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-gold transition-all duration-200"
                placeholder="Enter your organisation"
                autoComplete="organization"
              />
            </div>

            <div>
              <label htmlFor="position" className="block text-xs font-semibold text-forest uppercase tracking-widest mb-2">
                Position *
              </label>
              <input
                id="position"
                type="text"
                required
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                className="w-full px-4 py-3 text-base border border-line bg-cream rounded-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-gold transition-all duration-200"
                placeholder="Enter your position"
                autoComplete="organization-title"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-xs font-semibold text-forest uppercase tracking-widest mb-2">
                Contact Number
              </label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-3 text-base border border-line bg-cream rounded-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-gold transition-all duration-200"
                placeholder="Enter your contact number"
                autoComplete="tel"
              />
            </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 px-4 text-base font-medium rounded-sm text-white bg-forest hover:bg-forest-deep focus:outline-none focus:ring-2 focus:ring-gold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 active:scale-95"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    Registering...
                  </span>
                ) : 'Register'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
