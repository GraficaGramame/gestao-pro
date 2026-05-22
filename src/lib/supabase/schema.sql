create extension if not exists pgcrypto;

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  name text not null,
  whatsapp text not null
);

create index if not exists idx_customers_tenant_id on public.customers (tenant_id);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  name text not null,
  calculation_type text not null check (calculation_type in ('AREA', 'UNIT', 'TIME', 'FIXED')),
  base_price numeric(12, 2) not null check (base_price >= 0),
  cost_price numeric(12, 2) not null check (cost_price >= 0),
  is_outsourced boolean not null default false
);

create index if not exists idx_products_tenant_id on public.products (tenant_id);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  customer_id uuid references public.customers (id) on delete set null,
  status text not null check (status in ('QUOTATION', 'SERVICE_ORDER', 'PRODUCTION', 'COMPLETED', 'CANCELLED')),
  total numeric(12, 2) not null check (total >= 0),
  down_payment_value numeric(12, 2) not null default 0 check (down_payment_value >= 0),
  payment_status text not null check (payment_status in ('PENDING', 'PARTIAL', 'PAID')),
  created_at timestamptz not null default now()
);

create index if not exists idx_orders_tenant_id on public.orders (tenant_id);
create index if not exists idx_orders_customer_id on public.orders (customer_id);
create index if not exists idx_orders_created_at on public.orders (created_at desc);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid not null references public.products (id),
  description text not null,
  quantity numeric(12, 3) not null check (quantity > 0),
  width numeric(12, 3),
  height numeric(12, 3),
  unit_price numeric(12, 2) not null check (unit_price >= 0),
  total_price numeric(12, 2) not null check (total_price >= 0),
  cost_total numeric(12, 2) not null check (cost_total >= 0)
);

create index if not exists idx_order_items_order_id on public.order_items (order_id);
create index if not exists idx_order_items_product_id on public.order_items (product_id);
