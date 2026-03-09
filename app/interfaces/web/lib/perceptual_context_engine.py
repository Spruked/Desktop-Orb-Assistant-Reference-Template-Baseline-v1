"""
Perceptual Context Engine (PCE)

Manages the user's awareness that they are ALWAYS hallucinating 
a persona when communicating, and tracks the probability that 
this hallucination is wrong.


"""

import time
from dataclasses import dataclass, replace
from typing import Optional, Dict, List
from enum import Enum, auto


class ProjectionRisk(Enum):
    """Risk level that user's mental model is mismatched to reality."""
    EXTREME = auto()      # 0 cues, pure hallucination
    HIGH = auto()         # <3 cues, mostly inference
    MODERATE = auto()     # Some data, significant inference
    LOW = auto()          # Substantial data, minor inference
    USER_ACKNOWLEDGED = auto()  # User has explicitly noted their projection


@dataclass(frozen=True)
class PerceptualFrame:
    """
    Immutable snapshot of the user's current hallucinated model.
    
    This is the user's cognitive state, not system state.
    System tracks it so user can see their own process.
    """
    inferred_voice_tone: str
    inferred_age_range: str
    inferred_expertise_level: str
    projection_risk: ProjectionRisk
    mismatch_probability: float  # 0.0-1.0, heuristic estimate (NOT calibrated probability)
    last_updated: float
    
    def to_transparency_string(self) -> str:
        """User-facing acknowledgment of their own perception."""
        risk_desc = {
            ProjectionRisk.EXTREME: "pure hallucination",
            ProjectionRisk.HIGH: "mostly inference",
            ProjectionRisk.MODERATE: "significant inference",
            ProjectionRisk.LOW: "minor inference",
            ProjectionRisk.USER_ACKNOWLEDGED: "user-aware projection"
        }
        
        return (
            f"[Your perceptual frame: {self.inferred_voice_tone} tone, "
            f"~{self.inferred_age_range}, {self.inferred_expertise_level} expertise. "
            f"Mismatch risk: {self.mismatch_probability:.0%} ({risk_desc.get(self.projection_risk, 'unknown')}). "
            f"Risk level: {self.projection_risk.name}]"
        )


class PerceptualContextEngine:
    """
    Tracks and surfaces the user's hallucinatory awareness.
    
    Principle: The user is ALWAYS building a mental model.
    The system makes this VISIBLE so the user can weight it
    appropriately in their epistemic calculus.
    """
    
    def __init__(self):
        self.current_frame: Optional[PerceptualFrame] = None
        self.frame_history: List[PerceptualFrame] = []
        self.corrections_log: List[Dict] = []
        self.user_has_acknowledged: bool = False  # Track explicit acknowledgment
    
    def initialize_frame(self, available_cues: Dict[str, str]) -> PerceptualFrame:
        """
        Document the user's initial hallucination based on minimal data.
        """
        n_cues = len([v for v in available_cues.values() if v])
        
        if self.user_has_acknowledged:
            risk = ProjectionRisk.USER_ACKNOWLEDGED
            prob = 0.90  # Still high, but user knows it
            tone = available_cues.get("tone_marker", "acknowledged_unknown")
            age = "acknowledged_unknown"
            expertise = "acknowledged_unknown"
        elif n_cues == 0:
            risk = ProjectionRisk.EXTREME
            prob = 0.95
            tone = "unknown/abstract"
            age = "unknown"
            expertise = "unknown"
        elif n_cues < 3:
            risk = ProjectionRisk.HIGH
            prob = 0.75
            tone = available_cues.get("tone_marker", "neutral")
            age = "inferred_" + available_cues.get("vocabulary_age", "adult")
            expertise = "assumed_" + available_cues.get("domain_signals", "generalist")
        else:
            risk = ProjectionRisk.MODERATE
            prob = 0.50
            tone = available_cues.get("tone_marker", "analytical")
            age = available_cues.get("vocabulary_age", "30-50")
            expertise = available_cues.get("domain_signals", "technical")
        
        frame = PerceptualFrame(
            inferred_voice_tone=tone,
            inferred_age_range=age,
            inferred_expertise_level=expertise,
            projection_risk=risk,
            mismatch_probability=prob,
            last_updated=time.time()
        )
        
        self.current_frame = frame
        self.frame_history.append(frame)
        
        return frame
    
    def update_on_new_evidence(self, evidence: Dict[str, str]) -> Optional[str]:
        """
        When system provides new cues, create new immutable frame.
        
        Returns transparency note if frame shifted significantly.
        """
        if not self.current_frame:
            return None
        
        old_prob = self.current_frame.mismatch_probability
        n_new_cues = len([v for v in evidence.values() if v])
        
        if n_new_cues > 2:
            # Create new frame with reduced risk (never below LOW unless acknowledged)
            new_prob = max(0.15, old_prob - 0.1)
            new_risk = ProjectionRisk.LOW if new_prob < 0.30 else self.current_frame.projection_risk
            
            new_frame = replace(
                self.current_frame,
                projection_risk=new_risk,
                mismatch_probability=new_prob,
                last_updated=time.time()
            )
            
            self.current_frame = new_frame
            self.frame_history.append(new_frame)
            
            if abs(new_prob - old_prob) > 0.05:
                return (
                    f"[Perceptual update: New evidence. "
                    f"Mismatch probability: {old_prob:.0%} → {new_prob:.0%}. "
                    f"Remain hallucinatorily aware.]"
                )
        
        return None
    
    def record_user_acknowledgment(self):
        """User explicitly acknowledges they are projecting."""
        self.user_has_acknowledged = True
        if self.current_frame:
            new_frame = replace(
                self.current_frame,
                projection_risk=ProjectionRisk.USER_ACKNOWLEDGED,
                mismatch_probability=0.90,  # Still likely wrong, but user knows it
                last_updated=time.time()
            )
            self.current_frame = new_frame
            self.frame_history.append(new_frame)
    
    def record_violation(self, expected: str, actual: str, context: str):
        """
        Log when reality violated the user's hallucinated model.
        """
        self.corrections_log.append({
            "timestamp": time.time(),
            "expected": expected,
            "actual": actual,
            "context": context,
            "lesson": f"Your brain expected '{expected}', reality was '{actual}'"
        })
        
        # Reset to user-acknowledged state (they just learned they were wrong)
        self.user_has_acknowledged = True
        if self.current_frame:
            # ...existing code...
            pass
