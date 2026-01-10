import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';

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
  criarIngresso: (nomeConvidado: string) => Promise<Ingresso | null>;
  validarIngresso: (id: string) => Promise<ResultadoValidacao>;
  buscarIngresso: (id: string) => Promise<Ingresso | null>;
  refreshIngressos: () => Promise<void>;
}

const IngressoContext = createContext<IngressoContextType | undefined>(undefined);

export function IngressoProvider({ children }: { children: ReactNode }) {
  const [ingressos, setIngressos] = useState<Ingresso[]>([]);
  const { user } = useAuth();

  const refreshIngressos = async () => {
    const { data, error } = await supabase
      .from('ingressos')
      .select('*')
      .order('data_criacao', { ascending: false });

    if (!error && data) {
      setIngressos(data as Ingresso[]);
    }
  };

  useEffect(() => {
    if (user) refreshIngressos();
  }, [user]);

  const criarIngresso = async (nomeConvidado: string): Promise<Ingresso | null> => {
    const id = crypto.randomUUID();
    const novoIngresso = {
      nome_convidado: nomeConvidado,
      qr_code: id,
      criado_por: user?.id,
    };

    const { data, error } = await supabase
      .from('ingressos')
      .insert([novoIngresso])
      .select()
      .single();

    if (error) throw error;
    
    await refreshIngressos();
    return data as Ingresso;
  };

  const validarIngresso = async (codigo: string): Promise<ResultadoValidacao> => {
    const { data: ingresso, error } = await supabase
      .from('ingressos')
      .select('*')
      .or(`id.eq.${codigo},qr_code.eq.${codigo}`)
      .maybeSingle();

    if (error || !ingresso) {
      return {
        status: 'invalido',
        mensagem: 'Ingresso não encontrado no sistema.',
      };
    }

    if (ingresso.entrada_registrada) {
      return {
        status: 'duplicado',
        ingresso: ingresso as Ingresso,
        mensagem: `Entrada já registrada em ${new Date(ingresso.data_entrada!).toLocaleString('pt-BR')}`,
      };
    }

    const { data: updated, error: updateError } = await supabase
      .from('ingressos')
      .update({
        entrada_registrada: true,
        data_entrada: new Date().toISOString(),
        usuario_validador: user?.id,
      })
      .eq('id', ingresso.id)
      .select()
      .single();

    if (updateError) throw updateError;

    await refreshIngressos();

    return {
      status: 'valido',
      ingresso: updated as Ingresso,
      mensagem: 'Entrada autorizada com sucesso!',
    };
  };

  const buscarIngresso = async (id: string): Promise<Ingresso | null> => {
    const { data } = await supabase
      .from('ingressos')
      .select('*')
      .or(`id.eq.${id},qr_code.eq.${id}`)
      .maybeSingle();
    return data as Ingresso;
  };

  return (
    <IngressoContext.Provider value={{ ingressos, criarIngresso, validarIngresso, buscarIngresso, refreshIngressos }}>
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