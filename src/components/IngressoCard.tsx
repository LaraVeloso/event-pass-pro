import React, { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Ticket, Download, Calendar, CheckCircle, XCircle } from 'lucide-react';
import type { Ingresso } from '@/contexts/IngressoContext';

interface IngressoCardProps {
  ingresso: Ingresso;
  showActions?: boolean;
  onNovo?: () => void;
}

export function IngressoCard({ ingresso, showActions = true, onNovo }: IngressoCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleDownload = () => {
    const printContent = cardRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '', 'width=400,height=600');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Ingresso - ${ingresso.nome_convidado}</title>
          <style>
            body { 
              font-family: system-ui, -apple-system, sans-serif; 
              padding: 20px;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              margin: 0;
              background: #f5f5f5;
            }
            .card {
              background: white;
              border-radius: 16px;
              padding: 32px;
              box-shadow: 0 4px 20px rgba(0,0,0,0.1);
              max-width: 350px;
              text-align: center;
            }
            .header {
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 8px;
              margin-bottom: 24px;
              color: #7c3aed;
            }
            .nome {
              font-size: 24px;
              font-weight: bold;
              margin-bottom: 8px;
              color: #1f2937;
            }
            .id {
              font-size: 12px;
              color: #6b7280;
              margin-bottom: 24px;
              font-family: monospace;
            }
            .qr-container {
              background: white;
              padding: 16px;
              border-radius: 12px;
              display: inline-block;
              margin-bottom: 24px;
            }
            .data {
              font-size: 14px;
              color: #6b7280;
            }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="header">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/>
                <path d="M13 5v2"/>
                <path d="M13 17v2"/>
                <path d="M13 11v2"/>
              </svg>
              <span style="font-weight: 600;">INGRESSO</span>
            </div>
            <div class="nome">${ingresso.nome_convidado}</div>
            <div class="id">ID: ${ingresso.id}</div>
            <div class="qr-container">
              ${document.querySelector(`#qr-${ingresso.id}`)?.outerHTML || ''}
            </div>
            <div class="data">
              Criado em: ${new Date(ingresso.data_criacao).toLocaleDateString('pt-BR')}
            </div>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  return (
    <Card ref={cardRef} className="w-full max-w-sm mx-auto border-border/50 bg-card/80 backdrop-blur-sm overflow-hidden">
      <CardHeader className="text-center bg-primary/5 border-b border-border/50 pb-4">
        <div className="flex items-center justify-center gap-2 text-primary">
          <Ticket className="w-5 h-5" />
          <span className="font-semibold tracking-wide">INGRESSO</span>
        </div>
      </CardHeader>
      <CardContent className="p-6 text-center space-y-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">{ingresso.nome_convidado}</h2>
          <p className="text-xs text-muted-foreground font-mono mt-1">ID: {ingresso.id}</p>
        </div>

        <div className="bg-white p-4 rounded-xl inline-block shadow-sm">
          <QRCodeSVG
            id={`qr-${ingresso.id}`}
            value={ingresso.id}
            size={180}
            level="H"
            includeMargin={false}
          />
        </div>

        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Calendar className="w-4 h-4" />
          <span>Criado em: {new Date(ingresso.data_criacao).toLocaleDateString('pt-BR')}</span>
        </div>

        <Badge
          variant={ingresso.entrada_registrada ? 'secondary' : 'default'}
          className="gap-1"
        >
          {ingresso.entrada_registrada ? (
            <>
              <CheckCircle className="w-3 h-3" />
              Utilizado
            </>
          ) : (
            <>
              <XCircle className="w-3 h-3" />
              Não utilizado
            </>
          )}
        </Badge>

        {showActions && (
          <div className="flex gap-2 pt-4">
            <Button onClick={handleDownload} variant="outline" className="flex-1">
              <Download className="w-4 h-4 mr-2" />
              Baixar/Imprimir
            </Button>
            {onNovo && (
              <Button onClick={onNovo} className="flex-1">
                Criar Novo
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
