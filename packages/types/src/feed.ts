// ─── Post Types ────────────────────────────────────────────────────────────────

export type PostType =
  | 'general'
  | 'question'
  | 'idea'
  | 'project_call'
  | 'content_draft'
  | 'team_search'
  | 'mentorship_experience'
  | 'poll'
  | 'announcement'
  | 'resource';

// ─── Post Categories ───────────────────────────────────────────────────────────

export type PostCategory =
  | 'klasik_haritacilik'
  | 'cbs'
  | 'fotogrametri_uzaktan_algilama'
  | 'insaat'
  | 'gayrimenkul_degerleme'
  | 'yazilim_teknoloji'
  | 'kariyer'
  | 'egitim'
  | 'mentorluk'
  | 'gonullulik'
  | 'proje_gelistirme'
  | 'haritailesi_duyurulari';

// ─── Post Status ───────────────────────────────────────────────────────────────

export type PostStatus = 'draft' | 'pending_review' | 'published' | 'hidden' | 'deleted';

// ─── Post ─────────────────────────────────────────────────────────────────────

export interface Post {
  id: string;
  author_id: string;
  type: PostType;
  category: PostCategory;
  title: string | null;
  body: string;
  status: PostStatus;
  is_pinned: boolean;
  comment_count: number;
  reaction_count: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

// ─── Comment ──────────────────────────────────────────────────────────────────

export interface Comment {
  id: string;
  post_id: string;
  author_id: string;
  parent_id: string | null;
  body: string;
  status: PostStatus;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

// ─── Reaction ─────────────────────────────────────────────────────────────────

export type ReactionType = 'like' | 'insightful' | 'support';

export interface Reaction {
  id: string;
  user_id: string;
  target_type: 'post' | 'comment';
  target_id: string;
  reaction_type: ReactionType;
  created_at: string;
}
