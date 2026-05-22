/**
 * src/app/custos/page.tsx
 * Gestão de Custos Fixos Reais - UX/UI Premium com Geração em Lote
 */
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/components/auth/auth-provider';

interface FixedCost {
  id: string;
  description: string;
  amount: number;
  category: string;
}

export default function CustosPage() {
  const { tenantId } = useAuth();
  const [costs, setCosts] = useState<FixedCost[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Estados de Formulário e Modal
  const [newCost, setNewCost] = useState({ description: '', amount: '', category: 'MAINTENANCE' });
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCost, setEditingCost] = useState<FixedCost | null>(null);

  const fetchCosts = async () => {
    if (!tenantId) return;
    setLoading(true);
    const { data, error } = await supabase.from('fixed_costs').select('*').eq('tenant_id', tenantId);
    if (!error && data) {
      setCosts(data);
    }
    setLoading(false);
  };

  useEffect(() => { 
    fetchCosts(); 
  }, [tenantId]);

  // ==========================================
  // AÇÕES DE BANCO DE DADOS (CRUD)
  // ==========================================

  const handleAddCost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId) return;

    await supabase.from('fixed_costs').insert([{
      tenant_id: tenantId,
      description: newCost.description,
      amount: parseFloat(newCost.amount),
      category: newCost.category
    }]);

    setNewCost({ description: '', amount: '', category: 'MAINTENANCE' });
    fetchCosts();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remover este custo fixo da sua base permanentemente?')) return;
    await supabase.from('fixed_costs').delete().eq('id', id);
    fetchCosts();
  };

  const openEditModal = (cost: FixedCost) => {
    setEditingCost(cost);
    setIsEditModalOpen(true);
  };

  const handleUpdateCost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCost) return;

    await supabase.from('fixed_costs')
      .update({
        description: editingCost.description,
        amount: editingCost.amount
      })
      .eq('id', editingCost.id);

    setIsEditModalOpen(false);
    setEditingCost(null);
    fetchCosts();
  };

  // ==========================================
  // LÓGICA DE NEGÓCIOS: INTEGRAÇÃO FINANCEIRA
  // ==========================================

  // Geração Individual (1 Item)
  const handleGenerateExpense = async (cost: FixedCost) => {
    if (!tenantId) return;
    const dueDate = new Date().toISOString();

    const { error } = await supabase.from('expenses').insert([{
      tenant_id: tenantId,
      description: cost.description,
      amount: cost.amount,
      category: cost.category || 'MAINTENANCE',
      due_date: dueDate
    }]);

    if (error) {
      alert('Erro ao lançar despesa no financeiro.');
    } else {
      alert(`✅ ${cost.description} lançado no Contas a Pagar com sucesso!`);
    }
  };

  // Geração Global (Bulk Insert - Ultra Performance)
  const handleGenerateAllExpenses = async () => {
    if (!tenantId || costs.length === 0) return;
    
    if (!confirm('Isso vai lançar TODOS os seus custos fixos no Contas a Pagar deste mês. Deseja continuar?')) return;

    setIsGenerating(true);
    const dueDate = new Date().toISOString();

    // Mapeia todos os custos fixos para o formato da tabela de despesas
    const expensesToInsert = costs.map(cost => ({
      tenant_id: tenantId,
      description: cost.description,
      amount: cost.amount,
      category: cost.category || 'MAINTENANCE',
      due_date: dueDate
    }));

    // Insere tudo de uma vez no PostgreSQL
    const { error } = await supabase.from('expenses').insert(expensesToInsert);

    setIsGenerating(false);

    if (error) {
      alert('Erro ao processar as despesas em lote. Verifique a conexão.');
    } else {
      alert(`🚀 Sucesso! ${costs.length} despesas foram lançadas no seu módulo Financeiro.`);
    }
  };

  const totalFixed = costs.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

  return (
    <main className="min-h-screen bg-slate-950 text-white p-8 flex-1 overflow-y-auto font-sans relative">
      <header className="mb-10 flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-green-500 uppercase tracking-tighter">Custos Fixos</h1>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">Gestão de Sobrevivência e Margem</p>
        </div>
        
        {/* BOTÃO GLOBAL DE GERAÇÃO */}
        <button 
          onClick={handleGenerateAllExpenses}
          disabled={isGenerating || costs.length === 0}
          className="bg-orange-500 text-slate-950 px-6 py-4 rounded-2xl font-black uppercase text-[11px] tracking-widest hover:bg-orange-400 hover:scale-[1.02] transition-all flex items-center gap-3 shadow-lg shadow-orange-500/20 disabled:opacity-50 disabled:hover:scale-100"
        >
          {isGenerating ? (
            <span className="animate-pulse">Processando...</span>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
              Gerar Despesas do Mês
            </>
          )}
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COLUNA ESQUERDA: Formulário de Cadastro */}
        <section className="bg-slate-900 p-8 rounded-[2.5rem] border border-slate-800 h-fit shadow-2xl">
          <h2 className="text-[10px] font-black uppercase tracking-widest mb-6 text-slate-500">Novo Gasto Mensal</h2>
          <form onSubmit={handleAddCost} className="space-y-5">
            <div>
              <input 
                placeholder="Descrição (ex: Aluguel Loja)"
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-sm font-bold text-slate-200 outline-none focus:border-green-500 transition-colors placeholder:text-slate-600"
                value={newCost.description}
                onChange={e => setNewCost({...newCost, description: e.target.value})}
                required
              />
            </div>
            <div>
              <input 
                type="number" step="0.01"
                placeholder="Valor Mensal (R$)"
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-sm font-mono font-bold text-slate-200 outline-none focus:border-green-500 transition-colors placeholder:text-slate-600"
                value={newCost.amount}
                onChange={e => setNewCost({...newCost, amount: e.target.value})}
                required
              />
            </div>
            <button className="w-full bg-green-500 text-slate-950 py-4 rounded-2xl font-black uppercase text-[11px] tracking-widest hover:bg-green-400 hover:scale-[1.02] transition-all">
              Adicionar Despesa
            </button>
          </form>
        </section>

        {/* COLUNA DIREITA: Dashboard e Tabela */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Card de Resumo Financeiro */}
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] flex flex-col justify-center relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
            <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2 z-10">Total Fixo Mensal</span>
            <span className="text-5xl font-mono font-black text-green-500 z-10 tracking-tighter">
              R$ {totalFixed.toFixed(2)}
            </span>
            <div className="mt-4 w-full h-1 bg-slate-800 rounded-full overflow-hidden z-10">
              <div className="h-full bg-green-500 w-1/3"></div>
            </div>
          </div>

          {/* Tabela de Custos */}
          <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
            {loading ? (
              <div className="p-10 text-center text-slate-500 text-xs font-bold uppercase tracking-widest">Carregando custos...</div>
            ) : costs.length === 0 ? (
              <div className="p-10 text-center text-slate-500 text-xs font-bold uppercase tracking-widest">Nenhum custo fixo cadastrado.</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-slate-950/50 text-[10px] font-black uppercase text-slate-600 border-b border-slate-800">
                  <tr>
                    <th className="p-6 text-left tracking-widest">Descrição</th>
                    <th className="p-6 text-right tracking-widest">Valor (R$)</th>
                    <th className="p-6 text-center tracking-widest">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {costs.map(cost => (
                    <tr key={cost.id} className="hover:bg-slate-800/30 transition-colors group">
                      <td className="p-6 font-bold text-slate-300">{cost.description}</td>
                      <td className="p-6 text-right font-mono font-bold text-slate-400">R$ {Number(cost.amount).toFixed(2)}</td>
                      <td className="p-6">
                        <div className="flex items-center justify-center gap-3 opacity-80 group-hover:opacity-100 transition-opacity">
                          
                          {/* Editar */}
                          <button onClick={() => openEditModal(cost)} className="p-2 bg-slate-950 border border-slate-800 rounded-xl text-green-500 hover:border-green-500 hover:bg-green-500/10 transition-all" title="Editar">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                          </button>
                          
                          {/* Lançar Individual */}
                          <button onClick={() => handleGenerateExpense(cost)} className="p-2 bg-slate-950 border border-slate-800 rounded-xl text-orange-500 hover:border-orange-500 hover:bg-orange-500/10 transition-all" title="Lançar Apenas Este">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                          </button>

                          {/* Deletar */}
                          <button onClick={() => handleDelete(cost.id)} className="p-2 bg-slate-950 border border-slate-800 rounded-xl text-red-500 hover:border-red-500 hover:bg-red-500/10 transition-all" title="Excluir Permanentemente">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                          </button>

                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* MODAL DE EDIÇÃO */}
      {isEditModalOpen && editingCost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] w-full max-w-md shadow-2xl">
            <h3 className="text-[10px] font-black uppercase tracking-widest mb-6 text-green-500">Editar Custo Fixo</h3>
            <form onSubmit={handleUpdateCost} className="space-y-5">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 block">Descrição</label>
                <input 
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-sm font-bold text-slate-200 outline-none focus:border-green-500"
                  value={editingCost.description}
                  onChange={e => setEditingCost({...editingCost, description: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 block">Valor Mensal (R$)</label>
                <input 
                  type="number" step="0.01"
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-sm font-mono font-bold text-slate-200 outline-none focus:border-green-500"
                  value={editingCost.amount}
                  onChange={e => setEditingCost({...editingCost, amount: parseFloat(e.target.value)})}
                  required
                />
              </div>
              <div className="flex gap-4 pt-2">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="flex-1 bg-slate-800 text-slate-300 py-4 rounded-2xl font-black uppercase text-[11px] tracking-widest hover:bg-slate-700 transition-all">
                  Cancelar
                </button>
                <button type="submit" className="flex-1 bg-green-500 text-slate-950 py-4 rounded-2xl font-black uppercase text-[11px] tracking-widest hover:bg-green-400 transition-all">
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}