import { buildFallbackPack as extractiveFallback } from './evidence.js';

export function parseJsonObject(text) {
  try { return JSON.parse(text); } catch {}
  const match = String(text).match(/\{[\s\S]*\}/);
  if (!match) throw new Error('AI response was not valid JSON.');
  return JSON.parse(match[0]);
}

const arr = x => Array.isArray(x) ? x.filter(v => typeof v === 'string').slice(0, 10) : [];

export function normalizeSummary(raw) {
  const s = raw?.summary || raw;
  if (!s || typeof s !== 'object') throw new Error('AI returned an invalid evidence object.');
  const claims = Array.isArray(s.claims) ? s.claims.slice(0, 14).map((c,i) => ({
    id: String(c.id || `c${i+1}`),
    claim: String(c.claim || '').slice(0, 900),
    type: ['Result','Safety','Boundary','Context'].includes(c.type) ? c.type : 'Result',
    strength: ['High','Medium','Low'].includes(c.strength) ? c.strength : 'Medium',
    source: String(c.source || 'S1'),
    anchor: String(c.anchor || '').slice(0, 320)
  })).filter(c=>c.claim) : [];
  return {
    executive: String(s.executive||'').slice(0, 3000),
    population: String(s.population||'Not stated in the abstract.').slice(0, 900),
    intervention: String(s.intervention||'Not stated in the abstract.').slice(0, 1000),
    comparator: String(s.comparator||'Not stated in the abstract.').slice(0, 800),
    design: String(s.design||'Not stated in the abstract.').slice(0, 500),
    lens: String(s.lens||'Evidence-preserving synthesis').slice(0, 100),
    outcomes: arr(s.outcomes),
    limitations: arr(s.limitations),
    cannotSay: arr(s.cannotSay),
    relevance: String(s.relevance||'Verify the original article before applying this evidence.').slice(0, 1800),
    confidence: ['High','Medium','Low'].includes(s.confidence) ? s.confidence : 'Medium',
    numericFacts: Array.isArray(s.numericFacts) ? s.numericFacts.slice(0, 14).map(n=>({value:String(n.value||''),context:String(n.context||''),source:String(n.source||'S1')})) : [],
    uncertainties: arr(s.uncertainties),
    claims,
    evidenceAnchors: Array.isArray(s.evidenceAnchors) ? s.evidenceAnchors.slice(0, 14).map(a=>({claim:String(a.claim||''),source:String(a.source||'S1'),anchor:String(a.anchor||'').slice(0,320)})).filter(a=>a.claim||a.anchor) : [],
    integrity: s.integrity && typeof s.integrity === 'object' ? s.integrity : undefined
  };
}

export { extractiveFallback };
