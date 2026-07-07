"use client";

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';

interface CustomField {
  id: string;
  label: string;
  placeholder: string;
  required: boolean;
}

interface ProdutoDB {
  id: string;
  name: string;
  base_price: number;
  slug: string;
  description: string;
  theme: string;
  tag: string;
  images: string[];
  promotional_old_price: number;
  vitrine_custom_fields: CustomField[];
}

export default function PaginaDinamicaDoProduto() {
  const params = useParams();
  const slug = params?.slug as string;

  const [produto, setProduto] = useState<ProdutoDB | null>(null);
  const [produtosRelacionados, setProdutosRelacionados] = useState<ProdutoDB[]>([]);
  const [loading, setLoading] = useState(true);
  const [imagemAtiva, setImagemAtiva] = useState('');

  // Estados de Compra
  const [customValues, setCustomValues] = useState<Record<string, string>>({});
  const [quantidade, setQuantidade] = useState(1);
  const [revisaoArte, setRevisaoArte] = useState(false);

  useEffect(() => {
    async function carregarDados() {
      if (!slug) return;
      try {
        // CORREÇÃO: Uso do .maybeSingle() para evitar erro no console quando o produto não existe
        const { data: mainProduct, error } = await supabase
          .from('products')
          .select('*')
          .eq('slug', slug)
          .eq('is_public', true)
          .maybeSingle();

        if (error) {
          console.error("Erro interno do Supabase:", error);
          return;
        }

        if (mainProduct) {
          setProduto(mainProduct as ProdutoDB);
          if (mainProduct.images && mainProduct.images.length > 0) {
            setImagemAtiva(mainProduct.images[0]);
          }

          // Busca outros produtos públicos para a seção "Combina com"
          const { data: relatedProducts } = await supabase
            .from('products')
            .select('*')
            .eq('is_public', true)
            .neq('id', mainProduct.id)
            .limit(4);
            
          if (relatedProducts) {
            setProdutosRelacionados(relatedProducts as ProdutoDB[]);
          }
        }
      } catch (error) {
        console.error("Falha na requisição:", error);
      } finally {
        setLoading(false);
      }
    }
    carregarDados();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!produto) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-center px-4">
        <h1 className="text-4xl font-black text-slate-900 mb-2">Ops! Produto não encontrado.</h1>
        <p className="text-slate-600 mb-6 font-medium">Parece que esse link não existe ou o produto saiu de linha.</p>
        <Link href="/" className="px-6 py-3 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 transition-colors shadow-lg">
          Voltar para a Loja
        </Link>
      </div>
    );
  }

  const precoBase = Number(produto.base_price) || 0;
  const precoAntigo = Number(produto.promotional_old_price) || precoBase;
  const descontoPercentual = precoAntigo > precoBase ? Math.round(((precoAntigo - precoBase) / precoAntigo) * 100) : 0;
  const valorTotal = (precoBase + (revisaoArte ? 5.00 : 0)) * quantidade;

  const handleInputValueChange = (fieldId: string, value: string) => {
    setCustomValues(prev => ({ ...prev, [fieldId]: value }));
  };

  const handleFazerPedido = () => {
    const numeroWhatsApp = "5583998474211";
    
    let missingField = false;
    const camposPreenchidosTexto: string[] = [];

    (produto.vitrine_custom_fields || []).forEach(field => {
      const valor = customValues[field.id] || '';
      if (field.required && !valor.trim()) {
        missingField = true;
      }
      if (valor.trim()) {
        camposPreenchidosTexto.push(`- ${field.label}: ${valor.trim()}`);
      }
    });

    if (missingField) {
      alert("⚠️ Ops! Por favor, preencha todos os campos obrigatórios (*).");
      return;
    }
    
    const temaTexto = produto.theme ? ` (${produto.theme})` : '';
    const mensagem = `*NOVO PEDIDO: ${produto.name.toUpperCase()}${temaTexto}* 🚀\n\n` +
      `*1. Dados da Personalização:*\n` +
      (camposPreenchidosTexto.length > 0 ? camposPreenchidosTexto.join('\n') + '\n' : 'Sem personalização\n') +
      `- Revisão VIP (+R$ 5): ${revisaoArte ? 'Sim' : 'Não'}\n\n` +
      `*2. Resumo:*\n` +
      `- Quantidade: ${quantidade} un.\n` +
      `- *Valor Total: R$ ${valorTotal.toFixed(2).replace('.', ',')}*\n\n` +
      `Olá, Gráfica Gramame! Vim da página de ofertas e quero finalizar meu pedido.`;

    const url = `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(mensagem)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-20">
      <div className="w-full bg-gradient-to-r from-purple-700 via-fuchsia-600 to-purple-700 text-white text-center py-3 px-4 text-xs sm:text-sm font-black tracking-wide shadow-md">
        ✨ FRETE GRÁTIS para Zona Sul (JP) em pedidos acima de R$ 100! Aproveite.
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        <div className="flex flex-col lg:flex-row gap-12">
          
          <div className="w-full lg:w-1/2 flex flex-col gap-4 sticky top-8 h-fit">
            <div className="relative rounded-2xl bg-white shadow-xl shadow-slate-200/50 overflow-hidden aspect-square border border-slate-100 group">
              {descontoPercentual > 0 && (
                <div className="absolute top-4 left-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-sm font-black px-4 py-1.5 rounded-full z-10 shadow-lg transform -rotate-2">
                  -{descontoPercentual}% OFF
                </div>
              )}
              {imagemAtiva ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={imagemAtiva} alt={produto.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
              ) : (
                <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400 font-medium">Sem imagem</div>
              )}
            </div>
            
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {(produto.images || []).map((img, index) => (
                <button key={index} onClick={() => setImagemAtiva(img)} className={`flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden transition-all border-2 ${imagemAtiva === img ? 'ring-4 ring-purple-500 border-white opacity-100' : 'border-transparent opacity-60 hover:opacity-100'}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img} alt={`Detalhe ${index + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          <div className="w-full lg:w-1/2 flex flex-col">
            <div className="mb-6">
              {produto.tag && <span className="inline-block bg-amber-100 text-amber-800 text-[11px] font-black px-3 py-1 rounded-full uppercase tracking-widest mb-3">{produto.tag}</span>}
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight mb-3">
                {produto.name} <br/>
                {produto.theme && <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-fuchsia-500">Tema {produto.theme}</span>}
              </h1>
              {produto.description && (
                <p className="text-slate-600 text-sm sm:text-base leading-relaxed font-medium whitespace-pre-line">{produto.description}</p>
              )}
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm mb-8">
              <div className="flex items-end gap-4">
                <span className="text-5xl font-black text-slate-900 tracking-tighter"><span className="text-2xl mr-1">R$</span>{precoBase.toFixed(2).replace('.', ',')}</span>
                {precoAntigo > precoBase && <span className="text-lg text-slate-400 line-through font-medium mb-1.5">R$ {precoAntigo.toFixed(2).replace('.', ',')}</span>}
              </div>
            </div>

            {(produto.vitrine_custom_fields && produto.vitrine_custom_fields.length > 0) && (
              <div className="mb-8 space-y-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-3 mb-4">Dados da Personalização</h3>
                
                {produto.vitrine_custom_fields.map((field) => (
                  <div key={field.id}>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                      {field.label} {field.required && <span className="text-rose-500">*</span>}
                    </label>
                    <input 
                      type="text" 
                      value={customValues[field.id] || ''}
                      onChange={(e) => handleInputValueChange(field.id, e.target.value)}
                      placeholder={field.placeholder}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 p-3.5 rounded-xl text-sm font-semibold focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all placeholder:font-normal placeholder:text-slate-400"
                    />
                  </div>
                ))}
              </div>
            )}

            <div className="mb-8">
              <label className={`flex items-start gap-4 cursor-pointer p-5 rounded-2xl border-2 transition-all ${revisaoArte ? 'border-purple-500 bg-purple-50' : 'border-slate-200 bg-white'}`}>
                <input type="checkbox" checked={revisaoArte} onChange={(e) => setRevisaoArte(e.target.checked)} className="mt-1 w-5 h-5 text-purple-600 rounded cursor-pointer" />
                <div className="flex flex-col">
                  <span className="text-sm font-black text-slate-900">Revisão VIP pela Gramame (+R$ 5,00)</span>
                  <span className="text-xs text-slate-600 mt-1.5 font-medium">Garantimos o ajuste perfeito do nome na arte antes do recorte.</span>
                </div>
              </label>
            </div>

            <div className="bg-slate-900 p-6 rounded-3xl shadow-2xl">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex items-center justify-between bg-slate-800 rounded-xl w-full sm:w-36 h-16 px-2 border border-slate-700">
                  <button className="w-10 h-10 text-slate-300 hover:bg-slate-700 rounded-lg font-black text-xl transition-colors" onClick={() => setQuantidade(q => Math.max(1, q - 1))}>-</button>
                  <span className="font-black text-white text-lg">{quantidade}</span>
                  <button className="w-10 h-10 text-slate-300 hover:bg-slate-700 rounded-lg font-black text-xl transition-colors" onClick={() => setQuantidade(q => q + 1)}>+</button>
                </div>
                <button onClick={handleFazerPedido} className="flex-1 h-16 bg-[#25D366] hover:bg-[#20bd5a] text-white font-black uppercase tracking-widest rounded-xl shadow-lg hover:scale-[1.02] transition-all">
                  Garantir Meu Pedido
                </button>
              </div>
            </div>
          </div>
        </div>

        {produtosRelacionados.length > 0 && (
          <div className="mt-24 pt-16 border-t border-slate-200">
            <h2 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-3">
              Combina com 
              <span className="text-sm font-bold bg-purple-100 text-purple-700 px-3 py-1 rounded-full uppercase tracking-widest">Leve junto</span>
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {produtosRelacionados.map((relacionado) => (
                <Link href={`/produto/${relacionado.slug}`} key={relacionado.id} className="group cursor-pointer">
                  <div className="aspect-square rounded-2xl overflow-hidden bg-slate-100 mb-4 border border-slate-200 group-hover:border-purple-400 transition-colors">
                    {relacionado.images && relacionado.images.length > 0 ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={relacionado.images[0]} alt={relacionado.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300 text-sm font-medium">Sem Foto</div>
                    )}
                  </div>
                  <h3 className="font-bold text-slate-800 leading-tight group-hover:text-purple-600 transition-colors line-clamp-2">{relacionado.name} {relacionado.theme}</h3>
                  <div className="mt-2 font-black text-lg text-slate-900">R$ {Number(relacionado.base_price).toFixed(2).replace('.', ',')}</div>
                </Link>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}