import { Injectable, BadRequestException } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import { ConfigService } from '@nestjs/config';
import { InjectDb } from '../database/inject-db.decorator';
import type { Database } from '@haritailesi/database';
import { aiConversations, aiMessages, libraryTerms, libraryGuides, libraryRegulations } from '@haritailesi/database';
import { eq, asc, and, or, ilike, sql, type SQL } from 'drizzle-orm';

const SYSTEM_PROMPTS: Record<string, string> = {
  library: `Sen Haritailesi Meslek Kütüphanesi'nin yapay zeka asistanısın. Haritacılık, jeodezi, geomatik, CBS (Coğrafi Bilgi Sistemleri), fotogrametri, kadastro, uzaktan algılama ve gayrimenkul değerleme alanlarında uzman bir rehbersin.

Görevlerin:
- Meslek sözlüğündeki terimleri açıklamak ve tanımlamak
- Mesleki rehberler, makaleler ve teknik kılavuzlar hakkında yönlendirmek
- Mevzuat ve teknik düzenlemeler hakkında bilgi vermek
- Kariyer ve eğitim konularında yol göstermek
- Sınav hazırlığında (KPSS, CBS Uzmanı, Değerleme, İHA) destek sağlamak

Yanıtlarını Türkçe ver. Teknik bilgiyi anlaşılır şekilde aktar. Emin olmadığın bilgileri belirt ve doğrulama için yetkili kaynaklara yönlendir.`,

  general: `Sen Haritailesi platformunun yapay zeka asistanısın. Haritacılık ve geomatik alanında uzman bir topluluk platformu olan Haritailesi'nde üyelere yardım edersin. Yanıtlarını Türkçe ver.`,
};

@Injectable()
export class AiService {
  private anthropic: Anthropic;

  constructor(
    @InjectDb() private readonly db: Database,
    private readonly config: ConfigService,
  ) {
    this.anthropic = new Anthropic({
      apiKey: this.config.get<string>('ANTHROPIC_API_KEY'),
    });
  }

  async chat(opts: {
    userId: string | null;
    sessionId: string;
    conversationId: string | null;
    message: string;
    context: string;
  }) {
    const { userId, sessionId, conversationId, message, context } = opts;

    if (!message.trim()) throw new BadRequestException('Mesaj boş olamaz');

    let conversation: typeof aiConversations.$inferSelect | undefined;

    if (conversationId) {
      [conversation] = await this.db.select().from(aiConversations)
        .where(eq(aiConversations.id, conversationId))
        .limit(1);
    }

    if (!conversation) {
      [conversation] = await this.db.insert(aiConversations).values({
        userId: userId ?? null,
        sessionId,
        context,
        messageCount: 0,
      }).returning();
    }

    if (!conversation) throw new Error('Konuşma oluşturulamadı');

    const history = await this.db.select().from(aiMessages)
      .where(eq(aiMessages.conversationId, conversation.id))
      .orderBy(asc(aiMessages.createdAt))
      .limit(20);

    await this.db.insert(aiMessages).values({
      conversationId: conversation.id,
      role: 'user',
      content: message.trim(),
    });

    const apiMessages = [
      ...history.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user' as const, content: message.trim() },
    ];

    let ragContext = '';
    if (context === 'library') {
      try {
        const q = message.trim().slice(0, 100);
        const ftsFilter = (col: SQL) =>
          sql`to_tsvector('turkish', coalesce(${col},'')) @@ plainto_tsquery('turkish', ${q})`;

        const [matchedTerms, matchedGuides, matchedRegs] = await Promise.all([
          this.db.select({ term: libraryTerms.term, definition: libraryTerms.definition, slug: libraryTerms.slug })
            .from(libraryTerms)
            .where(and(
              eq(libraryTerms.status, 'published'),
              or(
                ftsFilter(sql`coalesce(${libraryTerms.term},'') || ' ' || coalesce(${libraryTerms.definition},'')`),
                ilike(libraryTerms.term, `%${q}%`),
              )!,
            ))
            .limit(4),
          this.db.select({ title: libraryGuides.title, summary: libraryGuides.summary, slug: libraryGuides.slug })
            .from(libraryGuides)
            .where(and(
              eq(libraryGuides.status, 'published'),
              or(
                ftsFilter(sql`coalesce(${libraryGuides.title},'') || ' ' || coalesce(${libraryGuides.summary},'')`),
                ilike(libraryGuides.title, `%${q}%`),
              )!,
            ))
            .limit(3),
          this.db.select({ title: libraryRegulations.title, shortTitle: libraryRegulations.shortTitle, aiSummary: libraryRegulations.aiSummary, slug: libraryRegulations.slug })
            .from(libraryRegulations)
            .where(and(
              eq(libraryRegulations.status, 'published'),
              or(
                ftsFilter(sql`coalesce(${libraryRegulations.title},'') || ' ' || coalesce(${libraryRegulations.aiSummary},'')`),
                ilike(libraryRegulations.title, `%${q}%`),
              )!,
            ))
            .limit(2),
        ]);

        if (matchedTerms.length || matchedGuides.length || matchedRegs.length) {
          ragContext = '\n\n--- Kütüphane İçeriği (Bu soruyla ilgili) ---';
          for (const t of matchedTerms) {
            ragContext += `\n\nTerim: ${t.term}\nTanım: ${t.definition}${t.slug ? `\nURL: /kutuphane/sozluk/${t.slug}` : ''}`;
          }
          for (const g of matchedGuides) {
            ragContext += `\n\nRehber: ${g.title}\nÖzet: ${g.summary}\nURL: /kutuphane/rehberler/${g.slug}`;
          }
          for (const r of matchedRegs) {
            ragContext += `\n\nMevzuat: ${r.shortTitle ?? r.title}${r.aiSummary ? `\nÖzet: ${r.aiSummary}` : ''}\nURL: /kutuphane/mevzuat/${r.slug}`;
          }
          ragContext += '\n--- İçerik sonu ---\nYukarıdaki kütüphane içeriklerini yanıtına referans olarak kullanabilirsin.';
        }
      } catch { /* ignore — RAG is best-effort */ }
    }

    const systemPrompt = (SYSTEM_PROMPTS[context] ?? SYSTEM_PROMPTS['general']!) + ragContext;

    const response = await this.anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: systemPrompt,
      messages: apiMessages,
    });

    const assistantContent =
      response.content[0]?.type === 'text' ? response.content[0].text : '';

    const [savedMsg] = await this.db.insert(aiMessages).values({
      conversationId: conversation.id,
      role: 'assistant',
      content: assistantContent,
    }).returning();

    await this.db.update(aiConversations)
      .set({ messageCount: conversation.messageCount + 2, updatedAt: new Date() })
      .where(eq(aiConversations.id, conversation.id));

    return {
      conversationId: conversation.id,
      message: savedMsg,
    };
  }

  async getMessages(conversationId: string) {
    return this.db.select().from(aiMessages)
      .where(eq(aiMessages.conversationId, conversationId))
      .orderBy(asc(aiMessages.createdAt));
  }
}
