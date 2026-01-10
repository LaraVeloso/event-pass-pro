import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useIngressos, ResultadoValidacao as ResultadoType } from '@/contexts/IngressoContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { QRScanner } from '@/components/QRScanner';
import { ResultadoValidacao } from '@/components/ResultadoValidacao';
import { QrCode, Search, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function ValidarIngresso() {
  const [codigoManual, setCodigoManual] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [resultado, setResultado] = useState<ResultadoType | null>(null);
  const { user } = useAuth();
  const { validarIngresso } = useIngressos();
  const { toast } = useToast();

  const handleValidar = async (codigo: string) => {
    if (!codigo.trim()) {
      toast({
        title: 'Campo obrigatório',
        description: 'Digite ou escaneie o código do ingresso.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    setShowScanner(false);

    // Simular delay para UX
    await new Promise(resolve => setTimeout(resolve, 300));

    const result = validarIngresso(codigo.trim(), user?.id || '');
    setResultado(result);
    setCodigoManual('');
    setIsLoading(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleValidar(codigoManual);
  };

  const handleScan = (code: string) => {
    handleValidar(code);
  };

  const handleNovo = () => {
    setResultado(null);
  };

  if (resultado) {
    return (
      <div className="container mx-auto px-4 py-8">
        <ResultadoValidacao resultado={resultado} onNovo={handleNovo} />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-lg">
      {showScanner && (
        <QRScanner onScan={handleScan} onClose={() => setShowScanner(false)} />
      )}

      <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-primary" />
            Validar Ingresso
          </CardTitle>
          <CardDescription>
            Escaneie o QR Code ou digite o código manualmente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Scanner Button */}
          <Button
            onClick={() => setShowScanner(true)}
            className="w-full h-24 text-lg"
            size="lg"
            disabled={isLoading}
          >
            <QrCode className="w-8 h-8 mr-3" />
            Escanear QR Code
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">ou</span>
            </div>
          </div>

          {/* Manual Input */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="codigo">Código do Ingresso</Label>
              <Input
                id="codigo"
                type="text"
                value={codigoManual}
                onChange={(e) => setCodigoManual(e.target.value)}
                placeholder="Cole ou digite o código aqui"
                disabled={isLoading}
              />
            </div>
            <Button type="submit" variant="outline" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Validando...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Validar Manualmente
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
