from dataclasses import dataclass, field
from typing import List, Dict, Optional, Tuple, Literal
from enum import Enum, auto
import hashlib
import json
import time
from datetime import datetime

class Doctrine(Enum):
    EMPIRICAL = auto()      # Locke: Evidence-based, sensory-grounded
    SKEPTICAL = auto()      # Hume: Doubt, uncertainty acknowledgment
    STRUCTURAL = auto()     # Kant: Categorical frameworks, limits
    NECESSITARIAN = auto()  # Spinoza: Deterministic necessity, causality

@dataclass(frozen=True)
class VaultEntry:
    """Immutable vault record"""
    timestamp: float
    content_hash: str
    source: str
    doctrine: Doctrine
    confidence: float  # 0.0-1.0
    payload: Dict
    
    def verify(self) -> bool:
        check = hashlib.sha256(
            json.dumps(self.payload, sort_keys=True).encode()
        ).hexdigest()[:16]
        return check == self.content_hash

@dataclass
class GlyphTrace:
    """Auditable decision path"""
    trace_id: str
    timestamp: float
    doctrine_votes: Dict[Doctrine, float]
    convergence_score: float
    final_confidence: float
    output_hash: str
    ping_confirmed: bool = False
    
    def to_audio_log(self) -> str:
        """Convert to human-readable audit trail"""
        return (
            f"[{datetime.fromtimestamp(self.timestamp).isoformat()}] "
            f"Convergence: {self.convergence_score:.2f} | "
            f"Confidence: {self.final_confidence:.2f} | "
            f"Doctrines: {[d.name for d in self.doctrine_votes.keys()]}"
        )

