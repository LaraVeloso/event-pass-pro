import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import { X, Camera, Loader2 } from 'lucide-react';

interface QRScannerProps {
  onScan: (code: string) => void;
  onClose: () => void;
}

export function QRScanner({ onScan, onClose }: QRScannerProps) {
  const [isStarting, setIsStarting] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    const startScanner = async () => {
      try {
        const scanner = new Html5Qrcode('qr-reader');
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1,
          },
          (decodedText) => {
            onScan(decodedText);
            scanner.stop().catch(console.error);
          },
          () => {
            // Ignore scan failures
          }
        );

        setIsStarting(false);
      } catch (err) {
        console.error('Scanner error:', err);
        setError(
          'Não foi possível acessar a câmera. Verifique as permissões ou use a validação manual.'
        );
        setIsStarting(false);
      }
    };

    startScanner();

    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/80 backdrop-blur-sm">
        <div className="flex items-center gap-2 text-white">
          <Camera className="w-5 h-5" />
          <span className="font-semibold">Scanner QR Code</span>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/20">
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Camera View */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        {isStarting && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black z-10">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
            <p className="mt-4 text-white/80">Iniciando câmera...</p>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black z-10 p-8 text-center">
            <Camera className="w-16 h-16 text-white/40 mb-4" />
            <p className="text-white mb-6">{error}</p>
            <Button onClick={onClose} variant="outline" className="border-white/30 text-white hover:bg-white/10">
              Usar validação manual
            </Button>
          </div>
        )}

        {/* Camera container */}
        <div
          id="qr-reader"
          className="w-full h-full"
          style={{ 
            display: isStarting || error ? 'none' : 'block',
          }}
        />

        {/* Scan frame overlay */}
        {!isStarting && !error && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            {/* Dark overlay with transparent center */}
            <div className="absolute inset-0 bg-black/50" />
            
            {/* Scan box */}
            <div className="relative w-64 h-64 z-10">
              {/* Clear center */}
              <div className="absolute inset-0 bg-transparent" style={{ boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)' }} />
              
              {/* Corner brackets */}
              <div className="absolute top-0 left-0 w-8 h-8 border-l-4 border-t-4 border-primary rounded-tl-lg" />
              <div className="absolute top-0 right-0 w-8 h-8 border-r-4 border-t-4 border-primary rounded-tr-lg" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-l-4 border-b-4 border-primary rounded-bl-lg" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-r-4 border-b-4 border-primary rounded-br-lg" />
              
              {/* Scanning line animation */}
              <div className="absolute left-2 right-2 h-0.5 bg-primary/80 animate-pulse" style={{ top: '50%' }} />
            </div>
          </div>
        )}
      </div>

      {/* Footer instruction */}
      {!isStarting && !error && (
        <div className="p-6 bg-black/80 backdrop-blur-sm text-center">
          <p className="text-white/80 text-sm">
            Posicione o QR Code dentro do quadrado
          </p>
        </div>
      )}
    </div>
  );
}
