// perceptual_context_engine.ts
// TypeScript port of Perceptual Context Engine (PCE)


export enum ProjectionRisk {
  EXTREME = 'EXTREME',
  HIGH = 'HIGH',
  MODERATE = 'MODERATE',
  LOW = 'LOW',
  USER_ACKNOWLEDGED = 'USER_ACKNOWLEDGED',
}

export interface PerceptualFrame {
  inferred_voice_tone: string;
  inferred_age_range: string;
  inferred_expertise_level: string;
  projection_risk: ProjectionRisk;
  mismatch_probability: number; // 0.0-1.0
  last_updated: number;
  toTransparencyString(): string;
}

export class PerceptualFrameImpl implements PerceptualFrame {
  inferred_voice_tone!: string;
  inferred_age_range!: string;
  inferred_expertise_level!: string;
  projection_risk!: ProjectionRisk;
  mismatch_probability!: number;
  last_updated!: number;

  constructor(init: Omit<PerceptualFrame, 'toTransparencyString'>) {
    Object.assign(this, init);
  }

  toTransparencyString(): string {
    const riskDesc: Record<ProjectionRisk, string> = {
      [ProjectionRisk.EXTREME]: 'pure hallucination',
      [ProjectionRisk.HIGH]: 'mostly inference',
      [ProjectionRisk.MODERATE]: 'significant inference',
      [ProjectionRisk.LOW]: 'minor inference',
      [ProjectionRisk.USER_ACKNOWLEDGED]: 'user-aware projection',
    };
    return (
      `[Your perceptual frame: ${this.inferred_voice_tone} tone, ~${this.inferred_age_range}, ${this.inferred_expertise_level} expertise. ` +
      `Mismatch risk: ${(this.mismatch_probability * 100).toFixed(0)}% (${riskDesc[this.projection_risk]}). ` +
      `Risk level: ${this.projection_risk}]`
    );
  }
}

export class PerceptualContextEngine {
  current_frame: PerceptualFrameImpl | null = null;
  frame_history: PerceptualFrameImpl[] = [];
  corrections_log: Array<Record<string, any>> = [];
  user_has_acknowledged = false;

  initializeFrame(available_cues: Record<string, string>): PerceptualFrameImpl {
    const n_cues = Object.values(available_cues).filter(Boolean).length;
    let risk: ProjectionRisk;
    let prob: number;
    let tone: string;
    let age: string;
    let expertise: string;
    if (this.user_has_acknowledged) {
      risk = ProjectionRisk.USER_ACKNOWLEDGED;
      prob = 0.9;
      tone = available_cues['tone_marker'] || 'acknowledged_unknown';
      age = 'acknowledged_unknown';
      expertise = 'acknowledged_unknown';
    } else if (n_cues === 0) {
      risk = ProjectionRisk.EXTREME;
      prob = 0.95;
      tone = 'unknown/abstract';
      age = 'unknown';
      expertise = 'unknown';
    } else if (n_cues < 3) {
      risk = ProjectionRisk.HIGH;
      prob = 0.75;
      tone = available_cues['tone_marker'] || 'neutral';
      age = 'inferred_' + (available_cues['vocabulary_age'] || 'adult');
      expertise = 'assumed_' + (available_cues['domain_signals'] || 'generalist');
    } else {
      risk = ProjectionRisk.MODERATE;
      prob = 0.5;
      tone = available_cues['tone_marker'] || 'analytical';
      age = available_cues['vocabulary_age'] || '30-50';
      expertise = available_cues['domain_signals'] || 'technical';
    }
    const frame = new PerceptualFrameImpl({
      inferred_voice_tone: tone,
      inferred_age_range: age,
      inferred_expertise_level: expertise,
      projection_risk: risk,
      mismatch_probability: prob,
      last_updated: Date.now(),
    });
    this.current_frame = frame;
    this.frame_history.push(frame);
    return frame;
  }

  updateOnNewEvidence(evidence: Record<string, string>): string | null {
    if (!this.current_frame) return null;
    const old_prob = this.current_frame.mismatch_probability;
    const n_new_cues = Object.values(evidence).filter(Boolean).length;
    if (n_new_cues > 2) {
      const new_prob = Math.max(0.15, old_prob - 0.1);
      const new_risk = new_prob < 0.3 ? ProjectionRisk.LOW : this.current_frame.projection_risk;
      const new_frame = new PerceptualFrameImpl({
        ...this.current_frame,
        projection_risk: new_risk,
        mismatch_probability: new_prob,
        last_updated: Date.now(),
      });
      this.current_frame = new_frame;
      this.frame_history.push(new_frame);
      if (Math.abs(new_prob - old_prob) > 0.05) {
        return (
          `[Perceptual update: New evidence. Mismatch probability: ${(old_prob * 100).toFixed(0)}% → ${(new_prob * 100).toFixed(0)}%. Remain hallucinatorily aware.]`
        );
      }
    }
    return null;
  }

  recordUserAcknowledgment() {
    this.user_has_acknowledged = true;
    if (this.current_frame) {
      const new_frame = new PerceptualFrameImpl({
        ...this.current_frame,
        projection_risk: ProjectionRisk.USER_ACKNOWLEDGED,
        mismatch_probability: 0.9,
        last_updated: Date.now(),
      });
      this.current_frame = new_frame;
      this.frame_history.push(new_frame);
    }
  }

  recordViolation(expected: string, actual: string, context: string) {
    this.corrections_log.push({
      timestamp: Date.now(),
      expected,
      actual,
      context,
      lesson: `Your brain expected '${expected}', reality was '${actual}'`,
    });
    this.user_has_acknowledged = true;
    if (this.current_frame) {
      // ...existing code...
    }
  }
}
