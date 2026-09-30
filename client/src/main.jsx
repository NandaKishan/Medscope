import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Activity, AlertCircle, ArrowDownRight, ArrowRight, BarChart3, Beaker, BookOpen, BrainCircuit,
  Check, ChevronDown, ClipboardCheck, Copy, Database, Download, ExternalLink, Eye, FileSearch,
  FileText, Fingerprint, FlaskConical, Gauge, GitBranch, Globe2, History, Info, Layers3, Lightbulb,
  LockKeyhole, Menu, MessageCircle, Moon, Network, PanelLeftClose, PanelLeftOpen, Play, Plus,
  Quote, RefreshCw, Search, Send, Settings, ShieldCheck, Sparkles, Split, Sun, Target, TestTube2,
  Upload, X, Zap, Scale, TriangleAlert, CircleDot
} from 'lucide-react';
import './styles.css';

const DEMO_ABSTRACT = `Background: Type 2 diabetes is associated with an increased risk of cardiovascular disease. We evaluated whether a structured lifestyle intervention added to usual care could improve glycemic control and cardiovascular risk markers in adults with recently diagnosed type 2 diabetes.

Methods: In this pragmatic, parallel-group trial, 312 adults were assigned to a 12-month lifestyle program or usual care. The primary outcome was change in HbA1c at 12 months. Secondary outcomes included body weight, systolic blood pressure, LDL cholesterol, and treatment escalation.

Results: At 12 months, mean HbA1c decreased by 0.8 percentage points in the intervention group and 0.3 percentage points with usual care (between-group difference, -0.5 percentage points; 95% CI, -0.7 to -0.2). Participants in the intervention group also had greater mean weight loss and modest reductions in systolic blood pressure. Treatment escalation was less frequent in the intervention group. No serious intervention-related adverse events were reported.

Conclusions: A structured lifestyle program added to usual care improved glycemic control and several cardiovascular risk markers over 12 months. Longer follow-up is needed to determine whether these changes translate into fewer cardiovascular events.`;

const DEMO_META = {title:'Structured lifestyle intervention for recently diagnosed type 2 diabetes',authors:'A. Rao, M. Chen, L. Williams',journal:'Synthetic Clinical Research Journal',year:'2025',pmid:'DEMO-001'};

const NAV = [
  ['workspace','Abstract Lab',FileSearch],
  ['radar','Literature Radar',Globe2],
  ['compare','Evidence Matrix',GitBranch],
  ['ledger','Claim Ledger',ClipboardCheck],
  ['history','History',History],
  ['benchmark','Benchmark Lab',FlaskConical],
  ['settings','System & API',Settings]
];

const modeCopy = {
  clinical:'Clinician lens · protocol, outcomes, caveats',
  research:'Research lens · design, estimates, limitations',
  plain:'Plain-language lens · readable without flattening uncertainty'
};

