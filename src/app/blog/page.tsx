/**
 * src/app/blog/page.tsx
 * Vitrine Pública do Blog - Gráfica Gramame
 */
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';

export default function BlogIndex() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPosts() {
      // Puxa apenas os posts publicados
      const { data } = await supabase
        .from('posts')
        .select('*')
        .eq('is_published', true)
        .order('published_at', { ascending: false });
      
      setPosts(data || []);
      setLoading(false);
    }
    fetchPosts();
  }, []);

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-sans text-slate-900">
      {/* HEADER SIMPLIFICADO */}
      <header className="w-full h-20 bg-white/80 backdrop-blur-lg border-b border-slate-200/50 flex items-center sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 w-full flex justify-between items-center">
          <Link href="/" className="hover:opacity-80 transition-opacity">
            <img src="/assets/logo.png" alt="Gráfica Gramame" className="h-8 w-auto" />
          </Link>
          <Link href="/" className="text-slate-600 hover:text-[#061b8f] font-black uppercase text-[11px] tracking-widest">
            Voltar ao Site
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-black text-[#061b8f] tracking-tighter mb-4">Blog da Gramame</h1>
          <p className="text-slate-500 text-lg max-w-2xl mx-auto">Dicas, tendências e tudo o que você precisa saber sobre impressão digital, comunicação visual e vendas.</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-[#f5c400] border-t-transparent rounded-full animate-spin"></div></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map(post => (
              <Link href={`/blog/${post.slug}`} key={post.id} className="group bg-white rounded-[2rem] p-4 shadow-sm hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-500 border border-slate-100 flex flex-col h-full hover:-translate-y-2">
                <div className="h-64 bg-slate-100 rounded-[1.5rem] relative overflow-hidden flex-shrink-0 mb-6">
                  {post.cover_image ? (
                    <img src={post.cover_image} alt={post.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300 text-5xl bg-slate-100">📰</div>
                  )}
                  {post.tags && (
                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur text-[#061b8f] px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm">
                      {post.tags.split(',')[0]}
                    </div>
                  )}
                </div>
                <div className="px-4 pb-4 flex flex-col flex-grow">
                  <h3 className="text-xl font-black text-[#061b8f] mb-3 leading-tight">{post.title}</h3>
                  <p className="text-slate-400 text-xs font-mono mt-auto uppercase tracking-widest">
                    {new Date(post.published_at || post.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </Link>
            ))}
            {posts.length === 0 && (
              <div className="col-span-full text-center py-20 text-slate-500 font-bold">Nenhuma matéria publicada ainda.</div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}