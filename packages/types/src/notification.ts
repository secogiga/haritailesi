// ─── Notification Types ────────────────────────────────────────────────────────

export type NotificationType =
  | 'new_comment'
  | 'new_reaction'
  | 'new_mention'
  | 'mentorship_request'
  | 'mentorship_accepted'
  | 'mentorship_rejected'
  | 'session_reminder'
  | 'mentorship_completed'
  | 'new_follower'
  | 'new_message';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  is_read: boolean;
  data: Record<string, unknown> | null;
  created_at: string;
}

// ─── Notification Preferences ─────────────────────────────────────────────────

export type NotificationPreferences = Partial<Record<NotificationType, boolean>>;

export interface NotificationPreferenceRecord {
  id: string;
  user_id: string;
  preferences: NotificationPreferences;
  created_at: string;
  updated_at: string;
}
