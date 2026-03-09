class GovernanceOverlay {
    constructor() {
        this.apiEndpoint = 'http://localhost:8000/govern';
        this.enabled = true;
        this.observer = null;
    }

    init() {
        // Inject governance indicator
        this.injectIndicator();
        
        // Watch for LLM responses
        this.observeResponses();
        
        console.log('[Governance] Layer active');
    }

    injectIndicator() {
        const indicator = document.createElement('div');
        indicator.id = 'governance-indicator';
        indicator.innerHTML = `
            <div class="gov-badge">
                <span class="gov-dot"></span>
                <span class="gov-text">GOV: ACTIVE</span>
            </div>
            <div class="gov-panel hidden">
                <div class="gov-stat">Confidence: <span id="gov-conf">--</span></div>
                <div class="gov-stat">Convergence: <span id="gov-conv">--</span></div>
                <div class="gov-stat">Bullshit: <span id="gov-bs">--</span></div>
                <div class="gov-doctrines">
                    <span class="doc-emp">E</span>
                    <span class="doc-ske">S</span>
                    <span class="doc-str">K</span>
                    <span class="doc-nec">N</span>
                </div>
            </div>
        `;
        document.body.appendChild(indicator);
        
        // Toggle panel
        indicator.querySelector('.gov-badge').addEventListener('click', () => {
            indicator.querySelector('.gov-panel').classList.toggle('hidden');
        });
    }

    observeResponses() {
        // Platform-specific selectors
        const selectors = {
            'chat.openai.com': '[data-message-author-role="assistant"]',
            'claude.ai': '.message-content, [class*=" ClaudeMessage"]'
        };
        
        const hostname = window.location.hostname;
        const selector = selectors[hostname] || '[class*="assistant"], [class*="response"]';
        
        this.observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.matches && node.matches(selector)) {
                        this.processResponse(node);
                    }
                });
            });
        });
        
        this.observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    async processResponse(element) {
        const rawText = element.innerText || element.textContent;
        
        // Skip if already processed
        if (element.dataset.governed) return;
        
        // Call governance API
        try {
            const response = await fetch(this.apiEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query: this.getLastUserQuery(),
                    raw_llm_outputs: [{
                        response: rawText,
                        confidence: 0.8,
                        doctrine: 'empirical'  // Default, would be multi-doctrine in full impl
                    }]
                })
            });
            
            const result = await response.json();
            this.displayGovernance(result, element);
            
        } catch (e) {
            console.error('[Governance] API error:', e);
        }
    }

    displayGovernance(result, element) {
        element.dataset.governed = 'true';
        
        // Update indicator
        document.getElementById('gov-conf').textContent = result.confidence.toFixed(2);
        document.getElementById('gov-conv').textContent = result.convergence_score.toFixed(2);
        document.getElementById('gov-bs').textContent = result.bullshit_score.toFixed(2);
        
        // Visual feedback on response
        if (result.bullshit_score > 0.5) {
            element.classList.add('governance-warning');
        }
        
        if (result.confidence < 0.4) {
            element.classList.add('governance-uncertain');
        }
        
        // Add governance metadata tooltip
        const meta = document.createElement('div');
        meta.className = 'governance-meta';
        meta.innerHTML = `
            <small>Trace: ${result.trace_id}</small>
            <small>Words: ${result.final_output.split(' ').length}/15</small>
        `;
        element.appendChild(meta);
    }

    getLastUserQuery() {
        // Extract last user message from DOM
        const userSelectors = [
            '[data-message-author-role="user"]',
            '.user-message',
            '[class*="user"]'
        ];
        
        for (const sel of userSelectors) {
            const el = document.querySelector(sel);
            if (el) return el.innerText || 'Unknown query';
        }
        return 'Unknown query';
    }
}

// Initialize
const gov = new GovernanceOverlay();
gov.init();
