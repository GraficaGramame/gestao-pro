// @ts-nocheck
/**
 * src/app/clientes/page.tsx
 * CRM de Alta Performance - Gráfica Gramame
 * Atualização: Seleção de Cupons Existentes ou Criação Dinâmica
 */
'use client';

import { FormEvent, useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/components/auth/auth-provider';

export default function ClientesPage() {
  const { tenantId, loading: authLoading } = useAuth();
  
  // Estados de Dados
  const [customers, setCustomers] = useState<any[]>([]);
  const [couponsList, setCouponsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Estados do Formulário de Cadastro/Edição
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [birthDate, setBirthDate] = useState('');

  // Estados do Modal de Cupom
  const [selectedCliente, setSelectedCliente] = useState<any>(null);
  const [cupomCodigo, setCupomCodigo] = useState('');
  const [cupomTipo, setCupomTipo] = useState<'FIXED' | 'PERCENTAGE'>('PERCENTAGE');
  const [cupomValor, setCupomValor] = useState('');
  const [cupomValidade, setCupomValidade] = useState('');

  const fetchData = async () => {
    if (!tenantId) return;
    setLoading(true);
    
    // Busca Clientes + Contagem de Pedidos atrelados
    const { data: clientsData, error: clientsError } = await supabase
      .from('customers')
      .select('*, orders(id)')
      .eq('tenant_id', tenantId)
      .order('name', { ascending: true });
      
    // Busca todos os Cupons ativos da Gráfica
    const { data: couponsData } = await supabase
      .from('coupons')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('is_active', true);
      
    if (clientsError) console.error("Erro ao buscar clientes:", clientsError);
    
    setCustomers(clientsData ?? []);
    setCouponsList(couponsData ?? []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [tenantId]);

  // ==========================================
  // LÓGICA DE CADASTRO E EDIÇÃO
  // ==========================================
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    
    const payload = {
      tenant_id: tenantId,
      name: name.trim(),
      whatsapp: whatsapp.replace(/\D/g, ''),
      birth_date: birthDate || null,
    };

    try {
      if (editingId) {
        const { error } = await supabase.from('customers').update(payload).eq('id', editingId).eq('tenant_id', tenantId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('customers').insert(payload);
        if (error) throw error;
      }
      
      handleCancel();
      await fetchData();
    } catch (error: any) {
      alert(`Falha ao salvar cliente: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditClick = (customer: any) => {
    setEditingId(customer.id);
    setName(customer.name);
    setWhatsapp(customer.whatsapp);
    setBirthDate(customer.birth_date ?? '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancel = () => {
    setEditingId(null);
    setName('');
    setWhatsapp('');
    setBirthDate('');
  };

  // ==========================================
  // LÓGICA DE GESTÃO DE CUPONS
  // ==========================================
  const handleOpenCupomModal = (cliente: any) => {
    setSelectedCliente(cliente);
    setCupomCodigo(''); // Começa vazio para incentivar a escolha na lista
    setCupomValor('');
    setCupomValidade('');
  };

  const handleCreateCupom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cupomCodigo) return alert("Preencha ou selecione o código do cupom.");

    const upperCode = cupomCodigo.toUpperCase().trim();

    try {
      // 1. Verifica se o cupom já existe na lista
      const cupomExistente = couponsList.find(c => c.code === upperCode);

      // 2. Se não existir, nós criamos um novo
      if (!cupomExistente) {
        if (!cupomValor) return alert("Para criar um cupom inédito, informe o valor do desconto.");
        
        const payload = {
          tenant_id: tenantId,
          code: upperCode,
          discount_type: cupomTipo,
          discount_value: parseFloat(cupomValor),
          valid_until: cupomValidade || null,
          is_active: true
        };

        const { error: erroCupom } = await supabase.from('coupons').insert([payload]);
        if (erroCupom) throw erroCupom;
      }

      // 3. Atrela o cupom (novo ou existente) ao cliente
      const { error: erroUpdate } = await supabase
        .from('customers')
        .update({ coupon: upperCode })
        .eq('id', selectedCliente.id)
        .eq('tenant_id', tenantId);

      if (erroUpdate) throw erroUpdate;

      alert(`Benefício atrelado com sucesso ao cliente ${selectedCliente.name}!`);
      setSelectedCliente(null);
      fetchData(); // Recarrega a lista
    } catch (error) {
      alert("Erro ao gerenciar cupom. Verifique os dados e tente novamente.");
      console.error(error);
    }
  };

  const handleRemoverCupom = async (clienteId: string) => {
    if(!confirm("Deseja realmente remover o benefício deste cliente?")) return;
    try {
        await supabase.from('customers').update({ coupon: null }).eq('id', clienteId);
        fetchData();
    } catch (error) {
        alert("Erro ao remover cupom.");
    }
  }

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      c.whatsapp.includes(searchQuery)
    );
  }, [customers, searchQuery]);

  if (authLoading || !tenantId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-950 text-slate-500 font-black uppercase tracking-widest animate-pulse">
        Sincronizando CRM...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-8 flex-1">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* HEADER */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tighter text-green-500">Clientes & LTV</h1>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Gestão de Carteira e Benefícios</p>
          </div>
          <div className="w-full md:w-96 relative">
            <input 
              type="text" 
              placeholder="Buscar por nome ou WhatsApp..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-12 pr-4 py-3 text-sm text-slate-100 outline-none focus:border-green-500 transition-colors shadow-inner"
            />
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-lg">🔍</span>
          </div>
        </header>

        {/* FORMULÁRIO DE CADASTRO RÁPIDO */}
        <section className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl animate-in fade-in">
          <h2 className="text-[11px] font-black uppercase tracking-widest mb-6 text-slate-400">
            {editingId ? '✏️ Editando Ficha do Cliente' : '✨ Novo Cadastro Rápido'}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Nome Completo</label>
                <input
                  type="text" required value={name} onChange={e => setName(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm outline-none focus:border-green-500 text-slate-200 transition-colors"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">WhatsApp</label>
                <input
                  type="tel" required value={whatsapp} onChange={e => setWhatsapp(e.target.value)}
                  placeholder="Ex: 839..."
                  className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm outline-none focus:border-green-500 text-slate-200 font-mono transition-colors"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Nascimento (Opcional)</label>
                <input
                  type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm outline-none focus:border-green-500 text-slate-200 transition-colors"
                />
              </div>
            </div>

            <div className="flex gap-3 border-t border-slate-800/50 pt-6">
              <button type="submit" disabled={submitting} className="bg-green-600 hover:bg-green-500 px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-green-900/20">
                {submitting ? 'Sincronizando...' : 'Salvar Ficha'}
              </button>
              {editingId && (
                <button type="button" onClick={handleCancel} className="bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-colors">
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </section>

        {/* TABELA DE GESTÃO DE CLIENTES */}
        <section className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-4">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-950/80 text-slate-500 font-black uppercase text-[10px] tracking-widest border-b border-slate-800">
                <tr>
                  <th className="px-6 py-5">Identificação</th>
                  <th className="px-6 py-5 text-center">Volume (LTV)</th>
                  <th className="px-6 py-5">Benefício Ativo</th>
                  <th className="px-6 py-5 text-right">Ações de Gestão</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {loading ? (
                  <tr><td colSpan={4} className="px-6 py-20 text-center text-slate-600 font-black uppercase tracking-widest text-xs animate-pulse">Analisando Carteira...</td></tr>
                ) : filteredCustomers.length > 0 ? (
                  filteredCustomers.map((customer: any) => {
                    const numeroPedidos = customer.orders ? customer.orders.length : 0;
                    const cleanPhone = customer.whatsapp.replace(/\D/g, '');
                    const zapLink = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
                    
                    const cupomDetalhe = customer.coupon ? couponsList.find(c => c.code === customer.coupon) : null;
                    
                    return (
                      <tr key={customer.id} className="hover:bg-slate-800/40 transition-colors group">
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-slate-950 border border-slate-800 text-slate-400 flex items-center justify-center font-black shadow-inner text-lg group-hover:text-green-500 group-hover:border-green-500/30 transition-all">
                              {customer.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-black text-slate-100 uppercase tracking-tight">{customer.name}</p>
                              <div className="flex items-center gap-3 mt-1">
                                <a href={`https://wa.me/${zapLink}`} target="_blank" className="text-green-500 hover:text-green-400 font-mono text-[10px] font-bold transition-colors">
                                  {customer.whatsapp}
                                </a>
                                {customer.birth_date && (
                                  <span className="text-[10px] text-slate-500 font-mono border-l border-slate-700 pl-3">
                                    🎂 {new Date(customer.birth_date).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-6 py-5 text-center">
                          <div className="flex flex-col items-center">
                            <span className="text-xl font-black font-mono text-slate-200">{numeroPedidos}</span>
                            <span className="text-[8px] uppercase tracking-widest text-slate-500 font-bold">Pedidos</span>
                          </div>
                        </td>
                        
                        <td className="px-6 py-5">
                          {cupomDetalhe ? (
                            <div className="flex flex-col gap-1 items-start">
                               <div className="bg-orange-500/10 border border-orange-500/30 text-orange-400 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                 🏷️ {cupomDetalhe.code} 
                                 <span className="text-orange-300">
                                    ({cupomDetalhe.discount_type === 'PERCENTAGE' ? `${cupomDetalhe.discount_value}%` : `R$ ${cupomDetalhe.discount_value}`})
                                 </span>
                               </div>
                               {cupomDetalhe.valid_until && (
                                 <span className="text-[8px] text-slate-500 uppercase tracking-widest pl-1 mt-1">Válido até: {new Date(cupomDetalhe.valid_until).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</span>
                               )}
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-600 font-bold uppercase tracking-widest bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">Sem Vínculo</span>
                          )}
                        </td>
                        
                        <td className="px-6 py-5 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleEditClick(customer)} className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all" title="Editar Cliente">
                              ✏️
                            </button>
                            {customer.coupon ? (
                                <button onClick={() => handleRemoverCupom(customer.id)} className="px-4 py-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-slate-950 font-black rounded-xl text-[10px] uppercase tracking-widest transition-all">Tirar Cupom</button>
                            ) : (
                                <button onClick={() => handleOpenCupomModal(customer)} className="px-4 py-2 bg-orange-500/10 text-orange-400 hover:bg-orange-500 hover:text-slate-950 border border-orange-500/20 font-black rounded-xl text-[10px] uppercase tracking-widest transition-all">Dar Cupom</button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr><td colSpan={4} className="px-6 py-20 text-center text-slate-600 font-black uppercase tracking-widest text-xs">Nenhum cliente na base corresponde à busca.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* MODAL DE GERAÇÃO E ATRIBUIÇÃO DE CUPOM */}
      {selectedCliente && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 w-full max-w-md rounded-[2.5rem] border border-slate-800 shadow-2xl overflow-hidden">
            <div className="p-8 border-b border-slate-800 bg-slate-950/50">
              <h2 className="text-xl font-black text-slate-100 uppercase tracking-tighter">Conceder Benefício</h2>
              <p className="text-orange-500 text-[10px] font-black uppercase tracking-widest mt-1">Cliente: {selectedCliente.name}</p>
            </div>
            
            <form onSubmit={handleCreateCupom} className="p-8">
              
              {/* DROPDOWN DE CUPONS EXISTENTES */}
              {couponsList.length > 0 && (
                <div className="mb-6">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Atribuir da sua Lista</label>
                  <select
                    onChange={(e) => {
                      const val = e.target.value;
                      setCupomCodigo(val);
                      const c = couponsList.find(x => x.code === val);
                      if(c) {
                        setCupomTipo(c.discount_type);
                        setCupomValor(c.discount_value.toString());
                      }
                    }}
                    className="w-full mt-2 bg-slate-950 border border-slate-800 rounded-2xl px-4 py-4 text-sm text-slate-100 outline-none focus:border-orange-500 appearance-none font-black"
                  >
                    <option value="">-- Escolha um cupom existente --</option>
                    {couponsList.map(c => (
                       <option key={c.id} value={c.code}>{c.code} ({c.discount_type === 'PERCENTAGE' ? `${c.discount_value}%` : `R$ ${c.discount_value}`})</option>
                    ))}
                  </select>
                  <div className="text-center my-6 text-slate-600 font-black text-[10px] uppercase tracking-widest flex items-center gap-4">
                     <span className="flex-1 h-px bg-slate-800"></span> OU CRIE UM NOVO <span className="flex-1 h-px bg-slate-800"></span>
                  </div>
                </div>
              )}

              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Código do Cupom</label>
                  <input type="text" value={cupomCodigo} onChange={(e)=>setCupomCodigo(e.target.value)} required placeholder="Ex: VIP10" className="w-full mt-2 bg-slate-950 border border-slate-800 rounded-2xl px-4 py-4 text-sm font-mono text-orange-400 outline-none focus:border-orange-500 transition-colors uppercase" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                     <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Tipo</label>
                     <select value={cupomTipo} onChange={(e)=>setCupomTipo(e.target.value as any)} className="w-full mt-2 bg-slate-950 border border-slate-800 rounded-2xl px-4 py-4 text-sm text-slate-100 outline-none focus:border-orange-500 appearance-none">
                       <option value="PERCENTAGE">Porcentagem (%)</option>
                       <option value="FIXED">Valor Fixo (R$)</option>
                     </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Desconto</label>
                    <input type="number" step="0.01" min="0" value={cupomValor} onChange={(e)=>setCupomValor(e.target.value)} placeholder={cupomTipo === 'PERCENTAGE' ? "Ex: 10" : "Ex: 50.00"} className="w-full mt-2 bg-slate-950 border border-slate-800 rounded-2xl px-4 py-4 text-sm font-mono text-slate-100 outline-none focus:border-orange-500 transition-colors" />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Validade (Opcional)</label>
                  <input type="date" value={cupomValidade} onChange={(e)=>setCupomValidade(e.target.value)} className="w-full mt-2 bg-slate-950 border border-slate-800 rounded-2xl px-4 py-4 text-sm font-mono text-slate-100 outline-none focus:border-orange-500 transition-colors" />
                </div>
              </div>

              <div className="pt-8 flex gap-3">
                <button type="button" onClick={() => setSelectedCliente(null)} className="flex-1 py-4 bg-slate-800 text-slate-300 font-black rounded-2xl text-[10px] uppercase tracking-widest hover:bg-slate-700 hover:text-white transition-all">Cancelar</button>
                <button type="submit" className="flex-1 py-4 bg-orange-500 hover:bg-orange-400 text-slate-950 font-black rounded-2xl text-[10px] uppercase tracking-widest transition-all shadow-xl shadow-orange-500/20">Atribuir Cupom</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </main>
  );
}