import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { OrcamentoData, initialOrcamentoData } from '@/types/orcamento';

export interface ProdutoCatalogo {
  id: string;
  nome: string;
  preco_base: number;
}

export function useOrcamentoFunil() {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<OrcamentoData>(initialOrcamentoData);
  const [funilId, setFunilId] = useState<string | null>(null);
  
  const [catalogo, setCatalogo] = useState<ProdutoCatalogo[]>([]);
  const [isLoadingCatalogo, setIsLoadingCatalogo] = useState(true);

  // 1. Busca os produtos na sua tabela 'products' original
  useEffect(() => {
    const fetchProdutos = async () => {
      // (supabase as any) cala a boca do TypeScript para colunas/tabelas novas
      const { data: produtos, error } = await (supabase as any)
        .from('products')
        .select('id, name, base_price')
        .eq('show_on_website', true)
        .order('base_price', { ascending: true });

      if (produtos) {
        // Adaptando os nomes das colunas do seu banco (name) para o front-end (nome)
        const produtosFormatados = produtos.map((p: any) => ({
          id: p.id,
          nome: p.name,
          preco_base: Number(p.base_price)
        }));
        setCatalogo(produtosFormatados);
      } else if (error) {
        console.error('Erro ao buscar produtos:', error);
      }
      setIsLoadingCatalogo(false);
    };
    fetchProdutos();
  }, []);

  // 2. Calcula o valor em tempo real
  useEffect(() => {
    let total = 0;
    const produtoSelecionado = catalogo.find(p => p.nome === data.produto);
    
    if (produtoSelecionado) {
      total += produtoSelecionado.preco_base;
    }

    if (data.adicionais.includes('Manga Longa')) total += 8;
    if (data.adicionais.includes('Manga Longa com Sublimação')) total += 10;
    if (data.adicionais.includes('Manga 3/4')) total += 6;
    if (data.adicionais.includes('Corte Especial')) total += 7;

    if (total > 0) {
      setData(prev => ({ ...prev, valorUnitario: total }));
    }
  }, [data.produto, data.adicionais, catalogo]);

  const updateData = (key: keyof OrcamentoData, value: any) => {
    setData((prev) => ({ ...prev, [key]: value }));
  };

  const persistToDatabase = async (currentStep: number, status: 'PENDENTE' | 'FINALIZADO' = 'PENDENTE') => {
    if (!data.whatsapp || !data.nome) return;

    try {
      const payload = {
        nome: data.nome,
        whatsapp: data.whatsapp,
        etapa_atual: currentStep,
        payload: data,
        status: status,
        updated_at: new Date().toISOString(),
      };

      if (funilId) {
        // Correção definitiva do TypeScript
        await (supabase as any).from('orcamentos_funil').update(payload).eq('id', funilId);
      } else {
        // Correção definitiva do TypeScript
        const { data: newRecord } = await (supabase as any)
          .from('orcamentos_funil')
          .insert([payload])
          .select('id')
          .single();
        
        if (newRecord) setFunilId(newRecord.id);
      }
    } catch (error) {
      console.error('Erro ao salvar no funil:', error);
    }
  };

  const nextStep = () => {
    const next = step + 1;
    setStep(next);
    persistToDatabase(next);
  };

  const prevStep = () => {
    const prev = Math.max(1, step - 1);
    setStep(prev);
  };

  const finalizarPedido = () => {
    persistToDatabase(step, 'FINALIZADO');
    
    const adicionaisTexto = data.adicionais.length > 0 
      ? data.adicionais.join(', ') 
      : 'Nenhum adicional';

    const mensagem = `Olá, meu nome é *${data.nome}* e realizei um orçamento pelo site.\n\n` +
      `*Detalhes do Pedido:*\n` +
      `- *Quantidade:* ${data.quantidade}\n` +
      `- *Modelo:* ${data.produto}\n` +
      `- *Estampa:* ${data.estampa}\n` +
      `- *Malha:* ${data.tecido}\n` +
      `- *Adicionais:* ${adicionaisTexto} | Valor unitário: R$ ${data.valorUnitario.toFixed(2).replace('.', ',')}\n` +
      `- *Prazo de Entrega:* ${data.prazo}`;

    // Atualizado com o WhatsApp do seu print
    const url = `https://wa.me/5583998474211?text=${encodeURIComponent(mensagem)}`;
    window.open(url, '_blank');
  };

  return { step, data, updateData, nextStep, prevStep, finalizarPedido, catalogo, isLoadingCatalogo };
}