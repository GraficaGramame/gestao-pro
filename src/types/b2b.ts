export type B2BCategoryType = 'sacolas' | 'tags' | 'adesivos' | 'caixas' | string;

export interface PricingTier {
  id: string;
  minQuantity: number;
  unitPrice: number;
}

export interface ProductVariant {
  id: string;
  name: string;
  paperType: string;
  colorType: 'Branca' | 'Colorida' | 'Lamicote Ouro' | 'Holográfica' | string;
  handleType?: 'Cordão' | 'Gorgurão' | 'Nenhum' | string;
  isActive: boolean;
}

export interface AdditionalService {
  id: string;
  name: string;
  price: number;
}

export interface B2BProduct {
  id: string;
  slug: string;
  title: string;
  category: B2BCategoryType;
  description?: string;
  dimensions: string;
  imageUrl: string;
  galleryUrls?: string[];
  isActive: boolean;

  // Taxas e Serviços Customizáveis pelo Admin
  artFee?: number;
  reviewFee?: number;

  // Bonificações e Combos de Upsell
  upsellActive: boolean;
  upsellTitle: string;
  upsellPrice: number;

  variants?: ProductVariant[];
  pricingTiers?: PricingTier[];
  additionalServices?: AdditionalService[];
}

export interface WhatsAppOrderPayload {
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
}