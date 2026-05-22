/**
 * src/lib/supabase/client.ts
 * CLIENTE SUPABASE COM BYPASS DE TIPAGEM PARA O EDITOR
 */
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Criamos o cliente e forçamos o tipo para evitar que o editor trave em 'never'
const client = createClient<Database>(supabaseUrl, supabaseAnonKey);

export const supabase = client as any;