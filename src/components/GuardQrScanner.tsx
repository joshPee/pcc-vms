'use client';

import { useEffect, useRef, useState } from 'react';
import { Camera, CameraOff, RefreshCw, AlertCircle } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';

interface GuardQrScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onScanError?: (errorMessage: string) => void;
  active: boolean;
}

export default function GuardQrScanner({ onScanSuccess, onScanError, active }: GuardQrScannerProps) {
  const [hasCamera, setHasCamera] = useState<boolean | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerId = 'guard-qr-reader-container';

  useEffect(() => {
    // Check if media devices are supported
    if (typeof window === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setHasCamera(false);
      setCameraError('Camera access is not supported by this browser.');
      return;
    }

    setHasCamera(true);
  }, []);

  useEffect(() => {
    if (!active) {
      stopScanner();
      return;
    }

    startScanner();

    return () => {
      stopScanner();
    };
  }, [active, facingMode]);

  const startScanner = async () => {
    try {
      setCameraError(null);
      // Wait for DOM container
      await new Promise((resolve) => setTimeout(resolve, 100));

      const element = document.getElementById(containerId);
      if (!element) return;

      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(containerId);
      }

      const qrScanner = scannerRef.current;
      if (qrScanner.isScanning) {
        await qrScanner.stop();
      }

      await qrScanner.start(
        { facingMode: facingMode },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          if (decodedText) {
            onScanSuccess(decodedText);
          }
        },
        (errorMessage) => {
          if (onScanError) {
            onScanError(errorMessage);
          }
        }
      );

      setIsScanning(true);
    } catch (err: any) {
      console.warn('QR Scanner start error:', err);
      setIsScanning(false);
      if (err?.name === 'NotAllowedError' || err?.message?.includes('Permission denied')) {
        setCameraError('Camera permission denied. Please grant camera permission to scan passes.');
      } else if (err?.name === 'NotFoundError') {
        setCameraError('No camera detected on this device.');
      } else {
        setCameraError('Unable to start camera scanner. Use manual code search below.');
      }
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
      } catch (err) {
        // ignore
      }
      setIsScanning(false);
    }
  };

  const toggleCameraFacing = async () => {
    await stopScanner();
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  if (hasCamera === false || cameraError) {
    return (
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-6 text-center text-amber-900 dark:text-amber-200">
        <CameraOff className="w-10 h-10 mx-auto mb-2 text-amber-600 opacity-80" />
        <p className="text-sm font-semibold mb-1">Camera Scanner Unavailable</p>
        <p className="text-xs text-amber-700 dark:text-amber-300 max-w-sm mx-auto mb-4">
          {cameraError || 'Camera could not be accessed. You can still scan with a hardware barcode gun or type the visitor code below.'}
        </p>
        <button
          type="button"
          onClick={() => startScanner()}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 text-white text-xs font-semibold hover:bg-amber-700 transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Retry Camera
        </button>
      </div>
    );
  }

  return (
    <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-xl">
      {/* Viewfinder Overlay with Animated Scanning Laser */}
      <div className="relative w-full aspect-square max-h-[320px] flex items-center justify-center bg-black">
        <div id={containerId} className="w-full h-full object-cover" />

        {/* Framing HUD */}
        <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
          <div className="w-[220px] h-[220px] border-2 border-emerald-400/60 rounded-2xl relative shadow-[0_0_20px_rgba(52,211,153,0.3)]">
            {/* Corner Markers */}
            <span className="absolute -top-1 -left-1 w-5 h-5 border-t-3 border-l-3 border-emerald-400 rounded-tl" />
            <span className="absolute -top-1 -right-1 w-5 h-5 border-t-3 border-r-3 border-emerald-400 rounded-tr" />
            <span className="absolute -bottom-1 -left-1 w-5 h-5 border-b-3 border-l-3 border-emerald-400 rounded-bl" />
            <span className="absolute -bottom-1 -right-1 w-5 h-5 border-b-3 border-r-3 border-emerald-400 rounded-br" />

            {/* Scanning Laser Beam */}
            <div className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-bounce opacity-80" />
          </div>

          <p className="mt-3 text-[12px] font-medium text-emerald-300/90 tracking-wide bg-black/60 px-3 py-1 rounded-full backdrop-blur-xs">
            Align Visitor Pass QR inside frame
          </p>
        </div>
      </div>

      {/* Camera Controls Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-t border-slate-800 text-xs text-slate-300">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-medium text-slate-200">Optical Scanner Live</span>
        </div>
        <button
          type="button"
          onClick={toggleCameraFacing}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition"
          title="Switch front/back camera"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Switch Cam ({facingMode === 'environment' ? 'Rear' : 'Front'})</span>
        </button>
      </div>
    </div>
  );
}
