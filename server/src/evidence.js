const UNCERTAINTY = /\b(uncertain|unclear|unknown|not establish|not known|may |might |could |suggest|suggests|longer follow|further research|future|needs? (?:to )?be|limited|no significant|confidence interval|95%\s*ci|ci\b|however|although|was not designed|insufficient)\b/i;
const RESULT = /\b(results?|findings?|difference|improv|decreas|increas|reduc|hazard|risk|odds|mortality|survival|adverse|significant|associated|correlation|effect)\b/i;
const SAFETY = /\b(adverse|harm|safety|serious|death|mortality|hospitaliz|toxicity)\b/i;
const METHOD = /\b(methods?|randomi[sz]ed|trial|cohort|participants?|assigned|prospective|retrospective|double-blind|parallel-group|cross-sectional|case-control|follow-up|observational)\b/i;
const LIMITATION = /\b(limitation|however|although|not establish|not designed|needs?|further|generaliz|short follow|single center|retrospective|limited|unclear)\b/i;

export function normalizeText(text='') {
  return String(text).replace(/\u0000/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

export function sentences(text='') {
  const clean = normalizeText(text);
  if (!clean) return [];
  return clean
    .split(/(?<!\d)(?<=[.!?])\s+(?=[A-Z0-9])/)
    .map(s => s.trim())
    .filter(Boolean)
    .map(s => /[.!?]$/.test(s) ? s : `${s}.`);
}

export function sectionType(s='') {
  if (/^(background|introduction)\s*:/i.test(s)) return 'Context';
  if (/^(methods?|design)\s*:/i.test(s)) return 'Method';
  if (/^(results?|findings?)\s*:/i.test(s)) return 'Result';
  if (/^(conclusions?|interpretation)\s*:/i.test(s)) return 'Conclusion';
  return RESULT.test(s) ? 'Result' : METHOD.test(s) ? 'Method' : UNCERTAINTY.test(s) ? 'Boundary' : 'Context';
}

export function extractNumbers(text='') {
  const rx = /(?:[-+]?\d[\d,]*(?:\.\d+)?\s*(?:%|percentage points?|mg\/dL|mg|g|kg|mmHg|bpm|years?|months?|weeks?|days?|participants?|patients?|subjects?|adults?|children?)|95%\s*(?:CI|confidence interval)?[^.;\n]{0,80})/gi;
  return [...new Set((String(text).match(rx) || []).map(x => x.trim()).filter(x => x.length < 110))].slice(0, 24);
}

function tokenize(s='') {
  return normalizeText(s).toLowerCase().split(/\W+/).filter(w => w.length > 3 && !['with','from','that','this','were','than','into','over','using','study','group','groups'].includes(w));
}

function similarity(a='', b='') {
  const A = new Set(tokenize(a));
  const B = new Set(tokenize(b));
  if (!A.size || !B.size) return 0;
  let overlap = 0;
  for (const w of A) if (B.has(w)) overlap++;
  return overlap / Math.max(1, Math.sqrt(A.size * B.size));
}

export function findAnchor(claim='', xs=[]) {
  if (!claim || !xs.length) return 'Source phrase unavailable.';
  return xs.reduce((best, s) => similarity(claim, s) > similarity(claim, best) ? s : best, xs[0]).slice(0, 300);
}

export function buildClaims(xs, boundaries=[]) {
  const candidates = xs.filter(s => RESULT.test(s) || SAFETY.test(s) || UNCERTAINTY.test(s)).slice(0, 10);
  const claims = candidates.map((s, i) => {
    const type = SAFETY.test(s) ? 'Safety' : (UNCERTAINTY.test(s) && !RESULT.test(s)) ? 'Boundary' : 'Result';
    const strength = /95%\s*CI|p\s*[<=>]|hazard ratio|odds ratio|between-group difference/i.test(s) ? 'High' : /modest|suggest|associated|correlation/i.test(s) ? 'Medium' : 'Medium';
    return { id: `c${i+1}`, claim: s.replace(/^(Results?|Conclusions?):\s*/i, '').trim(), type, strength, source: 'S1', anchor: s.slice(0, 300) };
  });
  for (const boundary of boundaries.slice(0, 3)) {
    claims.push({ id: `c${claims.length+1}`, claim: boundary, type: 'Boundary', strength: 'High', source: 'S1', anchor: findAnchor(boundary, xs) });
  }
  return claims.slice(0, 12);
}

export function detectPICO(abstract='') {
  const xs = sentences(abstract);
  const methods = xs.find(s => METHOD.test(s)) || xs[0] || '';
  const population = methods.match(/\b\d[\d,]*\s+(?:adults?|patients?|participants?|subjects?)\b[^.]{0,120}/i)?.[0] || methods.match(/\b(?:adults?|patients?|participants?|subjects?)\b[^.]{0,160}/i)?.[0] || 'Not stated in the abstract.';
  const intervention = xs.find(s => /\b(intervention|program|treatment|exposure|received|assigned to)\b/i.test(s)) || 'Not stated in the abstract.';
  const comparator = xs.find(s => /\b(usual care|control|placebo|comparator|compared with|versus|vs\.?)\b/i.test(s)) || 'Not stated in the abstract.';
  let design = 'Not stated in the abstract.';
  if (/randomi[sz]ed/i.test(abstract)) design = /double[- ]blind/i.test(abstract) ? 'Randomized, double-blind trial' : 'Randomized trial';
  else if (/parallel-group/i.test(abstract)) design = 'Parallel-group trial';
  else if (/cohort/i.test(abstract)) design = 'Cohort study';
  else if (/cross-sectional/i.test(abstract)) design = 'Cross-sectional study';
  else if (/case-control/i.test(abstract)) design = 'Case-control study';
  return { population: population.slice(0, 500), intervention: intervention.slice(0, 550), comparator: comparator.slice(0, 500), design };
}

export function auditEvidence({ abstract, summary }) {
  const xs = sentences(abstract);
  const claims = Array.isArray(summary?.claims) ? summary.claims : [];
  const anchors = Array.isArray(summary?.evidenceAnchors) ? summary.evidenceAnchors : [];
  const sourceNumbers = extractNumbers(abstract);
  const summaryText = JSON.stringify(summary || '').toLowerCase();

  const substantiveClaims = claims.filter(c => ['Result','Safety','Boundary'].includes(c.type));
  const anchoredClaims = substantiveClaims.filter(c => c.anchor && xs.some(s => similarity(c.anchor, s) > 0.5)).length;
  const anchorCoverage = substantiveClaims.length ? Math.round(anchoredClaims / substantiveClaims.length * 100) : 100;
  const numericHits = sourceNumbers.filter(n => {
    const token = n.toLowerCase().split(/\s+/)[0].replace(/[,]/g,'');
    return summaryText.includes(token);
  }).length;
  const numericFidelity = sourceNumbers.length ? Math.round(numericHits / sourceNumbers.length * 100) : 100;
  const uncertaintySource = xs.filter(s => UNCERTAINTY.test(s)).length;
  const uncertaintyMentioned = (summary.uncertainties?.length || 0) + (summary.cannotSay?.length || 0);
  const uncertaintyCoverage = uncertaintySource ? Math.min(100, Math.round(uncertaintyMentioned / Math.max(1, uncertaintySource) * 100)) : 100;
  const frame = ['population','intervention','comparator','design'].filter(k => summary?.[k] && !/^not stated/i.test(summary[k])).length;
  const completeness = Math.round(frame / 4 * 100);
  const boundaryAnchors = anchors.filter(a => a.anchor).length;
  const claimDiscipline = claims.length ? Math.round(Math.min(1, boundaryAnchors / Math.max(1, claims.length * 0.25)) * 100) : 80;
  const score = Math.max(0, Math.min(100, Math.round(anchorCoverage * 0.30 + numericFidelity * 0.25 + uncertaintyCoverage * 0.20 + completeness * 0.15 + claimDiscipline * 0.10)));
  const label = score >= 90 ? 'Traceable' : score >= 75 ? 'Reviewable' : 'Needs review';
  return { score, label, anchorCoverage, numericFidelity, uncertaintyCoverage, completeness, claimDiscipline };
}

export function buildFallbackPack(abstract, metadata={}) {
  if (!String(abstract||'').trim()) throw new Error('The supplied abstract is empty.');
  const xs = sentences(abstract);
  const pico = detectPICO(abstract);
  const resultSentences = xs.filter(s => RESULT.test(s)).slice(0, 5);
  const conclusion = xs.find(s => /^(Conclusions?|Interpretation):/i.test(s)) || xs.at(-1) || '';
  const uncertainties = xs.filter(s => UNCERTAINTY.test(s)).slice(0, 4).map(s => s.replace(/^(Conclusions?|Limitations?):\s*/i, '').trim());
  const cannotSay = [
    'The abstract does not establish effects, subgroups, or mechanisms that are not explicitly reported.',
    ...(uncertainties.length ? ['Do not remove the uncertainty or time horizon from the reported conclusion.'] : [])
  ];
  const claims = buildClaims(xs, uncertainties.slice(0, 2));
  const outcomes = (resultSentences.length ? resultSentences : xs.slice(-3)).map(s => `${s} [S1]`);
  const pack = {
    executive: [resultSentences[0], resultSentences[1], conclusion].filter(Boolean).join(' ').slice(0, 1800),
    population: pico.population,
    intervention: pico.intervention,
    comparator: pico.comparator,
    design: pico.design,
    lens: 'Evidence-preserving synthesis',
    outcomes,
    limitations: [
      'This local compiler is extractive and does not invent unstated study limitations.',
      'The full article may contain details omitted from the abstract.',
      'Generalizability should be checked against the full study population, setting, and eligibility criteria.'
    ],
    cannotSay,
    relevance: `Evidence brief generated from the supplied abstract${metadata.title ? ` for “${metadata.title}”` : ''}. Verify the original paper before making research or clinical decisions.`,
    confidence: xs.length >= 7 ? 'Medium' : 'Low',
    numericFacts: extractNumbers(abstract).slice(0, 10).map(value => ({ value, context: 'Numeric fact preserved from source', source: 'S1' })),
    uncertainties,
    claims,
    evidenceAnchors: claims.slice(0, 7).map(c => ({ claim: c.claim, source: 'S1', anchor: c.anchor }))
  };
  pack.integrity = auditEvidence({ abstract, summary: pack });
  return pack;
}

export function detectDrift({ abstract='', summary={} }) {
  const xs = sentences(abstract);
  const srcNums = extractNumbers(abstract);
  const summaryText = JSON.stringify(summary).toLowerCase();
  const missingNumbers = srcNums.filter(n => !summaryText.includes(n.toLowerCase().split(/\s+/)[0].replace(/[,]/g,'')));
  const sourceBoundaries = xs.filter(s => UNCERTAINTY.test(s));
  const omittedBoundaries = sourceBoundaries.filter(s => !summaryText.includes(s.toLowerCase().slice(0, 35)));
  const suspicious = [];
  const terms = ['causes','cures','guarantees','proves','eliminates','prevents'];
  for (const claim of (summary.claims || [])) if (terms.some(t => claim.claim.toLowerCase().includes(t))) suspicious.push(`Loaded causal language: “${claim.claim}”`);
  return { missingNumbers: missingNumbers.slice(0,10), omittedBoundaries: omittedBoundaries.slice(0,5).map(s=>s.slice(0,180)), suspicious, status: suspicious.length || missingNumbers.length ? 'Review' : 'Stable' };
}

export function buildEvidenceMap(summary={}) {
  const claims = summary.claims || [];
  const counts = claims.reduce((a,c)=>{a[c.type]=(a[c.type]||0)+1; return a;},{});
  return { nodes: [{ id:'source', label:'Source', type:'source' }, ...claims.map(c=>({id:c.id,label:c.claim,type:c.type})), {id:'boundary',label:'Boundary layer',type:'Boundary'}], counts };
}

export { UNCERTAINTY, RESULT, SAFETY, METHOD, LIMITATION };
