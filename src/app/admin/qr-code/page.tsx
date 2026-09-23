'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Share2, Image as ImageIcon, RefreshCw, User } from 'lucide-react';
import QRCode from 'qrcode';

type QRCodeType = 'pdf' | 'registration';

export default function QRCodePage() {
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [qrType, setQrType] = useState<QRCodeType>('pdf');

  // Get the base URL for the QR code
  const getTargetUrl = () => {
    if (typeof window !== 'undefined') {
      const baseUrl = window.location.origin;
      if (qrType === 'pdf') {
        return `${baseUrl}/pdf?t=${Date.now()}`;
      } else {
        return `${baseUrl}/register`;
      }
    }
    return qrType === 'pdf' ? `/pdf?t=${Date.now()}` : '/register';
  };

  const generateQRCode = async () => {
    setLoading(true);
    try {
      const targetUrl = getTargetUrl();
      const qrDataUrl = await QRCode.toDataURL(targetUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      });
      setQrCodeUrl(qrDataUrl);
      setLoading(false);
    } catch (err) {
      console.error('Error generating QR code:', err);
      setError('Failed to generate QR code');
      setLoading(false);
    }
  };

  useEffect(() => {
    generateQRCode();
  }, [qrType]);

  const handleDownloadQR = () => {
    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = qrType === 'pdf' ? 'qcc-pdf-qr-code.png' : 'visitor-registration-qr-code.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShare = async () => {
    const url = getTargetUrl();
    if (navigator.share) {
      try {
        await navigator.share({
          title: qrType === 'pdf' ? 'QCC Image' : 'Visitor Registration',
          text: qrType === 'pdf' 
            ? 'Scan this QR code to access the QCC information image'
            : 'Scan this QR code to register as a visitor',
          url: url,
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      navigator.clipboard.writeText(url);
      alert('URL copied to clipboard!');
    }
  };

  const handleDownloadImage = () => {
    const link = document.createElement('a');
    link.href = '/api/pdf?download=true';
    link.download = 'qcc-info.jpg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>QR Code Generator</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* QR Code Type Selector */}
            <div className="flex gap-2 justify-center">
              <Button
                onClick={() => setQrType('pdf')}
                variant={qrType === 'pdf' ? 'default' : 'outline'}
                className={qrType === 'pdf' ? 'bg-[#123B70] hover:bg-[#0d2d52]' : ''}
              >
                <ImageIcon className="h-4 w-4 mr-2" />
                PDF QR Code
              </Button>
              <Button
                onClick={() => setQrType('registration')}
                variant={qrType === 'registration' ? 'default' : 'outline'}
                className={qrType === 'registration' ? 'bg-[#123B70] hover:bg-[#0d2d52]' : ''}
              >
                <User className="h-4 w-4 mr-2" />
                Registration QR Code
              </Button>
            </div>

            {/* QR Code Display */}
            <div className="flex flex-col items-center space-y-6">
              {loading ? (
                <div className="h-64 w-64 bg-slate-100 animate-pulse rounded-lg flex items-center justify-center">
                  <span className="text-slate-400">Generating QR Code...</span>
                </div>
              ) : error ? (
                <div className="text-destructive">{error}</div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-lg shadow-md">
                    <img 
                      src={qrCodeUrl} 
                      alt={`QR Code for ${qrType}`} 
                      className="w-64 h-64"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground text-center">
                    {qrType === 'pdf' 
                      ? 'Scan this QR code to access the PDF document'
                      : 'Scan this QR code to register as a visitor'}
                  </p>
                  <div className="flex gap-2 justify-center flex-wrap">
                    {qrType === 'pdf' && (
                      <Button 
                        onClick={handleDownloadImage}
                        className="bg-[#123B70] hover:bg-[#0d2d52]"
                      >
                        <ImageIcon className="h-4 w-4 mr-2" />
                        Download Image
                      </Button>
                    )}
                    <Button 
                      onClick={handleDownloadQR}
                      variant="outline"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download QR Code
                    </Button>
                    <Button 
                      onClick={handleShare}
                      variant="outline"
                    >
                      <Share2 className="h-4 w-4 mr-2" />
                      Share
                    </Button>
                    <Button 
                      onClick={generateQRCode}
                      variant="outline"
                      disabled={loading}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Instructions</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          {qrType === 'pdf' ? (
            <>
              <p>1. Place your JPG file in the <code className="bg-slate-100 px-1 py-0.5 rounded">public/qcc-info.jpg</code> directory</p>
              <p>2. The QR code will automatically point to <code className="bg-slate-100 px-1 py-0.5 rounded">/pdf</code> page</p>
              <p>3. Users can scan the QR code to view and download the JPG image</p>
              <p>4. You can download the QR code image for printing or sharing</p>
            </>
          ) : (
            <>
              <p>1. The QR code points to the visitor registration form</p>
              <p>2. Visitors can scan the QR code with their phone camera</p>
              <p>3. They will be directed to fill in their visitor details</p>
              <p>4. Print this QR code and place it at the entrance for self-registration</p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
