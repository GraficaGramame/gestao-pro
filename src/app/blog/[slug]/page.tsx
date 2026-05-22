/**
 * src/app/blog/[slug]/page.tsx
 * Página Dinâmica de Leitura de Matéria - Gráfica Gramame
 */
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

export default function BlogPost() {
  const { slug } = useParams();
  const [post, setPost] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form de comentário
  const [author, setAuthor] = useState('');
  const [content, setContent] = useState('');
  const [commentSent, setCommentSent] = useState(false);

  useEffect(() => {
    async function fetchPostAndComments() {
      if (!slug) return;
      
      // Busca o Post
      const { data: postData } = await supabase
        .from('posts')
        .select('*')
        .eq('slug', slug)
        .eq('is_published', true)
        .single();
        
      if (postData) {
        setPost(postData);
        // Busca comentários aprovados
        const { data: commentsData } = await supabase
          .from('comments')
          .select('*')
          .eq('post_id', postData.id)
          .eq('is_approved', true)
          .order('created_at', { ascending: false });
        
        setComments(commentsData || []);
      }
      setLoading(false);
    }
    fetchPostAndComments();
  }, [slug]);

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!author || !content || !post) return;

    try {
      await supabase.from('comments').insert([{
        post_id: post.id,
        author_name: author,
        content: content,
        is_approved: false // Fica aguardando sua aprovação no admin
      }]);
      setCommentSent(true);
      setAuthor('');
      setContent('');
    } catch (error) {
      alert('Erro ao enviar comentário.');
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA]"><div className="w-12 h-12 border-4 border-[#061b8f] border-t-[#f5c400] rounded-full animate-spin"></div></div>;
  if (!post) return <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] text-2xl font-black text-[#061b8f]">Matéria não encontrada.</div>;

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-sans text-slate-900 pb-32">
      {/* HEADER */}
      <header className="w-full h-20 bg-white/80 backdrop-blur-lg border-b border-slate-200/50 flex items-center sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 w-full flex justify-between items-center">
          <Link href="/" className="hover:opacity-80 transition-opacity">
            <img src="/assets/logo.png" alt="Gráfica Gramame" className="h-8 w-auto" />
          </Link>
          <Link href="/blog" className="text-slate-600 hover:text-[#061b8f] font-black uppercase text-[11px] tracking-widest">
            ← Voltar ao Blog
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        {post.tags && (
           <div className="mb-6"><span className="bg-[#f5c400]/20 text-[#061b8f] px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest">{post.tags}</span></div>
        )}
        
        <h1 className="text-4xl md:text-6xl font-black text-[#061b8f] tracking-tighter mb-6 leading-tight">{post.title}</h1>
        <p className="text-slate-500 font-mono text-xs uppercase tracking-widest mb-10">Publicado em {new Date(post.published_at || post.created_at).toLocaleDateString('pt-BR')}</p>

        {post.cover_image && (
          <div className="w-full h-[300px] md:h-[500px] bg-slate-200 rounded-[2rem] overflow-hidden mb-12 shadow-xl shadow-slate-200/50">
            <img src={post.cover_image} alt={post.title} className="w-full h-full object-cover" />
          </div>
        )}

        {post.video_url && (
          <div className="w-full aspect-video rounded-[2rem] overflow-hidden mb-12 shadow-xl bg-slate-900">
             <iframe src={post.video_url.replace('watch?v=', 'embed/')} className="w-full h-full" allowFullScreen></iframe>
          </div>
        )}

        {/* O conteúdo do Post. Renderizamos o HTML perfeitamente */}
        <article 
          className="prose prose-lg prose-slate max-w-none prose-headings:text-[#061b8f] prose-headings:font-black prose-a:text-[#f5c400]"
          dangerouslySetInnerHTML={{ __html: post.content.replace(/\n/g, '<br/>') }}
        />

        <div className="mt-20 pt-10 border-t border-slate-200">
           <h3 className="text-3xl font-black text-[#061b8f] mb-8">Comentários ({comments.length})</h3>
           
           {/* Form de Comentário */}
           <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 mb-12">
             {commentSent ? (
               <div className="bg-green-50 text-green-700 p-6 rounded-2xl font-bold text-center">Obrigado! Seu comentário foi enviado e está aguardando aprovação.</div>
             ) : (
               <form onSubmit={handleComment} className="space-y-4">
                 <h4 className="font-black text-slate-700 mb-4">Deixe o seu comentário</h4>
                 <input type="text" placeholder="Seu Nome" value={author} onChange={(e)=>setAuthor(e.target.value)} required className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#061b8f] text-sm" />
                 <textarea placeholder="O que você achou desta matéria?" value={content} onChange={(e)=>setContent(e.target.value)} required rows={4} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#061b8f] text-sm"></textarea>
                 <button type="submit" className="px-8 py-4 bg-[#061b8f] hover:bg-blue-800 text-white font-black rounded-xl uppercase tracking-widest text-[11px] transition-all">Enviar Comentário</button>
               </form>
             )}
           </div>

           {/* Lista de Comentários Aprovados */}
           <div className="space-y-6">
             {comments.map(c => (
               <div key={c.id} className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                 <div className="flex items-center gap-3 mb-2">
                   <div className="w-10 h-10 bg-[#061b8f] text-white rounded-full flex items-center justify-center font-black">{c.author_name.charAt(0).toUpperCase()}</div>
                   <div>
                     <p className="font-black text-slate-800">{c.author_name}</p>
                     <p className="text-[10px] text-slate-500 font-mono">{new Date(c.created_at).toLocaleDateString('pt-BR')}</p>
                   </div>
                 </div>
                 <p className="text-slate-600 pl-13">{c.content}</p>
               </div>
             ))}
           </div>
        </div>
      </main>
    </div>
  );
}