function App(){
  const [page,setPage]=useState('workspace');
  const [collapsed,setCollapsed]=useState(false);
  const [dark,setDark]=useState(true);
  const [abstract,setAbstract]=useState('');
  const [meta,setMeta]=useState({title:'',authors:'',journal:'',year:'',pmid:''});
  const [mode,setMode]=useState('research');
  const [length,setLength]=useState('balanced');
  const [strict,setStrict]=useState(true);
  const [pack,setPack]=useState(null);
  const [drift,setDrift]=useState(null);
  const [loading,setLoading]=useState(false);
  const [notice,setNotice]=useState(null);
  const [focusedClaim,setFocusedClaim]=useState(null);
  const [sourceOpen,setSourceOpen]=useState(false);
  const [history,setHistory]=useState(()=>parse(localStorage.getItem('medscope-history'),[]));
  const [results,setResults]=useState([]);
  const [query,setQuery]=useState('');
  const [searching,setSearching]=useState(false);
  const [selected,setSelected]=useState([]);
  const [batch,setBatch]=useState([]);
  const [batchLoading,setBatchLoading]=useState(false);
  const [compare,setCompare]=useState(null);
  const [chat,setChat]=useState([]);
  const [chatInput,setChatInput]=useState('');
  const [chatLoading,setChatLoading]=useState(false);
  const [health,setHealth]=useState(null);
  const [benchmark,setBenchmark]=useState(null);
  const [benchmarkLoading,setBenchmarkLoading]=useState(false);
  const [presentation,setPresentation]=useState(false);
  const [toast,setToast]=useState(null);
  const fileRef=useRef();

  useEffect(()=>{document.documentElement.dataset.theme=dark?'dark':'light';},[dark]);
  useEffect(()=>{localStorage.setItem('medscope-history',JSON.stringify(history.slice(0,50)));},[history]);
  useEffect(()=>{fetch('/api/health').then(r=>r.json()).then(setHealth).catch(()=>setHealth({aiConfigured:false,provider:'offline'}));},[]);
  useEffect(()=>{if(notice){const t=setTimeout(()=>setNotice(null),5200);return()=>clearTimeout(t)}},[notice]);
  useEffect(()=>{if(toast){const t=setTimeout(()=>setToast(null),2400);return()=>clearTimeout(t)}},[toast]);

  const stats=useMemo(()=>{
    const words=abstract.trim()?abstract.trim().split(/\s+/).length:0;
    const sentenceCount=abstract.trim()?abstract.split(/(?<=[.!?])\s+/).filter(Boolean).length:0;
    return {words,sentenceCount,reading:Math.max(1,Math.ceil(words/190)),papers:results.length,selected:selected.length,history:history.length};
  },[abstract,results.length,selected.length,history.length]);

  const activeLabel=page==='workspace'?'Abstract Lab':page==='radar'?'Literature Radar':page==='compare'?'Evidence Matrix':page==='ledger'?'Claim Ledger':page==='history'?'History':page==='benchmark'?'Benchmark Lab':'System & API';

  function flash(type,text){setNotice({type,text});}
  function nav(p){setPage(p);}
  function loadDemo(){setAbstract(DEMO_ABSTRACT);setMeta(DEMO_META);setPage('workspace');setPack(null);setFocusedClaim(null);setChat([]);flash('info','Demo paper loaded. Hit Compile Evidence to generate the full evidence object.');}
  function useQuick(q){setQuery(q);searchLiterature(q);}
  function reset(){setAbstract('');setMeta({title:'',authors:'',journal:'',year:'',pmid:''});setPack(null);setDrift(null);setChat([]);setFocusedClaim(null);setSourceOpen(false);flash('info','Workspace reset.');}

  async function compile(){
    if(!abstract.trim()) return flash('error','Paste an abstract or load the prepared demo first.');
    setLoading(true);setFocusedClaim(null);setNotice(null);
    try{
      const r=await fetch('/api/summarize',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({abstract,metadata:meta,mode,length,strict})});
      const d=await r.json();if(!r.ok)throw new Error(d.error||'Compilation failed');
      setPack(d.summary);setDrift(d.drift);setChat([{role:'assistant',text:'Evidence brief compiled. Ask about the source, the numbers, the study frame, or what it does not establish.'}]);
      const item={id:crypto.randomUUID(),createdAt:new Date().toISOString(),title:meta.title||'Untitled abstract',pmid:meta.pmid||'No PMID',metadata:{...meta,abstract},wordCount:stats.words,summary:d.summary,provider:d.provider};
      setHistory(prev=>[item,...prev]);
      flash('success',`${d.provider==='openai'?'OpenAI':'Local evidence engine'} compiled the abstract. Evidence integrity: ${d.summary.integrity?.score||0}%.`);
    }catch(e){flash('error',e.message||'Compilation failed.');}finally{setLoading(false)}
  }

  async function searchLiterature(q=query){
    if(!q.trim()) return flash('error','Enter a literature query.');
    setSearching(true);setNotice(null);setPage('radar');
    try{const r=await fetch('/api/search',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({query:q,limit:10})});const d=await r.json();if(!r.ok)throw new Error(d.error||'Search failed');setResults(d.results||[]);setSelected([]);flash('success',`${(d.results||[]).length} deduplicated records returned across ${d.sourceCount||0} public literature sources.`);}catch(e){flash('error',e.message||'Search failed.');}finally{setSearching(false)}
  }

  function toggleSelected(p){setSelected(prev=>prev.some(x=>samePaper(x,p))?prev.filter(x=>!samePaper(x,p)):[...prev,p].slice(0,10));}
  function samePaper(a,b){return (a.pmid&&b.pmid&&a.pmid===b.pmid)||(a.doi&&b.doi&&a.doi.toLowerCase()===b.doi.toLowerCase())||a.id===b.id;}

  async function compileBatch(){
    if(!selected.length) return flash('error','Select papers from Literature Radar first.');
    setBatchLoading(true);setNotice(null);
    try{const r=await fetch('/api/batch',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({items:selected})});const d=await r.json();if(!r.ok)throw new Error(d.error||'Batch failed');setBatch(d.items||[]);setCompare(d.compare||null);setPage('compare');flash('success',`${(d.items||[]).length} evidence briefs aligned into a comparison matrix.`);}catch(e){flash('error',e.message||'Batch failed.');}finally{setBatchLoading(false)}
  }

  async function ask(){
    if(!chatInput.trim()||!abstract.trim()||chatLoading)return;
    const question=chatInput.trim();setChat(v=>[...v,{role:'user',text:question}]);setChatInput('');setChatLoading(true);
    try{const r=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({abstract,metadata:meta,summary:pack,question})});const d=await r.json();if(!r.ok)throw new Error(d.error||'Question failed');setChat(v=>[...v,{role:'assistant',text:d.answer,anchors:d.anchors||[]}]);}catch(e){setChat(v=>[...v,{role:'assistant',text:e.message||'Unable to answer that question.'}]);}finally{setChatLoading(false)}
  }

  async function runBenchmark(){setBenchmarkLoading(true);try{const r=await fetch('/api/benchmark',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});const d=await r.json();if(!r.ok)throw new Error(d.error||'Benchmark failed');setBenchmark(d);flash('success',`Regression suite complete: ${d.overall}% deterministic preservation score.`);}catch(e){flash('error',e.message||'Benchmark failed.')}finally{setBenchmarkLoading(false)}}

  function reopen(item){setAbstract(item.metadata?.abstract||'');setMeta(item.metadata||{});setPack(item.summary||null);setDrift(null);setPage('workspace');setChat([{role:'assistant',text:'Reopened from local browser history.'}]);}
  function clearHistory(){localStorage.removeItem('medscope-history');setHistory([]);flash('info','Local history cleared.');}
  function exportPack(kind){if(!pack)return flash('error','Compile an evidence brief first.');const stem=slug(meta.title||'medscope-evidence');if(kind==='json')download(JSON.stringify({metadata:meta,summary:pack,drift,exportedAt:new Date().toISOString()},null,2),`${stem}.json`,'application/json');else {const md=`# ${meta.title||'MedScope Evidence Brief'}\n\n> ${pack.executive}\n\n## Study frame\n- Design: ${pack.design}\n- Population: ${pack.population}\n- Intervention: ${pack.intervention}\n- Comparator: ${pack.comparator}\n\n## Key outcomes\n${(pack.outcomes||[]).map(x=>`- ${x}`).join('\n')}\n\n## Boundaries\n${(pack.cannotSay||[]).map(x=>`- ${x}`).join('\n')}\n\n## Limitations\n${(pack.limitations||[]).map(x=>`- ${x}`).join('\n')}\n\n## Numeric lock\n${(pack.numericFacts||[]).map(x=>`- ${x.value} — ${x.context} [${x.source}]`).join('\n')}\n\n## Evidence integrity\n${JSON.stringify(pack.integrity,null,2)}\n`;download(md,`${stem}.md`,'text/markdown');}}
  function handleFile(e){const file=e.target.files?.[0];if(!file)return;const reader=new FileReader();reader.onload=()=>{setAbstract(String(reader.result||'').slice(0,45000));setMeta(m=>({...m,title:file.name.replace(/\.[^.]+$/,'')}));flash('success',`Imported ${file.name}.`)};reader.readAsText(file);}

  return <div className="app-shell">
    <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} page={page} nav={nav} dark={dark} setDark={setDark} onDemo={loadDemo} presentation={()=>setPresentation(true)}/>
    <div className={`main-shell ${collapsed?'is-collapsed':''}`}>
      <Topbar label={activeLabel} health={health} stats={stats} presentation={()=>setPresentation(true)} />
      {notice&&<Notice data={notice}/>} 
      {toast&&<div className="toast"><Check size={14}/>{toast}</div>}
      {page==='workspace'&&<Workspace {...{abstract,setAbstract,meta,setMeta,mode,setMode,length,setLength,strict,setStrict,pack,drift,loading,compile,loadDemo,reset,sourceOpen,setSourceOpen,focusedClaim,setFocusedClaim,exportPack,chat,chatInput,setChatInput,ask,chatLoading,stats,fileRef,handleFile,health}}/>}
      {page==='radar'&&<Radar {...{query,setQuery,searchLiterature,searching,results,selected,toggleSelected,compileBatch,batchLoading,useQuick}}/>}
      {page==='compare'&&<ComparePage batch={batch} compare={compare} selected={selected}/>} 
      {page==='ledger'&&<LedgerPage pack={pack} abstract={abstract} focusedClaim={focusedClaim} setFocusedClaim={setFocusedClaim}/>} 
      {page==='history'&&<HistoryPage history={history} reopen={reopen} clearHistory={clearHistory}/>} 
      {page==='benchmark'&&<BenchmarkPage benchmark={benchmark} loading={benchmarkLoading} run={runBenchmark}/>} 
      {page==='settings'&&<SettingsPage health={health}/>} 
    </div>
    {presentation&&<PresentationMode close={()=>setPresentation(false)} pack={pack} abstract={abstract} integrity={pack?.integrity} onDemo={loadDemo} compile={compile} />}
  </div>
}

