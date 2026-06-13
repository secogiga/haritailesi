'use client';

import Image from 'next/image';
import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  mutfakApi,
  POST_TYPE_LABELS,
  POST_CATEGORY_LABELS,
  POST_TYPES,
  POST_CATEGORIES,
  type FeedPost,
  type PostComment,
  type PollOption,
  type OgData,
} from '@/lib/api';
import { MentionTextarea } from '@/components/MentionTextarea';
import { MarkdownContent } from '@/components/MarkdownContent';
import { FeedPostSkeleton } from '@/components/Skeleton';
import { useToken } from '@/hooks/useToken';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Avatar } from '@/components/Avatar';
import { FocusTrap } from '@/components/FocusTrap';
import { EmptyState } from '@/components/EmptyState';
import { StatsBar } from '@/components/StatsBar';
import { ActivityWidget } from '@/components/ActivityWidget';
import { SuggestedMembers } from '@/components/SuggestedMembers';

// ── Helpers ───────────────────────────────────────────────────────────────────

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
  return new Date(date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
}

// ── Post Card ─────────────────────────────────────────────────────────────────

function PostCard({
  post,
  token,
  currentUserId,
  onDeleted,
}: {
  post: FeedPost;
  token: string;
  currentUserId: string;
  onDeleted: (id: string) => void;
}) {
  const [reactionCount, setReactionCount] = useState(Number(post.reactionCount));
  const [viewerReaction, setViewerReaction] = useState<string | null>(post.viewerReaction ?? null);
  const [commentCount, setCommentCount] = useState(Number(post.commentCount));
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<PostComment[]>([]);
  const [commentBody, setCommentBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [showEdit, setShowEdit] = useState(false);
  const [editTitle, setEditTitle] = useState(post.title ?? '');
  const [editBody, setEditBody] = useState(post.body);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState('');
  const [editSaving, setEditSaving] = useState(false);
  const [localPost, setLocalPost] = useState(post);
  const [bookmarked, setBookmarked] = useState(post.isBookmarked ?? false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [copied, setCopied] = useState(false);
  const reactionTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [ogData, setOgData] = useState<OgData | null>(null);
  const [pollOptions, setPollOptions] = useState<PollOption[]>(post.pollOptions ?? []);
  const [viewerVote, setViewerVote] = useState<string | null>(post.viewerVote ?? null);

  useEffect(() => {
    const urlMatch = /https?:\/\/[^\s<>"']+/i.exec(post.body);
    if (!urlMatch) return;
    const url = urlMatch[0];
    mutfakApi.scrapeOg(url, token).then(setOgData).catch(() => {});
  }, [post.body, token]);

  const REACTIONS = [
    { type: 'like', emoji: '👍', label: 'Beğen' },
    { type: 'celebrate', emoji: '🎉', label: 'Kutla' },
    { type: 'support', emoji: '🤝', label: 'Destek' },
    { type: 'insightful', emoji: '💡', label: 'İçgörü' },
  ];

  function onReactionEnter() {
    if (reactionTimeout.current) clearTimeout(reactionTimeout.current);
    setShowReactionPicker(true);
  }
  function onReactionLeave() {
    reactionTimeout.current = setTimeout(() => setShowReactionPicker(false), 300);
  }

  async function handleReact(type = 'like') {
    const prev = viewerReaction;
    const wasLiked = prev === type;
    setShowReactionPicker(false);
    setViewerReaction(wasLiked ? null : type);
    setReactionCount((n) => n + (wasLiked ? -1 : 1));

    try {
      await mutfakApi.reactToPost(post.id, type, token);
    } catch {
      setViewerReaction(prev);
      setReactionCount((n) => n + (wasLiked ? 1 : -1));
    }
  }

  async function handleBookmark() {
    const prev = bookmarked;
    setBookmarked(!prev);
    try {
      await mutfakApi.bookmarkPost(post.id, token);
    } catch {
      setBookmarked(prev);
    }
  }

  async function handleShare() {
    const url = `${window.location.origin}/akis/${post.id}`;
    const title = post.title ?? post.body.slice(0, 80);
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch { /* user cancelled or not supported */ }
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleVote(optionId: string) {
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

  async function toggleComments() {
    if (!showComments && comments.length === 0) {
      try {
        const data = await mutfakApi.listComments(post.id, token);
        setComments(data);
      } catch { /* */ }
    }
    setShowComments((v) => !v);
  }

  async function handleComment(e: React.FormEvent) {
    e.preventDefault();
    if (!commentBody.trim()) return;
    setSubmitting(true);
    try {
      const created = await mutfakApi.addComment(post.id, commentBody.trim(), token);
      setComments((prev) => [...prev, created]);
      setCommentCount((n) => n + 1);
      setCommentBody('');
    } catch { /* */ } finally {
      setSubmitting(false);
    }
  }

  async function handleReply(e: React.FormEvent) {
    e.preventDefault();
    if (!replyBody.trim() || !replyingTo) return;
    setSubmitting(true);
    try {
      const created = await mutfakApi.addComment(post.id, replyBody.trim(), token, replyingTo);
      setComments((prev) => [...prev, created]);
      setCommentCount((n) => n + 1);
      setReplyBody('');
      setReplyingTo(null);
    } catch { /* */ } finally {
      setSubmitting(false);
    }
  }

  async function doDelete() {
    setDeleteError(null);
    try {
      await mutfakApi.deletePost(post.id, token);
      onDeleted(post.id);
    } catch (err) {
      setDeleteError((err as Error).message);
    }
  }

  async function doEdit() {
    setEditSaving(true);
    try {
      const updated = await mutfakApi.updatePost(
        post.id,
        { title: editTitle.trim() || null, body: editBody.trim() },
        token,
      );
      setLocalPost((p) => ({ ...p, title: updated.title, body: updated.body }));
      setShowEdit(false);
    } catch { /* */ } finally {
      setEditSaving(false);
    }
  }

  const typeLabel = POST_TYPE_LABELS[localPost.type] ?? localPost.type;
  const catLabel = POST_CATEGORY_LABELS[localPost.category] ?? localPost.category;
  const typeColor = TYPE_COLORS[localPost.type] ?? 'bg-gray-100 text-gray-600';
  const stripe = TYPE_STRIPE[localPost.type] ?? 'border-gray-300';

  const isAnnouncement = localPost.type === 'announcement';
  const isProjectCall = localPost.type === 'project_call';
  const isQuestion = localPost.type === 'question';
  const isPoll = localPost.type === 'poll';
  const isDraft = localPost.type === 'content_draft';

  const TYPE_ICONS: Record<string, string> = {
    poll: '📊',
    content_draft: '📝',
    idea: '💡',
    resource: '📚',
    announcement: '📢',
    project_call: '🚀',
  };

  return (
    <>
    {deleteError && (
      <div className="mb-2 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">{deleteError}</div>
    )}
    <div
      data-card-hover
      className={`rounded-xl shadow-sm transition-shadow ${
        isAnnouncement
          ? 'bg-[#26496b] border border-[#26496b]'
          : isProjectCall
            ? `bg-emerald-50 border-l-4 ${stripe} border-y border-r border-emerald-200`
            : `bg-white border-l-4 ${stripe} border-y border-r border-gray-200 ${post.isPinned ? 'ring-1 ring-[#26496b]/10' : ''}`
      }`}
    >
      {post.isPinned && (
        <div className={`px-4 pt-3 text-xs font-medium flex items-center gap-1.5 ${isAnnouncement ? 'text-white/60' : 'text-[#26496b]'}`}>
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M6.5 1A1.5 1.5 0 005 2.5v1A1.5 1.5 0 006.5 5h1V6H5.5a.5.5 0 00-.5.5v2a.5.5 0 00.5.5H9v3.5a.5.5 0 001 0V9h3.5a.5.5 0 00.5-.5v-2a.5.5 0 00-.5-.5H12V5h1A1.5 1.5 0 0014.5 3.5v-1A1.5 1.5 0 0013 1h-6.5z" />
          </svg>
          Sabitlenmiş
        </div>
      )}
      <div className="p-4">
        {/* Author */}
        <div className="flex items-start gap-3 mb-3">
          <a href={`/uyeler/${post.authorId}`} className="shrink-0">
            <Avatar name={post.displayName} src={post.avatarUrl} id={post.authorId} size={36} />
          </a>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <a href={`/uyeler/${post.authorId}`} className={`text-sm font-semibold hover:underline ${isAnnouncement ? 'text-white' : 'text-gray-900'}`}>{post.displayName}</a>
              {post.profession && <span className={`text-xs ${isAnnouncement ? 'text-white/50' : 'text-gray-400'}`}>{post.profession}</span>}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1 ${isAnnouncement ? 'bg-white/20 text-white' : typeColor}`}>
                {TYPE_ICONS[localPost.type] && <span className="text-[11px] leading-none">{TYPE_ICONS[localPost.type]}</span>}
                {typeLabel}
              </span>
              <span className={`text-xs ${isAnnouncement ? 'text-white/50' : 'text-gray-400'}`}>{catLabel}</span>
              <span className={`text-xs ${isAnnouncement ? 'text-white/50' : 'text-gray-400'}`}>· {timeAgo(post.createdAt)}</span>
              {localPost.updatedAt && new Date(localPost.updatedAt).getTime() > new Date(localPost.createdAt).getTime() + 5 * 60 * 1000 && (
                <span className={`text-xs italic ${isAnnouncement ? 'text-white/40' : 'text-gray-400'}`}>(düzenlendi)</span>
              )}
            </div>
          </div>
          {post.authorId === currentUserId && (
            <div className="flex items-center gap-0.5 shrink-0">
              <button
                onClick={() => setShowEdit(true)}
                className={`transition-colors p-1 ${isAnnouncement ? 'text-white/40 hover:text-white/80' : 'text-gray-300 hover:text-[#26496b]'}`}
                title="Düzenle"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className={`transition-colors p-1 ${isAnnouncement ? 'text-white/40 hover:text-white/80' : 'text-gray-300 hover:text-red-400'}`}
                title="Sil"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Question badge */}
        {isQuestion && commentCount > 0 && (
          <div className="flex items-center gap-1.5 mb-2 text-xs text-blue-600 font-medium">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            {commentCount} yanıt
          </div>
        )}

        {/* Content — tüm alan tıklanabilir */}
        <a
          href={`/akis/${post.id}`}
          className="block group"
          onClick={() => {
            const main = document.querySelector('main');
            if (main) sessionStorage.setItem('feed_scroll', String(main.scrollTop));
          }}
        >
          {localPost.title && (
            <h3 className={`text-base font-semibold mb-1.5 transition-colors ${
              isAnnouncement ? 'text-white group-hover:text-white/80' : 'text-gray-900 group-hover:text-[#26496b]'
            }`}>{localPost.title}</h3>
          )}
          <div className={`text-sm leading-relaxed line-clamp-4 ${isAnnouncement ? 'text-white/75 [&_a]:text-white/80 [&_code]:bg-white/10 [&_code]:text-white' : ''}`}>
            <MarkdownContent content={localPost.body} />
          </div>
        </a>

        {/* Poll Options */}
        {isPoll && pollOptions.length > 0 && (
          <div className="mt-3 space-y-2" onClick={(e) => e.preventDefault()}>
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
                    className={`w-full text-left rounded-lg border px-3 py-2.5 text-sm transition-all relative overflow-hidden ${
                      isSelected
                        ? 'border-[#26496b] bg-[#26496b]/5 font-medium text-[#26496b]'
                        : 'border-gray-200 hover:border-[#66aca9] text-gray-700'
                    }`}
                  >
                    {hasVoted && (
                      <span
                        className="absolute inset-y-0 left-0 bg-[#26496b]/8 transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    )}
                    <span className="relative flex items-center justify-between gap-2">
                      <span>{option.text}</span>
                      {hasVoted && (
                        <span className="text-xs text-gray-500 shrink-0">{pct}%</span>
                      )}
                    </span>
                  </button>
                );
              });
            })()}
            <p className="text-xs text-gray-400 mt-1">
              {pollOptions.reduce((s, o) => s + o.voteCount, 0)} oy
            </p>
          </div>
        )}

        {localPost.imageUrl && (
          <div className="mt-3 rounded-lg overflow-hidden relative" style={{ maxHeight: '16rem', aspectRatio: '16/9' }}>
            <Image
              src={localPost.imageUrl}
              alt="Gönderi görseli"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 680px"
            />
          </div>
        )}

        {/* OG Link Preview */}
        {ogData && !localPost.imageUrl && (ogData.title || ogData.image) && (
          <a
            href={/https?:\/\/[^\s<>"']+/i.exec(post.body)?.[0]}
            target="_blank"
            rel="noopener noreferrer"
            className={`mt-3 flex items-start gap-3 border rounded-xl overflow-hidden hover:opacity-90 transition-opacity ${isAnnouncement ? 'border-white/20' : 'border-gray-200'}`}
          >
            {ogData.image && (
              <img
                src={ogData.image}
                alt=""
                className="w-24 h-20 object-cover shrink-0"
                loading="lazy"
              />
            )}
            <div className="flex-1 min-w-0 py-2.5 pr-3 pl-2">
              {ogData.siteName && (
                <p className={`text-xs mb-0.5 ${isAnnouncement ? 'text-white/40' : 'text-gray-400'}`}>{ogData.siteName}</p>
              )}
              {ogData.title && (
                <p className={`text-sm font-semibold line-clamp-2 ${isAnnouncement ? 'text-white' : 'text-gray-900'}`}>{ogData.title}</p>
              )}
              {ogData.description && (
                <p className={`text-xs line-clamp-2 mt-0.5 ${isAnnouncement ? 'text-white/60' : 'text-gray-500'}`}>{ogData.description}</p>
              )}
            </div>
          </a>
        )}

        {/* Library refs */}
        {localPost.libraryRefs && localPost.libraryRefs.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {localPost.libraryRefs.map(ref => {
              const SAHNE_URL = process.env['NEXT_PUBLIC_SAHNE_URL'] ?? 'https://sahne.haritailesi.org';
              const href = ref.type === 'term'
                ? `${SAHNE_URL}/kutuphane/sozluk/${ref.slug}`
                : `${SAHNE_URL}/kutuphane/rehberler/${ref.slug}`;
              return (
                <a
                  key={`${ref.type}:${ref.slug}`}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center gap-1.5 text-xs border rounded-full px-2.5 py-1 hover:opacity-80 transition-opacity ${isAnnouncement ? 'border-white/30 bg-white/10 text-white' : 'border-violet-200 bg-violet-50 text-violet-700'}`}
                  onClick={e => e.stopPropagation()}
                >
                  <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  <span className="font-semibold">{ref.type === 'term' ? 'Terim' : 'Rehber'}:</span>
                  <span className="truncate max-w-[160px]">{ref.title}</span>
                </a>
              );
            })}
          </div>
        )}

        {/* Actions */}
        <div className={`flex items-center gap-3 mt-4 pt-3 border-t ${isAnnouncement ? 'border-white/15' : 'border-gray-100'}`}>
          {/* Reaction button with picker */}
          <div className="relative" onMouseEnter={onReactionEnter} onMouseLeave={onReactionLeave}>
            <button
              onClick={() => void handleReact(viewerReaction ?? 'like')}
              className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${
                viewerReaction
                  ? (isAnnouncement ? 'text-[#66aca9]' : 'text-[#26496b]')
                  : (isAnnouncement ? 'text-white/40 hover:text-white/80' : 'text-gray-400 hover:text-[#26496b]')
              }`}
            >
              <span className={`text-base leading-none ${viewerReaction ? 'animate-like-pop' : ''}`}>
                {REACTIONS.find((r) => r.type === viewerReaction)?.emoji ?? '👍'}
              </span>
              {reactionCount > 0 ? reactionCount : 'Beğen'}
            </button>
            {showReactionPicker && (
              <div className="absolute bottom-full left-0 mb-2 flex items-center gap-1 bg-white border border-gray-200 rounded-full px-2 py-1.5 shadow-lg z-20">
                {REACTIONS.map((r) => (
                  <button
                    key={r.type}
                    title={r.label}
                    onClick={() => void handleReact(r.type)}
                    className="text-xl hover:scale-125 transition-transform leading-none"
                  >
                    {r.emoji}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => void toggleComments()}
            className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${
              isAnnouncement ? 'text-white/40 hover:text-white/80' : 'text-gray-400 hover:text-[#26496b]'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            {commentCount > 0 ? `${commentCount} Yorum` : 'Yorum Yap'}
          </button>

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => void handleBookmark()}
              title={bookmarked ? 'Kaydedilenlerden çıkar' : 'Kaydet'}
              className={`transition-colors ${
                bookmarked
                  ? (isAnnouncement ? 'text-[#66aca9]' : 'text-[#26496b]')
                  : (isAnnouncement ? 'text-white/40 hover:text-white/80' : 'text-gray-400 hover:text-[#26496b]')
              }`}
            >
              <svg className="w-4 h-4" fill={bookmarked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </button>
            <button
              onClick={() => void handleShare()}
              title={copied ? 'Kopyalandı!' : 'Paylaş'}
              className={`transition-colors relative ${
                isAnnouncement ? 'text-white/40 hover:text-white/80' : 'text-gray-400 hover:text-[#26496b]'
              }`}
            >
              {copied ? (
                <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
              )}
            </button>
            <a
              href={`/akis/${post.id}`}
              className={`flex items-center gap-1 text-xs transition-colors ${
                isAnnouncement ? 'text-white/40 hover:text-white/80' : 'text-gray-400 hover:text-[#26496b]'
              }`}
              title="Tam görünüm"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        </div>

        {/* Comments */}
        {showComments && (
          <div className="mt-3 space-y-2.5 border-t border-gray-100 pt-3">
            {/* Top-level comments */}
            {comments.filter((c) => !c.parentId).map((c) => (
              <div key={c.id}>
                <div className="flex gap-2.5">
                  <Avatar name={c.displayName} src={c.avatarUrl} id={c.authorId} size={28} />
                  <div className="flex-1 min-w-0">
                    <div className="bg-gray-50 rounded-xl px-3 py-2">
                      <div className="flex items-baseline gap-2">
                        <span className="text-xs font-semibold text-gray-800">{c.displayName}</span>
                        <span className="text-xs text-gray-400">{timeAgo(c.createdAt)}</span>
                      </div>
                      <p className="text-sm text-gray-700 mt-0.5">{c.body}</p>
                    </div>
                    <button
                      onClick={() => setReplyingTo(replyingTo === c.id ? null : c.id)}
                      className="text-[10px] text-gray-400 hover:text-[#26496b] transition-colors mt-1 ml-1"
                    >
                      Yanıtla
                    </button>
                    {/* Replies */}
                    {comments.filter((r) => r.parentId === c.id).map((r) => (
                      <div key={r.id} className="flex gap-2 mt-2 ml-2 pl-2 border-l-2 border-gray-100">
                        <Avatar name={r.displayName} src={r.avatarUrl} id={r.authorId} size={22} />
                        <div className="flex-1 bg-gray-50/80 rounded-lg px-2.5 py-1.5">
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-xs font-semibold text-gray-800">{r.displayName}</span>
                            <span className="text-[10px] text-gray-400">{timeAgo(r.createdAt)}</span>
                          </div>
                          <p className="text-xs text-gray-700 mt-0.5">{r.body}</p>
                        </div>
                      </div>
                    ))}
                    {/* Reply input */}
                    {replyingTo === c.id && (
                      <form onSubmit={(e) => void handleReply(e)} className="flex gap-2 mt-2 ml-2">
                        <input
                          type="text"
                          value={replyBody}
                          onChange={(e) => setReplyBody(e.target.value)}
                          placeholder={`@${c.displayName} cevapla…`}
                          maxLength={2000}
                          autoFocus
                          className="flex-1 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#26496b]/30"
                        />
                        <button
                          type="submit"
                          disabled={submitting || !replyBody.trim()}
                          className="px-2.5 py-1.5 bg-[#26496b] text-white text-xs font-medium rounded-lg hover:bg-[#1d3a57] disabled:opacity-50 shrink-0"
                        >
                          Gönder
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              </div>
            ))}

            <form onSubmit={(e) => void handleComment(e)} className="flex gap-2 mt-2">
              <input
                type="text"
                value={commentBody}
                onChange={(e) => setCommentBody(e.target.value)}
                placeholder="Yorum yaz…"
                maxLength={2000}
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#26496b]/30"
              />
              <button
                type="submit"
                disabled={submitting || !commentBody.trim()}
                className="px-3 py-2 bg-[#26496b] text-white text-xs font-medium rounded-xl hover:bg-[#1d3a57] disabled:opacity-50 shrink-0"
              >
                Gönder
              </button>
            </form>
          </div>
        )}
      </div>
    </div>

    {showDeleteConfirm && (
      <ConfirmDialog
        title="Gönderiyi sil"
        message="Bu gönderi kalıcı olarak silinecek. Emin misiniz?"
        confirmLabel="Sil"
        danger
        onConfirm={() => { setShowDeleteConfirm(false); void doDelete(); }}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    )}

    {showEdit && (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40">
        <FocusTrap
          onClose={() => setShowEdit(false)}
          aria-label="Gönderiyi Düzenle"
          className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto animate-slide-up"
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Gönderiyi Düzenle</h2>
            <button onClick={() => setShowEdit(false)} className="text-gray-400 hover:text-gray-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Başlık (isteğe bağlı)</label>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                maxLength={300}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#26496b]/30"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">İçerik</label>
              <textarea
                rows={5}
                value={editBody}
                onChange={(e) => setEditBody(e.target.value)}
                maxLength={5000}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#26496b]/30 resize-none"
              />
              <div className="text-right text-xs text-gray-400 mt-1">{editBody.length}/5000</div>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowEdit(false)} className="flex-1 py-2.5 border border-gray-200 text-gray-600 text-sm rounded-xl hover:bg-gray-50">
                Vazgeç
              </button>
              <button
                onClick={() => void doEdit()}
                disabled={editSaving || !editBody.trim()}
                className="flex-1 py-2.5 bg-[#26496b] text-white text-sm font-semibold rounded-xl hover:bg-[#1d3a57] disabled:opacity-50"
              >
                {editSaving ? 'Kaydediliyor…' : 'Kaydet'}
              </button>
            </div>
          </div>
        </FocusTrap>
      </div>
    )}
    </>
  );
}

// ── Create Post Modal ─────────────────────────────────────────────────────────

type LibraryRef = { type: 'term' | 'guide'; slug: string; title: string };

function LibraryRefPicker({
  onAdd,
  onClose,
}: {
  onAdd: (ref: LibraryRef) => void;
  onClose: () => void;
}) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<LibraryRef[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!q.trim()) { setResults([]); return; }
    const t = setTimeout(async () => {
      setBusy(true);
      const [terms, guides] = await Promise.all([
        mutfakApi.searchLibraryTerms(q),
        mutfakApi.searchLibraryGuides(q),
      ]);
      setResults([
        ...terms.map(t => ({ type: 'term' as const, slug: t.slug ?? t.id, title: t.term })),
        ...guides.map(g => ({ type: 'guide' as const, slug: g.slug, title: g.title })),
      ]);
      setBusy(false);
    }, 350);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <div className="border border-violet-200 rounded-xl p-3 bg-violet-50/50 space-y-2">
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs font-semibold text-violet-800">Kütüphaneden bağla</p>
        <button type="button" onClick={onClose} className="text-violet-400 hover:text-violet-600">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <input
        autoFocus
        type="text"
        value={q}
        onChange={e => setQ(e.target.value)}
        placeholder="Terim veya rehber ara…"
        className="w-full px-3 py-2 text-sm border border-violet-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-violet-400"
      />
      {busy && <p className="text-xs text-violet-400 px-1">Aranıyor…</p>}
      {results.length > 0 && (
        <div className="space-y-1 max-h-40 overflow-y-auto">
          {results.map(r => (
            <button
              key={`${r.type}:${r.slug}`}
              type="button"
              onClick={() => { onAdd(r); onClose(); }}
              className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-violet-100 hover:border-violet-400 hover:bg-violet-50 transition-colors"
            >
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${r.type === 'term' ? 'bg-violet-100 text-violet-700' : 'bg-emerald-100 text-emerald-700'}`}>
                {r.type === 'term' ? 'Terim' : 'Rehber'}
              </span>
              <span className="text-sm text-gray-800 truncate">{r.title}</span>
            </button>
          ))}
        </div>
      )}
      {q.trim() && !busy && results.length === 0 && (
        <p className="text-xs text-gray-400 px-1">Sonuç bulunamadı.</p>
      )}
    </div>
  );
}

