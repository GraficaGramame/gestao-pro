'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { WizardConfig, WizardStep, WizardOption, QuantityTier } from '@/types';
import { useAuth } from '@/components/auth/auth-provider';

interface WizardBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: any | null; 
  onSaveSuccess: () => void; 
}

const defaultConfig: WizardConfig & { min_quantity?: number } = {
  base_production_days: 15,
  min_quantity: 1,
  has_art_module: false,
  art_fee: 50.00,
  art_rules: '• Enviar arquivo em PDF (curvas) ou PNG sem fundo.\n• Resolução mínima de 300dpi.\n• Padrão de cor CMYK.',
  steps: [],
  quantity_tiers: []
};

export default function WizardBuilderModal({ isOpen, onClose, product, onSaveSuccess }: WizardBuilderModalProps) {
  const { tenantId } = useAuth();
  const [config, setConfig] = useState<WizardConfig & { min_quantity?: number }>(defaultConfig);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen && product) {
      setConfig({ ...defaultConfig, ...(product.wizard_config || {}) });
    }
  }, [isOpen, product]);

  if (!isOpen || !product) return null;

  const handleSave = async () => {
    if (!tenantId) return;
    setIsSaving(true);
    
    try {
      const { error } = await (supabase as any)
        .from('products')
        .update({ wizard_config: config })
        .eq('id', product.id)
        .eq('tenant_id', tenantId);

      if (error) throw error;
      
      onSaveSuccess();
      onClose();
    } catch (error) {
      console.error('Erro ao salvar configuração do funil:', error);
      alert('Erro ao salvar as configurações. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const addStep = () => {
    setConfig({
      ...config,
      steps: [
        ...config.steps,
        { id: `step_${Date.now()}`, title: 'Novo Passo', subtitle: '', type: 'single', options: [] }
      ]
    });
  };

  const removeStep = (index: number) => {
    const newSteps = [...config.steps];
    newSteps.splice(index, 1);
    setConfig({ ...config, steps: newSteps });
  };

  const updateStep = (index: number, field: keyof WizardStep, value: any) => {
    const newSteps = [...config.steps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    setConfig({ ...config, steps: newSteps });
  };

  const addOption = (stepIndex: number) => {
    const newSteps = [...config.steps];
    newSteps[stepIndex].options.push({ label: 'Nova Opção', price_modifier: 0 });
    setConfig({ ...config, steps: newSteps });
  };

  const removeOption = (stepIndex: number, optionIndex: number) => {
    const newSteps = [...config.steps];
    newSteps[stepIndex].options.splice(optionIndex, 1);
    setConfig({ ...config, steps: newSteps });
  };

  const updateOption = (stepIndex: number, optionIndex: number, field: keyof WizardOption, value: any) => {
    const newSteps = [...config.steps];
    newSteps[stepIndex].options[optionIndex] = { ...newSteps[stepIndex].options[optionIndex], [field]: value };
    setConfig({ ...config, steps: newSteps });
  };

  const addTier = () => {
    setConfig({
      ...config,
      quantity_tiers: [
        ...config.quantity_tiers,
        { min: 1, max: null, discount_percentage: 0 }
      ]
    });
  };

  const removeTier = (index: number) => {
    const newTiers = [...config.quantity_tiers];
    newTiers.splice(index, 1);
    setConfig({ ...config, quantity_tiers: newTiers });
  };

  const updateTier = (index: number, field: keyof QuantityTier, value: any) => {
    const newTiers = [...config.quantity_tiers];
    newTiers[index] = { ...newTiers[index], [field]: value };
    setConfig({ ...config, quantity_tiers: newTiers });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
          <div>
            <h2 className="text-xl font-black text-green-500 tracking-tighter uppercase">Construtor de Funil</h2>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">
              Produto: <span className="text-slate-200">{product.name}</span>
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-500 hover:text-white transition-colors bg-slate-900 rounded-xl border border-slate-800">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
          
          <section className="bg-slate-950 p-5 rounded-2xl border border-slate-800">
            <h3 className="text-sm font-black text-slate-300 uppercase tracking-widest mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              Configurações Gerais
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 block">Quantidade Mínima</label>
                <input
                  type="number" 
                  min="1"
                  value={config.min_quantity || 1}
                  onChange={(e) => setConfig({ ...config, min_quantity: Number(e.target.value) })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-sm font-bold text-green-500 outline-none focus:border-green-500"
                  title="O cliente não poderá pedir menos que este valor."
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 block">Prazo Base (Dias Úteis)</label>
                <input
                  type="number" 
                  min="0"
                  value={config.base_production_days}
                  onChange={(e) => setConfig({ ...config, base_production_days: Number(e.target.value) })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-sm font-bold text-slate-200 outline-none focus:border-green-500"
                />
              </div>
            </div>
          </section>

          {/* NOVO: SEÇÃO DE ARTE */}
          <section className="bg-slate-950 p-5 rounded-2xl border border-slate-800">
             <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-black text-slate-300 uppercase tracking-widest flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-pink-500"></span>
                  Módulo de Criação de Arte
                </h3>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={config.has_art_module} 
                    onChange={(e) => setConfig({ ...config, has_art_module: e.target.checked })}
                    className="w-5 h-5 rounded border-slate-700 bg-slate-900 accent-pink-500"
                  />
                  <span className="text-xs font-black uppercase tracking-widest text-slate-400">Ativar Módulo</span>
                </label>
             </div>

             {config.has_art_module && (
               <div className="grid grid-cols-1 gap-4 mt-4 animate-in fade-in slide-in-from-top-2">
                 <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 block">Taxa Fixa de Criação (R$)</label>
                    <input
                      type="number" 
                      step="0.01"
                      value={config.art_fee || 0}
                      onChange={(e) => setConfig({ ...config, art_fee: Number(e.target.value) })}
                      className="w-full sm:w-1/3 bg-slate-900 border border-slate-800 rounded-xl p-3 text-sm font-mono font-bold text-pink-500 outline-none focus:border-pink-500"
                      title="Valor somado no total do pedido caso o cliente precise de ajuda."
                    />
                 </div>
                 <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 block">Regras de Envio (Exibidas p/ quem já tem a arte)</label>
                    <textarea
                      rows={4}
                      value={config.art_rules || ''}
                      onChange={(e) => setConfig({ ...config, art_rules: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-sm text-slate-300 outline-none focus:border-pink-500 resize-none"
                      placeholder="Ex: Enviar em PDF em curvas..."
                    />
                 </div>
               </div>
             )}
          </section>

          <section className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-black text-slate-300 uppercase tracking-widest flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                Etapas do Orçamento
              </h3>
              <button onClick={addStep} className="px-4 py-2 bg-purple-500/10 text-purple-400 border border-purple-500/30 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-purple-500 hover:text-white transition-all">
                + Adicionar Etapa
              </button>
            </div>

            {config.steps.length === 0 && (
              <div className="text-center p-8 bg-slate-950 border border-slate-800 border-dashed rounded-2xl text-slate-500 text-xs font-bold uppercase tracking-widest">
                Nenhuma etapa configurada. Clique em Adicionar Etapa para começar.
              </div>
            )}

            {config.steps.map((step, sIndex) => (
              <div key={step.id} className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4 relative group">
                <button onClick={() => removeStep(sIndex)} className="absolute top-4 right-4 text-slate-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                </button>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 block">Título da Etapa</label>
                    <input type="text" value={step.title} onChange={(e) => updateStep(sIndex, 'title', e.target.value)} placeholder="Ex: Tipo de Tecido" className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-sm font-bold text-slate-200 outline-none focus:border-purple-500" />
                  </div>
                  <div className="sm:col-span-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 block">Subtítulo explicativo</label>
                    <input type="text" value={step.subtitle} onChange={(e) => updateStep(sIndex, 'subtitle', e.target.value)} placeholder="Ex: Escolha a malha" className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 outline-none focus:border-purple-500" />
                  </div>
                  <div className="sm:col-span-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 block">Comportamento</label>
                    <select value={step.type} onChange={(e) => updateStep(sIndex, 'type', e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-sm font-bold text-slate-200 outline-none focus:border-purple-500 appearance-none">
                      <option value="single">Escolha Única (Botões)</option>
                      <option value="multiple">Múltipla Escolha (Checkboxes)</option>
                    </select>
                  </div>
                </div>

                <div className="pl-4 border-l-2 border-slate-800 space-y-2 mt-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Opções disponíveis</span>
                    <button onClick={() => addOption(sIndex)} className="text-[10px] font-black uppercase text-green-500 hover:text-green-400">
                      + Add Opção
                    </button>
                  </div>
                  
                  {step.options.map((option, oIndex) => (
                    <div key={oIndex} className="flex gap-2 items-center">
                      <input type="text" value={option.label} onChange={(e) => updateOption(sIndex, oIndex, 'label', e.target.value)} placeholder="Nome da opção" className="flex-1 bg-slate-900 border border-slate-800 rounded-lg p-2 text-sm text-slate-200 outline-none focus:border-green-500" />
                      <div className="relative w-32">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-black">R$</span>
                        <input type="number" step="0.01" value={option.price_modifier} onChange={(e) => updateOption(sIndex, oIndex, 'price_modifier', Number(e.target.value))} placeholder="0.00" className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 pl-7 text-sm font-mono text-green-500 outline-none focus:border-green-500" />
                      </div>
                      <button onClick={() => removeOption(sIndex, oIndex)} className="p-2 text-slate-600 hover:text-red-500 bg-slate-900 rounded-lg border border-slate-800">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </section>

          <section className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-black text-slate-300 uppercase tracking-widest flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                Descontos por Volume (Quantidade)
              </h3>
              <button onClick={addTier} className="px-4 py-2 bg-orange-500/10 text-orange-400 border border-orange-500/30 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-orange-500 hover:text-white transition-all">
                + Adicionar Faixa
              </button>
            </div>
            
            {config.quantity_tiers.length === 0 && (
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Sem descontos progressivos configurados.</p>
            )}

            {config.quantity_tiers.map((tier, tIndex) => (
              <div key={tIndex} className="flex gap-4 items-center bg-slate-900 p-3 rounded-xl border border-slate-800">
                <div className="flex-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1 block">Mínimo (Und)</label>
                  <input type="number" value={tier.min} onChange={(e) => updateTier(tIndex, 'min', Number(e.target.value))} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-slate-200 outline-none focus:border-orange-500" />
                </div>
                <div className="flex-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1 block">Máximo (Und)</label>
                  <input type="number" value={tier.max || ''} onChange={(e) => updateTier(tIndex, 'max', e.target.value ? Number(e.target.value) : null)} placeholder="Vazio = Infinito" className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-slate-200 outline-none focus:border-orange-500" />
                </div>
                <div className="flex-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1 block">Desconto (%)</label>
                  <input type="number" step="0.1" value={tier.discount_percentage} onChange={(e) => updateTier(tIndex, 'discount_percentage', Number(e.target.value))} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm font-mono text-green-500 outline-none focus:border-orange-500" />
                </div>
                <button onClick={() => removeTier(tIndex)} className="mt-5 p-2 text-slate-600 hover:text-red-500 bg-slate-950 rounded-lg border border-slate-800">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
              </div>
            ))}
          </section>
        </div>

        <div className="p-6 border-t border-slate-800 bg-slate-950/50 flex justify-end gap-4">
          <button onClick={onClose} className="px-6 py-3 bg-slate-900 text-slate-400 rounded-xl font-black uppercase text-xs tracking-widest border border-slate-800 hover:text-white transition-all">
            Cancelar
          </button>
          <button onClick={handleSave} disabled={isSaving} className="px-8 py-3 bg-green-500 text-slate-950 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-green-400 hover:scale-[1.02] transition-all shadow-[0_0_20px_rgba(34,197,94,0.2)] disabled:opacity-50">
            {isSaving ? 'Salvando...' : 'Salvar Funil'}
          </button>
        </div>

      </div>
    </div>
  );
}