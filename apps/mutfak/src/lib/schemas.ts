import { z } from 'zod';

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const LoginSchema = z.object({
  email: z.string().email('Geçerli bir e-posta adresi girin.'),
  password: z.string().min(1, 'Şifre gereklidir.'),
});

export const ForgotPasswordSchema = z.object({
  email: z.string().email('Geçerli bir e-posta adresi girin.'),
});

export const ResetPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, 'Şifre en az 8 karakter olmalı.')
      .regex(/\d/, 'En az bir rakam içermelidir.'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Şifreler eşleşmiyor.',
    path: ['confirmPassword'],
  });

export const ChangePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Mevcut şifre gereklidir.'),
    newPassword: z
      .string()
      .min(8, 'Yeni şifre en az 8 karakter olmalı.')
      .regex(/\d/, 'En az bir rakam içermelidir.'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Şifreler eşleşmiyor.',
    path: ['confirmPassword'],
  });

// ─── Profile ──────────────────────────────────────────────────────────────────

export const ProfileUpdateSchema = z.object({
  displayName: z.string().min(2, 'En az 2 karakter').max(100).optional(),
  bio: z.string().max(300).optional(),
  city: z.string().max(80).optional(),
  profession: z.string().max(100).optional(),
  linkedinUrl: z.string().url('Geçerli LinkedIn URL girin.').optional().or(z.literal('')),
  websiteUrl: z.string().url('Geçerli URL girin.').optional().or(z.literal('')),
  portfolioUrl: z.string().url('Geçerli URL girin.').optional().or(z.literal('')),
  skillTags: z.array(z.string().max(50)).max(10).optional(),
});

// ─── Feed ─────────────────────────────────────────────────────────────────────

const POST_TYPES = [
  'general', 'question', 'idea', 'project_call', 'content_draft',
  'team_search', 'mentorship_experience', 'poll', 'announcement', 'resource',
] as const;

const POST_CATEGORIES = [
  'klasik_haritacilik', 'cbs', 'fotogrametri_uzaktan_algilama', 'insaat',
  'gayrimenkul_degerleme', 'yazilim_teknoloji', 'kariyer', 'egitim',
  'mentorluk', 'gonullulik', 'proje_gelistirme', 'haritailesi_duyurulari',
] as const;

export const CreatePostSchema = z.object({
  type: z.enum(POST_TYPES, { errorMap: () => ({ message: 'Tür seçin.' }) }),
  category: z.enum(POST_CATEGORIES, { errorMap: () => ({ message: 'Kategori seçin.' }) }),
  title: z.string().max(300).optional(),
  body: z.string().min(1, 'İçerik gereklidir.').max(5000),
});

export const CreateCommentSchema = z.object({
  body: z.string().min(1, 'Yorum boş olamaz.').max(2000),
});

// ─── Mentorship ───────────────────────────────────────────────────────────────

export const MentorshipRequestSchema = z.object({
  mentorId: z.string().uuid(),
  topic: z.string().min(5, 'Konu en az 5 karakter olmalı.').max(200),
  goal: z.string().min(10, 'Hedef en az 10 karakter olmalı.').max(1000),
  preferredFormat: z.enum(['online', 'in_person']),
});

export const SessionFeedbackSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(500).optional(),
});

// ─── Messages ─────────────────────────────────────────────────────────────────

export const SendMessageSchema = z.object({
  body: z.string().min(1, 'Mesaj boş olamaz.').max(2000),
});

// ─── Inferred types ───────────────────────────────────────────────────────────

export type LoginInput = z.infer<typeof LoginSchema>;
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>;
export type ProfileUpdateInput = z.infer<typeof ProfileUpdateSchema>;
export type CreatePostInput = z.infer<typeof CreatePostSchema>;
export type CreateCommentInput = z.infer<typeof CreateCommentSchema>;
export type MentorshipRequestInput = z.infer<typeof MentorshipRequestSchema>;
export type SessionFeedbackInput = z.infer<typeof SessionFeedbackSchema>;
export type SendMessageInput = z.infer<typeof SendMessageSchema>;
