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
  const containerId = "qr-reader";

  useEffect(() => {
    let isMounted = true;

    const startScanner = async () => {
      try {
        // Pequeno delay para garantir que o elemento DOM esteja pronto
        await new Promise(resolve => setTimeout(resolve, 300));
        
        if (!isMounted) return;

        const scanner = new Html5Qrcode(containerId);
        scannerRef.current = scanner;

        const config = {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        };

        await scanner.start(
          { facingMode: "environment" },
          config,
          (decodedText) => {
            if (isMounted) {
              onScan(decodedText);
              stopScanner();
            }
          },
          () => {
            // Falhas de leitura silenciosas
          }
        );

        if (isMounted) setIsStarting(false);
      } catch (err) {
        console.error('Erro ao iniciar scanner:', err);
        if (isMounted) {
          setError('Não foi possível acessar a câmera. Verifique se outra aba está usando a câmera ou as permissões do navegador.');
          setIsStarting(false);
        }
      }
    };

    const stopScanner = async () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        try {
          await scannerRef.current.stop();
          scannerRef.current = null;
        } catch (err) {
          console.error('Erro ao parar scanner:', err);
        }
      }
    };

    startScanner();

    return () => {
      isMounted = false;
      stopScanner();
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 bg-black z-[100] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/80 backdrop-blur-sm z-20">
        <div className="flex items-center gap-2 text-white">
          <Camera className="w-5 h-5 text-primary" />
          <span className="font-semibold">Scanner QR Code</span>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/20">
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Camera View */}
      <div className="flex-1 relative flex items-center justify-center bg-black overflow-hidden">
        {isStarting && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black z-30">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
            <p className="mt-4 text-white/80">Iniciando câmera...</p>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black z-30 p-8 text-center">
            <Camera className="w-16 h-16 text-white/40 mb-4" />
            <p className="text-white mb-6">{error}</p>
            <Button onClick={onClose} variant="outline" className="border-white/30 text-white hover:bg-white/10">
              Voltar para validação manual
            </Button>
          </div>
        )}

        {/* O container do scanner deve estar sempre no DOM para a biblioteca encontrá-lo */}
        <div
          id={containerId}
          className="w-full h-full"
        />

        {/* Overlay de mira */}
        {!isStarting && !error && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
            <div className="relative w-64 h-64">
              <div className="absolute top-0 left-0 w-8 h-8 border-l-4 border-t-4 border-primary rounded-tl-lg" />
              <div className="absolute top-0 right-0 w-8 h-8 border-r-4 border-t-4 border-primary rounded-tr-lg" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-l-4 border-b-4 border-primary rounded-bl-lg" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-r-4 border-b-4 border-primary rounded-br-lg" />
              <div className="absolute left-0 right-0 h-0.5 bg-primary/50 animate-pulse top-1/2" />
            </div>
          </div>
        )}
      </div>

      <div className="p-6 bg-black/80 backdrop-blur-sm text-center z-20">
        <p className="text-white/80 text-sm">
          Aponte a câmera para o QR Code do ingresso
        </p>
      </div>
    </div>
  );
}