function Sidebar({collapsed,setCollapsed,page,nav,dark,setDark,onDemo,presentation}){return <aside className={`sidebar ${collapsed?'collapsed':''}`}>
  <div className="brand">
    <div className="logo-mark"><span></span><span></span><span></span><i></i></div>
    {!collapsed&&<div><div className="brand-name">MED<span>SCOPE</span></div><div className="brand-sub">EVIDENCE OS <b>3.0</b></div></div>}
  </div>
  <div className="rail-rule"/>
  <div className="nav-label">WORKSPACE</div>
  <nav>{nav.map(([id,label,Icon])=><button key={id} className={page===id?'active':''} title={collapsed?label:''} onClick={()=>{setPage(id)}}><Icon size={17}/>{!collapsed&&<span>{label}</span>}{!collapsed&&id==='workspace'&&<em>CORE</em>}</button>)}</nav>
  {!collapsed&&<div className="sidebar-feature"><div className="mini-orbit"><span></span><i></i></div><div><b>Evidence-first by design.</b><p>Every claim can point back to its source span.</p></div></div>}
  <div className="sidebar-bottom">
    {!collapsed&&<button className="demo-btn" onClick={onDemo}><FlaskConical size={14}/> Launch judge demo <ArrowRight size={13}/></button>}
    {!collapsed&&<button className="demo-btn secondary" onClick={presentation}><Eye size={14}/> Presentation mode <Sparkles size={13}/></button>}
    <div className="sidebar-actions"><button title="Collapse rail" onClick={()=>setCollapsed(v=>!v)}>{collapsed?<PanelLeftOpen size={16}/>:<PanelLeftClose size={16}/>}</button><button title="Theme" onClick={()=>setDark(v=>!v)}>{dark?<Sun size={16}/>:<Moon size={16}/>}</button></div>
  </div>
  {!collapsed&&<div className="privacy"><LockKeyhole size={12}/><span>Demo boundary: public abstracts only</span></div>}
</aside>}

function Topbar({label,health,stats,presentation}){return <header className="topbar"><div className="breadcrumb"><span>MEDSCOPE</span><b>/</b>{label}</div><div className="topbar-right"><div className="source-status"><i></i><span>{health?.aiConfigured?'AI connected':'Local engine'}</span><b>·</b><span>PubMed</span><b>·</b><span>Europe PMC</span></div><div className="top-stats"><span>{stats.papers||0} papers</span><span>{stats.history||0} briefs</span></div><button className="icon-btn" onClick={presentation}><Zap size={15}/></button></div></header>}
function Notice({data}){return <div className={`notice ${data.type}`}><div>{data.type==='error'?<AlertCircle size={15}/>:data.type==='success'?<Check size={15}/>:<Info size={15}/>}</div><span>{data.text}</span></div>}

function Workspace(p){
  return <main className="page workspace-page">
    <section className="hero-band">
      <div className="hero-copy">
        <div className="eyebrow"><span className="pulse-dot"/> MEDICAL LITERATURE COMPILER <b>•</b> EVIDENCE-GROUNDED</div>
        <h1>Read the paper.<br/><em>Keep the evidence.</em></h1>
        <p>MedScope turns a raw abstract into an inspectable evidence object — preserving study frame, quantitative facts, uncertainty, and the exact source phrases behind important claims.</p>
        <div className="hero-actions"><button className="primary-btn" onClick={p.compile} disabled={p.loading}>{p.loading?<><span className="spinner"/>Compiling evidence…</>:<><Sparkles size={16}/>Compile evidence</>}</button><button className="ghost-btn" onClick={p.loadDemo}><FlaskConical size={15}/>Load benchmark paper</button><button className="ghost-btn" onClick={()=>p.fileRef.current?.click()}><Upload size={15}/>Import .txt</button><input ref={p.fileRef} hidden type="file" accept=".txt,.md,text/plain" onChange={p.handleFile}/></div>
        <div className="hero-micro"><span><ShieldCheck size={13}/> No clinical recommendations</span><span><LockKeyhole size={13}/> Source treated as untrusted content</span><span><Database size={13}/> Public / synthetic data</span></div>
      </div>
      <HeroConstellation pack={p.pack}/>
    </section>

    <div className="workspace-grid top-grid">
      <SourceCard {...p}/>
      <CompilerCard {...p}/>
      <GuardianCard pack={p.pack} drift={p.drift} health={p.health}/>
    </div>

    {p.pack?<>
      <StudyDNA pack={p.pack}/>
      <section className="workspace-grid main-grid">
        <EvidenceBrief pack={p.pack} onClaim={p.setFocusedClaim}/>
        <ChatCard {...p}/>
      </section>
      <section className="workspace-grid lower-grid">
        <NumericLock pack={p.pack}/>
        <BoundaryCard pack={p.pack}/>
        <DriftCard drift={p.drift}/>
      </section>
      <EvidenceMap pack={p.pack}/>
      <SourceReader abstract={p.abstract} pack={p.pack} open={p.sourceOpen} setOpen={p.setSourceOpen} focusedClaim={p.focusedClaim}/>
    </>:<EmptyLaunch onDemo={p.loadDemo}/>} 
  </main>
}

