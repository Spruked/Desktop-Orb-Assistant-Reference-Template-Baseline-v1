import React, { useState } from 'react';

export function GovernancePanel({ onUpdate }: { onUpdate?: (output: any) => void }) {
  const [governance, setGovernance] = useState<null | {
    trace_id: string;
    final_output: string;
    confidence: number;
    convergence_score: number;
    doctrine_balance: Record<string, number>;
    bullshit_score: number;
    ping_time_ms: number;
  }>(null);
  const [query, setQuery] = useState('');
  const [llmOutputs, setLlmOutputs] = useState([
    { response: '', confidence: 0.8, doctrine: 'empirical' }
  ]);
  const [loading, setLoading] = useState(false);

  async function handleGovern() {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:8000/govern', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          raw_llm_outputs: llmOutputs
        })
      });
      const data = await res.json();
      setGovernance(data);
      if (onUpdate) onUpdate(data);
    } catch (e) {
      setGovernance(null);
    }
    setLoading(false);
  }

  return (
    <div className="bg-neutral-900 text-white rounded-lg p-6 border border-neutral-700 w-[420px]">
      <h2 className="text-lg font-bold mb-2">Governance Layer</h2>
      <div className="mb-2">
        <label className="block text-sm mb-1">Query</label>
        <input
          className="w-full px-2 py-1 rounded bg-neutral-800 border border-neutral-600 text-white"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Enter user query..."
        />
      </div>
      <div className="mb-2">
        <label className="block text-sm mb-1">LLM Output</label>
        <input
          className="w-full px-2 py-1 rounded bg-neutral-800 border border-neutral-600 text-white"
          value={llmOutputs[0].response}
          onChange={e => setLlmOutputs([{ ...llmOutputs[0], response: e.target.value }])}
          placeholder="Paste LLM output here..."
        />
      </div>
      <button
        className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-white mt-2"
        onClick={handleGovern}
        disabled={loading}
      >
        {loading ? 'Checking...' : 'Govern'}
      </button>
      {/* Governance output and monitoring removed from side panel; metrics shown in footer */}
    </div>
  );
}
