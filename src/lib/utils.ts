import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function generateWhatsAppLink(
  payload: {
    productTitle: string;
    dimensions: string;
    variantName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    storeName: string;
    neighborhood: string;
    selectedServices: string[];
    upsellSelected?: boolean;
    upsellText?: string;
    utmSource?: string;
    utmCampaign?: string;
  },
  whatsappNumber: string = '5583998474211'
): string {
  const servicesText = payload.selectedServices.length > 0
    ? `\n🛠️ *Opcionais*: ${payload.selectedServices.join(', ')}`
    : '';

  const upsellBlock = payload.upsellSelected && payload.upsellText
    ? `\n🎁 *Combo/Upsell*: ${payload.upsellText}`
    : '';

  const utmBlock = payload.utmSource || payload.utmCampaign
    ? `\n\n📌 *Origem*: ${payload.utmSource || 'Direto'} ${payload.utmCampaign ? `(Campanha: ${payload.utmCampaign})` : ''}`
    : '';

  const message = `Olá Gráfica Gramame! Gostaria de fechar o seguinte pedido no Atacado B2B:

📦 *Produto*: ${payload.productTitle} (${payload.dimensions})
🎨 *Variação*: ${payload.variantName}
📊 *Quantidade*: ${payload.quantity} unidades
💵 *Preço Unitário*: ${formatCurrency(payload.unitPrice)}
💰 *Valor Total*: ${formatCurrency(payload.totalPrice)}${servicesText}${upsellBlock}

🏢 *Nome da Loja*: ${payload.storeName || 'Não informado'}
📍 *Bairro*: ${payload.neighborhood || 'Zona Sul - João Pessoa'}${utmBlock}
  `;

  return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
}