function SourceCard({abstract,setAbstract,meta,setMeta,stats,reset}){return <section className="card source-card">
  <div className="card-head"><div><div className="overline">01 · SOURCE INGEST</div><h2>Abstract <em>input</em></h2></div><span className="source-badge"><CircleDot size={12}/> {stats.words?`${stats.words} words`:'Awaiting source'}</span></div>
  <textarea value={abstract} onChange={e=>setAbstract(e.target.value.slice(0,45000))} placeholder="Paste a PubMed-style abstract here…\n\nBackground: …\nMethods: …\nResults: …\nConclusions: …" />
  <div className="source-footer"><div className="meta-stats"><span>{stats.sentenceCount} sentences</span><span>~{stats.reading} min read</span><span className={stats.words>900?'warn':''}>{stats.words}/45k chars</span></div><button className="text-btn" onClick={reset}><RefreshCw size={12}/> Reset</button></div>
  <div className="meta-grid"><MetaInput label="TITLE" value={meta.title} set={v=>setMeta({...meta,title:v})} placeholder="Study title"/><MetaInput label="PMID / DOI" value={meta.pmid} set={v=>setMeta({...meta,pmid:v})} placeholder="Identifier"/><MetaInput label="JOURNAL" value={meta.journal} set={v=>setMeta({...meta,journal:v})} placeholder="Journal"/><MetaInput label="YEAR" value={meta.year} set={v=>setMeta({...meta,year:v})} placeholder="2026"/></div>
</section>}
function MetaInput({label,value,set,placeholder}){return <label className="meta-input"><span>{label}</span><input value={value||''} onChange={e=>set(e.target.value)} placeholder={placeholder}/></label>}

function CompilerCard({mode,setMode,length,setLength,strict,setStrict}){return <section className="card compiler-card">
  <div className="card-head"><div><div className="overline">02 · SYNTHESIS CONTROL</div><h2>Compiler <em>lens</em></h2></div><div className="tiny-lock"><LockKeyhole size={12}/> strict</div></div>
  <div className="lens-selector">{Object.entries(modeCopy).map(([k,v])=><button key={k} className={mode===k?'selected':''} onClick={()=>setMode(k)}><span>{k==='clinical'?'C':k==='research'?'R':'P'}</span><b>{k}</b><small>{v}</small></button>)}</div>
  <div className="control-row"><div><span className="control-title">COMPRESSION</span><div className="segmented">{['compact','balanced','deep'].map(x=><button key={x} className={length===x?'active':''} onClick={()=>setLength(x)}>{x}</button>)}</div></div><label className="switch-row"><span><b>Evidence lock</b><small>preserve qualifiers + exact numbers</small></span><button className={`switch ${strict?'on':''}`} onClick={()=>setStrict(!strict)}><i/></button></label></div>
  <div className="compiler-principles"><span><Target size={13}/> PICO frame</span><span><Quote size={13}/> Atomic claims</span><span><BarChart3 size={13}/> Numeric lock</span><span><Split size={13}/> Boundary layer</span></div>
</section>}

function GuardianCard({pack,drift,health}){const score=pack?.integrity?.score??0;const metrics=pack?.integrity||{};return <section className="card guardian-card"><div className="card-head"><div><div className="overline">03 · EVIDENCE GUARDIAN</div><h2>Integrity <em>vector</em></h2></div><span className={`status-chip ${score>=90?'good':score>=75?'mid':'low'}`}>{score>=90?'TRACEABLE':score>=75?'REVIEWABLE':'READY'}</span></div><div className="ring-wrap"><div className="ring" style={{'--p':`${score}%`}}><div><b>{score||'—'}</b><span>{score?'integrity':'awaiting'}</span></div></div><div><strong>{drift?.status==='Review'?'Review recommended':'Evidence path stable'}</strong><p>{health?.aiConfigured?'OpenAI structured output + deterministic audit':'Deterministic extractor + audit guard'}</p><div className="guard-mini"><span>Source anchors <b>{metrics.anchorCoverage||0}%</b></span><span>Numeric fidelity <b>{metrics.numericFidelity||0}%</b></span><span>Uncertainty <b>{metrics.uncertaintyCoverage||0}%</b></span></div></div></div><div className="guard-footer"><div><i></i> Not a clinical accuracy score</div><button className="text-btn"><Info size={12}/> What is this?</button></div></section>}

function StudyDNA({pack}){return <section className="dna-grid"><Fingerprint size={18}/><div className="dna-title"><div className="overline">STUDY DNA</div><b>The frame travels with every claim.</b></div><DNAItem k="DESIGN" v={pack.design}/><DNAItem k="POPULATION" v={pack.population}/><DNAItem k="INTERVENTION" v={pack.intervention}/><DNAItem k="COMPARATOR" v={pack.comparator}/></section>}
function DNAItem({k,v}){return <div className="dna-item"><span>{k}</span><p>{v||'Not stated.'}</p></div>}

function EvidenceBrief({pack,onClaim}){return <section className="card brief-card"><div className="card-head"><div><div className="overline">EVIDENCE BRIEF · EXECUTIVE LAYER</div><h2>What the abstract <em>actually says.</em></h2></div><span className="confidence-pill"><ShieldCheck size={13}/> {pack.confidence} synthesis confidence</span></div><div className="executive-block"><span className="quote-chip">[S1] source-anchored</span><p>{pack.executive||'No executive synthesis returned.'}</p></div><div className="brief-columns"><div><SectionLabel icon={Target} text="Key outcomes"/>{(pack.outcomes||[]).map((x,i)=><button className="outcome-row" key={i} onClick={()=>onClaim(pack.claims?.[i]?.id)}><i>{String(i+1).padStart(2,'0')}</i><span>{x}</span><ArrowDownRight size={14}/></button>)}</div><div><SectionLabel icon={Scale} text="Evidence boundaries"/>{(pack.cannotSay||[]).map((x,i)=><div className="boundary-row" key={i}><TriangleAlert size={14}/><span>{x}</span></div>)}<div className="relevance"><span>USE WITHIN SCOPE</span><p>{pack.relevance}</p></div></div></div></section>}
function SectionLabel({icon:Icon,text}){return <div className="section-label"><Icon size={14}/><span>{text}</span></div>}

