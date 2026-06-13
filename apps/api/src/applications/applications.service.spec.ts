import { NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { ApplicationsService } from './applications.service';
import { APPLICATION_STATE_CHANGED, DomainEvent } from './events/application.events';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const makeApp = (overrides: Record<string, unknown> = {}) => ({
  id: 'app-uuid-1',
  type: 'individual' as const,
  state: 'submitted',
  applicantEmail: 'test@example.com',
  applicantUserId: null,
  formData: { adSoyad: 'Test Kullanıcı' },
  adminNotes: null,
  paymentStatus: 'pending' as const,
  paymentAmountKurus: null,
  paymentDescription: null,
  paymentDueAt: null,
  reminderCount: 0,
  lastReminderAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
  reviewedBy: null,
  ...overrides,
});

const makeActor = (functionalRoles: string[] = ['admin'], membershipTier = 'individual_member') => ({
  id: 'actor-uuid',
  email: 'admin@example.com',
  membershipTier,
  functionalRoles,
});

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockTx = {
  insert: jest.fn().mockReturnThis(),
  values: jest.fn().mockReturnThis(),
  returning: jest.fn(),
  update: jest.fn().mockReturnThis(),
  set: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  from: jest.fn().mockReturnThis(),
  limit: jest.fn().mockResolvedValue([]),
};

const mockDb = {
  query: {
    applications: { findFirst: jest.fn() },
  },
  transaction: jest.fn().mockImplementation(async (fn: (tx: typeof mockTx) => Promise<unknown>) =>
    fn(mockTx),
  ),
  update: jest.fn().mockReturnThis(),
  set: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  returning: jest.fn(),
  insert: jest.fn().mockReturnThis(),
  values: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  from: jest.fn().mockReturnThis(),
  limit: jest.fn().mockResolvedValue([]),
};

const mockEventEmitter = { emit: jest.fn() };
const mockAudit = { log: jest.fn().mockResolvedValue(undefined) };
const mockEmail = {
  send: jest.fn().mockResolvedValue(undefined),
  sendApplicationSubmitted: jest.fn().mockResolvedValue(undefined),
  sendProvisionaryFollowup: jest.fn().mockResolvedValue(undefined),
  sendAccountSetup: jest.fn().mockResolvedValue(undefined),
};
const mockAuth = { createSetupToken: jest.fn().mockResolvedValue('setup-token') };

function makeService(): ApplicationsService {
  return new ApplicationsService(
    mockDb as any,
    mockEventEmitter as any,
    mockAudit as any,
    mockEmail as any,
    mockAuth as any,
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  // Default transaction chain: inserted app + state log
  mockTx.returning.mockResolvedValue([{ id: 'app-uuid-1', state: 'submitted' }]);
  mockDb.returning.mockResolvedValue([makeApp()]);
});

// ─── submit ───────────────────────────────────────────────────────────────────

describe('ApplicationsService.submit', () => {
  it('returns id and state on success', async () => {
    const service = makeService();
    const result = await service.submit({
      type: 'individual',
      applicantEmail: 'test@example.com',
      formData: { adSoyad: 'Test' },
    });
    expect(result).toEqual({ id: 'app-uuid-1', state: 'submitted' });
  });

  it('sends application_submitted email after commit', async () => {
    const service = makeService();
    await service.submit({
      type: 'individual',
      applicantEmail: 'test@example.com',
      formData: { adSoyad: 'Test' },
    });
    expect(mockEmail.sendApplicationSubmitted).toHaveBeenCalledWith('test@example.com', 'Test');
  });

  it('logs audit after successful submission', async () => {
    const service = makeService();
    await service.submit({
      type: 'individual',
      applicantEmail: 'test@example.com',
      formData: {},
    });
    expect(mockAudit.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'application.submitted',
        entityType: 'application',
      }),
    );
  });

  it('sends email to original address (DB stores lowercase)', async () => {
    const service = makeService();
    await service.submit({
      type: 'individual',
      applicantEmail: 'TEST@EXAMPLE.COM',
      formData: {},
    });
    expect(mockEmail.sendApplicationSubmitted).toHaveBeenCalledWith('TEST@EXAMPLE.COM', expect.any(String));
  });
});

// ─── transitionState ──────────────────────────────────────────────────────────

