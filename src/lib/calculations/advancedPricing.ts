// src/lib/calculations/advancedPricing.ts

export interface CostComponent {
    id: string;
    name: string;
    type: 'RAW_MATERIAL' | 'OUTSOURCING' | 'LABOR' | 'PACKAGING' | 'OTHER';
    quantity: number;
    unit: string;
    unit_cost: number;
    loss_percentage: number;
  }
  
  export interface PricingConfig {
    target_margin: number;
    tax_percentage: number;
    payment_fee_percentage: number;
    fixed_cost_apportionment_method: 'PERCENTAGE' | 'HOURS' | 'FIXED_VALUE';
    fixed_cost_rate?: number; // Ex: 8.27 se for 8,27% de rateio
  }
  
  export interface ProfitabilitySnapshot {
    directCost: number;
    apportionedFixedCost: number;
    commercialCosts: number; // Impostos + Taxas de cartão
    totalCost: number;
    netProfit: number;
    netMargin: number;
    isHealthy: boolean;
  }
  
  /**
   * Calcula o custo de um componente individual aplicando a perda técnica.
   * Ex: Custo de R$ 10,00 com 15% de perda = R$ 11,50
   */
  export function calculateComponentCost(component: CostComponent): number {
    const baseCost = component.quantity * component.unit_cost;
    if (component.loss_percentage > 0) {
      // A perda aumenta o custo do material necessário para produzir a unidade
      const lossMultiplier = 1 + (component.loss_percentage / 100);
      return baseCost * lossMultiplier;
    }
    return baseCost;
  }
  
  /**
   * Soma o custo direto de todos os componentes de um produto.
   */
  export function calculateDirectCost(components: CostComponent[]): number {
    return components.reduce((total, comp) => total + calculateComponentCost(comp), 0);
  }
  
  /**
   * Calcula o rateio do custo fixo para uma unidade de produto.
   */
  export function calculateFixedCostApportionment(
    directCost: number,
    config: PricingConfig
  ): number {
    if (!config.fixed_cost_rate || config.fixed_cost_rate <= 0) return 0;
  
    switch (config.fixed_cost_apportionment_method) {
      case 'PERCENTAGE':
        // Aplica um percentual sobre o custo direto como rateio de custos fixos
        return directCost * (config.fixed_cost_rate / 100);
      case 'FIXED_VALUE':
        // Adiciona um valor fixo em reais (ex: R$ 2,00 por item para cobrir custos)
        return config.fixed_cost_rate;
      case 'HOURS':
        // Lógica a ser implementada caso a gráfica utilize custo/hora de máquina
        return 0; 
      default:
        return 0;
    }
  }
  
  /**
   * Calcula os custos comerciais (impostos e taxas de pagamento) com base no preço de venda.
   */
  export function calculateCommercialCosts(
    sellingPrice: number,
    config: PricingConfig
  ): number {
    const taxCost = sellingPrice * (config.tax_percentage / 100);
    const paymentFeeCost = sellingPrice * (config.payment_fee_percentage / 100);
    return taxCost + paymentFeeCost;
  }
  
  /**
   * Gera o Preço Recomendado com base na estrutura de custos e margem desejada.
   * Utiliza o cálculo "Markup Divisor" (Preço = Custo Total / (1 - %Despesas - %Margem)).
   */
  export function calculateRecommendedPrice(
    directCost: number,
    apportionedFixedCost: number,
    config: PricingConfig
  ): number {
    const productionCost = directCost + apportionedFixedCost;
    
    const totalDeductionsPercent = 
      config.tax_percentage + 
      config.payment_fee_percentage + 
      config.target_margin;
  
    // Proteção contra divisão por zero ou negativa se as taxas + margem passarem de 100%
    if (totalDeductionsPercent >= 100) {
      return productionCost * 2; // Fallback de segurança (markup de 100% no custo)
    }
  
    const divisor = 1 - (totalDeductionsPercent / 100);
    const recommendedPrice = productionCost / divisor;
  
    // Retorna com arredondamento seguro de 2 casas decimais
    return Math.round(recommendedPrice * 100) / 100;
  }
  
  /**
   * Calcula a rentabilidade real de uma venda efetuada ou de um preço manual.
   * Retorna os dados prontos para o Snapshot que será salvo em order_items.
   */
  export function calculateRealProfitability(
    sellingPrice: number,
    directCost: number,
    apportionedFixedCost: number,
    config: PricingConfig
  ): ProfitabilitySnapshot {
    const commercialCosts = calculateCommercialCosts(sellingPrice, config);
    const totalCost = directCost + apportionedFixedCost + commercialCosts;
    
    const netProfit = sellingPrice - totalCost;
    const netMargin = sellingPrice > 0 ? (netProfit / sellingPrice) * 100 : 0;
  
    return {
      directCost: Number(directCost.toFixed(2)),
      apportionedFixedCost: Number(apportionedFixedCost.toFixed(2)),
      commercialCosts: Number(commercialCosts.toFixed(2)),
      totalCost: Number(totalCost.toFixed(2)),
      netProfit: Number(netProfit.toFixed(2)),
      netMargin: Number(netMargin.toFixed(2)),
      isHealthy: netMargin >= config.target_margin,
    };
  }