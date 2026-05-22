/**
 * src/components/vendas/product-card.tsx
 * Componente visual para exibir um produto no catálogo.
 */

import { Product } from '@/types';

interface ProductCardProps {
  product: Product;
  onAdd: (product: Product) => void;
}

export default function ProductCard({ product, onAdd }: ProductCardProps) {
  // Cores baseadas no tipo de cálculo para facilitar a visão do operador
  const typeLabels = {
    AREA: { label: 'm²', color: 'bg-blue-500/20 text-blue-400' },
    UNIT: { label: 'Unid.', color: 'bg-purple-500/20 text-purple-400' },
    TIME: { label: 'Hora', color: 'bg-orange-500/20 text-orange-400' },
    FIXED: { label: 'Fixo', color: 'bg-slate-500/20 text-slate-400' },
  };

  const currentType = typeLabels[product.calculation_type];

  return (
    <div 
      onClick={() => onAdd(product)}
      className="bg-slate-900 border border-slate-800 p-4 rounded-xl hover:border-green-500 transition-all cursor-pointer group"
    >
      <div className="flex justify-between items-start mb-2">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${currentType.color}`}>
          {currentType.label}
        </span>
        {product.is_outsourced && (
          <span className="text-[10px] bg-red-500/10 text-red-400 px-2 py-0.5 rounded border border-red-500/20">
            Terceirizado
          </span>
        )}
      </div>
      
      <h3 className="font-semibold text-slate-100 group-hover:text-green-400 transition-colors">
        {product.name}
      </h3>
      
      <p className="text-sm text-slate-400 mt-1">
        R$ {product.base_price.toFixed(2)}
        <span className="text-[10px] ml-1">
          {product.calculation_type === 'AREA' ? '/m²' : '/un'}
        </span>
      </p>
      
      <div className="mt-4 flex justify-end">
        <span className="text-xs text-slate-500 group-hover:text-white">+ Adicionar</span>
      </div>
    </div>
  );
}