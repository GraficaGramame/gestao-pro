'use client';

import { useOrcamentoFunil } from '@/hooks/useOrcamentoFunil';

export default function OrcamentoWizard() {
  const { 
    step, data, updateData, updateSelection, toggleMultipleSelection, 
    nextStep, prevStep, finalizarPedido, catalogo, isLoadingCatalogo 
  } = useOrcamentoFunil();

  const produtoSelecionado = catalogo.find(p => p.id === data.produto_id);
  const wizardConfig = produtoSelecionado?.wizard_config;
  const minQty = wizardConfig?.min_quantity || 1;

  // Constrói o array de passos baseado na configuração
  const flow = ['contact', 'product', 'quantity'];
  if (wizardConfig?.steps) {
    wizardConfig.steps.forEach(s => flow.push(`dynamic_${s.id}`));
  }
  flow.push('review');

  const currentFlowStep = flow[step - 1];
  const totalSteps = flow.length;

  const renderStep = () => {
    if (isLoadingCatalogo) {
      return <div className="text-center p-10 text-stone-500 font-medium animate-pulse">Carregando produtos...</div>;
    }

    if (currentFlowStep === 'contact') {
      return (
        <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4">
          <div className="text-center">
            <h2 className="text-3xl font-black text-stone-900 tracking-tight">Que bom que você fez contato!</h2>
            <h3 className="text-xl font-bold text-stone-700 mt-2">Será uma alegria estampar as suas ideias</h3>
            <p className="text-stone-500 mt-4 text-sm">Informe os dados abaixo para iniciar o orçamento de seu pedido</p>
          </div>
          
          <div className="space-y-4 mt-2">
            <input 
              type="text" 
              placeholder="Seu Nome completo" 
              value={data.nome}
              onChange={(e) => updateData('nome', e.target.value)}
              className="w-full p-4 rounded-2xl bg-white border-2 border-stone-200 text-stone-900 focus:border-[#F6C689] focus:ring-4 focus:ring-[#F6C689]/20 outline-none transition-all placeholder:text-stone-400"
            />
            <input 
              type="tel" 
              placeholder="Seu WhatsApp (ex: 83999999999)" 
              value={data.whatsapp}
              onChange={(e) => updateData('whatsapp', e.target.value)}
              className="w-full p-4 rounded-2xl bg-white border-2 border-stone-200 text-stone-900 focus:border-[#F6C689] focus:ring-4 focus:ring-[#F6C689]/20 outline-none transition-all placeholder:text-stone-400"
            />
          </div>
          
          <button 
            onClick={nextStep}
            disabled={!data.nome || data.whatsapp.length < 10}
            className="mt-6 w-full py-4 bg-[#F8D299] hover:bg-[#f5c37a] disabled:opacity-50 disabled:cursor-not-allowed text-stone-900 font-black rounded-2xl uppercase tracking-widest transition-all shadow-sm"
          >
            Fazer Orçamento Agora →
          </button>
        </div>
      );
    }

    if (currentFlowStep === 'product') {
      return (
        <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-right-4">
          <div className="text-center mb-4">
            <h2 className="text-2xl font-black text-stone-900">Qual produto deseja?</h2>
            <p className="text-stone-500 mt-2 text-sm">Escolha o produto que melhor atende sua necessidade</p>
          </div>
          
          {catalogo.length === 0 ? (
            <p className="text-center text-red-500 text-sm">Nenhum produto marcado para o site no banco de dados.</p>
          ) : (
            catalogo.map((produto) => (
              <button
                key={produto.id}
                onClick={() => {
                  updateData('produto_id', produto.id);
                  updateData('produto_nome', produto.nome);
                  updateData('selections', {}); // Reseta seleções
                  updateData('quantidade', produto.wizard_config?.min_quantity || 1);
                  nextStep();
                }}
                className={`w-full p-5 rounded-2xl border-2 text-left transition-all ${
                  data.produto_id === produto.id ? 'bg-[#EAF5F0] border-[#F6C689] shadow-sm' : 'bg-white border-stone-100 hover:border-stone-300'
                }`}
              >
                <span className={`font-bold text-lg ${data.produto_id === produto.id ? 'text-stone-900' : 'text-stone-700'}`}>{produto.nome}</span>
              </button>
            ))
          )}
          <button onClick={prevStep} className="mt-4 py-4 text-stone-400 hover:text-stone-600 font-bold uppercase tracking-widest text-sm">← Voltar</button>
        </div>
      );
    }

    if (currentFlowStep === 'quantity') {
        const tiers = wizardConfig?.quantity_tiers || [];
  
        return (
          <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-right-4">
            <div className="text-center mb-4">
              <h2 className="text-2xl font-black text-stone-900">Qual a quantidade?</h2>
              <p className="text-stone-500 mt-2 text-sm">A quantidade mínima para este produto é de <strong>{minQty} unidades</strong></p>
            </div>
            
            <input 
              type="number"
              min={minQty}
              value={data.quantidade}
              onChange={(e) => updateData('quantidade', parseInt(e.target.value) || minQty)}
              className="w-full p-6 text-center text-4xl font-black rounded-2xl bg-white border-2 border-stone-200 text-[#F6C689] focus:border-[#F6C689] focus:ring-4 focus:ring-[#F6C689]/20 outline-none transition-all"
            />
  
            {/* NOVO BLOCO CTA: Tabela de Descontos Progressivos */}
            {tiers.length > 0 && (
              <div className="mt-2 bg-[#EAF5F0] border border-[#25D366]/30 p-5 rounded-2xl shadow-sm">
                <p className="text-[11px] font-black uppercase tracking-widest text-[#20bd5a] mb-3 flex items-center gap-2">
                  <span className="text-base">🔥</span> Descontos por Volume
                </p>
                <div className="space-y-2">
                  {tiers.map((tier, idx) => {
                    // Destaca a faixa atual que o cliente atingiu com base no que ele digitou
                    const atingiuFaixa = data.quantidade >= tier.min && (tier.max === null || data.quantidade <= tier.max);
                    
                    return (
                      <div key={idx} className={`flex justify-between items-center text-sm p-2 rounded-lg transition-colors ${atingiuFaixa ? 'bg-[#25D366]/10' : ''}`}>
                        <span className={`font-medium ${atingiuFaixa ? 'text-stone-900 font-bold' : 'text-stone-600'}`}>
                          {tier.max ? `De ${tier.min} a ${tier.max} unidades` : `Acima de ${tier.min} unidades`}
                        </span>
                        <span className={`font-black ${atingiuFaixa ? 'text-[#20bd5a] scale-110 transition-transform' : 'text-[#20bd5a]'}`}>
                          {tier.discount_percentage}% OFF
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
  
            <div className="flex gap-4 mt-4">
              <button onClick={prevStep} className="px-6 py-4 rounded-2xl border-2 border-stone-200 text-stone-500 font-bold uppercase tracking-widest text-sm hover:bg-stone-50 transition-all">Voltar</button>
              <button 
                onClick={nextStep} 
                disabled={data.quantidade < minQty}
                className="flex-1 py-4 bg-[#F8D299] hover:bg-[#f5c37a] disabled:opacity-50 text-stone-900 shadow-sm font-black rounded-2xl uppercase tracking-widest transition-all"
              >
                Continuar →
              </button>
            </div>
          </div>
        );
      }

    // Passos Dinâmicos (Tecido, Adicionais, etc)
    if (currentFlowStep.startsWith('dynamic_')) {
      const stepId = currentFlowStep.replace('dynamic_', '');
      const wizardStep = wizardConfig?.steps.find(s => s.id === stepId);
      
      if (!wizardStep) return null;

      return (
        <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-right-4">
          <div className="text-center mb-4">
            <h2 className="text-2xl font-black text-stone-900">{wizardStep.title}</h2>
            <p className="text-stone-500 mt-2 text-sm">{wizardStep.subtitle}</p>
          </div>
          
          {wizardStep.type === 'single' ? (
            // Botões de Seleção Única
            wizardStep.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => {
                  updateSelection(stepId, opt.label);
                  nextStep();
                }}
                className={`w-full p-5 rounded-2xl border-2 text-left flex justify-between items-center transition-all ${
                  data.selections[stepId] === opt.label ? 'bg-[#EAF5F0] border-[#F6C689] shadow-sm text-stone-900' : 'bg-white border-stone-100 text-stone-700 hover:border-stone-300'
                }`}
              >
                <span className="font-bold text-lg">{opt.label}</span>
                {opt.price_modifier > 0 && <span className="text-xs font-bold text-stone-400">+R$ {opt.price_modifier.toFixed(2).replace('.', ',')}</span>}
              </button>
            ))
          ) : (
            // Checkboxes de Múltipla Escolha
            <div className="space-y-4">
              {wizardStep.options.map((opt, i) => {
                const isSelected = ((data.selections[stepId] as string[]) || []).includes(opt.label);
                return (
                  <label
                    key={i}
                    className={`w-full p-5 rounded-2xl border-2 text-left flex justify-between items-center cursor-pointer transition-all ${
                      isSelected ? 'bg-[#EAF5F0] border-[#F6C689] shadow-sm text-stone-900' : 'bg-white border-stone-100 text-stone-700 hover:border-stone-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input 
                        type="checkbox" 
                        checked={isSelected}
                        onChange={() => toggleMultipleSelection(stepId, opt.label)}
                        className="w-5 h-5 accent-[#F6C689]"
                      />
                      <span className="font-bold text-lg">{opt.label}</span>
                    </div>
                    {opt.price_modifier > 0 && <span className="text-xs font-bold text-stone-400">+R$ {opt.price_modifier.toFixed(2).replace('.', ',')}</span>}
                  </label>
                );
              })}
              
              <div className="flex gap-4 mt-6">
                <button onClick={prevStep} className="px-6 py-4 rounded-2xl border-2 border-stone-200 text-stone-500 font-bold uppercase tracking-widest text-sm hover:bg-stone-50 transition-all">Voltar</button>
                <button onClick={nextStep} className="flex-1 py-4 bg-[#F8D299] hover:bg-[#f5c37a] text-stone-900 shadow-sm font-black rounded-2xl uppercase tracking-widest transition-all">Continuar →</button>
              </div>
            </div>
          )}

          {wizardStep.type === 'single' && (
            <button onClick={prevStep} className="mt-4 py-4 text-stone-400 hover:text-stone-600 font-bold uppercase tracking-widest text-sm">← Voltar</button>
          )}
        </div>
      );
    }

    if (currentFlowStep === 'review') {
      return (
        <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-right-4">
          <div className="bg-[#fcf8f2] p-6 rounded-3xl border border-[#f5e3cc] text-center mb-2 shadow-sm">
             <p className="text-stone-500 text-sm font-medium">Valor Total Estimado</p>
             <p className="text-5xl font-black text-[#F6C689] mt-2">R$ {data.valorTotal.toFixed(2).replace('.', ',')}</p>
             <p className="text-stone-400 text-xs mt-1">R$ {data.valorUnitario.toFixed(2).replace('.', ',')} por unidade</p>
          </div>

          <div className="bg-white rounded-3xl border border-stone-200 divide-y divide-stone-100 shadow-sm overflow-hidden">
             <div className="p-5 flex flex-col gap-1">
               <span className="text-[11px] font-bold text-stone-400 uppercase tracking-widest">Cliente</span>
               <span className="text-stone-800 font-bold text-lg">{data.nome}</span>
               <span className="text-stone-600">{data.whatsapp}</span>
             </div>
             
             <div className="p-5 flex flex-col gap-1 bg-stone-50">
               <span className="text-[11px] font-bold text-stone-400 uppercase tracking-widest">Resumo do Pedido</span>
               <span className="text-stone-800 font-black text-lg">{data.quantidade}x {data.produto_nome}</span>
               
               {wizardConfig?.steps.map(s => {
                 const sel = data.selections[s.id];
                 if (!sel || sel.length === 0) return null;
                 const text = Array.isArray(sel) ? sel.join(', ') : sel;
                 return <span key={s.id} className="text-stone-600 mt-1">• {s.title}: {text}</span>;
               })}
             </div>

             {wizardConfig?.base_production_days && (
               <div className="p-5 flex flex-col gap-1 bg-stone-50">
                 <span className="text-[11px] font-bold text-stone-400 uppercase tracking-widest">Prazo de Produção Base</span>
                 <span className="text-stone-800 font-bold">{wizardConfig.base_production_days} dias úteis</span>
               </div>
             )}
          </div>
          
          <div className="flex gap-4 mt-6">
            <button onClick={prevStep} className="px-6 py-4 rounded-2xl border-2 border-stone-200 text-stone-500 font-bold uppercase tracking-widest text-sm hover:bg-stone-50 transition-all">Voltar</button>
            <button onClick={finalizarPedido} className="flex-1 py-4 bg-[#25D366] hover:bg-[#20bd5a] text-white shadow-md font-black rounded-2xl uppercase tracking-widest flex items-center justify-center gap-2 transition-all">
               <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
               Fechar Pedido
            </button>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col items-center p-4 sm:p-6 pb-24 font-sans text-stone-900">
      <div className="w-full max-w-md pt-6">
        
        {/* Header - Branding */}
        <div className="flex justify-center mb-8">
          <div className="px-5 py-2.5 bg-white border border-stone-200 shadow-sm rounded-full flex items-center gap-3">
             <span className="w-2.5 h-2.5 rounded-full bg-[#F6C689] animate-pulse"></span>
             <span className="text-[11px] font-black text-stone-600 uppercase tracking-widest">Orçamento Online</span>
          </div>
        </div>

        {/* Wizard Steps Dinâmico */}
        <div className="flex justify-between mb-10 px-2 relative">
          <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-stone-200 -z-10 -translate-y-1/2"></div>
          
          {[...Array(totalSteps)].map((_, i) => {
            const s = i + 1;
            return (
              <div 
                key={s} 
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all shadow-sm ${
                  step === s ? 'bg-[#25D366] text-white scale-110 ring-4 ring-[#25D366]/20' : 
                  step > s ? 'bg-[#25D366] text-white' : 
                  'bg-white text-stone-400 border border-stone-200'
                }`}
              >
                {step > s ? '✓' : s}
              </div>
            );
          })}
        </div>
        
        {renderStep()}

      </div>
    </div>
  );
}