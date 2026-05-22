/**
 * src/app/blog-admin/page.tsx
 * CMS de Alta Performance e Motor de SEO - Gráfica Gramame
 */
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/components/auth/auth-provider';

export default function BlogAdminPage() {
  const { tenantId, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<'POSTS' | 'COMMENTS'>('POSTS');
  const [loading, setLoading] = useState(true);

  // Estados de Posts
  const [posts, setPosts] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  
  // Formulário do Post
  const [postId, setPostId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [content, setContent] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [tags, setTags] = useState('');
  const [isPublished, setIsPublished] = useState(false);

  // Estados de Comentários
  const [comments, setComments] = useState<any[]>([]);

  useEffect(() => {
    if (!tenantId) return;
    fetchData();
  }, [tenantId, activeTab]);

  const fetchData = async () => {
    setLoading(true);
    if (activeTab === 'POSTS') {
      const { data } = await supabase
        .from('posts')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });
      setPosts(data || []);
    } else {
      // Puxa comentários e o título do post correspondente
      const { data } = await supabase
        .from('comments')
        .select('*, posts(title)')
        .order('created_at', { ascending: false });
      setComments(data || []);
    }
    setLoading(false);
  };

  // Gerador de Slug (Transforma "Como Fazer Adesivo!" em "como-fazer-adesivo")
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    if (!postId) { // Só gera slug automático se for um post novo
      const autoSlug = newTitle
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Remove acentos
        .replace(/[^a-z0-9]+/g, '-') // Troca espaços e símbolos por hifens
        .replace(/(^-|-$)+/g, ''); // Remove hifens nas pontas
      setSlug(autoSlug);
    }
  };

  const handleSavePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !slug || !content) return alert("Título, Slug e Conteúdo são obrigatórios.");

    const payload = {
      tenant_id: tenantId,
      title,
      slug,
      content,
      cover_image: coverImage || null,
      video_url: videoUrl || null,
      tags: tags || null,
      is_published: isPublished,
      updated_at: new Date().toISOString(),
      published_at: isPublished && !postId ? new Date().toISOString() : null
    };

    try {
      if (postId) {
        await supabase.from('posts').update(payload).eq('id', postId).eq('tenant_id', tenantId);
        alert('Matéria atualizada com sucesso!');
      } else {
        await supabase.from('posts').insert([payload]);
        alert('Matéria criada com sucesso!');
      }
      resetForm();
      fetchData();
    } catch (error) {
      alert("Erro ao salvar matéria.");
    }
  };

  const editPost = (post: any) => {
    setPostId(post.id);
    setTitle(post.title);
    setSlug(post.slug);
    setContent(post.content);
    setCoverImage(post.cover_image || '');
    setVideoUrl(post.video_url || '');
    setTags(post.tags || '');
    setIsPublished(post.is_published);
    setIsEditing(true);
  };

  const deletePost = async (id: string) => {
    if (!confirm("Tem a certeza que deseja apagar esta matéria? Tudo será perdido.")) return;
    await supabase.from('posts').delete().eq('id', id).eq('tenant_id', tenantId);
    fetchData();
  };

  const resetForm = () => {
    setPostId(null); setTitle(''); setSlug(''); setContent(''); setCoverImage(''); setVideoUrl(''); setTags(''); setIsPublished(false); setIsEditing(false);
  };

  // Funções de Moderação de Comentários
  const toggleCommentApproval = async (id: string, currentStatus: boolean) => {
    await supabase.from('comments').update({ is_approved: !currentStatus }).eq('id', id);
    fetchData();
  };

  const deleteComment = async (id: string) => {
    if (!confirm("Apagar este comentário definitivamente?")) return;
    await supabase.from('comments').delete().eq('id', id);
    fetchData();
  };

  if (authLoading) return <div className="flex-1 h-screen flex items-center justify-center bg-slate-950"><div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="flex-1 p-10 h-screen overflow-y-auto bg-slate-950 custom-scrollbar">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4 border-b border-slate-900 pb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-100 tracking-tight">Estúdio de Conteúdo</h1>
          <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.2em] mt-1">SEO • Blog • Audiência</p>
        </div>
        
        {/* TABS */}
        <div className="flex items-center bg-slate-900 p-1 rounded-2xl border border-slate-800 shadow-2xl">
          <button 
            onClick={() => { setActiveTab('POSTS'); setIsEditing(false); }}
            className={`px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'POSTS' ? 'bg-green-500 text-slate-950 shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
          >
            Matérias & Artigos
          </button>
          <button 
            onClick={() => { setActiveTab('COMMENTS'); setIsEditing(false); }}
            className={`px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'COMMENTS' ? 'bg-blue-500 text-slate-950 shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
          >
            Moderação 💬
          </button>
        </div>
      </div>

      {activeTab === 'POSTS' && !isEditing && (
        <div className="animate-in fade-in">
          <div className="mb-6 flex justify-end">
             <button onClick={() => setIsEditing(true)} className="bg-green-500 hover:bg-green-400 text-slate-950 px-8 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all shadow-lg shadow-green-500/20">
               + Escrever Nova Matéria
             </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map(post => (
              <div key={post.id} className="bg-slate-900 rounded-[2rem] p-6 border border-slate-800 flex flex-col group hover:border-green-500/50 transition-colors">
                <div className="h-40 bg-slate-950 rounded-2xl mb-6 overflow-hidden relative border border-slate-800/50">
                   {post.cover_image ? (
                     <img src={post.cover_image} alt="Capa" className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500" />
                   ) : (
                     <div className="w-full h-full flex items-center justify-center text-slate-700 text-4xl">📰</div>
                   )}
                   <div className="absolute top-3 right-3">
                     {post.is_published ? 
                       <span className="bg-green-500 text-slate-950 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg">Publicado</span> : 
                       <span className="bg-slate-800 text-slate-400 border border-slate-700 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">Rascunho</span>
                     }
                   </div>
                </div>
                
                <h3 className="text-lg font-black text-slate-100 mb-2 leading-tight">{post.title}</h3>
                <p className="text-[10px] text-slate-500 font-mono mb-6">/blog/{post.slug}</p>
                
                <div className="mt-auto grid grid-cols-2 gap-3 pt-6 border-t border-slate-800/50">
                  <button onClick={() => editPost(post)} className="py-3 bg-slate-800 hover:bg-green-500 text-slate-300 hover:text-slate-950 font-black rounded-xl text-[10px] uppercase tracking-widest transition-colors">Editar</button>
                  <button onClick={() => deletePost(post.id)} className="py-3 bg-slate-950 hover:bg-red-500/20 text-slate-500 hover:text-red-500 font-black rounded-xl text-[10px] uppercase tracking-widest border border-slate-800 hover:border-red-500/30 transition-colors">Apagar</button>
                </div>
              </div>
            ))}
            {posts.length === 0 && !loading && (
              <div className="col-span-full py-20 text-center text-slate-600 font-black uppercase text-xs tracking-widest">Nenhuma matéria escrita ainda. Comece a dominar o Google!</div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'POSTS' && isEditing && (
        <div className="bg-slate-900 rounded-[3rem] p-10 border border-slate-800 shadow-2xl max-w-5xl mx-auto animate-in slide-in-from-bottom-8">
          <form onSubmit={handleSavePost} className="space-y-8">
            <div className="flex justify-between items-center mb-8 pb-8 border-b border-slate-800">
               <h2 className="text-2xl font-black text-white">{postId ? 'Editar Matéria' : 'Nova Matéria'}</h2>
               <button type="button" onClick={resetForm} className="text-slate-500 hover:text-white font-bold text-sm">✕ Cancelar</button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Título da Matéria (Chamativo)</label>
                  <input type="text" value={title} onChange={handleTitleChange} placeholder="Ex: Por que o Adesivo DTF é a melhor opção..." required className="w-full mt-2 bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-sm text-white focus:border-green-500 outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Slug (URL do Google) - Gerado Auto</label>
                  <input type="text" value={slug} onChange={(e) => setSlug(e.target.value)} required className="w-full mt-2 bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-sm text-green-500 font-mono outline-none focus:border-green-500" />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Categorias/Tags (Separadas por vírgula)</label>
                  <input type="text" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="Ex: DTF, Fachada, Dicas de Design" className="w-full mt-2 bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-sm text-slate-300 outline-none focus:border-green-500" />
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">URL da Imagem de Capa (Opcional)</label>
                  <input type="url" value={coverImage} onChange={(e) => setCoverImage(e.target.value)} placeholder="https://exemplo.com/foto.jpg" className="w-full mt-2 bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-sm text-blue-400 font-mono outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Link de Vídeo do YouTube (Opcional)</label>
                  <input type="url" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://youtube.com/watch?v=..." className="w-full mt-2 bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-sm text-red-400 font-mono outline-none focus:border-red-500" />
                </div>
                <div className="p-6 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between mt-8">
                   <div>
                     <p className="font-black text-white text-sm">Status da Matéria</p>
                     <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">Deseja exibir no site?</p>
                   </div>
                   <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} className="sr-only peer" />
                    <div className="w-14 h-7 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-green-500"></div>
                  </label>
                </div>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Conteúdo da Matéria (Escreva tudo aqui! Aceita HTML para negritos e quebras de linha)</label>
              <textarea value={content} onChange={(e) => setContent(e.target.value)} required rows={15} className="w-full mt-2 bg-slate-950 border border-slate-800 rounded-3xl p-6 text-sm text-slate-200 outline-none focus:border-green-500 leading-relaxed custom-scrollbar"></textarea>
            </div>

            <div className="pt-6">
              <button type="submit" className="w-full py-6 bg-green-500 hover:bg-green-400 text-slate-950 font-black rounded-2xl text-[14px] uppercase tracking-[0.2em] transition-all shadow-xl shadow-green-500/20">
                {postId ? 'Atualizar e Publicar Alterações' : 'Salvar Matéria no Blog'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SEPARADOR DE COMENTÁRIOS (MODERAÇÃO) */}
      {activeTab === 'COMMENTS' && (
        <div className="max-w-5xl mx-auto animate-in slide-in-from-right-8">
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6 mb-8 flex items-center gap-4">
             <span className="text-3xl">🛡️</span>
             <div>
               <h3 className="font-black text-blue-400 text-sm uppercase tracking-widest">Filtro de Segurança Ativado</h3>
               <p className="text-slate-400 text-xs mt-1">Os comentários dos leitores só aparecem no site se você clicar em "Aprovar". Isso evita robôs e spam.</p>
             </div>
          </div>

          <div className="space-y-4">
            {comments.map(comment => (
              <div key={comment.id} className={`p-6 rounded-3xl border transition-all ${comment.is_approved ? 'bg-slate-900 border-green-500/30' : 'bg-slate-950 border-slate-800'}`}>
                <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                  <div className="flex-1">
                     <div className="flex items-center gap-3 mb-2">
                       <h4 className="font-black text-slate-200">{comment.author_name}</h4>
                       <span className="text-slate-600 text-xs">• em: <span className="text-slate-400 font-bold italic">{comment.posts?.title}</span></span>
                     </div>
                     <p className="text-slate-400 text-sm leading-relaxed bg-slate-900/50 p-4 rounded-xl border border-slate-800/50">{comment.content}</p>
                     <p className="text-[9px] text-slate-600 font-mono mt-3 uppercase tracking-widest">Enviado em: {new Date(comment.created_at).toLocaleString('pt-BR')}</p>
                  </div>
                  
                  <div className="flex flex-row md:flex-col gap-3 w-full md:w-auto shrink-0">
                     {comment.is_approved ? (
                        <button onClick={() => toggleCommentApproval(comment.id, true)} className="flex-1 px-6 py-3 bg-slate-800 hover:bg-orange-500/20 text-slate-300 hover:text-orange-400 font-black rounded-xl text-[10px] uppercase tracking-widest transition-colors border border-slate-700 hover:border-orange-500/30">Ocultar do Site</button>
                     ) : (
                        <button onClick={() => toggleCommentApproval(comment.id, false)} className="flex-1 px-6 py-3 bg-green-500/20 hover:bg-green-500 text-green-400 hover:text-slate-950 font-black rounded-xl text-[10px] uppercase tracking-widest transition-colors border border-green-500/30 shadow-lg shadow-green-900/20">Aprovar Comentário</button>
                     )}
                     <button onClick={() => deleteComment(comment.id)} className="flex-1 px-6 py-3 bg-slate-950 hover:bg-red-500/20 text-slate-500 hover:text-red-500 font-black rounded-xl text-[10px] uppercase tracking-widest transition-colors border border-slate-800 hover:border-red-500/30">Apagar (Spam)</button>
                  </div>
                </div>
              </div>
            ))}
            {comments.length === 0 && !loading && (
              <div className="py-20 text-center text-slate-600 font-black uppercase text-xs tracking-widest">Nenhum comentário recebido ainda.</div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}