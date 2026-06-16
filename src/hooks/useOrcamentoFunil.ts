import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { OrcamentoData, initialOrcamentoData } from '@/types';
import { WizardConfig } from '@/types';

export interface ProdutoCatalogo {
  id: string;
  nome: string;
  preco_base: number;
  wizard_config: WizardConfig | null;
}

export function useOrcamentoFunil() {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<OrcamentoData>(initialOrcamentoData);
  const [funilId, setFunilId] = useState<string | null>(null);
  
  const [catalogo, setCatalogo] = useState<ProdutoCatalogo[]>([]);
  const [isLoadingCatalogo, setIsLoadingCatalogo] = useState(true);

  useEffect(() => {
    const fetchProdutos = async () => {
      const { data: produtos, error } = await (supabase as any)
        .from('products')
        .select('id, name, base_price, wizard_config')
        .eq('show_on_website', true)
        .order('base_price', { ascending: true });

      if (produtos) {
        const produtosFormatados = produtos.map((p: any) => ({
          id: p.id,
          nome: p.name,
          preco_base: Number(p.base_price),
          wizard_config: p.wizard_config
        }));
        setCatalogo(produtosFormatados);
      } else if (error) {
        console.error('Erro ao buscar produtos:', error);
      }
      setIsLoadingCatalogo(false);
    };
    fetchProdutos();
  }, []);

  useEffect(() => {
    if (!data.produto_id) return;
    
    const produtoSelecionado = catalogo.find(p => p.id === data.produto_id);
    if (!produtoSelecionado) return;

    let base = produtoSelecionado.preco_base;
    let modifiers = 0;

    const config = produtoSelecionado.wizard_config;
    
    if (config && config.steps) {
      config.steps.forEach(wizardStep => {
        const selection = data.selections[wizardStep.id];
        if (!selection) return;

        if (wizardStep.type === 'single' && typeof selection === 'string') {
          const option = wizardStep.options.find(o => o.label === selection);
          if (option) modifiers += option.price_modifier || 0;
        } else if (wizardStep.type === 'multiple' && Array.isArray(selection)) {
          selection.forEach(selLabel => {
            const option = wizardStep.options.find(o => o.label === selLabel);
            if (option) modifiers += option.price_modifier || 0;
          });
        }
      });
    }

    let unitPrice = base + modifiers;
    
    if (config && config.quantity_tiers && config.quantity_tiers.length > 0) {
      const qty = data.quantidade;
      const applicableTier = config.quantity_tiers.find(tier => {
        const isAboveMin = qty >= tier.min;
        const isBelowMax = tier.max === null || qty <= tier.max;
        return isAboveMin && isBelowMax;
      });

      if (applicableTier) {
        const discountAmount = unitPrice * (applicableTier.discount_percentage / 100);
        unitPrice -= discountAmount;
      }
    }

    let totalPrice = unitPrice * data.quantidade;

    // NOVO: Aplica a Taxa de Arte (Uma única vez no valor total do pedido)
    if (config?.has_art_module && data.precisa_arte === true && config.art_fee) {
       totalPrice += config.art_fee;
    }

    setData(prev => ({ 
      ...prev, 
      valorUnitario: unitPrice,
      valorTotal: totalPrice
    }));
  }, [data.produto_id, data.selections, data.quantidade, data.precisa_arte, catalogo]);

  const updateData = (key: keyof OrcamentoData, value: any) => {
    setData((prev) => ({ ...prev, [key]: value }));
  };

  const updateSelection = (stepId: string, value: string | string[]) => {
    setData((prev) => ({
      ...prev,
      selections: {
        ...prev.selections,
        [stepId]: value
      }
    }));
  };

  const toggleMultipleSelection = (stepId: string, label: string) => {
    const currentSelections = (data.selections[stepId] as string[]) || [];
    if (currentSelections.includes(label)) {
      updateSelection(stepId, currentSelections.filter(l => l !== label));
    } else {
      updateSelection(stepId, [...currentSelections, label]);
    }
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
        await (supabase as any).from('orcamentos_funil').update(payload).eq('id', funilId);
      } else {
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
    
    const produtoSelecionado = catalogo.find(p => p.id === data.produto_id);
    const config = produtoSelecionado?.wizard_config;

    let details = `- *Produto:* ${data.produto_nome}\n`;
    details += `- *Quantidade:* ${data.quantidade}\n`;
    
    if (config?.steps) {
      config.steps.forEach(s => {
        const sel = data.selections[s.id];
        if (sel && sel.length > 0) {
          const val = Array.isArray(sel) ? sel.join(', ') : sel;
          details += `- *${s.title}:* ${val}\n`;
        }
      });
    }

    // NOVO: Adiciona a resposta da arte no resumo do WhatsApp
    if (config?.has_art_module) {
      if (data.precisa_arte) {
        details += `- *Arte:* Cliente precisa de Criação (+R$ ${config.art_fee?.toFixed(2).replace('.', ',')})\n`;
      } else {
        details += `- *Arte:* Cliente enviará o arquivo pronto nos padrões.\n`;
      }
    }

    if (config?.base_production_days) {
      details += `- *Prazo Base:* ${config.base_production_days} dias úteis\n`;
    }
    
    details += `\n*Financeiro:*\n`;
    details += `- *Valor Unitário:* R$ ${data.valorUnitario.toFixed(2).replace('.', ',')}\n`;
    details += `- *Valor Total:* R$ ${data.valorTotal.toFixed(2).replace('.', ',')}\n`;
    
    const mensagem = `Olá, meu nome é *${data.nome}* e realizei um orçamento pelo site.\n\n*Detalhes do Pedido:*\n${details}`;
    const url = `https://wa.me/5583998474211?text=${encodeURIComponent(mensagem)}`;
    window.open(url, '_blank');
  };

  return { 
    step, 
    data, 
    updateData, 
    updateSelection,
    toggleMultipleSelection,
    nextStep, 
    prevStep, 
    finalizarPedido, 
    catalogo, 
    isLoadingCatalogo 
  };
}