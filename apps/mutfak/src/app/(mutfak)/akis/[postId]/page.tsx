'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  mutfakApi,
  POST_TYPE_LABELS,
  POST_CATEGORY_LABELS,
  type FeedPost,
  type PostComment,
  type PollOption,
} from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToken } from '@/hooks/useToken';
import { Avatar } from '@/components/Avatar';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { PostDetailSkeleton } from '@/components/Skeleton';

const TYPE_COLORS: Record<string, string> = {
  general: 'bg-gray-100 text-gray-600',
  question: 'bg-blue-100 text-blue-700',
  idea: 'bg-violet-100 text-violet-700',
  project_call: 'bg-emerald-100 text-emerald-700',
  team_search: 'bg-teal-100 text-teal-700',
  mentorship_experience: 'bg-amber-100 text-amber-700',
  announcement: 'bg-[#26496b]/10 text-[#26496b]',
  resource: 'bg-orange-100 text-orange-700',
  poll: 'bg-pink-100 text-pink-700',
  content_draft: 'bg-slate-100 text-slate-600',
};

const TYPE_STRIPE: Record<string, string> = {
  general: 'border-gray-300',
  question: 'border-blue-400',
  idea: 'border-violet-400',
  project_call: 'border-emerald-400',
  team_search: 'border-teal-400',
  mentorship_experience: 'border-amber-400',
  announcement: 'border-[#26496b]',
  resource: 'border-orange-400',
  poll: 'border-pink-400',
  content_draft: 'border-slate-400',
};

