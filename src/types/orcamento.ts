export interface OrcamentoData {
    nome: string;
    whatsapp: string;
    produto_id: string;
    produto_nome: string;
    quantidade: number;
    selections: Record<string, string | string[]>; // Guarda dinamicamente { "step_1": "Algodão", "step_2": ["Manga Longa", "Tag"] }
    valorUnitario: number;
    valorTotal: number;
  }
  
  export const initialOrcamentoData: OrcamentoData = {
    nome: '',
    whatsapp: '',
    produto_id: '',
    produto_nome: '',
    quantidade: 1, 
    selections: {},
    valorUnitario: 0,
    valorTotal: 0,
  };