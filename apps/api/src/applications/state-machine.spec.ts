import { getTransition, getValidNextStates, TERMINAL_STATES } from './state-machine';

describe('getTransition', () => {
  describe('individual', () => {
    it('returns transition for valid from→to pair', () => {
      const t = getTransition('individual', 'submitted', 'under_review');
      expect(t).not.toBeNull();
      expect(t?.requiredPermission).toBe('application.review');
      expect(t?.emailTrigger).toBe('application_under_review');
    });

    it('returns null for invalid transition', () => {
      expect(getTransition('individual', 'submitted', 'approved')).toBeNull();
    });

    it('returns null for unknown fromState', () => {
      expect(getTransition('individual', 'nonexistent', 'under_review')).toBeNull();
    });

    it('payment step requires admin_notes prerequisite', () => {
      const t = getTransition('individual', 'approved', 'waiting_payment');
      expect(t?.prerequisites).toHaveLength(1);
      expect(t?.prerequisites?.[0]?.type).toBe('requires_admin_notes');
    });

    it('verification step requires payment_amount prerequisite', () => {
      const t = getTransition('individual', 'waiting_payment', 'waiting_verification');
      expect(t?.prerequisites?.[0]?.type).toBe('requires_payment_amount');
    });

    it('active step requires donation_record prerequisite', () => {
      const t = getTransition('individual', 'waiting_verification', 'active');
      expect(t?.prerequisites?.[0]?.type).toBe('requires_donation_record');
    });

    it('active → passive requires user.manage', () => {
      const t = getTransition('individual', 'active', 'passive');
      expect(t?.requiredPermission).toBe('user.manage');
    });

    it('passive → active requires user.manage', () => {
      const t = getTransition('individual', 'passive', 'active');
      expect(t?.requiredPermission).toBe('user.manage');
    });
  });

  describe('corporate', () => {
    it('under_review → approved requires application.approve', () => {
      const t = getTransition('corporate', 'under_review', 'approved');
      expect(t?.requiredPermission).toBe('application.approve');
    });

    it('waiting_verification → verified requires payment.verify (not member.activate)', () => {
      const t = getTransition('corporate', 'waiting_verification', 'verified');
      expect(t?.requiredPermission).toBe('payment.verify');
    });

    it('verified → active requires member.activate', () => {
      const t = getTransition('corporate', 'verified', 'active');
      expect(t?.requiredPermission).toBe('member.activate');
    });

    it('interview_needed can go directly to approved (no interview_scheduled step)', () => {
      const t = getTransition('corporate', 'interview_needed', 'approved');
      expect(t).not.toBeNull();
      expect(t?.requiredPermission).toBe('application.approve');
    });
  });

  describe('meslegin_gelecekleri', () => {
    it('under_review → shortlisted is valid', () => {
      const t = getTransition('meslegin_gelecekleri', 'under_review', 'shortlisted');
      expect(t).not.toBeNull();
      expect(t?.requiredPermission).toBe('application.review');
    });

    it('shortlisted → interview_needed triggers email', () => {
      const t = getTransition('meslegin_gelecekleri', 'shortlisted', 'interview_needed');
      expect(t?.emailTrigger).toBe('application_interview_scheduled');
    });

    it('interview_completed → waitlisted is valid', () => {
      expect(getTransition('meslegin_gelecekleri', 'interview_completed', 'waitlisted')).not.toBeNull();
    });

    it('waitlisted → accepted is valid', () => {
      const t = getTransition('meslegin_gelecekleri', 'waitlisted', 'accepted');
      expect(t).not.toBeNull();
      expect(t?.requiredPermission).toBe('application.approve');
    });

    it('active_program_member → program_completed requires member.activate', () => {
      const t = getTransition('meslegin_gelecekleri', 'active_program_member', 'program_completed');
      expect(t?.requiredPermission).toBe('member.activate');
    });
  });

  describe('haritailesi_genc', () => {
    it('has no payment step — approved → active directly', () => {
      const t = getTransition('haritailesi_genc', 'approved', 'active');
      expect(t).not.toBeNull();
      expect(t?.requiredPermission).toBe('member.activate');
      expect(t?.prerequisites).toBeUndefined();
    });

    it('under_review → approved requires application.approve', () => {
      const t = getTransition('haritailesi_genc', 'under_review', 'approved');
      expect(t?.requiredPermission).toBe('application.approve');
    });

    it('under_review → interview_needed does not exist', () => {
      expect(getTransition('haritailesi_genc', 'under_review', 'interview_needed')).toBeNull();
    });
  });
});

describe('getValidNextStates', () => {
  it('returns all valid transitions from submitted for individual', () => {
    const states = getValidNextStates('individual', 'submitted');
    expect(states).toEqual(['under_review']);
  });

  it('returns multiple valid states from under_review for individual', () => {
    const states = getValidNextStates('individual', 'under_review');
    expect(states).toContain('interview_needed');
    expect(states).toContain('approved');
    expect(states).toContain('rejected');
  });

  it('returns empty array for terminal state rejected', () => {
    expect(getValidNextStates('individual', 'rejected')).toHaveLength(0);
  });

  it('returns empty array for unknown state', () => {
    expect(getValidNextStates('individual', 'made_up_state')).toHaveLength(0);
  });

  it('returns both active and passive from interview_scheduled for individual', () => {
    const states = getValidNextStates('individual', 'interview_scheduled');
    expect(states).toContain('approved');
    expect(states).toContain('rejected');
  });

  it('returns correct states for meslegin_gelecekleri after interview_completed', () => {
    const states = getValidNextStates('meslegin_gelecekleri', 'interview_completed');
    expect(states).toContain('accepted');
    expect(states).toContain('waitlisted');
    expect(states).toContain('rejected');
  });
});

describe('TERMINAL_STATES', () => {
  it('includes rejected', () => {
    expect(TERMINAL_STATES.has('rejected')).toBe(true);
  });

  it('includes program_completed', () => {
    expect(TERMINAL_STATES.has('program_completed')).toBe(true);
  });

  it('does not include active', () => {
    expect(TERMINAL_STATES.has('active')).toBe(false);
  });
});