function timeAgo(date: string) {
  const diff = (Date.now() - new Date(date).getTime()) / 1000;
  if (diff < 60) return 'az önce';
  if (diff < 3600) return `${Math.floor(diff / 60)}dk`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}sa`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}g`;
  return new Date(date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const token = useToken();

  const postId = params['postId'] as string;

  const [post, setPost] = useState<FeedPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [reactionCount, setReactionCount] = useState(0);
  const [viewerReaction, setViewerReaction] = useState<string | null>(null);
  const [comments, setComments] = useState<PostComment[]>([]);
  const [commentBody, setCommentBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [copied, setCopied] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);
  const [pollOptions, setPollOptions] = useState<PollOption[]>([]);
  const [viewerVote, setViewerVote] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    Promise.all([
      mutfakApi.getPost(postId, token),
      mutfakApi.listComments(postId, token),
    ])
      .then(([p, c]) => {
        setPost(p);
        setReactionCount(Number(p.reactionCount));
        setViewerReaction(p.viewerReaction ?? null);
        setPollOptions(p.pollOptions ?? []);
        setViewerVote(p.viewerVote ?? null);
        setComments(c);
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Gönderi yüklenemedi.'))
      .finally(() => setLoading(false));
  }, [postId, token]);

  async function handleReact() {
    if (!post) return;
    const type = 'like';
    const wasLiked = viewerReaction === type;
    setViewerReaction(wasLiked ? null : type);
    setReactionCount((n) => n + (wasLiked ? -1 : 1));
    try {
      await mutfakApi.reactToPost(post.id, type, token);
    } catch {
      setViewerReaction(wasLiked ? type : null);
      setReactionCount((n) => n + (wasLiked ? 1 : -1));
    }
  }

  async function handleComment(e: React.FormEvent) {
    e.preventDefault();
    if (!post || !commentBody.trim()) return;
    setSubmitting(true);
    try {
      const created = await mutfakApi.addComment(post.id, commentBody.trim(), token);
      setComments((prev) => [...prev, created]);
      setCommentBody('');
    } catch { /* */ } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!post) return;
    try {
      await mutfakApi.deletePost(post.id, token);
      router.push('/akis');
    } catch { /* */ }
  }

  async function handleDeleteComment(commentId: string) {
    setDeletingCommentId(commentId);
    try {
      await mutfakApi.deleteComment(commentId, token);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch { /* */ } finally {
      setDeletingCommentId(null);
    }
  }

  async function handleVote(optionId: string) {
    if (!post) return;
    const prevVote = viewerVote;
    const prevOptions = pollOptions;
    const isToggleOff = prevVote === optionId;

    setViewerVote(isToggleOff ? null : optionId);
    setPollOptions((opts) =>
      opts.map((o) => {
        if (o.id === optionId) return { ...o, voteCount: o.voteCount + (isToggleOff ? -1 : 1) };
        if (o.id === prevVote) return { ...o, voteCount: o.voteCount - 1 };
        return o;
      }),
    );
    try {
      await mutfakApi.voteOnPoll(post.id, optionId, token);
    } catch {
      setViewerVote(prevVote);
      setPollOptions(prevOptions);
    }
  }

  function handleShare() {
    void navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  if (loading) return <PostDetailSkeleton />;

  if (error || !post) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <button onClick={() => router.push('/akis')} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-6 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Geri
        </button>
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          {error ?? 'Gönderi bulunamadı.'}
        </div>
      </div>
    );
  }

  const typeLabel = POST_TYPE_LABELS[post.type] ?? post.type;
  const catLabel = POST_CATEGORY_LABELS[post.category] ?? post.category;
  const typeColor = TYPE_COLORS[post.type] ?? 'bg-gray-100 text-gray-600';
  const stripe = TYPE_STRIPE[post.type] ?? 'border-gray-300';
  const isOwner = user?.id === post.authorId;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Back */}
      <button
        onClick={() => {
          if (window.history.length > 1) router.back();
          else router.push('/akis');
        }}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-6 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Geri
      </button>

      {/* Post */}
      <div className={`bg-white rounded-xl border-l-4 ${stripe} border-y border-r border-gray-200 shadow-sm mb-6`}>
        {post.isPinned && (
          <div className="px-5 pt-4 text-xs font-medium text-[#26496b] flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M6.5 1A1.5 1.5 0 005 2.5v1A1.5 1.5 0 006.5 5h1V6H5.5a.5.5 0 00-.5.5v2a.5.5 0 00.5.5H9v3.5a.5.5 0 001 0V9h3.5a.5.5 0 00.5-.5v-2a.5.5 0 00-.5-.5H12V5h1A1.5 1.5 0 0014.5 3.5v-1A1.5 1.5 0 0013 1h-6.5z" />
            </svg>
            Sabitlenmiş
          </div>
        )}
        <div className="p-5">
          {/* Author */}
          <div className="flex items-start gap-3 mb-4">
            <a href={`/uyeler/${post.authorId}`} className="shrink-0">
              <Avatar name={post.displayName} src={post.avatarUrl} id={post.authorId} size={40} />
            </a>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <a href={`/uyeler/${post.authorId}`} className="text-sm font-semibold text-gray-900 hover:underline">{post.displayName}</a>
                {post.profession && <span className="text-xs text-gray-400">{post.profession}</span>}
              </div>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${typeColor}`}>{typeLabel}</span>
                <span className="text-xs text-gray-400">{catLabel}</span>
                <span className="text-xs text-gray-400">·</span>
                <time className="text-xs text-gray-400" dateTime={post.createdAt}>
                  {timeAgo(post.createdAt)}
                </time>
              </div>
            </div>
            {isOwner && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="text-gray-300 hover:text-red-400 transition-colors p-1 shrink-0"
                title="Sil"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>

          {/* Content */}
          {post.title && (
            <h1 className="text-lg font-bold text-gray-900 mb-2">{post.title}</h1>
          )}
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{post.body}</p>

          {/* Poll */}
          {post.type === 'poll' && pollOptions.length > 0 && (
            <div className="mt-4 space-y-2">
              {(() => {
                const totalVotes = pollOptions.reduce((s, o) => s + o.voteCount, 0);
                return pollOptions.map((option) => {
                  const pct = totalVotes > 0 ? Math.round((option.voteCount / totalVotes) * 100) : 0;
                  const isSelected = viewerVote === option.id;
                  const hasVoted = viewerVote !== null;
                  return (
                    <button
                      key={option.id}
                      onClick={() => void handleVote(option.id)}
                      className={`w-full text-left rounded-xl border px-4 py-3 text-sm transition-all relative overflow-hidden ${
                        isSelected
                          ? 'border-[#26496b] bg-[#26496b]/5 font-medium text-[#26496b]'
                          : 'border-gray-200 hover:border-[#66aca9] text-gray-700'
                      }`}
                    >
                      {hasVoted && (
                        <span
                          className="absolute inset-y-0 left-0 transition-all duration-700"
                          style={{
                            width: `${pct}%`,
                            background: isSelected ? 'rgba(38,73,107,0.1)' : 'rgba(102,172,169,0.12)',
                          }}
                        />
                      )}
                      <span className="relative flex items-center justify-between gap-3">
                        <span className="flex items-center gap-2">
                          {isSelected && <span className="text-[#26496b]">✓</span>}
                          {option.text}
                        </span>
                        {hasVoted && (
                          <span className="text-xs font-semibold shrink-0 tabular-nums">
                            {pct}%
                            <span className="font-normal text-gray-400 ml-1">({option.voteCount})</span>
                          </span>
                        )}
                      </span>
                    </button>
                  );
                });
              })()}
              <p className="text-xs text-gray-400 mt-1.5">
                {pollOptions.reduce((s, o) => s + o.voteCount, 0)} oy · {viewerVote ? 'Oy değiştirmek için tekrar tıkla' : 'Seçeneğe tıkla'}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-4 mt-5 pt-4 border-t border-gray-100">
            <button
              onClick={() => void handleReact()}
              className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${
                viewerReaction ? 'text-[#26496b]' : 'text-gray-400 hover:text-[#26496b]'
              }`}
            >
              <svg className="w-4 h-4" fill={viewerReaction ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
              </svg>
              {reactionCount > 0 ? `${reactionCount} Beğeni` : 'Beğen'}
            </button>

            <span className="flex items-center gap-1.5 text-xs text-gray-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              {comments.length} Yorum
            </span>

            <button
              onClick={handleShare}
              className="ml-auto flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-[#26496b] transition-colors"
            >
              {copied ? (
                <>
                  <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-emerald-500">Kopyalandı!</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  Bağlantıyı Kopyala
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Comments */}
      <div className="space-y-3 mb-4">
        {comments.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">Henüz yorum yok. İlk yorumu sen yap!</p>
        ) : (
          comments.map((c) => (
            <div key={c.id} className="flex gap-2.5">
              <a href={`/uyeler/${c.authorId}`} className="shrink-0">
                <Avatar name={c.displayName} src={c.avatarUrl} id={c.authorId} size={32} />
              </a>
              <div className="flex-1 bg-white border border-gray-100 rounded-xl px-3 py-2.5 shadow-sm">
                <div className="flex items-baseline gap-2">
                  <a href={`/uyeler/${c.authorId}`} className="text-xs font-semibold text-gray-800 hover:underline">{c.displayName}</a>
                  <span className="text-xs text-gray-400">{timeAgo(c.createdAt)}</span>
                  {c.authorId === user?.id && (
                    <button
                      onClick={() => void handleDeleteComment(c.id)}
                      disabled={deletingCommentId === c.id}
                      className="ml-auto text-gray-300 hover:text-red-400 transition-colors disabled:opacity-50"
                      title="Yorumu sil"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
                <p className="text-sm text-gray-700 mt-0.5 leading-relaxed">{c.body}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* New comment */}
      <form onSubmit={(e) => void handleComment(e)} className="flex gap-2">
        {user && <Avatar name={user.profile?.displayName ?? user.email} src={user.profile?.avatarUrl} size={32} />}
        <div className="flex-1 flex gap-2">
          <input
            type="text"
            value={commentBody}
            onChange={(e) => setCommentBody(e.target.value)}
            placeholder="Yorum yaz…"
            maxLength={2000}
            className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#26496b]/30 focus:border-[#26496b]"
          />
          <button
            type="submit"
            disabled={submitting || !commentBody.trim()}
            className="px-4 py-2 bg-[#26496b] text-white text-xs font-medium rounded-xl hover:bg-[#1d3a57] disabled:opacity-50 shrink-0"
          >
            {submitting ? '…' : 'Gönder'}
          </button>
        </div>
      </form>

      {showDeleteConfirm && (
        <ConfirmDialog
          title="Gönderiyi sil"
          message="Bu gönderi kalıcı olarak silinecek. Emin misiniz?"
          confirmLabel="Sil"
          danger
          onConfirm={() => { setShowDeleteConfirm(false); void handleDelete(); }}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </div>
  );
}
