import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, Camera, RotateCcw, Loader2, Upload, AlertCircle } from 'lucide-react';
import { BrowserQRCodeReader, DecodeHintType } from '@zxing/library';

interface PhotoCaptureProps {
  onCapture: (code: string) => void;
  onClose: () => void;
}

export function PhotoCapture({ onCapture, onClose }: PhotoCaptureProps) {
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [photoTaken, setPhotoTaken] = useState<string | null>(null);
  const [decodedCode, setDecodedCode] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    stopCamera();
    setError(null);
    setDecodedCode(null);
    setPhotoTaken(null);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
      }
    } catch (err: any) {
      console.error('[PhotoCapture] Camera error:', err);
      setError('Não foi possível acessar a câmera. Tente anexar uma foto.');
    }
  }, [stopCamera]);

  const processImage = async (imageDataUrl: string) => {
    setIsProcessing(true);
    setError(null);
    setPhotoTaken(imageDataUrl);

    const img = new Image();
    img.src = imageDataUrl;
    
    img.onload = async () => {
      try {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) throw new Error('Canvas context error');

        // Usar dimensões originais para prints digitais
        canvas.width = img.width;
        canvas.height = img.height;
        context.drawImage(img, 0, 0);

        const hints = new Map();
        hints.set(DecodeHintType.TRY_HARDER, true);
        // Removido restrição de formato para ser mais flexível
        
        const reader = new BrowserQRCodeReader(hints);
        const result = await reader.decodeFromCanvas(canvas);
        
        if (result && result.getText()) {
          const code = result.getText();
          console.log('[PhotoCapture] Success:', code);
          setDecodedCode(code);
          // Validação automática ao detectar
          setTimeout(() => onCapture(code), 500);
        } else {
          throw new Error('No code found');
        }
      } catch (err) {
        console.error('[PhotoCapture] Error:', err);
        setError("Não conseguimos ler este QR Code. Tente aproximar mais ou garantir que o código não esteja cortado.");
      } finally {
        setIsProcessing(false);
      }
    };
  };

  const capturePhoto = useCallback(() => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      
      if (context && video.readyState === 4) {
        context.drawImage(video, 0, 0);
        const dataUrl = canvas.toDataURL('image/png'); // PNG é melhor para preservar bordas de QR
        stopCamera();
        processImage(dataUrl);
      }
    }
  }, [stopCamera]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          processImage(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  return (
    <div className="fixed inset-0 bg-black z-[100] flex flex-col">
      <div className="flex items-center justify-between p-4 bg-black/80 backdrop-blur-sm z-20">
        <div className="flex items-center gap-2 text-white">
          <Camera className="w-5 h-5 text-primary" />
          <span className="font-semibold">Validar Ingresso</span>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/20">
          <X className="w-5 h-5" />
        </Button>
      </div>

      <div className="flex-1 relative flex items-center justify-center bg-black overflow-hidden">
        {photoTaken ? (
          <div className="relative w-full h-full flex flex-col items-center justify-center p-4">
            <div className="relative max-w-full max-h-[60vh]">
              <img 
                src={photoTaken} 
                alt="Captura" 
                className={`rounded-lg shadow-2xl object-contain ${decodedCode ? 'border-4 border-green-500' : ''}`}
              />
              {isProcessing && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-lg">
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-10 h-10 text-primary animate-spin" />
                    <span className="text-white font-medium">Lendo QR Code...</span>
                  </div>
                </div>
              )}
            </div>
            
            <div className="mt-6 w-full max-w-xs space-y-4">
              {decodedCode ? (
                <div className="bg-green-500 text-white p-4 rounded-lg text-center font-bold animate-bounce">
                  QR CODE DETECTADO!
                </div>
              ) : !isProcessing && error && (
                <div className="bg-red-500/20 border border-red-500 text-red-400 p-4 rounded-lg flex items-start gap-2 text-sm">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {!decodedCode && !isProcessing && (
                <div className="flex gap-3">
                  <Button onClick={() => { setPhotoTaken(null); startCamera(); }} variant="outline" className="flex-1 border-white/30 text-white hover:bg-white/10">
                    <RotateCcw className="w-4 h-4 mr-2" /> Tentar Outra
                  </Button>
                  <label className="flex-1">
                    <Button variant="secondary" className="w-full" onClick={() => fileInputRef.current?.click()}>
                      <Upload className="w-4 h-4 mr-2" /> Anexar
                    </Button>
                  </label>
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-72 h-72 border-2 border-primary/50 rounded-2xl relative">
                <div className="absolute -top-1 -left-1 w-12 h-12 border-t-4 border-l-4 border-primary rounded-tl-2xl" />
                <div className="absolute -top-1 -right-1 w-12 h-12 border-t-4 border-r-4 border-primary rounded-tr-2xl" />
                <div className="absolute -bottom-1 -left-1 w-12 h-12 border-b-4 border-l-4 border-primary rounded-bl-2xl" />
                <div className="absolute -bottom-1 -right-1 w-12 h-12 border-b-4 border-r-4 border-primary rounded-br-2xl" />
              </div>
            </div>

            <div className="absolute bottom-12 left-0 right-0 flex flex-col items-center gap-6">
              <div className="flex items-center gap-8">
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
                <Button variant="outline" size="icon" className="w-12 h-12 rounded-full border-white/30 text-white bg-black/20" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="w-5 h-5" />
                </Button>
                <Button onClick={capturePhoto} className="w-20 h-20 rounded-full bg-white hover:bg-gray-200 text-black shadow-xl" />
                <div className="w-12" />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}