// src/types/index.ts
export type CalculationType = 'AREA' | 'UNIT' | 'TIME' | 'FIXED';
export type OrderStatus = 'QUOTATION' | 'SERVICE_ORDER' | 'PRODUCTION' | 'COMPLETED' | 'CANCELLED';
export type PaymentStatus = 'PENDING' | 'PARTIAL' | 'PAID';
export type ExpenseCategory = 'MAINTENANCE' | 'SUPPLIES' | 'LOGISTICS' | 'FOOD' | 'OTHER';

export interface WizardOption { label: string; price_modifier: number; }
export interface WizardStep { id: string; title: string; subtitle: string; type: 'single' | 'multiple'; options: WizardOption[]; }
export interface QuantityTier { min: number; max: number | null; discount_percentage: number; }
export interface WizardConfig { steps: WizardStep[]; quantity_tiers: QuantityTier[]; base_production_days: number; min_quantity?: number; has_art_module?: boolean; art_fee?: number; art_rules?: string; }
export interface OrcamentoData { nome: string; whatsapp: string; produto_id: string; produto_nome: string; quantidade: number; selections: Record<string, string | string[]>; precisa_arte?: boolean; valorUnitario: number; valorTotal: number; }

export const initialOrcamentoData: OrcamentoData = { nome: '', whatsapp: '', produto_id: '', produto_nome: '', quantidade: 1, selections: {}, precisa_arte: undefined, valorUnitario: 0, valorTotal: 0 };

export interface Customer { id: string; tenant_id: string; name: string; whatsapp: string; birthdate?: string | null; coupon?: string | null; }
export interface Coupon { id: string; tenant_id: string; code: string; discount_type: 'FIXED' | 'PERCENTAGE'; discount_value: number; valid_until?: string | null; is_active: boolean; created_at: string; }
export interface Product { id: string; tenant_id: string; name: string; calculation_type: CalculationType; unit: string; base_price: number; cost_price: number; is_outsourced: boolean; show_on_website?: boolean; wizard_config?: WizardConfig | null; has_detailed_cost?: boolean; recommended_price?: number | null; }
export interface OrderItem { id: string; product_id: string; description: string; quantity: number; width?: number | null; height?: number | null; unit_price: number; total_price: number; cost_total: number; order_id?: string; cost_snapshot?: any; net_margin?: number; }
export interface Order { id: string; tenant_id: string; customer_id?: string | null; status: OrderStatus; total: number; down_payment_value: number; discount_value: number; payment_status: PaymentStatus; delivery_date?: string | null; created_at: string; archived: boolean; }
export interface Receipt { id: string; tenant_id: string; order_id: string; amount: number; payment_date: string; description?: string | null; created_at: string; }
export interface Expense { id: string; tenant_id: string; description: string; amount: number; category: string; due_date: string; payment_date?: string | null; created_at: string; }
export interface Post { id: string; tenant_id: string; title: string; slug: string; content: string; cover_image?: string | null; video_url?: string | null; tags?: string | null; is_published: boolean; published_at?: string | null; created_at: string; updated_at: string; }
export interface Comment { id: string; post_id: string; author_name: string; content: string; is_approved: boolean; created_at: string; }

export interface B2BCategoryRow { id: string; tenant_id: string; name: string; slug: string; is_active: boolean; created_at: string; }
export interface B2BProductRow { id: string; tenant_id: string; category_id?: string | null; slug: string; title: string; description?: string | null; dimensions: string; image_url: string; gallery_urls: string[]; is_active: boolean; created_at: string; }
export interface B2BVariantRow { id: string; product_id: string; name: string; paper_type: string; color_type: string; handle_type?: string | null; is_active: boolean; created_at: string; }
export interface B2BPricingTierRow { id: string; product_id: string; min_quantity: number; unit_price: number; created_at: string; }

// NOVAS INTERFACES DO MOTOR DE PRECIFICAÇÃO E TENANT
export interface Tenant { id: string; name: string; address: string; phone: string; pix_key: string; min_down_payment_pct: number; }
export interface TenantPricingConfig { tenant_id: string; target_margin: number; tax_percentage: number; payment_fee_percentage: number; fixed_cost_apportionment_method: 'PERCENTAGE' | 'HOURS' | 'FIXED_VALUE'; default_loss_percentage: number; created_at?: string; updated_at?: string; }
export interface ProductCostComponent { id: string; tenant_id: string; product_id: string; name: string; type: string; quantity: number; unit: string; unit_cost: number; loss_percentage: number; is_active: boolean; created_at?: string; }

export interface Database {
  public: {
    Tables: {
      customers: { Row: Customer; Insert: any; Update: any };
      coupons: { Row: Coupon; Insert: any; Update: any };
      products: { Row: Product; Insert: any; Update: any };
      orders: { Row: Order; Insert: any; Update: any };
      order_items: { Row: OrderItem; Insert: any; Update: any };
      receipts: { Row: Receipt; Insert: any; Update: any };
      expenses: { Row: Expense; Insert: any; Update: any };
      posts: { Row: Post; Insert: any; Update: any };
      comments: { Row: Comment; Insert: any; Update: any };
      b2b_categories: { Row: B2BCategoryRow; Insert: any; Update: any };
      b2b_products: { Row: B2BProductRow; Insert: any; Update: any };
      b2b_variants: { Row: B2BVariantRow; Insert: any; Update: any };
      b2b_pricing_tiers: { Row: B2BPricingTierRow; Insert: any; Update: any };
      tenants: { Row: Tenant; Insert: any; Update: any };
      tenant_pricing_configs: { Row: TenantPricingConfig; Insert: any; Update: any };
      product_cost_components: { Row: ProductCostComponent; Insert: any; Update: any };
    };
    Functions: {
      create_order_with_items: { Args: any; Returns: any };
    };
  };
}