describe('ApplicationsService.transitionState', () => {
  it('throws NotFoundException when application not found', async () => {
    mockDb.query.applications.findFirst.mockResolvedValue(null);
    const service = makeService();
    await expect(
      service.transitionState('nonexistent', { toState: 'under_review' }, makeActor() as any),
    ).rejects.toThrow(NotFoundException);
  });

  it('throws BadRequestException for invalid transition', async () => {
    mockDb.query.applications.findFirst.mockResolvedValue(
      makeApp({ state: 'submitted', type: 'individual' }),
    );
    const service = makeService();
    // submitted → approved is not a valid individual transition
    await expect(
      service.transitionState('app-uuid-1', { toState: 'approved' }, makeActor() as any),
    ).rejects.toThrow(BadRequestException);
  });

  it('throws ForbiddenException when actor lacks required permission', async () => {
    mockDb.query.applications.findFirst.mockResolvedValue(
      makeApp({ state: 'submitted', type: 'individual' }),
    );
    // viewer role cannot review applications
    const actor = makeActor(['viewer'], 'registered_user');
    const service = makeService();
    await expect(
      service.transitionState('app-uuid-1', { toState: 'under_review' }, actor as any),
    ).rejects.toThrow(ForbiddenException);
  });

  it('throws BadRequestException when admin_notes prerequisite not met', async () => {
    mockDb.query.applications.findFirst.mockResolvedValue(
      makeApp({ state: 'approved', type: 'individual', adminNotes: null }),
    );
    const service = makeService();
    await expect(
      service.transitionState(
        'app-uuid-1',
        { toState: 'waiting_payment' },
        makeActor(['super_admin'], 'individual_member') as any,
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('throws BadRequestException when payment_amount prerequisite not met', async () => {
    mockDb.query.applications.findFirst.mockResolvedValue(
      makeApp({ state: 'waiting_payment', type: 'individual' }),
    );
    const service = makeService();
    await expect(
      service.transitionState(
        'app-uuid-1',
        { toState: 'waiting_verification', paymentAmountKurus: 0 },
        makeActor(['super_admin'], 'individual_member') as any,
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('emits APPLICATION_STATE_CHANGED on successful transition', async () => {
    mockDb.query.applications.findFirst.mockResolvedValue(
      makeApp({ state: 'submitted', type: 'individual' }),
    );
    mockTx.returning.mockResolvedValue([
      makeApp({ state: 'under_review' }),
    ]);
    const service = makeService();
    await service.transitionState(
      'app-uuid-1',
      { toState: 'under_review' },
      makeActor(['admin'], 'individual_member') as any,
    );
    expect(mockEventEmitter.emit).toHaveBeenCalledWith(
      APPLICATION_STATE_CHANGED,
      expect.objectContaining({
        applicationId: 'app-uuid-1',
        toState: 'under_review',
      }),
    );
  });
});

// ─── waivePayment ─────────────────────────────────────────────────────────────

describe('ApplicationsService.waivePayment', () => {
  it('throws NotFoundException when application not found', async () => {
    mockDb.query.applications.findFirst.mockResolvedValue(null);
    const service = makeService();
    await expect(
      service.waivePayment('nonexistent', 'Burs', makeActor() as any),
    ).rejects.toThrow(NotFoundException);
  });

  it('throws BadRequestException when application is not in waiting_payment state', async () => {
    mockDb.query.applications.findFirst.mockResolvedValue(
      makeApp({ state: 'approved' }),
    );
    const service = makeService();
    await expect(
      service.waivePayment('app-uuid-1', 'Burs', makeActor() as any),
    ).rejects.toThrow(BadRequestException);
  });

  it('emits PAYMENT_WAIVED domain event on success', async () => {
    const app = makeApp({ state: 'waiting_payment', applicantUserId: 'user-uuid' });
    mockDb.query.applications.findFirst.mockResolvedValue(app);
    mockDb.returning.mockResolvedValue([{ ...app, state: 'waiting_verification', paymentStatus: 'waived' }]);
    mockDb.values.mockReturnThis();

    const service = makeService();
    await service.waivePayment('app-uuid-1', 'Burs öğrencisi', makeActor() as any);

    expect(mockEventEmitter.emit).toHaveBeenCalledWith(
      DomainEvent.PAYMENT_WAIVED,
      expect.objectContaining({
        applicationId: 'app-uuid-1',
        applicantEmail: 'test@example.com',
        actorId: 'actor-uuid',
        metadata: { reason: 'Burs öğrencisi' },
      }),
    );
  });

  it('returns updated application with waiting_verification state', async () => {
    const app = makeApp({ state: 'waiting_payment' });
    mockDb.query.applications.findFirst.mockResolvedValue(app);
    const updated = { ...app, state: 'waiting_verification', paymentStatus: 'waived' };
    mockDb.returning.mockResolvedValue([updated]);
    mockDb.values.mockReturnThis();

    const service = makeService();
    const result = await service.waivePayment('app-uuid-1', 'test', makeActor() as any);
    expect(result.state).toBe('waiting_verification');
    expect(result.paymentStatus).toBe('waived');
  });
});

// ─── resendPaymentReminder — cooldown guard ───────────────────────────────────

describe('ApplicationsService.resendPaymentReminder', () => {
  it('throws BadRequestException when within 24h cooldown', async () => {
    const recentReminder = new Date(Date.now() - 30 * 60 * 1000); // 30 dk önce
    const app = makeApp({ state: 'waiting_payment', lastReminderAt: recentReminder, reminderCount: 1 });
    mockDb.query.applications.findFirst.mockResolvedValue(app);

    const service = makeService();
    await expect(service.resendPaymentReminder('app-uuid-1')).rejects.toThrow(BadRequestException);
    expect(mockEmail.send).not.toHaveBeenCalled();
  });

  it('allows reminder when cooldown has expired (> 24h)', async () => {
    const oldReminder = new Date(Date.now() - 25 * 60 * 60 * 1000); // 25 saat önce
    const app = makeApp({ state: 'waiting_payment', lastReminderAt: oldReminder, reminderCount: 1 });
    mockDb.query.applications.findFirst.mockResolvedValue(app);
    mockDb.returning.mockResolvedValue([]);

    const service = makeService();
    await expect(service.resendPaymentReminder('app-uuid-1')).resolves.not.toThrow();
    expect(mockEmail.send).toHaveBeenCalledWith(
      'test@example.com',
      'payment_reminder',
      expect.objectContaining({ displayName: 'Test Kullanıcı' }),
    );
  });

  it('allows first reminder when lastReminderAt is null', async () => {
    const app = makeApp({ state: 'waiting_payment', lastReminderAt: null, reminderCount: 0 });
    mockDb.query.applications.findFirst.mockResolvedValue(app);
    mockDb.returning.mockResolvedValue([]);

    const service = makeService();
    await expect(service.resendPaymentReminder('app-uuid-1')).resolves.not.toThrow();
    expect(mockEmail.send).toHaveBeenCalled();
  });

  it('increments reminderCount and sets lastReminderAt on success', async () => {
    const app = makeApp({ state: 'waiting_payment', reminderCount: 2, lastReminderAt: null });
    mockDb.query.applications.findFirst.mockResolvedValue(app);
    mockDb.returning.mockResolvedValue([]);

    const service = makeService();
    await service.resendPaymentReminder('app-uuid-1');

    // DB update should include reminderCount + 1 and lastReminderAt
    const updateCall = mockDb.set.mock.calls.find((args: unknown[]) => {
      const arg = args[0] as Record<string, unknown>;
      return typeof arg?.reminderCount === 'number';
    });
    expect(updateCall).toBeDefined();
    const updateArg = updateCall![0] as Record<string, unknown>;
    expect(updateArg.reminderCount).toBe(3);
    expect(updateArg.lastReminderAt).toBeInstanceOf(Date);
  });

  it('throws NotFoundException when application not found', async () => {
    mockDb.query.applications.findFirst.mockResolvedValue(null);
    const service = makeService();
    await expect(service.resendPaymentReminder('nonexistent')).rejects.toThrow(NotFoundException);
  });

  it('throws BadRequestException when state is not waiting_payment or approved', async () => {
    const app = makeApp({ state: 'under_review' });
    mockDb.query.applications.findFirst.mockResolvedValue(app);
    const service = makeService();
    await expect(service.resendPaymentReminder('app-uuid-1')).rejects.toThrow(BadRequestException);
    expect(mockEmail.send).not.toHaveBeenCalled();
  });
});

// ─── extendPaymentDueDate ─────────────────────────────────────────────────────

describe('ApplicationsService.extendPaymentDueDate', () => {
  it('extends paymentDueAt by extraDays and writes audit log', async () => {
    const existingDue = new Date(Date.now() + 24 * 60 * 60 * 1000); // 1 gün sonra
    const app = makeApp({ state: 'waiting_payment', paymentDueAt: existingDue });
    mockDb.query.applications.findFirst.mockResolvedValue(app);
    const updated = { ...app, paymentDueAt: new Date(existingDue.getTime() + 7 * 24 * 60 * 60 * 1000) };
    mockDb.returning.mockResolvedValue([updated]);
    mockDb.values.mockReturnThis();

    const service = makeService();
    const result = await service.extendPaymentDueDate('app-uuid-1', 7, makeActor() as any);

    expect(mockAudit.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'application.payment_due_extended' }),
    );
    expect(result.paymentDueAt!.getTime()).toBeGreaterThan(existingDue.getTime());
  });

  it('throws NotFoundException when application not found', async () => {
    mockDb.query.applications.findFirst.mockResolvedValue(null);
    const service = makeService();
    await expect(
      service.extendPaymentDueDate('nonexistent', 7, makeActor() as any),
    ).rejects.toThrow(NotFoundException);
  });

  it('throws BadRequestException for invalid state', async () => {
    const app = makeApp({ state: 'active' });
    mockDb.query.applications.findFirst.mockResolvedValue(app);
    const service = makeService();
    await expect(
      service.extendPaymentDueDate('app-uuid-1', 7, makeActor() as any),
    ).rejects.toThrow(BadRequestException);
  });

  it('uses current time as base when paymentDueAt is null', async () => {
    const app = makeApp({ state: 'waiting_payment', paymentDueAt: null });
    mockDb.query.applications.findFirst.mockResolvedValue(app);
    const updated = { ...app, paymentDueAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) };
    mockDb.returning.mockResolvedValue([updated]);
    mockDb.values.mockReturnThis();

    const service = makeService();
    // Should not throw — base is now()
    await expect(
      service.extendPaymentDueDate('app-uuid-1', 3, makeActor() as any),
    ).resolves.toBeDefined();
  });
});

// ─── markPaymentFailed ────────────────────────────────────────────────────────

describe('ApplicationsService.markPaymentFailed', () => {
  it('sets paymentStatus to failed and emits PAYMENT_FAILED domain event', async () => {
    const app = makeApp({ state: 'waiting_payment', paymentStatus: 'pending' });
    mockDb.query.applications.findFirst.mockResolvedValue(app);
    const updated = { ...app, paymentStatus: 'failed' };
    mockDb.returning.mockResolvedValue([updated]);
    mockDb.values.mockReturnThis();

    const service = makeService();
    const result = await service.markPaymentFailed('app-uuid-1', 'EFT iade geldi', makeActor() as any);

    expect(result.paymentStatus).toBe('failed');
    expect(mockEventEmitter.emit).toHaveBeenCalledWith(
      DomainEvent.PAYMENT_FAILED,
      expect.objectContaining({
        applicationId: 'app-uuid-1',
        metadata: { reason: 'EFT iade geldi' },
      }),
    );
    expect(mockAudit.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'application.payment_failed' }),
    );
  });

  it('allows marking failed from waiting_verification state', async () => {
    const app = makeApp({ state: 'waiting_verification', paymentStatus: 'waiting_verification' });
    mockDb.query.applications.findFirst.mockResolvedValue(app);
    mockDb.returning.mockResolvedValue([{ ...app, paymentStatus: 'failed' }]);
    mockDb.values.mockReturnThis();

    const service = makeService();
    await expect(
      service.markPaymentFailed('app-uuid-1', 'sahte dekont', makeActor() as any),
    ).resolves.toBeDefined();
  });

  it('throws BadRequestException for active state', async () => {
    const app = makeApp({ state: 'active', paymentStatus: 'verified' });
    mockDb.query.applications.findFirst.mockResolvedValue(app);
    const service = makeService();
    await expect(
      service.markPaymentFailed('app-uuid-1', 'hata', makeActor() as any),
    ).rejects.toThrow(BadRequestException);
    expect(mockEventEmitter.emit).not.toHaveBeenCalled();
  });

  it('throws NotFoundException when application not found', async () => {
    mockDb.query.applications.findFirst.mockResolvedValue(null);
    const service = makeService();
    await expect(
      service.markPaymentFailed('nonexistent', 'hata', makeActor() as any),
    ).rejects.toThrow(NotFoundException);
  });
});

// ─── revokeWaiver ─────────────────────────────────────────────────────────────

describe('ApplicationsService.revokeWaiver', () => {
  it('resets state to waiting_payment and paymentStatus to pending', async () => {
    const app = makeApp({ state: 'waiting_verification', paymentStatus: 'waived' });
    mockDb.query.applications.findFirst.mockResolvedValue(app);
    const updated = { ...app, state: 'waiting_payment', paymentStatus: 'pending' };
    mockDb.returning.mockResolvedValue([updated]);
    mockDb.values.mockReturnThis();

    const service = makeService();
    const result = await service.revokeWaiver('app-uuid-1', makeActor() as any);

    expect(result.state).toBe('waiting_payment');
    expect(result.paymentStatus).toBe('pending');
  });

  it('emits PAYMENT_WAIVER_REVOKED domain event', async () => {
    const app = makeApp({
      state: 'waiting_verification',
      paymentStatus: 'waived',
      applicantUserId: 'user-uuid',
    });
    mockDb.query.applications.findFirst.mockResolvedValue(app);
    mockDb.returning.mockResolvedValue([{ ...app, state: 'waiting_payment', paymentStatus: 'pending' }]);
    mockDb.values.mockReturnThis();

    const service = makeService();
    await service.revokeWaiver('app-uuid-1', makeActor() as any);

    expect(mockEventEmitter.emit).toHaveBeenCalledWith(
      DomainEvent.PAYMENT_WAIVER_REVOKED,
      expect.objectContaining({
        applicationId: 'app-uuid-1',
        applicantEmail: 'test@example.com',
        actorId: 'actor-uuid',
      }),
    );
  });

  it('writes audit log entry', async () => {
    const app = makeApp({ state: 'waiting_verification', paymentStatus: 'waived' });
    mockDb.query.applications.findFirst.mockResolvedValue(app);
    mockDb.returning.mockResolvedValue([{ ...app, state: 'waiting_payment', paymentStatus: 'pending' }]);
    mockDb.values.mockReturnThis();

    const service = makeService();
    await service.revokeWaiver('app-uuid-1', makeActor() as any);

    expect(mockAudit.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'application.waiver_revoked',
        entityId: 'app-uuid-1',
      }),
    );
  });

  it('writes applicationStateLog (timeline entry)', async () => {
    const app = makeApp({ state: 'waiting_verification', paymentStatus: 'waived' });
    mockDb.query.applications.findFirst.mockResolvedValue(app);
    mockDb.returning.mockResolvedValue([{ ...app, state: 'waiting_payment', paymentStatus: 'pending' }]);

    // Capture the values() call to check timeline entry
    const insertedValues: unknown[] = [];
    mockDb.values.mockImplementation((val: unknown) => {
      insertedValues.push(val);
      return mockDb;
    });

    const service = makeService();
    await service.revokeWaiver('app-uuid-1', makeActor() as any);

    const stateLogEntry = insertedValues.find((v) => {
      const val = v as Record<string, unknown>;
      return val?.applicationId === 'app-uuid-1' && val?.toState === 'waiting_payment';
    });
    expect(stateLogEntry).toBeDefined();
  });

  it('throws BadRequestException when paymentStatus is not waived', async () => {
    const app = makeApp({ state: 'waiting_verification', paymentStatus: 'waiting_verification' });
    mockDb.query.applications.findFirst.mockResolvedValue(app);
    const service = makeService();
    await expect(
      service.revokeWaiver('app-uuid-1', makeActor() as any),
    ).rejects.toThrow(BadRequestException);
    expect(mockEventEmitter.emit).not.toHaveBeenCalled();
  });

  it('throws NotFoundException when application not found', async () => {
    mockDb.query.applications.findFirst.mockResolvedValue(null);
    const service = makeService();
    await expect(service.revokeWaiver('nonexistent', makeActor() as any)).rejects.toThrow(
      NotFoundException,
    );
  });
});

// ─── transitionState — payment status correctness ────────────────────────────

describe('ApplicationsService.transitionState — payment status correctness', () => {
  it('sets paymentStatus to waiting_verification (not verified) on waiting_verification transition', async () => {
    const app = makeApp({ state: 'waiting_payment', type: 'individual', adminNotes: 'ok' });
    mockDb.query.applications.findFirst.mockResolvedValue(app);
    const updated = { ...app, state: 'waiting_verification', paymentStatus: 'waiting_verification' };
    mockTx.returning.mockResolvedValue([updated]);

    const service = makeService();
    const result = await service.transitionState(
      'app-uuid-1',
      { toState: 'waiting_verification', paymentAmountKurus: 50000 },
      makeActor(['super_admin'], 'individual_member') as any,
    );

    expect(result.paymentStatus).toBe('waiting_verification');
  });

  it('stores paymentAmountKurus on application when moving to waiting_verification', async () => {
    const app = makeApp({ state: 'waiting_payment', type: 'individual', adminNotes: 'ok' });
    mockDb.query.applications.findFirst.mockResolvedValue(app);
    const updated = { ...app, state: 'waiting_verification', paymentAmountKurus: 50000 };
    mockTx.returning.mockResolvedValue([updated]);

    const service = makeService();
    const result = await service.transitionState(
      'app-uuid-1',
      { toState: 'waiting_verification', paymentAmountKurus: 50000 },
      makeActor(['super_admin'], 'individual_member') as any,
    );

    expect(result.paymentAmountKurus).toBe(50000);
  });
});

// ─── duplicate donation prevention ───────────────────────────────────────────
// requires_donation_record prereq is on waiting_verification → active transition.
// This prevents activation without a confirmed payment record.

describe('duplicate donation prevention', () => {
  it('requires_donation_record prereq blocks waiting_verification → active when no donation exists', async () => {
    // State machine: individual waiting_verification → active requires requires_donation_record
    const app = makeApp({
      state: 'waiting_verification',
      type: 'individual',
      paymentStatus: 'waiting_verification',
      paymentAmountKurus: 50000,
    });
    mockDb.query.applications.findFirst.mockResolvedValue(app);
    // mockDb.limit already resolves to [] by default → no donation found → should throw

    const service = makeService();
    await expect(
      service.transitionState(
        'app-uuid-1',
        { toState: 'active' },
        makeActor(['super_admin'], 'individual_member') as any,
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('waived applications bypass requires_donation_record check', async () => {
    const app = makeApp({
      state: 'waiting_verification',
      type: 'individual',
      paymentStatus: 'waived',
    });
    mockDb.query.applications.findFirst.mockResolvedValue(app);
    // mockDb.limit returns [] — but waived bypass means no DB check is made
    mockTx.returning.mockResolvedValue([{ ...app, state: 'active', paymentStatus: 'verified' }]);
    // User exists already — skip user creation
    mockTx.limit.mockResolvedValueOnce([{ id: 'user-uuid' }]);

    const service = makeService();
    // Should not throw — waived path skips donation check
    await expect(
      service.transitionState(
        'app-uuid-1',
        { toState: 'active' },
        makeActor(['super_admin'], 'individual_member') as any,
      ),
    ).resolves.toBeDefined();
  });

  it('donation insert during waiting_payment → waiting_verification sets applicationId FK', async () => {
    const app = makeApp({
      state: 'waiting_payment',
      type: 'individual',
      paymentStatus: 'pending',
    });
    mockDb.query.applications.findFirst.mockResolvedValue(app);
    // waiting_payment → waiting_verification prereq: requires_payment_amount only — no DB lookup needed

    const insertedValues: unknown[] = [];
    mockTx.values.mockImplementation((val: unknown) => {
      insertedValues.push(val);
      return mockTx;
    });
    mockTx.returning.mockResolvedValue([{ ...app, state: 'waiting_verification', paymentAmountKurus: 50000 }]);

    const service = makeService();
    await service.transitionState(
      'app-uuid-1',
      { toState: 'waiting_verification', paymentAmountKurus: 50000 },
      makeActor(['super_admin'], 'individual_member') as any,
    );

    const donationInsert = insertedValues.find((v) => {
      const val = v as Record<string, unknown>;
      return typeof val?.amount === 'number' && val?.referenceCode !== undefined;
    });
    expect(donationInsert).toBeDefined();
    const don = donationInsert as Record<string, unknown>;
    expect(don.applicationId).toBe('app-uuid-1');
    expect(don.amount).toBe(50000);
    expect(don.type).toBe('one_time');
    expect(don.status).toBe('completed');
  });
});
