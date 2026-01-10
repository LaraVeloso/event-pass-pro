import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, Camera, RotateCcw, Loader2, Upload } from 'lucide-react';

interface PhotoCaptureProps {
  onCapture: (photoDataUrl: string) => void;
  onClose: () => void;
}

export function PhotoCapture({ onCapture, onClose }: PhotoCaptureProps) {
  const [error, setError] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [photoTaken, setPhotoTaken] = useState<string | null>(null);
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
    
    try {
      const constraints = {
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Importante para iOS e navegadores modernos
        videoRef.current.setAttribute('playsinline', 'true');
        try {
          await videoRef.current.play();
        } catch (playErr) {
          console.error("Erro ao dar play no vídeo:", playErr);
        }
      }
    } catch (err: any) {
      console.error('Camera error:', err);
      setError('Não foi possível acessar a câmera. Tente usar o anexo de arquivo abaixo.');
    }
  }, [stopCamera]);

  const capturePhoto = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      setIsCapturing(true);
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      if (context && video.readyState === 4) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const photoDataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setPhotoTaken(photoDataUrl);
        stopCamera();
      }
      setIsCapturing(false);
    }
  }, [stopCamera]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoTaken(reader.result as string);
        stopCamera();
      };
      reader.readAsDataURL(file);
    }
  };

  const retakePhoto = () => {
    setPhotoTaken(null);
    startCamera();
  };

  const confirmPhoto = () => {
    if (photoTaken) {
      onCapture(photoTaken);
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
          <span className="font-semibold">Validar por Foto</span>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/20">
          <X className="w-5 h-5" />
        </Button>
      </div>

      <div className="flex-1 relative flex items-center justify-center bg-black overflow-hidden">
        {photoTaken ? (
          <div className="relative w-full h-full flex flex-col items-center justify-center p-4">
            <img 
              src={photoTaken} 
              alt="Captura" 
              className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-2xl"
            />
            <div className="flex gap-4 mt-8 w-full max-w-xs">
              <Button onClick={retakePhoto} variant="outline" className="flex-1 border-white/30 text-white hover:bg-white/10">
                <RotateCcw className="w-4 h-4 mr-2" /> Refazer
              </Button>
              <Button onClick={confirmPhoto} className="flex-1 bg-green-600 hover:bg-green-700">
                Confirmar
              </Button>
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
            <canvas ref={canvasRef} className="hidden" />
            
            {/* Overlay de Guia */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-72 h-72 border-2 border-white/30 rounded-3xl border-dashed" />
            </div>

            {error && (
              <div className="absolute top-20 left-4 right-4 bg-red-500/90 text-white p-3 rounded-lg text-sm text-center">
                {error}
              </div>
            )}

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
                  className="w-20 h-20 rounded-full bg-white hover:bg-gray-200 text-black shadow-xl"
                  disabled={isCapturing}
                >
                  {isCapturing ? <Loader2 className="w-8 h-8 animate-spin" /> : <div className="w-16 h-16 rounded-full border-4 border-black/10" />}
                </Button>

                <div className="w-12" /> {/* Spacer para centralizar o botão principal */}
              </div>
              <p className="text-white/70 text-xs font-medium uppercase tracking-widest">
                Tire uma foto ou anexe um arquivo
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}