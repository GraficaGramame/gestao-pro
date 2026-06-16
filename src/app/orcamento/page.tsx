'use client';

import { useOrcamentoFunil } from '@/hooks/useOrcamentoFunil';

export default function OrcamentoWizard() {
  const { step, data, updateData, nextStep, prevStep, finalizarPedido, catalogo, isLoadingCatalogo } = useOrcamentoFunil();

  const toggleAdicional = (item: string) => {
    const current = data.adicionais;
    if (current.includes(item)) {
      updateData('adicionais', current.filter((i) => i !== item));
    } else {
      updateData('adicionais', [...current, item]);
    }
  };

  const renderStep = () => {
    if (isLoadingCatalogo) {
      return <div className="text-center p-10 text-stone-500 font-medium animate-pulse">Carregando produtos...</div>;
    }

    switch (step) {
      case 1:
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

      case 2:
        return (
          <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-right-4">
            <div className="text-center mb-4">
              <h2 className="text-2xl font-black text-stone-900">Qual modelo deseja?</h2>
              <p className="text-stone-500 mt-2 text-sm">Escolha o modelo que melhor atende sua necessidade</p>
            </div>
            
            {catalogo.length === 0 ? (
              <p className="text-center text-red-500 text-sm">Nenhum produto marcado para o site no banco de dados.</p>
            ) : (
              catalogo.map((produto) => (
                <button
                  key={produto.id}
                  onClick={() => {
                    updateData('produto', produto.nome);
                    nextStep();
                  }}
                  className={`w-full p-5 rounded-2xl border-2 text-left transition-all ${
                    data.produto === produto.nome ? 'bg-[#EAF5F0] border-[#F6C689] shadow-sm' : 'bg-white border-stone-100 hover:border-stone-300'
                  }`}
                >
                  <span className={`font-bold text-lg ${data.produto === produto.nome ? 'text-stone-900' : 'text-stone-700'}`}>{produto.nome}</span>
                </button>
              ))
            )}

            <button onClick={prevStep} className="mt-4 py-4 text-stone-400 hover:text-stone-600 font-bold uppercase tracking-widest text-sm">← Voltar</button>
          </div>
        );

      case 3:
        return (
          <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-right-4">
            <div className="text-center mb-4">
              <h2 className="text-2xl font-black text-stone-900">Tipo de tecido</h2>
              <p className="text-stone-500 mt-2 text-sm">Escolha a malha da sua camiseta</p>
            </div>
            
            {['Poliviscose (PV)', 'Algodão Penteado', 'DryFit', 'Poliéster (PP ou Helanquinha)', 'Aero Dry'].map((item) => (
              <button
                key={item}
                onClick={() => {
                  updateData('tecido', item);
                  nextStep();
                }}
                className={`w-full p-5 rounded-2xl border-2 text-left transition-all ${
                  data.tecido === item ? 'bg-[#EAF5F0] border-[#F6C689] shadow-sm' : 'bg-white border-stone-100 hover:border-stone-300'
                }`}
              >
                <span className={`font-bold text-lg ${data.tecido === item ? 'text-stone-900' : 'text-stone-700'}`}>{item}</span>
              </button>
            ))}

            <button onClick={prevStep} className="mt-4 py-4 text-stone-400 hover:text-stone-600 font-bold uppercase tracking-widest text-sm">← Voltar</button>
          </div>
        );

      case 4:
        return (
          <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-right-4">
            <div className="text-center mb-4">
              <h2 className="text-2xl font-black text-stone-900">Tipo de estampa</h2>
              <p className="text-stone-500 mt-2 text-sm">Escolha como sua arte será aplicada na camiseta</p>
            </div>
            
            {['Serigrafia', 'Bordado (média 9cm x 9cm)', 'Sublimação Total', 'Sublimação Frente'].map((item) => (
              <button
                key={item}
                onClick={() => {
                  updateData('estampa', item);
                  nextStep();
                }}
                className={`w-full p-5 rounded-2xl border-2 text-left transition-all ${
                  data.estampa === item ? 'bg-[#EAF5F0] border-[#F6C689] shadow-sm' : 'bg-white border-stone-100 hover:border-stone-300'
                }`}
              >
                <span className={`font-bold text-lg ${data.estampa === item ? 'text-stone-900' : 'text-stone-700'}`}>{item}</span>
              </button>
            ))}

            <button onClick={prevStep} className="mt-4 py-4 text-stone-400 hover:text-stone-600 font-bold uppercase tracking-widest text-sm">← Voltar</button>
          </div>
        );

      case 5:
        return (
          <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-right-4">
             <div className="text-center mb-4">
              <h2 className="text-2xl font-black text-stone-900">Qual a quantidade que você precisa?</h2>
              <p className="text-stone-500 mt-2 text-sm">Selecione a faixa de quantidade desejada</p>
            </div>
            
            {['Entre 15 e 49 unidades', 'Entre 50 e 99 unidades', 'Entre 100 e 199 unidades', 'Mais de 200 unidades'].map((item) => (
              <button
                key={item}
                onClick={() => {
                  updateData('quantidade', item);
                  nextStep();
                }}
                className={`w-full p-5 rounded-2xl border-2 text-left transition-all ${
                  data.quantidade === item ? 'bg-[#EAF5F0] border-[#F6C689] shadow-sm' : 'bg-white border-stone-100 hover:border-stone-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  {data.quantidade === item && (
                    <div className="w-5 h-5 rounded-full bg-[#F6C689] flex items-center justify-center text-white text-xs font-bold">✓</div>
                  )}
                  <span className={`font-bold text-lg ${data.quantidade === item ? 'text-stone-900' : 'text-stone-700'}`}>{item}</span>
                </div>
              </button>
            ))}

            <button onClick={prevStep} className="mt-4 py-4 text-stone-400 hover:text-stone-600 font-bold uppercase tracking-widest text-sm">← Voltar</button>
          </div>
        );

      case 6:
        return (
          <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-right-4">
            <div className="text-center mb-4">
              <h2 className="text-2xl font-black text-stone-900">Adicionais</h2>
              <p className="text-stone-500 mt-2 text-sm">Personalize ainda mais sua camiseta</p>
            </div>
            
            <button
                onClick={() => updateData('adicionais', [])}
                className={`w-full p-5 rounded-2xl border-2 text-left transition-all flex justify-between items-center ${
                  data.adicionais.length === 0 ? 'bg-[#EAF5F0] border-[#F6C689] shadow-sm text-stone-900' : 'bg-white border-stone-100 text-stone-700'
                }`}
              >
                <span className="font-bold text-lg">Não quero adicionais</span>
                <span className={`text-sm font-bold ${data.adicionais.length === 0 ? 'text-[#F6C689]' : 'text-stone-400'}`}>R$ 0,00</span>
            </button>

            {[
              { nome: 'Manga Longa', preco: 8 }, 
              { nome: 'Manga Longa com Sublimação', preco: 10 }, 
              { nome: 'Manga 3/4', preco: 6 }, 
              { nome: 'Corte Especial', preco: 7 }
            ].map((item) => (
              <label
                key={item.nome}
                className={`w-full p-5 rounded-2xl border-2 text-left flex justify-between items-center cursor-pointer transition-all ${
                  data.adicionais.includes(item.nome) ? 'bg-[#EAF5F0] border-[#F6C689] shadow-sm text-stone-900' : 'bg-white border-stone-100 text-stone-700 hover:border-stone-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input 
                    type="checkbox" 
                    checked={data.adicionais.includes(item.nome)}
                    onChange={() => toggleAdicional(item.nome)}
                    className="w-5 h-5 accent-[#F6C689]"
                  />
                  <span className="font-bold text-lg">{item.nome}</span>
                </div>
                <span className={`text-sm font-bold ${data.adicionais.includes(item.nome) ? 'text-[#e9ac5b]' : 'text-stone-400'}`}>+R$ {item.preco},00</span>
              </label>
            ))}

            <div className="mt-6 flex flex-col items-center">
              <p className="text-stone-500 text-sm">Valor por unidade</p>
              <p className="text-4xl font-black text-[#F6C689] mt-1">R$ {data.valorUnitario.toFixed(2).replace('.', ',')}</p>
            </div>

            <div className="flex gap-4 mt-4">
              <button onClick={prevStep} className="px-6 py-4 rounded-2xl border-2 border-stone-200 text-stone-500 font-bold uppercase tracking-widest text-sm hover:bg-stone-50 transition-all">Voltar</button>
              <button onClick={nextStep} className="flex-1 py-4 bg-[#F8D299] hover:bg-[#f5c37a] text-stone-900 shadow-sm font-black rounded-2xl uppercase tracking-widest transition-all">Continuar →</button>
            </div>
          </div>
        );

      case 7:
        return (
          <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-right-4">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-black text-stone-900">Para quando precisa do pedido?</h2>
              <p className="text-stone-500 mt-2 text-sm">Selecione o prazo desejado para entrega</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border-2 border-stone-100 text-sm text-stone-500 mb-2 shadow-sm space-y-2">
              <p className="flex gap-2"><span>📅</span> Os prazos de produção são contados em <strong>dias úteis</strong> (segunda a sexta-feira).</p>
              <div className="h-px w-full bg-stone-100 my-2"></div>
              <p className="flex gap-2"><span>📅</span> Pólos e modelos com estampas bordadas e sublimação total são <strong>25 dias úteis</strong>.</p>
            </div>
            
            {['Preciso para menos de 20 dias', 'Daqui a 20 dias', 'Daqui a 20 a 30 dias', 'Daqui a mais de 30 dias'].map((item) => (
              <button
                key={item}
                onClick={() => {
                  updateData('prazo', item);
                  nextStep();
                }}
                className={`w-full p-5 rounded-2xl border-2 text-left transition-all ${
                  data.prazo === item ? 'bg-[#EAF5F0] border-[#F6C689] shadow-sm' : 'bg-white border-stone-100 hover:border-stone-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  {data.prazo === item && (
                    <div className="w-5 h-5 rounded-full bg-[#F6C689] flex items-center justify-center text-white text-xs font-bold">✓</div>
                  )}
                  <span className={`font-bold text-lg ${data.prazo === item ? 'text-stone-900' : 'text-stone-700'}`}>{item}</span>
                </div>
              </button>
            ))}

            <button onClick={prevStep} className="mt-4 py-4 text-stone-400 hover:text-stone-600 font-bold uppercase tracking-widest text-sm">← Voltar</button>
          </div>
        );

      case 8:
        return (
          <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-right-4">
            <div className="bg-[#fcf8f2] p-6 rounded-3xl border border-[#f5e3cc] text-center mb-2 shadow-sm">
               <p className="text-stone-500 text-sm font-medium">Valor por unidade estimado</p>
               <p className="text-5xl font-black text-[#F6C689] mt-2">R$ {data.valorUnitario.toFixed(2).replace('.', ',')}</p>
            </div>

            <div className="bg-white rounded-3xl border border-stone-200 divide-y divide-stone-100 shadow-sm overflow-hidden">
               <div className="p-5 flex flex-col gap-1">
                 <span className="text-[11px] font-bold text-stone-400 uppercase tracking-widest">Nome do Cliente</span>
                 <span className="text-stone-800 font-bold text-lg">{data.nome}</span>
               </div>
               <div className="p-5 flex flex-col gap-1">
                 <span className="text-[11px] font-bold text-stone-400 uppercase tracking-widest">WhatsApp</span>
                 <span className="text-stone-800 font-bold">{data.whatsapp}</span>
               </div>
               <div className="p-5 flex flex-col gap-1">
                 <span className="text-[11px] font-bold text-stone-400 uppercase tracking-widest">Quantidade</span>
                 <span className="text-stone-800 font-bold">{data.quantidade}</span>
               </div>
               <div className="p-5 flex flex-col gap-1">
                 <span className="text-[11px] font-bold text-stone-400 uppercase tracking-widest">Prazo</span>
                 <span className="text-stone-800 font-bold">{data.prazo}</span>
               </div>
               <div className="p-5 flex flex-col gap-1 bg-stone-50">
                 <span className="text-[11px] font-bold text-stone-400 uppercase tracking-widest">Modelo & Especificações</span>
                 <span className="text-stone-800 font-black text-lg">{data.produto}</span>
                 <span className="text-stone-600">{data.tecido} • {data.estampa}</span>
               </div>
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

      default:
        return null;
    }
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

        {/* Wizard Steps */}
        <div className="flex justify-between mb-10 px-2 relative">
          <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-stone-200 -z-10 -translate-y-1/2"></div>
          
          {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
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
          ))}
        </div>
        
        {renderStep()}

      </div>
    </div>
  );
}