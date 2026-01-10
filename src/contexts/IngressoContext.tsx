import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface Ingresso {
  id: string;
  nome_convidado: string;
  qr_code: string;
  entrada_registrada: boolean;
  data_criacao: string;
  data_entrada: string | null;
  usuario_validador: string | null;
}

export type ValidacaoStatus = 'valido' | 'duplicado' | 'invalido';

export interface ResultadoValidacao {
  status: ValidacaoStatus;
  ingresso?: Ingresso;
  mensagem: string;
}

interface IngressoContextType {
  ingressos: Ingresso[];
  criarIngresso: (nomeConvidado: string) => Ingresso;
  validarIngresso: (id: string, validadorId: string) => ResultadoValidacao;
  buscarIngresso: (id: string) => Ingresso | undefined;
}

const IngressoContext = createContext<IngressoContextType | undefined>(undefined);

const STORAGE_KEY = 'ticketSystem_ingressos';

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export function IngressoProvider({ children }: { children: ReactNode }) {
  const [ingressos, setIngressos] = useState<Ingresso[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setIngressos(JSON.parse(saved));
    }
  }, []);

  const saveIngressos = (newIngressos: Ingresso[]) => {
    setIngressos(newIngressos);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newIngressos));
  };

  const criarIngresso = (nomeConvidado: string): Ingresso => {
    const id = generateUUID();
    const novoIngresso: Ingresso = {
      id,
      nome_convidado: nomeConvidado,
      qr_code: id,
      entrada_registrada: false,
      data_criacao: new Date().toISOString(),
      data_entrada: null,
      usuario_validador: null,
    };

    saveIngressos([...ingressos, novoIngresso]);
    return novoIngresso;
  };

  const validarIngresso = (id: string, validadorId: string): ResultadoValidacao => {
    const ingresso = ingressos.find(i => i.id === id || i.qr_code === id);

    if (!ingresso) {
      return {
        status: 'invalido',
        mensagem: 'Ingresso não encontrado no sistema.',
      };
    }

    if (ingresso.entrada_registrada) {
      return {
        status: 'duplicado',
        ingresso,
        mensagem: `Entrada já registrada em ${new Date(ingresso.data_entrada!).toLocaleString('pt-BR')}`,
      };
    }

    // Registrar entrada
    const updatedIngressos = ingressos.map(i => {
      if (i.id === ingresso.id) {
        return {
          ...i,
          entrada_registrada: true,
          data_entrada: new Date().toISOString(),
          usuario_validador: validadorId,
        };
      }
      return i;
    });

    saveIngressos(updatedIngressos);

    return {
      status: 'valido',
      ingresso: { ...ingresso, entrada_registrada: true, data_entrada: new Date().toISOString() },
      mensagem: 'Entrada autorizada com sucesso!',
    };
  };

  const buscarIngresso = (id: string): Ingresso | undefined => {
    return ingressos.find(i => i.id === id || i.qr_code === id);
  };

  return (
    <IngressoContext.Provider value={{ ingressos, criarIngresso, validarIngresso, buscarIngresso }}>
      {children}
    </IngressoContext.Provider>
  );
}

export function useIngressos() {
  const context = useContext(IngressoContext);
  if (context === undefined) {
    throw new Error('useIngressos must be used within an IngressoProvider');
  }
  return context;
}
