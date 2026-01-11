import React, { useRef, useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
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
      // 1. Carregar a imagem base
      const baseImage = new Image();
      baseImage.src = '/src/images/MOCK.png';
      
      await new Promise((resolve, reject) => {
        baseImage.onload = resolve;
        baseImage.onerror = () => reject(new Error('Não foi possível carregar a imagem base MOCK.png'));
      });

      // Configurar tamanho do canvas baseado na imagem
      canvas.width = baseImage.width;
      canvas.height = baseImage.height;

      // Desenhar imagem base
      ctx.drawImage(baseImage, 0, 0);

      // 2. Configurar e desenhar o Nome
      // Margem superior 569px, Margens laterais 283px
      // Estilo: Serif, SmallCaps, Cor #5d3f04
      ctx.fillStyle = '#5d3f04';
      ctx.textAlign = 'center';
      ctx.font = 'small-caps 60px serif'; // Tamanho estimado para o nome
      
      const centerX = canvas.width / 2;
      const nomeY = 569 + 45; // 569 é o topo, adicionamos um offset para a linha de base
      ctx.fillText(ingresso.nome_convidado.toUpperCase(), centerX, nomeY);

      // 3. Configurar e desenhar o ID
      // Abaixo do nome, 55px de margem top, tamanho 30px
      ctx.font = 'small-caps 30px serif';
      const idY = nomeY + 55;
      ctx.fillText(`ID: ${ingresso.id.split('-')[0].toUpperCase()}`, centerX, idY);

      // 4. Gerar e desenhar o QR Code
      // Tamanho 419x419, Cor #322305, Sem background
      // Margem topo 769px, Margem bottom 162px
      const qrSize = 419;
      const qrY = 769;
      const qrX = (canvas.width - qrSize) / 2;

      // Para desenhar o QR Code no canvas, precisamos dele como imagem
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
      {/* QR Code oculto usado para gerar a imagem do Canvas */}
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

      <div className="relative border rounded-xl overflow-hidden bg-muted aspect-[3/4] w-full max-w-[400px] flex items-center justify-center">
        {isGenerating && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 z-10">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
            <p className="text-sm text-muted-foreground">Gerando ingresso...</p>
          </div>
        )}
        
        {error ? (
          <div className="p-6 text-center">
            <p className="text-destructive text-sm">{error}</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={generateTicket}>
              Tentar Novamente
            </Button>
          </div>
        ) : (
          <canvas 
            ref={canvasRef} 
            className="max-w-full h-auto shadow-lg"
            style={{ display: isGenerating ? 'none' : 'block' }}
          />
        )}
      </div>

      {!isGenerating && !error && (
        <Button onClick={handleDownload} className="w-full">
          <Download className="w-4 h-4 mr-2" />
          Baixar Ingresso Personalizado
        </Button>
      )}
    </div>
  );
}