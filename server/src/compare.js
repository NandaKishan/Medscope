import { extractiveFallback } from './summarizer.js';

function lower(s=''){return String(s).toLowerCase();}
function overlap(a='',b=''){
  const A=new Set(lower(a).split(/\W+/).filter(x=>x.length>4)); const B=new Set(lower(b).split(/\W+/).filter(x=>x.length>4));
  let n=0; for(const w of A) if(B.has(w)) n++; return n/Math.max(1,A.size+B.size-n);
}
function classify(item){
  const s=item.summary||extractiveFallback(item.abstract||'',item);
  const resultText=(s.outcomes||[]).join(' ');
  const direction=/\b(improv|decreas|reduc|lower|benefit|increase|higher|worse|no significant|not establish)\b/i.exec(resultText)?.[1]||'reported';
  return {item, summary:s, key: {design:s.design,population:s.population,intervention:s.intervention,comparator:s.comparator,direction:direction.toLowerCase()},}
}

export function compareDeterministic(items=[]){
  const prepared=items.map(classify);
  const sharedSignals=[]; const contextDifferences=[]; const apparentDisagreements=[]; const missingEvidence=[];
  for(let i=0;i<prepared.length;i++) for(let j=i+1;j<prepared.length;j++){
    const a=prepared[i], b=prepared[j];
    const popSim=overlap(a.key.population,b.key.population); const intSim=overlap(a.key.intervention,b.key.intervention); const endpointSim=overlap((a.summary.outcomes||[]).join(' '),(b.summary.outcomes||[]).join(' '));
    if(popSim<0.22) contextDifferences.push(`${a.item.title||'Study A'} and ${b.item.title||'Study B'} appear to use different study populations.`);
    if(intSim<0.70) contextDifferences.push(`${a.item.title||'Study A'} and ${b.item.title||'Study B'} describe different interventions/exposures.`);
    if(endpointSim<0.18) contextDifferences.push(`${a.item.title||'Study A'} and ${b.item.title||'Study B'} emphasize different outcome language.`);
    if(popSim>0.2 && intSim>0.2 && endpointSim>0.2 && a.key.direction!==b.key.direction) apparentDisagreements.push(`The two abstracts report different result directions under broadly similar study frames; inspect effect measures, timing, and full-text methods before calling this a true contradiction.`);
    if(popSim>0.35 && endpointSim>0.35) sharedSignals.push(`The abstracts share substantial population/outcome language; compare the actual effect estimates rather than prose alone.`);
  }
  const allNums=prepared.flatMap(x=>x.summary.numericFacts||[]).map(n=>n.value);
  if(!allNums.length) missingEvidence.push('No numeric effect estimate was available in the compiled abstracts.');
  return {provider:'fallback',synthesis:`MedScope aligned ${prepared.length} study frames. The matrix separates study-context differences from possible result-direction differences; it does not select a preferred study or conclusion.`,apparentDisagreements:[...new Set(apparentDisagreements)].slice(0,6),sharedSignals:[...new Set(sharedSignals)].slice(0,6),contextDifferences:[...new Set(contextDifferences)].slice(0,8),missingEvidence:[...new Set(missingEvidence)].slice(0,6),confidence:prepared.length>=2?'Medium':'Low',items:prepared.map(x=>({title:x.item.title,pmid:x.item.pmid,summary:x.summary,key:x.key}))};
}
