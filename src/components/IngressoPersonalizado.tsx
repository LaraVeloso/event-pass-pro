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
      const baseImage = new Image();
      baseImage.src = '/src/images/MOCK.png';
      
      await new Promise((resolve, reject) => {
        baseImage.onload = resolve;
        baseImage.onerror = () => reject(new Error('Não foi possível carregar a imagem base MOCK.png. Verifique se o arquivo existe em src/images/'));
      });

      // Forçar o canvas a ter o tamanho exato da imagem original (importante para as margens baterem)
      canvas.width = baseImage.width;
      canvas.height = baseImage.height;

      // Limpar e desenhar imagem base
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(baseImage, 0, 0);

      const centerX = canvas.width / 2;

      // 1. Desenhar o Nome
      // Margem superior 569px (distância do topo da imagem até o topo do texto)
      // Estilo: Serif, SmallCaps, Cor #5d3f04
      const fontSizeNome = 60; 
      ctx.fillStyle = '#5d3f04';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top'; // Facilita o cálculo da margem superior exata
      ctx.font = `small-caps ${fontSizeNome}px serif`;
      
      // 569px é a margem do topo até o início do texto
      const nomeY = 569;
      ctx.fillText(ingresso.nome_convidado.toUpperCase(), centerX, nomeY);

      // 2. Desenhar o ID
      // 55px de margem top em relação ao nome
      // Tamanho 30px
      const fontSizeId = 30;
      ctx.font = `small-caps ${fontSizeId}px serif`;
      const idY = nomeY + fontSizeNome + 55;
      ctx.fillText(`ID: ${ingresso.id.split('-')[0].toUpperCase()}`, centerX, idY);

      // 3. Desenhar o QR Code
      // Tamanho 419x419, Cor #322305, Sem background
      // Margem topo 769px (distância do topo da imagem até o topo do QR)
      const qrSize = 419;
      const qrY = 769;
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
            <p className="text-sm text-muted-foreground">Processando medidas...</p>
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