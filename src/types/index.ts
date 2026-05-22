/**
 * src/types/index.ts
 * DICIONÁRIO MESTRE - BLINDAGEM CONTRA ERRO 'NEVER'
 * Atualização: Adicionadas as interfaces Post e Comment para o motor de SEO
 */

export type CalculationType = 'AREA' | 'UNIT' | 'TIME' | 'FIXED';
export type OrderStatus = 'QUOTATION' | 'SERVICE_ORDER' | 'PRODUCTION' | 'COMPLETED' | 'CANCELLED';
export type PaymentStatus = 'PENDING' | 'PARTIAL' | 'PAID';
export type ExpenseCategory = 'MAINTENANCE' | 'SUPPLIES' | 'LOGISTICS' | 'FOOD' | 'OTHER';

export interface Customer {
  id: string;
  tenant_id: string;
  name: string;
  whatsapp: string;
  birthdate?: string | null;
  coupon?: string | null;
}

export interface Coupon {
  id: string;
  tenant_id: string;
  code: string;
  discount_type: 'FIXED' | 'PERCENTAGE';
  discount_value: number;
  valid_until?: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Product {
  id: string;
  tenant_id: string;
  name: string;
  calculation_type: CalculationType;
  unit: string;
  base_price: number;
  cost_price: number;
  is_outsourced: boolean;
}

export interface OrderItem {
  id: string;
  product_id: string;
  description: string;
  quantity: number;
  width?: number | null;
  height?: number | null;
  unit_price: number;
  total_price: number;
  cost_total: number;
  order_id?: string;
}

export interface Order {
  id: string;
  tenant_id: string;
  customer_id?: string | null;
  status: OrderStatus;
  total: number;
  down_payment_value: number;
  discount_value: number;
  payment_status: PaymentStatus;
  delivery_date?: string | null;
  created_at: string;
  archived: boolean;
}

export interface Receipt {
  id: string;
  tenant_id: string;
  order_id: string;
  amount: number;
  payment_date: string;
  description?: string | null;
  created_at: string;
}

export interface Expense {
  id: string;
  tenant_id: string;
  description: string;
  amount: number;
  category: string;
  due_date: string;
  payment_date?: string | null;
  created_at: string;
}

export interface Post {
  id: string;
  tenant_id: string;
  title: string;
  slug: string;
  content: string;
  cover_image?: string | null;
  video_url?: string | null;
  tags?: string | null;
  is_published: boolean;
  published_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: string;
  post_id: string;
  author_name: string;
  content: string;
  is_approved: boolean;
  created_at: string;
}

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
    };
    Functions: {
      create_order_with_items: { Args: any; Returns: any };
    };
  };
}