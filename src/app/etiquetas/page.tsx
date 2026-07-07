"use client";

import React, { useState } from 'react';

export default function LandingPageProduto() {
  // 1. ESTRUTURA ESCALÁVEL DE PRODUTO
  // Futuramente, você pode puxar isso de um banco de dados ou criar um arquivo de configuração.
  // Para criar a página do "Topo de Bolo", basta trocar os dados aqui.
  const produtoAtual = {
    titulo: "Kit Jumbo Etiquetas Escolares",
    tema: "Lilo & Stitch",
    tag: "🔥 Mais Vendido",
    precoBase: 38.90,
    precoAntigo: 49.90,
    descricao: "Chega de perder o material escolar! Identifique tudo com o tema favorito do seu filho. Nossas etiquetas são à prova d'água, não rasgam e duram o ano inteiro.",
    imagens: [
      "https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&q=80&w=800", // Foto 1 - Aplicação
      "https://images.unsplash.com/photo-1629540443229-87a4143a4e98?auto=format&fit=crop&q=80&w=800", // Foto 2 - Detalhe
      "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=800"  // Foto 3 - Embalagem
    ],
    oQueVem: [
      { qtd: 40, tipo: "Etiquetas Lápis (4x1,5cm)", uso: "Lápis, canetas, hidrocores" },
      { qtd: 25, tipo: "Etiquetas M (6x2cm)", uso: "Colas, réguas, apontadores" },
      { qtd: 15, tipo: "Etiquetas G (8x4cm)", uso: "Cadernos, livros, pastas" },
    ]
  };

  // Estados do formulário
  const [nome, setNome] = useState('');
  const [turma, setTurma] = useState('');
  const [escola, setEscola] = useState('');
  const [materia, setMateria] = useState(''); // Usado se for adaptar para outros kits
  const [quantidade, setQuantidade] = useState(1);
  const [revisaoArte, setRevisaoArte] = useState(false);
  const [imagemAtiva, setImagemAtiva] = useState(produtoAtual.imagens[0]);

  // Cálculos Financeiros
  const descontoPercentual = Math.round(((produtoAtual.precoAntigo - produtoAtual.precoBase) / produtoAtual.precoAntigo) * 100);
  const valorRevisao = 5.00;
  const valorTotal = (produtoAtual.precoBase + (revisaoArte ? valorRevisao : 0)) * quantidade;

  // Envio para WhatsApp
  const handleFazerPedido = () => {
    const numeroWhatsApp = "5583998474211";
    
    if (!nome || !turma) {
      alert("⚠️ Ops! Por favor, preencha o Nome e a Série/Turma da criança para podermos personalizar o kit.");
      return;
    }
    
    const mensagem = `*NOVO PEDIDO: ${produtoAtual.titulo.toUpperCase()} (${produtoAtual.tema})* 🚀\n\n` +
      `*1. Dados da Personalização:*\n` +
      `- Nome: ${nome}\n` +
      `- Turma: ${turma}\n` +
      (escola ? `- Escola: ${escola}\n` : '') +
      `- Revisão VIP (+R$ 5): ${revisaoArte ? 'Sim' : 'Não'}\n\n` +
      `*2. Resumo:*\n` +
      `- Quantidade: ${quantidade} Kit(s)\n` +
      `- *Valor Total: R$ ${valorTotal.toFixed(2).replace('.', ',')}*\n\n` +
      `Olá, Gramame! Vim do site e quero finalizar meu pedido.`;

    const url = `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(mensagem)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-20">
      
      {/* 1. TOPO: Urgência e Oferta */}
      <div className="w-full bg-gradient-to-r from-purple-700 via-fuchsia-600 to-purple-700 text-white text-center py-3 px-4 text-xs sm:text-sm font-black tracking-wide shadow-md">
        ✨ FRETE GRÁTIS para Zona Sul (JP) em pedidos acima de R$ 100! Aproveite.
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Breadcrumb Otimizado */}
        <div className="text-xs text-slate-500 mb-8 font-medium flex items-center gap-2">
          <span>Início</span> <span className="text-slate-300">/</span> 
          <span>Etiquetas Escolares</span> <span className="text-slate-300">/</span> 
          <span className="text-purple-600 font-bold bg-purple-100 px-2 py-0.5 rounded-full">{produtoAtual.tema}</span>
        </div>

        {/* 2. SESSÃO PRINCIPAL */}
        <div className="flex flex-col lg:flex-row gap-12">
          
          {/* ESQUERDA: Galeria de Alta Conversão */}
          <div className="w-full lg:w-1/2 flex flex-col gap-4 sticky top-8 h-fit">
            
            {/* Imagem Principal */}
            <div className="relative rounded-2xl bg-white shadow-xl shadow-slate-200/50 overflow-hidden aspect-square border border-slate-100 group">
              {/* Badge de Desconto */}
              <div className="absolute top-4 left-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-sm font-black px-4 py-1.5 rounded-full z-10 shadow-lg shadow-pink-500/30 transform -rotate-2">
                -{descontoPercentual}% OFF
              </div>
              
              <img 
                src={imagemAtiva} 
                alt={`${produtoAtual.titulo} - ${produtoAtual.tema}`} 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
            
            {/* Miniaturas */}
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {produtoAtual.imagens.map((img, index) => (
                <button 
                  key={index} 
                  onClick={() => setImagemAtiva(img)}
                  className={`relative flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden transition-all duration-300 ${
                    imagemAtiva === img 
                    ? 'ring-4 ring-purple-500 border-2 border-white opacity-100' 
                    : 'border-2 border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt={`Detalhe ${index + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* DIREITA: Copywriting e Checkout */}
          <div className="w-full lg:w-1/2 flex flex-col">
            
            {/* Cabeçalho do Produto */}
            <div className="mb-6">
              <span className="inline-block bg-amber-100 text-amber-800 text-[11px] font-black px-3 py-1 rounded-full uppercase tracking-widest mb-3">
                {produtoAtual.tag}
              </span>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight mb-3">
                {produtoAtual.titulo} <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-fuchsia-500">
                  Tema {produtoAtual.tema}
                </span>
              </h1>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed font-medium">
                {produtoAtual.descricao}
              </p>
            </div>

            {/* Preço com Ancoragem */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm mb-8">
              <div className="text-sm text-slate-500 font-semibold mb-1">Valor do Investimento:</div>
              <div className="flex items-end gap-4">
                <span className="text-5xl font-black text-slate-900 tracking-tighter">
                  <span className="text-2xl mr-1">R$</span>{produtoAtual.precoBase.toFixed(2).replace('.', ',')}
                </span>
                <span className="text-lg text-slate-400 line-through font-medium mb-1.5">
                  R$ {produtoAtual.precoAntigo.toFixed(2).replace('.', ',')}
                </span>
              </div>
              <div className="text-xs text-emerald-600 font-bold mt-2 flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                Pagamento via PIX ou Cartão no WhatsApp
              </div>
            </div>

            {/* 3. FUNIL DE PERSONALIZAÇÃO (O Formulário) */}
            <div className="mb-8">
              <h3 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
                <span className="bg-slate-900 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">1</span>
                Personalize o seu Kit
              </h3>
              
              <div className="space-y-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                
                {/* Nome */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                    Nome da Criança <span className="text-rose-500">*</span>
                  </label>
                  <input 
                    type="text" 
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Ex: Enzo Gabriel"
                    maxLength={20}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 p-3.5 rounded-xl text-sm font-semibold focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 transition-all placeholder:font-normal"
                  />
                </div>

                {/* Grid para Turma e Escola */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                      Série / Turma <span className="text-rose-500">*</span>
                    </label>
                    <input 
                      type="text" 
                      value={turma}
                      onChange={(e) => setTurma(e.target.value)}
                      placeholder="Ex: 2º Ano B"
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 p-3.5 rounded-xl text-sm font-semibold focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 transition-all placeholder:font-normal"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                      Escola <span className="text-slate-400 font-normal text-[10px]">(Opcional)</span>
                    </label>
                    <input 
                      type="text" 
                      value={escola}
                      onChange={(e) => setEscola(e.target.value)}
                      placeholder="Nome da escola"
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 p-3.5 rounded-xl text-sm font-semibold focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 transition-all placeholder:font-normal"
                    />
                  </div>
                </div>

              </div>
            </div>

            {/* 4. UPSELL (Aumentar Ticket Médio) */}
            <div className="mb-8">
              <h3 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
                <span className="bg-slate-900 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">2</span>
                Garantia de Qualidade
              </h3>
              
              <label className={`flex items-start gap-4 cursor-pointer p-5 rounded-2xl border-2 transition-all ${revisaoArte ? 'border-purple-500 bg-purple-50' : 'border-slate-200 bg-white hover:border-purple-300'}`}>
                <div className="relative flex items-center justify-center mt-1">
                  <input 
                    type="checkbox" 
                    checked={revisaoArte}
                    onChange={(e) => setRevisaoArte(e.target.checked)}
                    className="peer sr-only" 
                  />
                  <div className="w-6 h-6 border-2 border-slate-300 rounded peer-checked:bg-purple-600 peer-checked:border-purple-600 transition-colors"></div>
                  <svg className="absolute w-4 h-4 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-black text-slate-900">Revisão VIP pela Gramame (+R$ 5,00)</span>
                  <span className="text-xs text-slate-600 mt-1.5 leading-relaxed font-medium">Um designer vai revisar manualmente os espaçamentos do nome do seu filho antes da impressão, garantindo que fique perfeito.</span>
                </div>
              </label>
            </div>

            {/* 5. CHECKOUT / CTA */}
            <div className="bg-slate-900 p-6 rounded-3xl shadow-2xl shadow-slate-900/20">
              <div className="flex flex-col sm:flex-row gap-4">
                
                {/* Seletor de Qtd */}
                <div className="flex items-center justify-between bg-slate-800 rounded-xl w-full sm:w-36 h-16 px-2 shrink-0 border border-slate-700">
                  <button 
                    className="w-10 h-10 rounded-lg text-slate-300 hover:bg-slate-700 hover:text-white font-black text-xl flex items-center justify-center transition-colors"
                    onClick={() => setQuantidade(q => Math.max(1, q - 1))}
                    disabled={quantidade <= 1}
                  >-</button>
                  <span className="font-black text-white text-lg">{quantidade}</span>
                  <button 
                    className="w-10 h-10 rounded-lg text-slate-300 hover:bg-slate-700 hover:text-white font-black text-xl flex items-center justify-center transition-colors"
                    onClick={() => setQuantidade(q => q + 1)}
                  >+</button>
                </div>

                {/* Botão de Compra */}
                <button 
                  onClick={handleFazerPedido}
                  className="flex-1 h-16 bg-gradient-to-r from-[#25D366] to-[#1ebd5b] hover:from-[#1ebd5b] hover:to-[#179b4a] text-white font-black uppercase tracking-wider rounded-xl flex items-center justify-center gap-3 transition-all shadow-lg shadow-green-500/25 hover:shadow-green-500/40 hover:-translate-y-1 group"
                >
                  <svg className="w-6 h-6 fill-current group-hover:animate-bounce" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
                  </svg>
                  Garantir Meu Kit
                </button>
              </div>
              
              <div className="mt-4 flex items-center justify-center gap-2 text-xs font-semibold text-slate-400">
                <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                Site Seguro. Você será redirecionado para o nosso WhatsApp.
              </div>
            </div>

          </div>
        </div>

        {/* 6. DESCRIÇÃO E DETALHES TÉCNICOS */}
        <div className="mt-20 pt-16 border-t border-slate-200">
          
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mb-4">O que vem no pacote?</h2>
            <p className="text-slate-600 font-medium">Tudo o que você precisa para não deixar nenhum material sem identificação. Impressão a laser de alta durabilidade e corte eletrônico, é só destacar e colar!</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {produtoAtual.oQueVem.map((item, index) => (
              <div key={index} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center font-black text-xl mb-4">
                  {item.qtd}x
                </div>
                <h4 className="text-lg font-black text-slate-800 mb-2">{item.tipo}</h4>
                <p className="text-sm text-slate-500 font-medium">Perfeito para: {item.uso}</p>
              </div>
            ))}
          </div>

        </div>

      </div>
    </div>
  );
}