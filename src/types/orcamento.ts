export interface OrcamentoData {
    nome: string;
    whatsapp: string;
    produto: string;
    tecido: string;
    estampa: string;
    quantidade: string;
    adicionais: string[];
    prazo: string;
    valorUnitario: number;
  }
  
  export const initialOrcamentoData: OrcamentoData = {
    nome: '',
    whatsapp: '',
    produto: '',
    tecido: '',
    estampa: '',
    quantidade: '',
    adicionais: [],
    prazo: '',
    valorUnitario: 42.00,
  };