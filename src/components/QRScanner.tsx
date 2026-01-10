import React, { useState } from 'react';
import QrScanner from 'react-qr-scanner';
import { Button } from '@/components/ui/button';
import { X, Camera, Loader2 } from 'lucide-react';

interface QRScannerProps {
  onScan: (code: string) => void;
  onClose: () => void;
}

export function QRScanner({ onScan, onClose }: QRScannerProps) {
  const [error, setError] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(true);

  const handleScan = (result: any) => {
    if (result?.text) {
      console.log("QR Code detected:", result.text);
      onScan(result.text);
      setCameraActive(false);
    }
  };

  const handleError = (error: any) => {
    console.error('QR Scanner error:', error);
    if (error?.name === 'NotAllowedError') {
      setError('Permissão da câmera negada. Por favor, permita o acesso à câmera nas configurações do navegador.');
    } else if (error?.name === 'NotFoundError') {
      setError('Nenhuma câmera encontrada. Verifique se seu dispositivo tem uma câmera.');
    } else if (error?.name === 'NotSupportedError') {
      setError('Câmera não suportada. Tente usar um navegador diferente.');
    } else {
      setError('Não foi possível acessar a câmera. Verifique as permissões do navegador.');
    }
  };

  const handleRetry = () => {
    setError(null);
    setCameraActive(true);
  };

  const constraints = {
    facingMode: 'environment',
    aspectRatio: 1,
    width: { ideal: 1280 },
    height: { ideal: 720 }
  };

  return (
    <div className="fixed inset-0 bg-black z-[100] flex flex-col">
      <div className="flex items-center justify-between p-4 bg-black/80 backdrop-blur-sm z-20">
        <div className="flex items-center gap-2 text-white">
          <Camera className="w-5 h-5 text-primary" />
          <span className="font-semibold">Scanner QR Code</span>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/20">
          <X className="w-5 h-5" />
        </Button>
      </div>

      <div className="flex-1 relative flex items-center justify-center bg-black overflow-hidden">
        {error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black z-30 p-8 text-center">
            <Camera className="w-16 h-16 text-white/40 mb-4" />
            <p className="text-white mb-6">{error}</p>
            <div className="flex gap-3">
              <Button onClick={handleRetry} variant="outline" className="border-white/30 text-white hover:bg-white/10">
                Tentar Novamente
              </Button>
              <Button onClick={onClose} variant="outline" className="border-white/30 text-white hover:bg-white/10">
                Voltar
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="w-full h-full">
              {cameraActive && (
                <div className="relative w-full h-full">
                  <QrScanner
                    onResult={handleScan}
                    onError={handleError}
                    constraints={constraints}
                    style={{ 
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                    videoStyle={{ 
                      objectFit: 'cover',
                      width: '100%',
                      height: '100%'
                    }}
                    videoConstraints={{
                      facingMode: 'environment',
                      aspectRatio: 1,
                      width: { ideal: 1280 },
                      height: { ideal: 720 }
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="relative w-64 h-64">
                      <div className="absolute top-0 left-0 w-8 h-8 border-l-4 border-t-4 border-primary rounded-tl-lg" />
                      <div className="absolute top-0 right-0 w-8 h-8 border-r-4 border-t-4 border-primary rounded-tr-lg" />
                      <div className="absolute bottom-0 left-0 w-8 h-8 border-l-4 border-b-4 border-primary rounded-bl-lg" />
                      <div className="absolute bottom-0 right-0 w-8 h-8 border-r-4 border-b-4 border-primary rounded-br-lg" />
                      <div className="absolute left-0 right-0 h-0.5 bg-primary/50 animate-pulse top-1/2" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {!cameraActive && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black z-30">
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-white text-lg mb-4">QR Code detectado!</p>
                <p className="text-white/60 text-sm">Processando...</p>
              </div>
            )}
          </>
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