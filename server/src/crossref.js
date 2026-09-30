const BASE='https://api.crossref.org/works';
const clean=s=>String(s||'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();

export async function lookupDOI(doi) {
  const url=`${BASE}/${encodeURIComponent(String(doi).replace(/^https?:\/\/doi.org\//i,''))}`;
  const res=await fetch(url,{headers:{'User-Agent':`MedScope-AI/3.0 (mailto:${process.env.CROSSREF_MAILTO||'unset@example.com'})`}});
  if(!res.ok) throw new Error(`Crossref returned HTTP ${res.status}`);
  const item=(await res.json()).message;
  return normalizeCrossref(item);
}

export async function searchCrossref(query, limit=8) {
  const rows=Math.min(Math.max(Number(limit)||8,1),15);
  const url=`${BASE}?query.bibliographic=${encodeURIComponent(query)}&rows=${rows}&select=DOI,title,author,published,container-title,URL,type,is-referenced-by-count`;
  const res=await fetch(url,{headers:{'User-Agent':`MedScope-AI/3.0 (mailto:${process.env.CROSSREF_MAILTO||'unset@example.com'})`}});
  if(!res.ok) throw new Error(`Crossref returned HTTP ${res.status}`);
  const data=await res.json();
  return (data.message?.items||[]).map(normalizeCrossref).filter(x=>x.title);
}

function normalizeCrossref(r){
  return {id:`doi-${r.DOI||Math.random()}`,source:'Crossref',doi:r.DOI||'',title:clean(Array.isArray(r.title)?r.title[0]:r.title),authors:Array.isArray(r.author)?r.author.slice(0,8).map(a=>`${a.given||''} ${a.family||''}`.trim()).join(', '):'',journal:clean(Array.isArray(r['container-title'])?r['container-title'][0]:r['container-title']),year:r.published?.['date-parts']?.[0]?.[0]||'',abstract:clean(r.abstract),citationCount:Number(r['is-referenced-by-count']||0),publicationTypes:r.type?[r.type]:[],url:r.URL||(r.DOI?`https://doi.org/${r.DOI}`:'')};
}