function CreatePostModal({
  token,
  onClose,
  onCreated,
}: {
  token: string;
  onClose: () => void;
  onCreated: (post: FeedPost) => void;
}) {
  const [type, setType] = useState('general');
  const [category, setCategory] = useState('haritailesi_duyurulari');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pollOptionInputs, setPollOptionInputs] = useState(['', '']);
  const [libraryRefs, setLibraryRefs] = useState<LibraryRef[]>([]);
  const [showLibraryPicker, setShowLibraryPicker] = useState(false);

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError('Görsel 5MB\'dan küçük olmalıdır.');
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setError('');
  }

  function removeImage() {
    setImageFile(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setError('');
    setLoading(true);
    try {
      const validOptions = pollOptionInputs.map((o) => o.trim()).filter(Boolean);
      if (type === 'poll' && validOptions.length < 2) {
        setError('Anket için en az 2 seçenek giriniz.');
        setLoading(false);
        return;
      }
      let created = await mutfakApi.createPost(
        {
          type,
          category,
          ...(title.trim() ? { title: title.trim() } : {}),
          body: body.trim(),
          ...(type === 'poll' ? { pollOptions: validOptions } : {}),
          isPublic,
          ...(libraryRefs.length > 0 ? { libraryRefs } : {}),
        },
        token,
      );
      if (imageFile) {
        try {
          const { imageKey } = await mutfakApi.uploadPostImage(created.id, imageFile, token);
          created = { ...created, imageUrl: imageKey };
        } catch { /* image upload failure is non-blocking */ }
      }
      onCreated(created);
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40">
      <FocusTrap
        onClose={onClose}
        aria-label="Gönderi Oluştur"
        className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto animate-slide-up"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Gönderi Oluştur</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="p-5 space-y-4">
          {error && <p className="text-red-600 text-xs bg-red-50 rounded-lg px-3 py-2">{error}</p>}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Tür</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#26496b]/30 bg-white"
              >
                {POST_TYPES.map((t) => (
                  <option key={t} value={t}>{POST_TYPE_LABELS[t]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Kategori</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#26496b]/30 bg-white"
              >
                {POST_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{POST_CATEGORY_LABELS[c]}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Başlık (isteğe bağlı)</label>
            <input
              type="text"
              maxLength={300}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Gönderi başlığı…"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#26496b]/30"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">İçerik</label>
            <MentionTextarea
              value={body}
              onChange={setBody}
              token={token}
              placeholder="Topluluğa ne paylaşmak istiyorsunuz? @kullanıcı ile mention edebilirsiniz."
              rows={5}
              maxLength={5000}
            />
            <div className="text-right text-xs text-gray-400 mt-1">{body.length}/5000</div>
          </div>

          {/* Poll Options (only shown when type = poll) */}
          {type === 'poll' && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">Anket Seçenekleri</label>
              <div className="space-y-2">
                {pollOptionInputs.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="text"
                      maxLength={200}
                      value={opt}
                      onChange={(e) => {
                        const next = [...pollOptionInputs];
                        next[i] = e.target.value;
                        setPollOptionInputs(next);
                      }}
                      placeholder={`Seçenek ${i + 1}`}
                      className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#26496b]/30"
                    />
                    {pollOptionInputs.length > 2 && (
                      <button
                        type="button"
                        onClick={() => setPollOptionInputs((prev) => prev.filter((_, j) => j !== i))}
                        className="text-gray-300 hover:text-red-400 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
                {pollOptionInputs.length < 6 && (
                  <button
                    type="button"
                    onClick={() => setPollOptionInputs((prev) => [...prev, ''])}
                    className="flex items-center gap-1.5 text-xs text-[#26496b] hover:text-[#1d3a57] transition-colors mt-1"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Seçenek ekle
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Image upload */}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={handleImageChange}
            />
            {imagePreview ? (
              <div className="relative rounded-xl overflow-hidden max-h-48">
                <img src={imagePreview} alt="Önizleme" className="w-full object-cover max-h-48" />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-2 right-2 w-6 h-6 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 text-xs text-gray-500 hover:text-[#26496b] transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Görsel ekle (maks. 5MB)
              </button>
            )}
          </div>

          {/* Library refs */}
          {libraryRefs.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {libraryRefs.map(ref => (
                <span key={`${ref.type}:${ref.slug}`} className="flex items-center gap-1.5 text-xs bg-violet-50 border border-violet-200 text-violet-700 rounded-full px-2.5 py-1">
                  <span className="font-semibold">{ref.type === 'term' ? 'Terim' : 'Rehber'}:</span>
                  {ref.title}
                  <button type="button" onClick={() => setLibraryRefs(rs => rs.filter(r => r.slug !== ref.slug || r.type !== ref.type))} className="text-violet-400 hover:text-violet-600 ml-0.5">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              ))}
            </div>
          )}

          {showLibraryPicker ? (
            <LibraryRefPicker
              onAdd={ref => {
                if (!libraryRefs.find(r => r.slug === ref.slug && r.type === ref.type)) {
                  setLibraryRefs(rs => [...rs, ref]);
                }
              }}
              onClose={() => setShowLibraryPicker(false)}
            />
          ) : (
            <button
              type="button"
              onClick={() => setShowLibraryPicker(true)}
              className="flex items-center gap-2 text-xs text-violet-600 hover:text-violet-800 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              Kütüphaneden bağla {libraryRefs.length > 0 && `(${libraryRefs.length})`}
            </button>
          )}

          {/* Public toggle */}
          <button
            type="button"
            onClick={() => setIsPublic(p => !p)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-sm transition-all ${isPublic ? 'border-teal-300 bg-teal-50 text-teal-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
          >
            <span className={`w-8 h-4.5 rounded-full relative inline-flex items-center shrink-0 transition-colors ${isPublic ? 'bg-teal-500' : 'bg-gray-200'}`} style={{ height: '18px', width: '32px' }}>
              <span className={`absolute w-3.5 h-3.5 bg-white rounded-full shadow transition-transform ${isPublic ? 'translate-x-4' : 'translate-x-0.5'}`} />
            </span>
            <span>
              <span className="font-medium">{isPublic ? 'Herkese Açık' : 'Sadece Üyeler'}</span>
              <span className="ml-1.5 text-xs opacity-70">{isPublic ? '— Sahne forumunda görünür' : '— Yalnızca Mutfak üyeleri görür'}</span>
            </span>
          </button>

          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-gray-200 text-gray-600 text-sm rounded-xl hover:bg-gray-50">
              Vazgeç
            </button>
            <button
              type="submit"
              disabled={loading || !body.trim()}
              className="flex-1 py-2.5 bg-[#26496b] text-white text-sm font-semibold rounded-xl hover:bg-[#1d3a57] disabled:opacity-50"
            >
              {loading ? 'Paylaşılıyor…' : 'Paylaş'}
            </button>
          </div>
        </form>
      </FocusTrap>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function AkisPage() {
  const { user } = useAuth();
  const token = useToken();
  const currentUserId = user?.id ?? '';
  const router = useRouter();
  const searchParams = useSearchParams();

  const [feed, setFeed] = useState<FeedPost[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [feedFilter, setFeedFilter] = useState<'all' | 'following'>(() =>
    searchParams.get('filter') === 'following' ? 'following' : 'all',
  );
  const [sortMode, setSortMode] = useState<'recent' | 'hot'>(() =>
    searchParams.get('sort') === 'hot' ? 'hot' : 'recent',
  );
  const [categoryFilter, setCategoryFilter] = useState(() => searchParams.get('category') ?? '');
  const [typeFilter, setTypeFilter] = useState(() => searchParams.get('type') ?? '');
  const [search, setSearch] = useState(() => searchParams.get('q') ?? '');
  const [showCreate, setShowCreate] = useState(false);
  const [welcomeDismissed, setWelcomeDismissed] = useState(() =>
    typeof window !== 'undefined' && localStorage.getItem('mutfak_welcome_dismissed') === '1',
  );
  const [showScrollTop, setShowScrollTop] = useState(false);

  const genRef = useRef(0);
  const cursorRef = useRef<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadFeedRef = useRef<((reset: boolean) => Promise<void>) | null>(null);

  const canPost = user?.membershipTier &&
    ['new_graduate_member', 'individual_member', 'corporate_member'].includes(user.membershipTier);
  const isReadOnly = user?.membershipTier === 'haritailesi_genc';

  const loadingMoreRef = useRef(false);

  const loadFeed = useCallback(async (reset: boolean) => {
    const gen = ++genRef.current;

    if (reset) {
      setLoading(true);
      cursorRef.current = null;
      setCursor(null);
    } else {
      if (loadingMoreRef.current) return;
      loadingMoreRef.current = true;
      setLoadingMore(true);
    }

    const params: { cursor?: string; category?: string; type?: string; q?: string; filter?: string; sort?: string } = {};
    if (!reset && cursorRef.current) params.cursor = cursorRef.current;
    if (categoryFilter) params.category = categoryFilter;
    if (typeFilter) params.type = typeFilter;
    if (search.trim()) params.q = search.trim();
    if (feedFilter === 'following') params.filter = 'following';
    if (sortMode === 'hot') params.sort = 'hot';

    try {
      const { data, next_cursor, has_more } = await mutfakApi.listPosts(token, params);
      if (gen !== genRef.current) return;
      setFeed((prev) => reset ? data : [...prev, ...data]);
      cursorRef.current = next_cursor;
      setCursor(next_cursor);
      setHasMore(has_more);
    } catch (e) {
      if (gen !== genRef.current) return;
      setError((e as Error).message);
    } finally {
      if (gen === genRef.current) {
        setLoading(false);
        loadingMoreRef.current = false;
        setLoadingMore(false);
      }
    }
  }, [token, categoryFilter, typeFilter, search, feedFilter, sortMode]);

  useEffect(() => {
    const id = setTimeout(() => { void loadFeed(true); }, search.trim() ? 400 : 0);
    return () => clearTimeout(id);
  }, [categoryFilter, typeFilter, search, feedFilter, token, loadFeed]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (feedFilter === 'following') params.set('filter', 'following');
    if (sortMode === 'hot') params.set('sort', 'hot');
    if (categoryFilter) params.set('category', categoryFilter);
    if (typeFilter) params.set('type', typeFilter);
    if (search.trim()) params.set('q', search.trim());
    const qs = params.toString();
    router.replace(qs ? `/akis?${qs}` : '/akis', { scroll: false });
  }, [feedFilter, sortMode, categoryFilter, typeFilter, search, router]);

  useEffect(() => { loadFeedRef.current = loadFeed; }, [loadFeed]);

  // Restore scroll position when returning from post detail
  useEffect(() => {
    const saved = sessionStorage.getItem('feed_scroll');
    if (saved && !loading) {
      const main = document.querySelector('main');
      if (main) {
        main.scrollTop = Number(saved);
        sessionStorage.removeItem('feed_scroll');
      }
    }
  }, [loading]);

  useEffect(() => {
    const main = document.querySelector('main');
    if (!main) return;
    function onScroll() { setShowScrollTop(main!.scrollTop > 400); }
    main.addEventListener('scroll', onScroll, { passive: true });
    return () => main.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || e.metaKey || e.ctrlKey) return;
      if (e.key === '/') {
        e.preventDefault();
        document.getElementById('feed-search')?.focus();
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (!hasMore || loading || loadingMore) return;
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) void loadFeedRef.current?.(false);
      },
      { rootMargin: '300px' },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore]);

  // Sahne upcoming events for feed widget
  type SahneEvent = { id: string; slug: string; title: string; type: string; dateStart: string; location: string | null; attendeeCount: number };
  const [sahneEvents, setSahneEvents] = useState<SahneEvent[]>([]);
  const [myRsvps, setMyRsvps] = useState<Set<string>>(new Set());
  const [rsvpLoading, setRsvpLoading] = useState<string | null>(null);

  useEffect(() => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '';
    fetch(`${API_URL}/api/v1/cms/events`)
      .then((r) => r.ok ? r.json() : [])
      .then((data: SahneEvent[]) => {
        const now = Date.now();
        const upcoming = data
          .filter((e) => new Date(e.dateStart).getTime() >= now)
          .sort((a, b) => new Date(a.dateStart).getTime() - new Date(b.dateStart).getTime())
          .slice(0, 3);
        setSahneEvents(upcoming);
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!token) return;
    const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '';
    fetch(`${API_URL}/api/v1/cms/events-rsvp/mine`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.ok ? r.json() : [])
      .then((ids: string[]) => setMyRsvps(new Set(ids)))
      .catch(() => {});
  }, [token]);

  async function handleRsvp(eventId: string) {
    if (rsvpLoading) return;
    setRsvpLoading(eventId);
    const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '';
    const isRsvpd = myRsvps.has(eventId);
    try {
      const method = isRsvpd ? 'DELETE' : 'POST';
      const res = await fetch(`${API_URL}/api/v1/cms/events/${eventId}/rsvp`, {
        method,
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setMyRsvps((prev) => {
          const next = new Set(prev);
          isRsvpd ? next.delete(eventId) : next.add(eventId);
          return next;
        });
        setSahneEvents((prev) =>
          prev.map((e) =>
            e.id === eventId
              ? { ...e, attendeeCount: e.attendeeCount + (isRsvpd ? -1 : 1) }
              : e,
          ),
        );
      }
    } catch { /* */ } finally {
      setRsvpLoading(null);
    }
  }

  const weeklyHighlight = useMemo(() => {
    if (feed.length === 0) return null;
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const thisWeek = feed.filter(
      (p) => new Date(p.createdAt).getTime() > cutoff && p.reactionCount > 0,
    );
    if (thisWeek.length === 0) return null;
    return thisWeek.reduce((best, p) => p.reactionCount > best.reactionCount ? p : best);
  }, [feed]);

  function handlePostCreated(post: FeedPost) {
    setFeed((prev) => [post, ...prev]);
  }

  function handlePostDeleted(id: string) {
    setFeed((prev) => prev.filter((p) => p.id !== id));
  }

  const isNewUser = user?.createdAt
    ? Date.now() - new Date(user.createdAt).getTime() < 30 * 24 * 60 * 60 * 1000
    : false;
  const profileIncomplete = !user?.profile?.displayName || !user?.profile?.profession || !user?.profile?.bio;
  const showWelcome = isNewUser && profileIncomplete && !welcomeDismissed;

  function dismissWelcome() {
    localStorage.setItem('mutfak_welcome_dismissed', '1');
    setWelcomeDismissed(true);
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Scroll-to-top */}
      {showScrollTop && (
        <button
          onClick={() => document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-20 right-4 md:bottom-6 z-40 w-10 h-10 bg-[#26496b] text-white rounded-full shadow-lg flex items-center justify-center hover:bg-[#1e3a56] transition-colors animate-scale-in"
          aria-label="Başa dön"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        </button>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900 font-display">Akış</h1>
          <p className="text-xs text-gray-500 mt-0.5">Topluluk gönderileri</p>
        </div>
        {canPost && (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#26496b] text-white text-sm font-medium rounded-xl hover:bg-[#1d3a57] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Paylaş
          </button>
        )}
      </div>

      {/* Welcome Banner */}
      {showWelcome && (
        <div className="mb-5 bg-gradient-to-r from-[#26496b] to-[#1e3a56] rounded-2xl p-5 text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-5">
            <div className="absolute -right-4 -top-4 w-32 h-32 rounded-full bg-white" />
            <div className="absolute -left-4 -bottom-4 w-24 h-24 rounded-full bg-white" />
          </div>
          <button
            onClick={dismissWelcome}
            className="absolute top-3 right-3 text-white/50 hover:text-white"
            aria-label="Kapat"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <p className="text-sm font-semibold mb-1">Haritailesi Mutfak&apos;a hoş geldiniz!</p>
          <p className="text-xs text-white/70 mb-4 leading-relaxed">
            Topluluğun geri kalanıyla tanışmak için profilinizi tamamlayın, üyeleri keşfedin ve mentorlarla bağlantı kurun.
          </p>
          <div className="flex flex-wrap gap-2">
            <a
              href="/hesabim"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/15 hover:bg-white/25 text-white text-xs font-medium rounded-xl transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Profili Tamamla
            </a>
            <a
              href="/uyeler"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/15 hover:bg-white/25 text-white text-xs font-medium rounded-xl transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Üyeleri Keşfet
            </a>
            <a
              href="/mentorluk"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#66aca9]/40 hover:bg-[#66aca9]/60 text-white text-xs font-medium rounded-xl transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              Mentor Bul
            </a>
          </div>
        </div>
      )}

      {/* Feed Tabs */}
      <div className="flex items-center gap-2 mb-4">
        <div className="flex gap-0.5 bg-gray-100 rounded-xl p-1 flex-1">
          {(['all', 'following'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFeedFilter(f)}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                feedFilter === f
                  ? 'bg-white text-[#26496b] shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {f === 'all' ? 'Tüm Akış' : 'Takip Edilenler'}
            </button>
          ))}
        </div>
        <div className="flex gap-0.5 bg-gray-100 rounded-xl p-1 shrink-0">
          {(['recent', 'hot'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSortMode(s)}
              className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                sortMode === s
                  ? 'bg-white text-[#26496b] shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              title={s === 'hot' ? 'Son 30 günün en çok etkileşim alanları' : 'En yeni gönderiler'}
            >
              {s === 'recent' ? '🕐 Son' : '🔥 Popüler'}
            </button>
          ))}
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col gap-2 mb-5">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            id="feed-search"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Gönderilerde ara… (/ ile odaklan)"
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#26496b]/30 focus:border-[#26496b]"
          />
        </div>

        {/* Type chip filters */}
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
          <button
            onClick={() => setTypeFilter('')}
            className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors border ${
              typeFilter === ''
                ? 'bg-[#26496b] text-white border-[#26496b]'
                : 'bg-white text-gray-600 border-gray-200 hover:border-[#26496b]/40 hover:text-[#26496b]'
            }`}
          >
            Tüm Türler
          </button>
          {Object.entries(POST_TYPE_LABELS).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTypeFilter(typeFilter === key ? '' : key)}
              className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors border ${
                typeFilter === key
                  ? 'bg-[#26496b] text-white border-[#26496b]'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-[#26496b]/40 hover:text-[#26496b]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Category chip filters */}
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
          <button
            onClick={() => setCategoryFilter('')}
            className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors border ${
              categoryFilter === ''
                ? 'bg-[#66aca9] text-white border-[#66aca9]'
                : 'bg-white text-gray-500 border-gray-200 hover:border-[#66aca9]/40 hover:text-[#66aca9]'
            }`}
          >
            Tüm Kategoriler
          </button>
          {Object.entries(POST_CATEGORY_LABELS).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setCategoryFilter(categoryFilter === key ? '' : key)}
              className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors border ${
                categoryFilter === key
                  ? 'bg-[#66aca9] text-white border-[#66aca9]'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-[#66aca9]/40 hover:text-[#66aca9]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Discovery widgets — below filters so posts load immediately above the fold */}
      <StatsBar />
      <ActivityWidget />
      <SuggestedMembers />

      {/* Bu Hafta Öne Çıkan */}
      {weeklyHighlight && !search.trim() && !categoryFilter && !typeFilter && (
        <div className="animate-gradient-border rounded-2xl p-px mb-5">
        <a
          href={`/akis/${weeklyHighlight.id}`}
          className="group flex items-start gap-3 p-4 bg-white rounded-[calc(1rem-1px)] hover:bg-gray-50/80 transition-colors"
        >
          <div className="shrink-0 w-8 h-8 rounded-xl bg-[#26496b] flex items-center justify-center mt-0.5">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-semibold text-[#26496b] uppercase tracking-wider mb-0.5">Bu Hafta Öne Çıkan</p>
            <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-[#26496b] transition-colors">
              {weeklyHighlight.title ?? weeklyHighlight.body.slice(0, 80)}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">{weeklyHighlight.displayName} · {weeklyHighlight.reactionCount} beğeni</p>
          </div>
          <svg className="w-4 h-4 text-gray-400 group-hover:text-[#26496b] shrink-0 mt-1 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </a>
        </div>
      )}

      {/* Sahne yaklaşan etkinlikler — mobile'da sidebar hidden olduğu için feed'de göster */}
      {sahneEvents.length > 0 && !search.trim() && !categoryFilter && !typeFilter && (
        <div className="md:hidden mb-5 bg-gradient-to-r from-[#26496b]/5 to-[#66aca9]/10 border border-[#26496b]/15 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-semibold text-[#26496b] uppercase tracking-wider">Sahne&apos;de Yakında</p>
            <a
              href={process.env.NEXT_PUBLIC_SAHNE_URL ?? '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-[#66aca9] hover:text-[#66aca9]/80"
            >
              Tümü →
            </a>
          </div>
          <div className="space-y-3">
            {sahneEvents.map((e) => {
              const isRsvpd = myRsvps.has(e.id);
              return (
                <div key={e.id} className="flex items-start gap-3">
                  <span className="shrink-0 text-xs font-bold text-[#66aca9] w-10 pt-0.5">
                    {new Date(e.dateStart).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                  </span>
                  <div className="flex-1 min-w-0">
                    <a
                      href={`${process.env.NEXT_PUBLIC_SAHNE_URL ?? '#'}/etkinlikler/${e.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-gray-700 hover:text-[#26496b] transition-colors truncate block"
                    >
                      {e.title}
                    </a>
                    {e.attendeeCount > 0 && (
                      <p className="text-[10px] text-gray-400 mt-0.5">{e.attendeeCount} katılımcı</p>
                    )}
                  </div>
                  <button
                    onClick={() => void handleRsvp(e.id)}
                    disabled={rsvpLoading === e.id}
                    className={`shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-full border transition-colors ${
                      isRsvpd
                        ? 'bg-[#26496b] text-white border-[#26496b]'
                        : 'text-[#26496b] border-[#26496b]/40 hover:bg-[#26496b]/5'
                    }`}
                  >
                    {rsvpLoading === e.id ? '…' : isRsvpd ? 'Katılıyorum ✓' : 'Katıl'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {isReadOnly && (
        <div className="mb-4 flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Gönderi paylaşmak Haritailesi Genç ve üzeri üyelere açıktır. Yorum ve beğeni yapabilirsiniz.
        </div>
      )}
      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

      {/* Feed */}
      <div className="space-y-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <FeedPostSkeleton key={i} />)
        ) : feed.length === 0 ? (
          <EmptyState
            illustration="topo"
            title={
              feedFilter === 'following'
                ? 'Takip ettiğinizden gönderi yok.'
                : search.trim() ? 'Arama sonucu bulunamadı.' : 'Henüz gönderi yok.'
            }
            description={
              feedFilter === 'following'
                ? 'Üye profillerinden birini takip ederek kişisel akışınızı oluşturun.'
                : search.trim() ? 'Farklı bir arama deneyin.' : 'Topluluk paylaşımları burada görünecek.'
            }
            action={feedFilter === 'following' ? (
              <a href="/uyeler" className="text-sm text-[#26496b] font-medium hover:underline">
                Üyeleri Keşfet →
              </a>
            ) : canPost && !search.trim() ? (
              <button
                onClick={() => setShowCreate(true)}
                className="text-sm text-[#26496b] font-medium hover:underline"
              >
                İlk gönderiyi sen paylaş →
              </button>
            ) : undefined}
          />
        ) : (
          feed.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              token={token}
              currentUserId={currentUserId}
              onDeleted={handlePostDeleted}
            />
          ))
        )}
      </div>

      {/* Infinite scroll sentinel */}
      {hasMore && !loading && <div ref={sentinelRef} className="h-8" />}

      {loadingMore && (
        <div className="flex justify-center py-4">
          <div className="w-5 h-5 rounded-full border-2 border-[#26496b]/20 border-t-[#26496b] animate-spin" />
        </div>
      )}

      {showCreate && (
        <CreatePostModal
          token={token}
          onClose={() => setShowCreate(false)}
          onCreated={handlePostCreated}
        />
      )}
    </div>
  );
}