function ChatCard({chat,chatInput,setChatInput,ask,chatLoading}){return <section className="card chat-card"><div className="card-head"><div><div className="overline">SOURCE-LIMITED COPILOT</div><h2>Ask the <em>paper.</em></h2></div><span className="source-badge"><LockKeyhole size={12}/> S1 only</span></div><div className="chat-suggestions"><button onClick={()=>setChatInput('What does this study not establish?')}>What does it not establish?</button><button onClick={()=>setChatInput('What was the primary outcome?')}>Primary outcome?</button><button onClick={()=>setChatInput('What are the key numbers?')}>Key numbers?</button></div><div className="chat-feed">{chat.length?chat.map((m,i)=><div className={`chat-msg ${m.role}`} key={i}><div className="avatar">{m.role==='assistant'?<BrainCircuit size={14}/>:<span>Y</span>}</div><div><p>{m.text}</p>{m.anchors?.length>0&&<div className="chat-anchors">{m.anchors.slice(0,2).map((a,j)=><span key={j}><Quote size={10}/> {a.anchor}</span>)}</div>}</div></div>):<div className="chat-empty"><MessageCircle size={20}/><p>Questions are constrained to the supplied abstract. No external medical advice.</p></div>}</div><form className="chat-input" onSubmit={e=>{e.preventDefault();ask()}}><input value={chatInput} onChange={e=>setChatInput(e.target.value)} placeholder="Ask a source-grounded question…"/><button disabled={chatLoading}>{chatLoading?<span className="spinner small"/>:<Send size={14}/>}</button></form></section>}

