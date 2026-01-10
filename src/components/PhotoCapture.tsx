import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { X, Camera, RotateCcw, Loader2 } from 'lucide-react';

interface PhotoCaptureProps {
  onCapture: (photoDataUrl: string) => void;
  onClose: () => void;
}

export function PhotoCapture({ onCapture, onClose }: PhotoCaptureProps) {
  const [error, setError] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [photoTaken, setPhotoTaken] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setError(null);
    } catch (err: any) {
      console.error('Camera error:', err);
      if (err.name === 'NotAllowedError') {
        setError('Permissão da câmera negada. Por favor, permita o acesso à câmera nas configurações do navegador.');
      } else if (err.name === 'NotFoundError') {
        setError('Nenhuma câmera encontrada. Verifique se seu dispositivo tem uma câmera.');
      } else if (err.name === 'NotSupportedError') {
        setError('Câmera não suportada. Tente usar um navegador diferente.');
      } else {
        setError('Não foi possível acessar a câmera. Verifique as permissões do navegador.');
      }
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  const capturePhoto = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      setIsCapturing(true);
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      if (context) {
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

  const retakePhoto = () => {
    setPhotoTaken(null);
    startCamera();
  };

  const confirmPhoto = () => {
    if (photoTaken) {
      onCapture(photoTaken);
    }
  };

  React.useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  return (
    <div className="fixed inset-0 bg-black z-[100] flex flex-col">
      <div className="flex items-center justify-between p-4 bg-black/80 backdrop-blur-sm z-20">
        <div className="flex items-center gap-2 text-white">
          <Camera className="w-5 h-5 text-primary" />
          <span className="font-semibold">Capturar Foto</span>
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
              <Button onClick={startCamera} variant="outline" className="border-white/30 text-white hover:bg-white/10">
                Tentar Novamente
              </Button>
              <Button onClick={onClose} variant="outline" className="border-white/30 text-white hover:bg-white/10">
                Voltar
              </Button>
            </div>
          </div>
        ) : photoTaken ? (
          <div className="relative w-full h-full flex items-center justify-center">
            <img 
              src={photoTaken} 
              alt="Foto capturada" 
              className="max-w-full max-h-full object-contain"
            />
            <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-4 px-8">
              <Button 
                onClick={retakePhoto} 
                variant="outline" 
                size="lg"
                className="border-white/30 text-white hover:bg-white/10"
              >
                <RotateCcw className="w-5 h-5 mr-2" />
                Refazer
              </Button>
              <Button 
                onClick={confirmPhoto} 
                size="lg"
                className="bg-green-600 hover:bg-green-700"
              >
                Confirmar Foto
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
            
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="relative w-64 h-64">
                <div className="absolute top-0 left-0 w-8 h-8 border-l-4 border-t-4 border-primary rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-8 h-8 border-r-4 border-t-4 border-primary rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-l-4 border-b-4 border-primary rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-r-4 border-b-4 border-primary rounded-br-lg" />
              </div>
            </div>

            <div className="absolute bottom-8 left-0 right-0 flex justify-center">
              <Button 
                onClick={capturePhoto} 
                size="lg"
                disabled={isCapturing}
                className="w-20 h-20 rounded-full bg-white hover:bg-gray-100 text-black"
              >
                {isCapturing ? (
                  <Loader2 className="w-8 h-8 animate-spin" />
                ) : (
                  <Camera className="w-8 h-8" />
                )}
              </Button>
            </div>
          </>
        )}
      </div>

      <div className="p-6 bg-black/80 backdrop-blur-sm text-center z-20">
        <p className="text-white/80 text-sm">
          Tire uma foto do documento ou ingresso para validação
        </p>
      </div>
    </div>
  );
}