class GovernanceArbiter:
    """
    Central convergence engine.
    No monolith—modular, repairable, transparent.
    """
    
    DOCTRINE_WEIGHTS = {
        Doctrine.EMPIRICAL: 0.25,
        Doctrine.SKEPTICAL: 0.25,
        Doctrine.STRUCTURAL: 0.25,
        Doctrine.NECESSITARIAN: 0.25
    }
    
    MAX_WORDS = 15
    CONFIDENCE_THRESHOLD = 0.6
    HUMILITY_THRESHOLD = 0.4  # Below this: "I don't know"
    
    def __init__(self):
        self.a_priori_vault: List[VaultEntry] = []
        self.a_posteriori_vault: List[VaultEntry] = []
        self.reflection_matrix: List[GlyphTrace] = []
        self.session_start = time.time()
    
    def ping(self) -> Dict:
        """
        Fast single bounce—system health check.
        Not a loop. One call, one response.
        """
        return {
            "status": "active",
            "uptime": time.time() - self.session_start,
            "vault_entries": len(self.a_priori_vault) + len(self.a_posteriori_vault),
            "traces": len(self.reflection_matrix),
            "doctrine_balance": self._check_doctrine_balance(),
            "timestamp": time.time()
        }
    
    def _check_doctrine_balance(self) -> Dict[str, float]:
        """Verify equal 25% distribution across all vault entries"""
        total = len(self.a_priori_vault) + len(self.a_posteriori_vault)
        if total == 0:
            return {d.name: 0.25 for d in Doctrine}
        
        counts = {d: 0 for d in Doctrine}
        for entry in self.a_priori_vault + self.a_posteriori_vault:
            counts[entry.doctrine] += 1
        
        return {d.name: counts[d]/total for d in Doctrine}
    
    def submit_to_vault(self, 
                       entry: VaultEntry,
                       vault_type: Literal["a_priori", "a_posteriori"]) -> bool:
        """Immutable append-only vault storage"""
        if not entry.verify():
            return False
        
        if vault_type == "a_priori":
            self.a_priori_vault.append(entry)
        else:
            self.a_posteriori_vault.append(entry)
        
        return True
    
    def converge(self, 
                 query: str,
                 candidate_responses: List[Tuple[str, float, Doctrine]]) -> GlyphTrace:
        """
        Core arbitration: 4-doctrine convergence with brevity enforcement.
        
        Args:
            query: Original user query
            candidate_responses: List of (response, confidence, doctrine_source)
        
        Returns:
            GlyphTrace with final decision path
        """
        # Weight by doctrine
        weighted_votes = {d: [] for d in Doctrine}
        for response, conf, doctrine in candidate_responses:
            weighted_votes[doctrine].append((response, conf))
        
        # Calculate convergence score (agreement across doctrines)
        all_responses = [r for r, _, _ in candidate_responses]
        convergence_score = self._calculate_convergence(all_responses)
        
        # Select or synthesize
        final_response, final_confidence = self._select_output(
            weighted_votes, convergence_score
        )
        
        # Enforce brevity
        final_response = self._enforce_brevity(final_response)
        
        # Create trace
        trace = GlyphTrace(
            trace_id=hashlib.sha256(
                f"{query}{time.time()}".encode()
            ).hexdigest()[:16],
            timestamp=time.time(),
            doctrine_votes={
                d: max([conf for _, conf in weighted_votes[d]], default=0.0)
                for d in Doctrine
            },
            convergence_score=convergence_score,
            final_confidence=final_confidence,
            output_hash=hashlib.sha256(final_response.encode()).hexdigest()[:16]
        )
        
        self.reflection_matrix.append(trace)
        return trace, final_response
    
    def _calculate_convergence(self, responses: List[str]) -> float:
        """Measure semantic agreement across doctrine outputs"""
        if len(responses) < 2:
            return 1.0
        
        # Simplified: exact match ratio (replace with embedding similarity for production)
        from collections import Counter
        counts = Counter(responses)
        most_common = counts.most_common(1)[0][1]
        return most_common / len(responses)
    
    def _select_output(self, 
                      weighted_votes: Dict[Doctrine, List[Tuple[str, float]]],
                      convergence_score: float) -> Tuple[str, float]:
        """
        Select output based on doctrine weights and confidence thresholds.
        """
        # Aggregate by weighted doctrine importance
        candidate_scores = {}
        
        for doctrine, responses in weighted_votes.items():
            weight = self.DOCTRINE_WEIGHTS[doctrine]
            for response, conf in responses:
                if response not in candidate_scores:
                    candidate_scores[response] = 0.0
                candidate_scores[response] += conf * weight
        
        if not candidate_scores:
            return "I don't know.", 0.0
        
        # Select highest scored
        best_response = max(candidate_scores.items(), key=lambda x: x[1])
        response, score = best_response
        
        # Apply humility check
        if score < self.HUMILITY_THRESHOLD:
            return "I don't know.", score
        
        # Apply confidence threshold
        if score < self.CONFIDENCE_THRESHOLD:
            # Return best response but flag low confidence
            return response, score
        
        return response, score
    
    def _enforce_brevity(self, text: str) -> str:
        """Hard 15-word limit with honest truncation"""
        words = text.split()
        if len(words) <= self.MAX_WORDS:
            return text
        
        # Truncate with honesty marker
        truncated = " ".join(words[:self.MAX_WORDS])
        return truncated + " [truncated: brevity enforced]"
    
    def get_audit_trail(self, trace_id: Optional[str] = None) -> List[str]:
        """Retrieve full audio-readable audit log"""
        if trace_id:
            traces = [t for t in self.reflection_matrix if t.trace_id == trace_id]
        else:
            traces = self.reflection_matrix
        
        return [t.to_audio_log() for t in traces]
    
    def detect_bullshit(self, response: str, context: Dict) -> float:
        """
        Bullshit detection heuristic.
        Returns 0.0 (certain truth) to 1.0 (certain bullshit).
        """
        score = 0.0
        
        # Markers of potential fabrication
        markers = [
            "certainly", "definitely", "absolutely", "without doubt",
            "I know", "everyone knows", "it's obvious",
            "studies show"  # without citation
        ]
        
        response_lower = response.lower()
        for marker in markers:
            if marker in response_lower:
                score += 0.15
        
        # Length penalty (verbosity often masks uncertainty)
        word_count = len(response.split())
        if word_count > 50:
            score += 0.1
        
        # Uncertainty acknowledgment reduces bullshit score
        honesty_markers = ["I don't know", "uncertain", "possibly", "likely"]
        for marker in honesty_markers:
            if marker in response_lower:
                score -= 0.2
        
        return max(0.0, min(1.0, score))
