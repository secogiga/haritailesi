import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { eq, and, desc } from 'drizzle-orm';
import { InjectDb } from '../database/inject-db.decorator';
import type { Database } from '@haritailesi/database';
import { verificationDocuments, users, userProfiles } from '@haritailesi/database';

const DOC_TYPES = [
  'diploma',
  'transcript',
  'employee_card',
  'shkm_certificate',
  'lihkab_certificate',
  'tax_plate',
  'id_card',
  'other',
] as const;

export { DOC_TYPES };

@Injectable()
export class VerificationService {
  constructor(@InjectDb() private readonly db: Database) {}

  async submitDocument(
    userId: string,
    data: {
      documentType: string;
      fileKey: string;
      originalFilename: string;
      mimeType: string;
    },
  ) {
    const [doc] = await this.db
      .insert(verificationDocuments)
      .values({
        userId,
        documentType: data.documentType,
        fileKey: data.fileKey,
        originalFilename: data.originalFilename,
        mimeType: data.mimeType,
        status: 'pending',
      })
      .returning();

    // verificationStatus'ı güncelle
    await this.db
      .update(users)
      .set({ verificationStatus: 'verification_submitted', updatedAt: new Date() })
      .where(eq(users.id, userId));

    return doc;
  }

  async getMyDocuments(userId: string) {
    return this.db
      .select({
        id: verificationDocuments.id,
        documentType: verificationDocuments.documentType,
        originalFilename: verificationDocuments.originalFilename,
        mimeType: verificationDocuments.mimeType,
        status: verificationDocuments.status,
        notes: verificationDocuments.notes,
        createdAt: verificationDocuments.createdAt,
        reviewedAt: verificationDocuments.reviewedAt,
      })
      .from(verificationDocuments)
      .where(eq(verificationDocuments.userId, userId))
      .orderBy(desc(verificationDocuments.createdAt));
  }

  // ─── Admin ────────────────────────────────────────────────────────────────────

  async listPendingDocuments(userId?: string) {
    const rows = await this.db
      .select({
        id: verificationDocuments.id,
        userId: verificationDocuments.userId,
        documentType: verificationDocuments.documentType,
        originalFilename: verificationDocuments.originalFilename,
        fileKey: verificationDocuments.fileKey,
        mimeType: verificationDocuments.mimeType,
        status: verificationDocuments.status,
        notes: verificationDocuments.notes,
        createdAt: verificationDocuments.createdAt,
        reviewedAt: verificationDocuments.reviewedAt,
        displayName: userProfiles.displayName,
        email: users.email,
        membershipTier: users.membershipTier,
      })
      .from(verificationDocuments)
      .innerJoin(users, eq(users.id, verificationDocuments.userId))
      .leftJoin(userProfiles, eq(userProfiles.userId, verificationDocuments.userId))
      .where(userId ? eq(verificationDocuments.userId, userId) : undefined)
      .orderBy(desc(verificationDocuments.createdAt));

    return rows;
  }

  async getDocumentById(docId: string) {
    const [doc] = await this.db
      .select()
      .from(verificationDocuments)
      .where(eq(verificationDocuments.id, docId))
      .limit(1);
    return doc ?? null;
  }

  async reviewDocument(
    adminId: string,
    docId: string,
    decision: 'approved' | 'rejected',
    notes?: string,
  ) {
    const doc = await this.db.query.verificationDocuments.findFirst({
      where: and(
        eq(verificationDocuments.id, docId),
        eq(verificationDocuments.status, 'pending'),
      ),
    });

    if (!doc) throw new NotFoundException('Bekleyen belge bulunamadı.');

    const [updated] = await this.db
      .update(verificationDocuments)
      .set({
        status: decision,
        reviewedBy: adminId,
        reviewedAt: new Date(),
        updatedAt: new Date(),
        ...(notes ? { notes } : {}),
      })
      .where(eq(verificationDocuments.id, docId))
      .returning();

    if (decision === 'approved') {
      const remaining = await this.db
        .select({ id: verificationDocuments.id })
        .from(verificationDocuments)
        .where(and(
          eq(verificationDocuments.userId, doc.userId),
          eq(verificationDocuments.status, 'pending'),
        ));

      if (remaining.length === 0) {
        await this.db
          .update(users)
          .set({ verificationStatus: 'verified', updatedAt: new Date() })
          .where(eq(users.id, doc.userId));
      }
    } else {
      await this.db
        .update(users)
        .set({ verificationStatus: 'verification_rejected', updatedAt: new Date() })
        .where(eq(users.id, doc.userId));
    }

    return updated;
  }
}
