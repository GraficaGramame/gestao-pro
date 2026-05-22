import { CalculationType } from '@/types';

// Função principal para calcular o preço total de um item
export function calculateItemTotal(
  type: CalculationType,
  price: number,
  quantity: number,
  width?: number,
  height?: number
): number {
  switch (type) {
    case 'AREA':
      if (!width || !height) return 0;
      return width * height * price * quantity;
    case 'TIME':
    case 'UNIT':
    case 'FIXED':
    default:
      return price * quantity;
  }
}

// Função de "Saúde Financeira" - Calcula o lucro real líquido
export function calculateItemHealth(
  totalPrice: number,
  totalCost: number,
  fixedCostsPercent: number = 15
) {
  const variableProfit = totalPrice - totalCost;
  const fixedCostsValue = totalPrice * (fixedCostsPercent / 100);
  const netProfit = variableProfit - fixedCostsValue;
  const margin = totalPrice > 0 ? (netProfit / totalPrice) * 100 : 0;

  return {
    netProfit,
    margin,
    isHealthy: margin > 20,
  };
}
// Exemplo de lógica para integrar no BI futuramente:
export const calculateRealMargin = (faturamento: number, custoMaterial: number, totalCustosFixos: number) => {
  const custoFixoProporcional = totalCustosFixos; // Aqui você pode dividir pelo faturamento esperado
  const lucroBruto = faturamento - custoMaterial - custoFixoProporcional;
  const margem = (lucroBruto / faturamento) * 100;
  
  return {
    lucroBruto,
    margem,
    isHealthy: margem > 20 // Exemplo: saúde acima de 20% após descontar TUDO
  };
};