import React, { useRef, useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { Download, Loader2, AlertCircle } from 'lucide-react';
import type { Ingresso } from '@/contexts/IngressoContext';

interface IngressoPersonalizadoProps {
  ingresso: Ingresso;
}

export function IngressoPersonalizado({ ingresso }: IngressoPersonalizadoProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isGenerating, setIsGenerating] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const generateTicket = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsGenerating(true);
    setError(null);

    try {
      // Garantir que a fonte esteja carregada
      await document.fonts.load('48px GriffoClassico');

      const baseImage = new Image();
      baseImage.src = '/src/images/MOCK.png';
      
      await new Promise((resolve, reject) => {
        baseImage.onload = resolve;
        baseImage.onerror = () => reject(new Error('Erro ao carregar MOCK.png'));
      });

      canvas.width = baseImage.width;
      canvas.height = baseImage.height;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(baseImage, 0, 0);

      const centerX = canvas.width / 2;
      // Ajustado de 60 para 100 (subindo mais 40px)
      const offsetUp = 100; 

      // 1. Desenhar o Nome com SmallCaps Real
      const fontSizeNome = 48;
      ctx.fillStyle = '#5d3f04';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      
      ctx.font = `normal normal normal ${fontSizeNome}px GriffoClassico`;
      // @ts-ignore
      ctx.fontVariant = 'small-caps';
      
      const nomeY = 520 - offsetUp;
      const maxTextWidth = 419;
      
      ctx.fillText(ingresso.nome_convidado, centerX, nomeY, maxTextWidth);

      // 2. Desenhar o ID
      const fontSizeId = 28;
      ctx.font = `normal normal normal ${fontSizeId}px GriffoClassico`;
      // @ts-ignore
      ctx.fontVariant = 'small-caps';
      
      const idY = (520 + fontSizeNome + 45) - offsetUp;
      ctx.fillText(`ID: ${ingresso.id.split('-')[0]}`, centerX, idY);

      // 3. Desenhar o QR Code
      const qrSize = 419;
      const qrY = 720 - offsetUp;
      const qrX = centerX - (qrSize / 2);

      const svgElement = document.getElementById(`qr-hidden-${ingresso.id}`) as unknown as SVGSVGElement;
      if (svgElement) {
        const svgData = new XMLSerializer().serializeToString(svgElement);
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);
        
        const qrImg = new Image();
        qrImg.src = url;
        
        await new Promise((resolve) => {
          qrImg.onload = () => {
            ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);
            URL.revokeObjectURL(url);
            resolve(true);
          };
        });
      }

      setIsGenerating(false);
    } catch (err: any) {
      console.error('[IngressoPersonalizado] Erro:', err);
      setError(err.message);
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    generateTicket();
  }, [ingresso]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `Ingresso_${ingresso.nome_convidado}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <div className="hidden">
        <QRCodeSVG
          id={`qr-hidden-${ingresso.id}`}
          value={ingresso.id}
          size={419}
          level="H"
          fgColor="#322305"
          includeMargin={false}
        />
      </div>

      <div className="relative border rounded-xl overflow-hidden bg-muted w-full max-w-[400px] shadow-inner">
        {isGenerating && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 z-10">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
            <p className="text-sm text-muted-foreground">Ajustando posições...</p>
          </div>
        )}
        
        {error ? (
          <div className="p-8 text-center flex flex-col items-center gap-3">
            <AlertCircle className="w-10 h-10 text-destructive" />
            <p className="text-destructive text-sm font-medium">{error}</p>
            <Button variant="outline" size="sm" onClick={generateTicket}>
              Tentar Novamente
            </Button>
          </div>
        ) : (
          <div className="overflow-auto max-h-[500px] bg-white">
            <canvas 
              ref={canvasRef} 
              className="max-w-full h-auto block mx-auto"
              style={{ display: isGenerating ? 'none' : 'block' }}
            />
          </div>
        )}
      </div>

      {!isGenerating && !error && (
        <Button onClick={handleDownload} className="w-full shadow-lg">
          <Download className="w-4 h-4 mr-2" />
          Baixar Ingresso (Tamanho Real)
        </Button>
      )}
    </div>
  );
}