function NumericLock({pack}){return <section className="card metric-card"><div className="card-head"><div><div className="overline">QUANTITATIVE LOCK</div><h3>Numbers <em>that survived.</em></h3></div><span className="metric-icon"><BarChart3 size={15}/></span></div><div className="numeric-list">{(pack.numericFacts||[]).map((n,i)=><div className="numeric-row" key={i}><b>{n.value}</b><span>{n.context}</span><i>[{n.source}]</i></div>)}</div>{!(pack.numericFacts||[]).length&&<div className="muted">No explicit numeric facts detected.</div>}</section>}
function BoundaryCard({pack}){return <section className="card metric-card boundary-card"><div className="card-head"><div><div className="overline">BOUNDARY LAYER</div><h3>What you <em>must not infer.</em></h3></div><span className="metric-icon warn"><Split size={15}/></span></div><div className="boundary-list">{(pack.cannotSay||[]).map((x,i)=><div key={i}><span>0{i+1}</span><p>{x}</p></div>)}</div></section>}
function DriftCard({drift}){const has=drift&&(drift.missingNumbers?.length||drift.omittedBoundaries?.length||drift.suspicious?.length);return <section className="card metric-card"><div className="card-head"><div><div className="overline">NARRATIVE DRIFT GUARD</div><h3>Compression <em>didn't rewrite the truth.</em></h3></div><span className={`metric-icon ${has?'warn':'good'}`}>{has?<TriangleAlert size={15}/>:<Check size={15}/>}</span></div>{!drift?<div className="muted">Run the compiler to activate drift checks.</div>:has?<div className="drift-list">{drift.missingNumbers?.map((x,i)=><span key={'n'+i}>Missing numeric fact · {x}</span>)}{drift.omittedBoundaries?.map((x,i)=><span key={'b'+i}>Boundary may be omitted · {x}</span>)}{drift.suspicious?.map((x,i)=><span key={'s'+i}>{x}</span>)}</div>:<div className="stable-banner"><Check size={15}/><div><b>Stable</b><p>No missing numeric token or loaded causal phrase detected by the deterministic guard.</p></div></div>}</section>}

function EvidenceMap({pack}){const claims=(pack.claims||[]).slice(0,7);return <section className="card evidence-map"><div className="map-head"><div><div className="overline">EVIDENCE GRAPH</div><h2>One source, many <em>inspectable claims.</em></h2><p>Instead of hiding reasoning inside a paragraph, MedScope exposes the evidence graph that can power QA, audit, and cross-paper synthesis.</p></div><div className="map-legend"><span><i className="dot result"/>Result</span><span><i className="dot safety"/>Safety</span><span><i className="dot boundary"/>Boundary</span></div></div><div className="graph-stage"><div className="source-node"><Database size={18}/><span>S1</span><small>source</small></div><div className="graph-lines">{claims.map((c,i)=><div className="graph-line" key={c.id} style={{'--i':i}}><span className={`graph-dot ${c.type.toLowerCase()}`}></span></div>)}</div><div className="claim-orbit">{claims.map((c,i)=><button key={c.id} className={`claim-node ${c.type.toLowerCase()}`} style={{'--i':i}} title={c.claim}>{i+1}<span>{c.type}</span></button>)}</div><div className="graph-center"><Network size={19}/><b>{claims.length}</b><small>claims</small></div></div></section>}

function SourceReader({abstract,pack,open,setOpen,focusedClaim}){const highlighted=pack?.claims?.find(c=>c.id===focusedClaim);return <section className={`card source-reader ${open?'open':''}`}><button className="reader-toggle" onClick={()=>setOpen(!open)}><div><div className="overline">SOURCE READER</div><h2>See the <em>evidence.</em></h2></div><span>{open?'Hide':'Show'} source <ChevronDown size={15} className={open?'rot':''}/></span></button>{open&&<div className="source-text">{sentences(abstract).map((s,i)=>{const hot=highlighted?.anchor&&s.toLowerCase().includes(highlighted.anchor.slice(0,45).toLowerCase());return <p key={i} className={hot?'hot':''}><span>{String(i+1).padStart(2,'0')}</span>{s}</p>})}</div>}</section>}
function EmptyLaunch({onDemo}){return <section className="empty-hero card"><div className="empty-visual"><div className="empty-core"><BrainCircuit size={31}/></div><span className="orb o1"/><span className="orb o2"/><span className="orb o3"/></div><div><div className="overline">NO PAPER YET</div><h2>Your abstract is the <em>source of truth.</em></h2><p>Load the prepared benchmark to see the complete flow: source → study DNA → evidence brief → numeric lock → boundary layer → evidence graph.</p><div className="feature-chips"><span><Fingerprint size={13}/> Study DNA</span><span><Quote size={13}/> Claim anchors</span><span><BarChart3 size={13}/> Numeric lock</span><span><Scale size={13}/> Boundary guard</span></div><button className="primary-btn" onClick={onDemo}><Play size={14} fill="currentColor"/> Launch full demo</button></div></section>}

function Radar({query,setQuery,searchLiterature,searching,results,selected,toggleSelected,compileBatch,batchLoading,useQuick}){return <main className="page radar-page"><section className="page-hero"><div><div className="eyebrow"><span className="pulse-dot"/> LIVE LITERATURE RADAR</div><h1>Find the papers.<br/><em>Then compare the frames.</em></h1><p>Search public scholarly metadata and abstracts across PubMed, Europe PMC, and Crossref. Records are deduplicated before selection.</p></div><div className="radar-mark"><Globe2 size={23}/><span>3-source retrieval</span><b>{results.length||0}</b><small>records</small></div></section><section className="search-rail card"><div className="search-box"><Search size={18}/><input value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')searchLiterature(query)}} placeholder="e.g. randomized trial hypertension blood pressure adults"/><button onClick={()=>searchLiterature(query)} disabled={searching}>{searching?<span className="spinner small"/>:<ArrowRight size={15}/>}</button></div><div className="quick-row">{['hypertension randomized trial','machine learning ECG','diabetes lifestyle intervention','breast cancer screening'].map(q=><button key={q} onClick={()=>useQuick(q)}>{q}</button>)}</div></section>{selected.length>0&&<div className="selection-bar card"><div><b>{selected.length}</b> studies staged for synthesis.<span>Keep the corpus small enough to inspect.</span></div><button className="primary-btn compact" onClick={compileBatch} disabled={batchLoading}>{batchLoading?<span className="spinner"/>:<GitBranch size={14}/>} Build evidence matrix <ArrowRight size={13}/></button></div>}{results.length===0?<div className="radar-empty card"><div className="empty-visual small"><div className="empty-core"><Globe2 size={24}/></div></div><div><div className="overline">SEARCH EXAMPLE</div><h2>Try a question, not a keyword soup.</h2><p>Search can become a reusable literature workflow: retrieve → shortlist → compile → compare.</p><div className="example-query"><span>“Does lifestyle intervention improve glycemic control in recently diagnosed type 2 diabetes?”</span></div></div></div>:<div className="paper-grid">{results.map(p=><PaperCard key={p.id} paper={p} selected={selected.some(s=>same(s,p))} toggle={()=>toggleSelected(p)}/>)}</div>}</main>}
function same(a,b){return (a.pmid&&b.pmid&&a.pmid===b.pmid)||(a.doi&&b.doi&&a.doi.toLowerCase()===b.doi.toLowerCase())||a.id===b.id}
function PaperCard({paper,selected,toggle}){return <article className={`paper-card card ${selected?'picked':''}`}><button className="select-circle" onClick={toggle}>{selected?<Check size={13}/>:<Plus size={13}/>}</button><div className="paper-top"><span className="source-pill">{paper.source}</span>{paper.year&&<span>{paper.year}</span>}{paper.citationCount>0&&<span>{paper.citationCount} cites</span>}{paper.openAccess&&<span>OA</span>}</div><h3>{paper.title}</h3><p className="authors">{paper.authors||'Author list unavailable'} {paper.journal&&<><b>·</b> {paper.journal}</>}</p><p className="paper-abstract">{paper.abstract||'No abstract available. This record can still be inspected as metadata.'}</p><div className="paper-bottom"><span>{paper.pmid?`PMID ${paper.pmid}`:paper.doi?paper.doi:'No identifier'}</span>{paper.url&&<a href={paper.url} target="_blank" rel="noreferrer">Open source <ExternalLink size={11}/></a>}</div></article>}

function ComparePage({batch,compare,selected}){const items=batch.filter(x=>x.summary);return <main className="page compare-page"><section className="page-hero"><div><div className="eyebrow"><span className="pulse-dot"/> CROSS-PAPER SYNTHESIS</div><h1>Evidence <em>Matrix.</em></h1><p>Compare study frames before comparing conclusions. MedScope flags population, endpoint, intervention and direction differences without selecting a winner.</p></div><div className="compare-badge"><GitBranch size={15}/>{items.length||selected.length} studies</div></section>{items.length<2?<div className="empty-hero card"><div className="empty-visual"><div className="empty-core"><GitBranch size={30}/></div></div><div><div className="overline">MATRIX EMPTY</div><h2>Stage two or more papers from Literature Radar.</h2><p>Select a small set, compile them, and this screen becomes a visual comparison of their evidence frames.</p></div></div>:<><div className="compare-callout card"><div className="callout-icon"><Scale size={18}/></div><div><span className="overline">SYNTHESIS RULE</span><h3>Different wording ≠ contradictory evidence.</h3><p>{compare?.synthesis}</p></div></div><div className="matrix-wrap card"><table><thead><tr><th>DIMENSION</th>{items.map((x,i)=><th key={i}><span>{x.title?.slice(0,58)||`Study ${i+1}`}</span><small>{x.pmid||x.doi||'Identifier unavailable'}</small></th>)}</tr></thead><tbody>{['design','population','intervention','comparator','outcomes','limitations','confidence'].map(field=><tr key={field}><th>{labelFor(field)}</th>{items.map((x,i)=><td key={i}>{Array.isArray(x.summary?.[field])?x.summary[field].slice(0,2).map((v,j)=><div key={j} className="table-bullet">{v}</div>):x.summary?.[field]||'Not stated in the abstract.'}</td>)}</tr>)}</tbody></table><div className="matrix-footer"><ShieldCheck size={13}/><span>Descriptive comparison only. Inspect full text before concluding that two studies truly conflict.</span></div></div><div className="compare-insights">{(compare?.contextDifferences||[]).map((x,i)=><Insight key={'c'+i} icon={Layers3} title="Context difference" text={x}/>) }{(compare?.apparentDisagreements||[]).map((x,i)=><Insight key={'d'+i} icon={TriangleAlert} title="Possible disagreement" text={x}/>) }{(compare?.sharedSignals||[]).map((x,i)=><Insight key={'s'+i} icon={Check} title="Shared signal" text={x}/>)}</div></>}</main>}
function Insight({icon:Icon,title,text}){return <article className="insight card"><Icon size={16}/><div><b>{title}</b><p>{text}</p></div></article>}
function labelFor(k){return ({design:'Study design',population:'Population',intervention:'Intervention / exposure',comparator:'Comparator',outcomes:'Key outcomes',limitations:'Limitations',confidence:'Synthesis confidence'})[k]}

function LedgerPage({pack,abstract,focusedClaim,setFocusedClaim}){if(!pack)return <main className="page pad-page"><EmptyPage icon={ClipboardCheck} title="Claim Ledger is empty" text="Compile an abstract first. Each important statement will become an auditable claim with a source phrase."/></main>;const claims=pack.claims||[];const active=claims.find(c=>c.id===focusedClaim)||claims[0];return <main className="page ledger-page"><section className="page-hero"><div><div className="eyebrow"><span className="pulse-dot"/> TRACEABILITY LAYER</div><h1>Claim <em>Ledger.</em></h1><p>Atomic claims let a reviewer inspect evidence without rereading the entire abstract.</p></div><div className="ledger-stat"><b>{claims.length}</b><span>claims surfaced</span></div></section><div className="ledger-layout"><section className="card ledger-list"><div className="card-head"><div><div className="overline">AUDIT TABLE</div><h3>Claim inventory</h3></div><span className="source-badge"><ShieldCheck size={12}/> every claim is source-linked</span></div>{claims.map(c=><button className={`ledger-row ${c.id===focusedClaim?'active':''}`} key={c.id} onClick={()=>setFocusedClaim(c.id)}><span className={`claim-index ${c.type.toLowerCase()}`}>{c.id.replace('c','')}</span><div><p>{c.claim}</p><small><b>{c.type}</b> · {c.strength} support · [{c.source}]</small></div><ArrowRight size={14}/></button>)}</section><ClaimInspector claim={active} abstract={abstract}/></div></main>}
function ClaimInspector({claim,abstract}){if(!claim)return null;const source=sentences(abstract).find(s=>s.toLowerCase().includes((claim.anchor||'').slice(0,45).toLowerCase()))||claim.anchor||'Source anchor unavailable.';return <section className="card claim-inspector"><div className="overline">INSPECTING {claim.id}</div><div className="inspector-tags"><span className={`tag ${claim.type.toLowerCase()}`}>{claim.type}</span><span className="strength-tag">{claim.strength} support</span></div><h2>{claim.claim}</h2><div className="anchor-card"><div className="anchor-head"><Quote size={13}/><span>[{claim.source}] exact source phrase</span></div><blockquote>{source}</blockquote></div><div className="inspector-columns"><div><span>CLASSIFICATION</span><p>{claim.type==='Boundary'?'Boundary — the abstract limits the inference.':'Observed statement — the source explicitly reports this result or safety signal.'}</p></div><div><span>SAFE READ</span><p>Keep the study population, endpoint, time horizon, qualifiers, and effect direction attached to this claim.</p></div></div></section>}

function HistoryPage({history,reopen,clearHistory}){return <main className="page pad-page"><section className="page-hero"><div><div className="eyebrow"><span className="pulse-dot"/> LOCAL MEMORY</div><h1>Analysis <em>History.</em></h1><p>Stored only in this browser. No server-side patient database is used by the demo.</p></div>{history.length>0&&<button className="ghost-btn" onClick={clearHistory}><X size={14}/>Clear history</button>}</section>{history.length===0?<EmptyPage icon={History} title="No analyses yet" text="Your compiled evidence briefs will appear here."/>:<div className="history-grid">{history.map((x,i)=><article className="card history-card" key={x.id||i}><div className="history-top"><span className="source-pill">{x.provider==='openai'?'OPENAI':'LOCAL'}</span><time>{new Date(x.createdAt).toLocaleString()}</time></div><h3>{x.title}</h3><p>{x.summary?.executive}</p><div className="history-footer"><span>{x.pmid}</span><span>{x.wordCount} source words</span><button className="text-btn" onClick={()=>reopen(x)}>Reopen <ArrowRight size={12}/></button></div></article>)}</div>}</main>}

function BenchmarkPage({benchmark,loading,run}){return <main className="page pad-page"><section className="page-hero"><div><div className="eyebrow"><span className="pulse-dot"/> QUALITY / REGRESSION</div><h1>Benchmark <em>Lab.</em></h1><p>Judge the guardrails, not a made-up “medical accuracy” badge. The suite stress-tests number preservation, missingness, uncertainty, and prompt-injection resistance.</p></div><button className="primary-btn compact" onClick={run} disabled={loading}>{loading?<><span className="spinner"/>Running…</>:<><TestTube2 size={15}/>Run regression</>}</button></section>{!benchmark?<div className="empty-hero card"><div className="empty-visual"><div className="empty-core"><FlaskConical size={30}/></div></div><div><div className="overline">4 SYNTHETIC CASES</div><h2>Show judges that the guardrails are testable.</h2><p>Included cases exercise quantitative lock, missing-field honesty, boundary preservation, and hostile prompt text inside the source.</p><button className="primary-btn" onClick={run}><Play size={14} fill="currentColor"/>Run suite</button></div></div>:<><div className="bench-kpis"><BenchKpi label="REGRESSION SCORE" value={`${benchmark.overall}%`} note="deterministic preservation checks"/><BenchKpi label="CASES" value={benchmark.results.length} note="synthetic + reproducible"/><BenchKpi label="NOT CLAIMED" value="Clinical truth" note="requires expert-labeled validation"/></div><div className="bench-list card">{benchmark.results.map(r=><div className="bench-row" key={r.id}><div className="bench-score">{r.score}<small>%</small></div><div className="bench-copy"><div className="overline">{r.id}</div><h3>{r.name}</h3><p>{r.purpose}</p><div className="bench-checks">{r.checks.map((c,i)=><span key={i} className={c.pass?'pass':'fail'}>{c.pass?<Check size={10}/>:<X size={10}/>} {c.text}</span>)}</div></div></div>)}</div><div className="method-note card"><ShieldCheck size={14}/><span>{benchmark.method}</span></div></>}</main>}
function BenchKpi({label,value,note}){return <div className="card bench-kpi"><span>{label}</span><b>{value}</b><small>{note}</small></div>}

function SettingsPage({health}){return <main className="page pad-page"><section className="page-hero"><div><div className="eyebrow"><span className="pulse-dot"/> SYSTEM ARCHITECTURE</div><h1>System <em>& API.</em></h1><p>Built so the demo works offline, then scales into an evidence-intelligence SaaS.</p></div></section><div className="system-grid"><SystemCard icon={BrainCircuit} title="OpenAI Responses API" text="Optional server-side model layer. Structured JSON output plugs directly into the evidence object; the browser never needs the platform secret." status={health?.aiConfigured?'Connected':'Optional · local engine active'}/><SystemCard icon={Database} title="PubMed + Europe PMC" text="Public retrieval endpoints provide identifiers, metadata, abstracts, and links. Results are deduplicated before staging." status="3-source literature layer"/><SystemCard icon={BookOpen} title="Crossref metadata" text="DOI-based enrichment and bibliographic lookup strengthen the provenance layer without requiring a second secret." status="Public metadata"/><SystemCard icon={ShieldCheck} title="Privacy boundary" text="The prototype is designed for public abstracts and synthetic inputs. Do not paste protected health information." status="No patient database"/><SystemCard icon={TestTube2} title="Regression harness" text="Synthetic cases test numeric fidelity, missingness, uncertainty, and source-injection resistance." status="Deterministic"/><SystemCard icon={Network} title="Evidence object" text="Claim → source span → evidence type → boundary → integrity vector. That object is the platform primitive." status="Core architecture"/></div><div className="architecture-card card"><div className="overline">WHY THIS CAN BECOME A PRODUCT</div><h2>Don't build another summarizer. Build the <em>evidence layer.</em></h2><div className="arch-flow"><span>Retrieval</span><i>→</i><span>Normalization</span><i>→</i><span>Evidence compiler</span><i>→</i><span>Drift guard</span><i>→</i><span>Compare</span><i>→</i><span>Decision surface</span></div><p>Future extensions can add full-text OA ingestion, expert adjudication, team workspaces, versioned evidence snapshots, literature alerts, citation graphs, and an RAG layer without changing the evidence-object interface.</p></div></main>}
function SystemCard({icon:Icon,title,text,status}){return <article className="card system-card"><div className="system-icon"><Icon size={17}/></div><div><h3>{title}</h3><p>{text}</p><span><i/>{status}</span></div></article>}
function EmptyPage({icon:Icon,title,text}){return <div className="empty-hero card"><div className="empty-visual"><div className="empty-core"><Icon size={30}/></div></div><div><div className="overline">MEDSCOPE WORKSPACE</div><h2>{title}</h2><p>{text}</p></div></div>}

function PresentationMode({close,pack,abstract,integrity,onDemo,compile}){return <div className="presentation"><div className="presentation-top"><div><span className="brand-mini">MEDSCOPE</span><b>· judge mode</b></div><button className="icon-btn" onClick={close}><X size={17}/></button></div><div className="presentation-inner"><div className="present-copy"><div className="eyebrow"><span className="pulse-dot"/> 90-SECOND DEMO PATH</div><h1>From a raw abstract<br/><em>to an evidence graph.</em></h1><p>MedScope's differentiator is not “AI writes summaries.” It is that the summary is compiled into an inspectable evidence object that can be audited, compared, and challenged.</p><div className="present-steps"><PresentStep n="01" t="Ingest" d="Raw abstract + metadata" active/><PresentStep n="02" t="Compile" d="PICO + claims + numbers + boundaries"/><PresentStep n="03" t="Audit" d="Source anchors + drift guard + integrity vector"/></div><div className="present-actions"><button className="primary-btn" onClick={onDemo}>Load benchmark</button><button className="ghost-btn light" onClick={compile} disabled={!abstract.trim()}>Compile now <ArrowRight size={14}/></button></div></div><div className="present-card"><div className="present-score"><div className="ring" style={{'--p':`${integrity?.score||0}%`}}><div><b>{integrity?.score||'—'}</b><span>integrity</span></div></div><div><span>Evidence object</span><b>{pack?.claims?.length||0} claims</b><small>{pack?'source-linked':'waiting for demo'}</small></div></div><div className="present-node"><div className="present-source"><Database size={18}/>S1</div><div className="present-lines">{(pack?.claims||[{id:1},{id:2},{id:3},{id:4}]).slice(0,4).map((_,i)=><i key={i} style={{'--i':i}}/>)}</div><div className="present-claims">{(pack?.claims||[{id:1},{id:2},{id:3},{id:4}]).slice(0,4).map((c,i)=><span key={i}>{i+1}</span>)}</div><div className="present-caption">source → claims → boundaries → export</div></div></div></div></div>}
function PresentStep({n,t,d,active}){return <div className={active?'active':''}><span>{n}</span><div><b>{t}</b><small>{d}</small></div></div>}

function HeroConstellation({pack}){const n=pack?.claims?.length||0;return <div className="hero-visual"><div className="visual-glow"/><div className="hero-source"><Database size={18}/><span>S1</span><small>source</small></div><div className="hero-lines">{Array.from({length:7}).map((_,i)=><i key={i} style={{'--i':i}} className={i<n?'lit':''}/>)}</div><div className="hero-orbit">{Array.from({length:7}).map((_,i)=><span key={i} style={{'--i':i}} className={i<n?'lit':''}>{i+1}</span>)}</div><div className="hero-center"><Fingerprint size={18}/><b>{n||'—'}</b><small>claims</small></div><div className="visual-caption"><Sparkles size={12}/> evidence object</div></div>}
function sentences(text=''){return String(text).replace(/\s+/g,' ').split(/(?<!\d)(?<=[.!?])\s+(?=[A-Z0-9])/).map(s=>s.trim()).filter(Boolean)}
function parse(v,fallback){try{return v?JSON.parse(v):fallback}catch{return fallback}}
function slug(s){return String(s).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'').slice(0,70)||'medscope-export'}
function download(text,name,type){const blob=new Blob([text],{type});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),800)}

createRoot(document.getElementById('root')).render(<App/>);
