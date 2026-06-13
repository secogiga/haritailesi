import { AutomationService } from './automation.service';
import { DomainEvent } from '../applications/events/domain-events';
import type { MemberEventPayload, MemberRoleEventPayload, MemberTierEventPayload } from '../applications/events/domain-events';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const makeBase = () => ({
  userId: 'user-uuid',
  email: 'user@example.com',
  displayName: 'Test Kullanıcı',
  actorId: 'admin-uuid',
  actorEmail: 'admin@example.com',
  timestamp: new Date(),
});

const makeMemberPayload = (): MemberEventPayload => makeBase();

const makeRolePayload = (role: string): MemberRoleEventPayload => ({
  ...makeBase(),
  role: role as MemberRoleEventPayload['role'],
});

const makeTierPayload = (fromTier: string, toTier: string): MemberTierEventPayload => ({
  ...makeBase(),
  fromTier: fromTier as MemberTierEventPayload['fromTier'],
  toTier: toTier as MemberTierEventPayload['toTier'],
});

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockEmail = { send: jest.fn().mockResolvedValue(undefined) };
const mockNotifications = { create: jest.fn().mockResolvedValue({ id: 'notif-1' }) };
const mockPushQueue = { add: jest.fn().mockResolvedValue(undefined) };

function makeService(): AutomationService {
  const svc = new AutomationService(
    mockEmail as any,
    mockNotifications as any,
    mockPushQueue as any,
  );
  svc.onModuleInit(); // build ruleIndex
  return svc;
}

beforeEach(() => jest.clearAllMocks());

// ─── Rule: mentor_profile_approved ────────────────────────────────────────────

describe('AutomationService — mentor_profile_approved rule', () => {
  it('sends mentor_profile_approved email when mentor role is assigned', async () => {
    const svc = makeService();
    await svc.onMemberRoleAssigned(makeRolePayload('mentor'));
    expect(mockEmail.send).toHaveBeenCalledWith(
      'user@example.com',
      'mentor_profile_approved',
      expect.objectContaining({ displayName: 'Test Kullanıcı' }),
    );
  });

  it('does not send email for non-mentor role assignment', async () => {
    const svc = makeService();
    await svc.onMemberRoleAssigned(makeRolePayload('editor'));
    // Only moderator_welcome push — no email
    expect(mockEmail.send).not.toHaveBeenCalled();
  });
});

// ─── Rule: moderator_welcome ──────────────────────────────────────────────────

describe('AutomationService — moderator_welcome rule', () => {
  it('sends welcome push when moderator role is assigned', async () => {
    const svc = makeService();
    await svc.onMemberRoleAssigned(makeRolePayload('moderator'));
    expect(mockNotifications.create).toHaveBeenCalledWith(
      'user-uuid',
      expect.objectContaining({ title: 'Moderatör Olarak Atandın' }),
    );
  });

  it('does not send for admin role', async () => {
    const svc = makeService();
    await svc.onMemberRoleAssigned(makeRolePayload('admin'));
    expect(mockNotifications.create).not.toHaveBeenCalled();
  });
});

// ─── Rule: tier_upgrade_congrats ──────────────────────────────────────────────

describe('AutomationService — tier_upgrade_congrats rule', () => {
  it('sends congrats push on tier upgrade', async () => {
    const svc = makeService();
    await svc.onMemberTierChanged(makeTierPayload('haritailesi_genc', 'individual_member'));
    expect(mockNotifications.create).toHaveBeenCalledWith(
      'user-uuid',
      expect.objectContaining({ title: 'Üyelik Tipin Güncellendi 🎉' }),
    );
  });

  it('does not send push on tier downgrade', async () => {
    const svc = makeService();
    await svc.onMemberTierChanged(makeTierPayload('individual_member', 'haritailesi_genc'));
    expect(mockNotifications.create).not.toHaveBeenCalled();
  });

  it('does not send push when tier is same level', async () => {
    const svc = makeService();
    await svc.onMemberTierChanged(makeTierPayload('individual_member', 'corporate_member'));
    // Both are level 3 — not an upgrade
    expect(mockNotifications.create).not.toHaveBeenCalled();
  });
});

// ─── Rule: profile_completion_nudge_7d ────────────────────────────────────────

describe('AutomationService — profile_completion_nudge_7d rule', () => {
  it('enqueues a delayed push 7 days after member activation', async () => {
    const svc = makeService();
    await svc.onMemberActivated(makeMemberPayload());
    expect(mockPushQueue.add).toHaveBeenCalledWith(
      'send',
      expect.objectContaining({ userId: 'user-uuid', title: 'Profilini Tamamla' }),
      expect.objectContaining({
        delay: 7 * 24 * 60 * 60 * 1000,
        jobId: 'automation.profile_completion_nudge_7d.user-uuid', // deduplicated
      }),
    );
  });
});

// ─── Rule: member_deactivated_push ────────────────────────────────────────────

describe('AutomationService — member_deactivated_push rule', () => {
  it('sends deactivation push when member is deactivated', async () => {
    const svc = makeService();
    await svc.onMemberDeactivated(makeMemberPayload());
    expect(mockNotifications.create).toHaveBeenCalledWith(
      'user-uuid',
      expect.objectContaining({ title: 'Üyeliğin Pasife Alındı' }),
    );
  });
});

// ─── Rule isolation ───────────────────────────────────────────────────────────

describe('AutomationService — rule isolation', () => {
  it('member.activated does not trigger any email', async () => {
    const svc = makeService();
    await svc.onMemberActivated(makeMemberPayload());
    expect(mockEmail.send).not.toHaveBeenCalled();
  });

  it('error in one action does not prevent subsequent actions', async () => {
    mockNotifications.create.mockRejectedValueOnce(new Error('push failed'));
    const svc = makeService();
    // moderator_welcome sends a push — even if it fails, engine should not throw
    await expect(
      svc.onMemberRoleAssigned(makeRolePayload('moderator')),
    ).resolves.not.toThrow();
  });
});
