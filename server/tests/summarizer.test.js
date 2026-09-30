import test from 'node:test';
import assert from 'node:assert/strict';
import { extractiveFallback, normalizeSummary, parseJsonObject } from '../src/summarizer.js';
import { auditEvidence, detectDrift, extractNumbers, sentences, detectPICO } from '../src/evidence.js';
import { compareDeterministic } from '../src/compare.js';

test('sentence parsing keeps decimal numbers intact',()=>{const xs=sentences('The effect was 0.5 units. Follow-up was 12 months.');assert.equal(xs.length,2);});
test('numeric extractor preserves key quantities',()=>{const n=extractNumbers('312 adults; -0.5 percentage points; 95% CI, -0.7 to -0.2; 12 months.');assert.ok(n.some(x=>x.includes('312')));assert.ok(n.some(x=>x.includes('-0.5')));assert.ok(n.some(x=>/95%/i.test(x)));});
test('fallback compiler returns a traceable evidence pack',()=>{const s=extractiveFallback('Methods: In a randomized trial, 100 adults were assigned to intervention or usual care. Results: HbA1c decreased by 0.4 points at 6 months. Conclusions: Longer follow-up is needed.');assert.equal(s.population.includes('100'),true);assert.ok(s.claims.length>0);assert.ok(s.integrity.score>0);});
test('missing inputs are rejected',()=>{assert.throws(()=>extractiveFallback(''));});
test('normalizer removes malformed claim fields',()=>{const s=normalizeSummary({executive:'ok',population:'p',intervention:'i',comparator:'c',design:'d',lens:'l',outcomes:[],limitations:[],cannotSay:[],relevance:'r',confidence:'High',numericFacts:[],uncertainties:[],claims:[{claim:'x',strength:'Nope'}],evidenceAnchors:[]});assert.equal(s.claims[0].strength,'Medium');});
test('json parser rejects non-json',()=>{assert.throws(()=>parseJsonObject('not json'));});
test('drift detector spots missing numbers',()=>{const abstract='Results: 100 participants improved by 0.4 points at 6 months.';const summary={executive:'',population:'Not stated in the abstract.',intervention:'Not stated in the abstract.',comparator:'Not stated in the abstract.',design:'Not stated in the abstract.',outcomes:[],claims:[],numericFacts:[],uncertainties:[],cannotSay:[],evidenceAnchors:[]}; const d=detectDrift({abstract,summary});assert.ok(d.missingNumbers.length>=1);});
test('PICO extraction is deterministic',()=>{const p=detectPICO('Methods: In a parallel-group trial, 80 adults received intervention versus usual care for 12 weeks. Results: symptoms improved.');assert.ok(/80/.test(p.population));assert.ok(/usual care/i.test(p.comparator));assert.ok(/trial/i.test(p.design));});
test('comparison separates context from conclusions',()=>{const a={title:'A',pmid:'1',abstract:'Methods: 50 adults received exercise. Results: symptoms improved.'};const b={title:'B',pmid:'2',abstract:'Methods: 50 adults received medication. Results: symptoms improved.'};const out=compareDeterministic([a,b]);assert.ok(out.contextDifferences.length>=1);assert.match(out.synthesis,/aligned 2 study frames/);});
