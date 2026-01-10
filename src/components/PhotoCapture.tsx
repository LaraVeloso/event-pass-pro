import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, Camera, RotateCcw, Loader2, Upload, AlertCircle } from 'lucide-react';
import jsQR from 'jsqr';

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
  const canvasRef = useRef<HTMLCanvasElement>(null);
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
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1920 }, // Aumentando a resolução ideal para melhor captura
          height: { ideal: 1080 }
        }
      });
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
      }
    } catch (err: any) {
      console.error('Camera error:', err);
      setError('Não foi possível acessar a câmera. Tente anexar uma foto.');
    }
  }, [stopCamera]);

  const processImage = (imageDataUrl: string) => {
    setIsProcessing(true);
    setError(null);

    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d', { willReadFrequently: true });
      if (!context) return;

      // Redimensionar para um tamanho gerenciável mas nítido
      const maxDim = 1024;
      let width = img.width;
      let height = img.height;
      
      if (width > height) {
        if (width > maxDim) {
          height *= maxDim / width;
          width = maxDim;
        }
      } else {
        if (height > maxDim) {
          width *= maxDim / height;
          height = maxDim;
        }
      }

      canvas.width = width;
      canvas.height = height;
      context.drawImage(img, 0, 0, width, height);

      const imageData = context.getImageData(0, 0, width, height);
      
      // Tentar decodificar
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "dontInvert",
      });

      if (code && code.data) {
        setDecodedCode(code.data);
        setPhotoTaken(imageDataUrl);
      } else {
        // Segunda tentativa: Tentar com inversão (para QR codes em fundos escuros)
        const codeInverted = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "attemptBoth",
        });
        
        if (codeInverted && codeInverted.data) {
          setDecodedCode(codeInverted.data);
          setPhotoTaken(imageDataUrl);
        } else {
          setError("QR Code não detectado. Certifique-se que o código está nítido e bem iluminado.");
          setPhotoTaken(imageDataUrl);
        }
      }
      setIsProcessing(false);
    };
    img.src = imageDataUrl;
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
        const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
        stopCamera();
        processImage(dataUrl);
      }
    }
  }, [stopCamera]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        processImage(reader.result as string);
        stopCamera();
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
                className={`rounded-lg shadow-2xl object-contain ${!decodedCode ? 'opacity-60 grayscale' : ''}`}
              />
              {isProcessing && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-lg">
                  <Loader2 className="w-10 h-10 text-white animate-spin" />
                </div>
              )}
            </div>
            
            <div className="mt-6 w-full max-w-xs space-y-4">
              {!isProcessing && decodedCode ? (
                <div className="bg-green-500/20 border border-green-500 text-green-400 p-3 rounded-lg text-center font-medium">
                  Código Identificado!
                </div>
              ) : !isProcessing && (
                <div className="bg-red-500/20 border border-red-500 text-red-400 p-3 rounded-lg flex items-start gap-2 text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex gap-3">
                <Button onClick={() => { setPhotoTaken(null); startCamera(); }} variant="outline" className="flex-1 border-white/30 text-white hover:bg-white/10">
                  <RotateCcw className="w-4 h-4 mr-2" /> Tentar Outra
                </Button>
                {decodedCode && (
                  <Button onClick={() => onCapture(decodedCode)} className="flex-1 bg-primary hover:bg-primary/90">
                    Validar Agora
                  </Button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="relative w-72 h-72">
                <div className="absolute top-0 left-0 w-10 h-10 border-l-4 border-t-4 border-primary rounded-tl-2xl" />
                <div className="absolute top-0 right-0 w-10 h-10 border-r-4 border-t-4 border-primary rounded-tr-2xl" />
                <div className="absolute bottom-0 left-0 w-10 h-10 border-l-4 border-b-4 border-primary rounded-bl-2xl" />
                <div className="absolute bottom-0 right-0 w-10 h-10 border-r-4 border-b-4 border-primary rounded-br-2xl" />
                <div className="absolute inset-0 bg-primary/5 animate-pulse rounded-2xl" />
              </div>
            </div>

            <div className="absolute bottom-12 left-0 right-0 flex flex-col items-center gap-6">
              <div className="flex items-center gap-8">
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileUpload}
                />
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="w-12 h-12 rounded-full border-white/30 text-white bg-black/20"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-5 h-5" />
                </Button>

                <Button 
                  onClick={capturePhoto} 
                  className="w-20 h-20 rounded-full bg-white hover:bg-gray-200 text-black shadow-xl flex items-center justify-center"
                >
                  <div className="w-16 h-16 rounded-full border-4 border-black/5" />
                </Button>

                <div className="w-12" />
              </div>
              <p className="text-white/70 text-xs font-medium uppercase tracking-widest">
                Centralize o QR Code na moldura
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}