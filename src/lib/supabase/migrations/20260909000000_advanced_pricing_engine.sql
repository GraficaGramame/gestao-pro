-- supabase/migrations/20260909000000_advanced_pricing_engine.sql

-- 1. Criação da tabela de configurações de precificação por tenant
CREATE TABLE IF NOT EXISTS public.tenant_pricing_configs (
  tenant_id uuid PRIMARY KEY,
  target_margin numeric(5, 2) NOT NULL DEFAULT 30.00 CHECK (target_margin >= 0),
  tax_percentage numeric(5, 2) NOT NULL DEFAULT 0.00 CHECK (tax_percentage >= 0),
  payment_fee_percentage numeric(5, 2) NOT NULL DEFAULT 0.00 CHECK (payment_fee_percentage >= 0),
  fixed_cost_apportionment_method text NOT NULL DEFAULT 'PERCENTAGE' CHECK (fixed_cost_apportionment_method IN ('PERCENTAGE', 'HOURS', 'FIXED_VALUE')),
  default_loss_percentage numeric(5, 2) NOT NULL DEFAULT 0.00 CHECK (default_loss_percentage >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Habilitar RLS na tabela de configurações
ALTER TABLE public.tenant_pricing_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenants can view their own pricing configs" 
  ON public.tenant_pricing_configs FOR SELECT 
  USING (tenant_id = auth.uid()); -- Ajuste o auth.uid() conforme sua lógica atual de tenant_id

CREATE POLICY "Tenants can update their own pricing configs" 
  ON public.tenant_pricing_configs FOR UPDATE 
  USING (tenant_id = auth.uid());

-- 2. Criação da tabela de componentes de custo dos produtos
CREATE TABLE IF NOT EXISTS public.product_cost_components (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  product_id uuid NOT NULL REFERENCES public.products (id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('RAW_MATERIAL', 'OUTSOURCING', 'LABOR', 'PACKAGING', 'OTHER')),
  quantity numeric(12, 4) NOT NULL CHECK (quantity > 0),
  unit text NOT NULL,
  unit_cost numeric(12, 4) NOT NULL CHECK (unit_cost >= 0),
  loss_percentage numeric(5, 2) NOT NULL DEFAULT 0.00 CHECK (loss_percentage >= 0),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_product_cost_components_product_id ON public.product_cost_components (product_id);
CREATE INDEX IF NOT EXISTS idx_product_cost_components_tenant_id ON public.product_cost_components (tenant_id);

-- Habilitar RLS na tabela de componentes
ALTER TABLE public.product_cost_components ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenants can view their own cost components" 
  ON public.product_cost_components FOR SELECT 
  USING (tenant_id = auth.uid());

CREATE POLICY "Tenants can manage their own cost components" 
  ON public.product_cost_components FOR ALL 
  USING (tenant_id = auth.uid());

-- 3. Alterações seguras na tabela products (Adição de colunas sem quebrar as existentes)
ALTER TABLE public.products 
  ADD COLUMN IF NOT EXISTS recommended_price numeric(12, 2),
  ADD COLUMN IF NOT EXISTS has_detailed_cost boolean NOT NULL DEFAULT false;

-- 4. Alterações seguras na tabela order_items (Preservação de histórico)
ALTER TABLE public.order_items 
  ADD COLUMN IF NOT EXISTS cost_snapshot jsonb,
  ADD COLUMN IF NOT EXISTS net_margin numeric(5, 2);