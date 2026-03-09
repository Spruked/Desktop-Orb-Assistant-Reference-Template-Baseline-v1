from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import asyncio
import time

from .core import GovernanceArbiter, VaultEntry, Doctrine, GlyphTrace

app = FastAPI(title="LLM Governance Layer", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "*"],  # Restrict in production
    allow_credentials=True,
    allow_methods=["*"],  # include OPTIONS and all methods for preflight
    allow_headers=["*"],
)

# Global arbiter instance
arbiter = GovernanceArbiter()

class QueryRequest(BaseModel):
    query: str
    raw_llm_outputs: List[dict]  # [{response: str, confidence: float, doctrine: str}]

class GovernanceResponse(BaseModel):
    trace_id: str
    final_output: str
    confidence: float
    convergence_score: float
    doctrine_balance: dict
    bullshit_score: float
    ping_time_ms: float

@app.post("/govern", response_model=GovernanceResponse)
async def govern_response(request: QueryRequest):
    """
    Main governance endpoint.
    Takes raw LLM outputs, applies doctrine convergence, returns governed response.
    """
    start_time = time.time()
    
    # Convert to internal format
    candidates = []
    for output in request.raw_llm_outputs:
        doctrine_map = {
            "empirical": Doctrine.EMPIRICAL,
            "skeptical": Doctrine.SKEPTICAL,
            "structural": Doctrine.STRUCTURAL,
            "necessitarian": Doctrine.NECESSITARIAN
        }
        candidates.append((
            output["response"],
            output["confidence"],
            doctrine_map.get(output["doctrine"], Doctrine.EMPIRICAL)
        ))
    
    # Run convergence
    trace, final_output = arbiter.converge(request.query, candidates)
    trace.ping_confirmed = True
    
    # Calculate bullshit score
    bullshit = arbiter.detect_bullshit(final_output, {})
    
    ping_time = (time.time() - start_time) * 1000
    
    return GovernanceResponse(
        trace_id=trace.trace_id,
        final_output=final_output,
        confidence=trace.final_confidence,
        convergence_score=trace.convergence_score,
        doctrine_balance=trace.doctrine_votes,
        bullshit_score=bullshit,
        ping_time_ms=ping_time
    )

@app.get("/ping")
async def ping():
    """Fast health check—single bounce"""
    return arbiter.ping()

@app.get("/audit/{trace_id}")
async def get_audit(trace_id: str):
    """Retrieve auditable decision path"""
    trail = arbiter.get_audit_trail(trace_id)
    if not trail:
        raise HTTPException(status_code=404, detail="Trace not found")
    return {"trace_id": trace_id, "audit_trail": trail}

@app.get("/vault/stats")
async def vault_stats():
    """Immutable vault statistics"""
    return {
        "a_priori_entries": len(arbiter.a_priori_vault),
        "a_posteriori_entries": len(arbiter.a_posteriori_vault),
        "total_traces": len(arbiter.reflection_matrix),
        "doctrine_distribution": arbiter._check_doctrine_balance()
    }
