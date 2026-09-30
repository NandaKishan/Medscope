const BASE='https://www.ebi.ac.uk/europepmc/webservices/rest';
const clean=s=>String(s||'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();

async function epmc(url){
  const res=await fetch(url,{headers:{'User-Agent':'MedScope-AI/3.0'}});
  if(!res.ok) throw new Error(`Europe PMC returned HTTP ${res.status}`);
  return res.json();
}

export async function searchEuropePMC(query,limit=12){
  const capped=Math.min(Math.max(Number(limit)||12,1),20);
  const url=`${BASE}/search?query=${encodeURIComponent(query)}&format=json&resultType=core&pageSize=${capped}&sort=CITED desc`;
  const data=await epmc(url);
  return (data.resultList?.result||[]).map(r=>({
    id:`europepmc-${r.pmid||r.id}`, source:'Europe PMC', pmid:r.pmid||'', pmcid:r.pmcid||'',
    title:clean(r.title), authors:clean(r.authorString), journal:clean(r.journalTitle), year:r.pubYear||'',
    abstract:clean(r.abstractText), doi:r.doi||'', publicationTypes:Array.isArray(r.pubTypeList?.pubType)?r.pubTypeList.pubType:[],
    mesh:Array.isArray(r.meshHeadingList?.meshHeading)?r.meshHeadingList.meshHeading:[],
    citationCount:Number(r.citedByCount||0), openAccess:!!r.isOpenAccess,
    url:r.pmid?`https://pubmed.ncbi.nlm.nih.gov/${r.pmid}/`:`https://europepmc.org/article/${r.source||'MED'}/${r.id}`
  })).filter(r=>r.title);
}

export async function getEuropePMCById(id, source='MED') {
  const data=await epmc(`${BASE}/article/${encodeURIComponent(source)}/${encodeURIComponent(id)}?format=json&resultType=core`);
  const r=data.result || data;
  if(!r?.title) return null;
  return {id:`europepmc-${r.pmid||r.id}`,source:'Europe PMC',pmid:r.pmid||'',pmcid:r.pmcid||'',title:clean(r.title),authors:clean(r.authorString),journal:clean(r.journalTitle),year:r.pubYear||'',abstract:clean(r.abstractText),doi:r.doi||'',publicationTypes:r.pubTypeList?.pubType||[],mesh:r.meshHeadingList?.meshHeading||[],openAccess:!!r.isOpenAccess,url:r.pmid?`https://pubmed.ncbi.nlm.nih.gov/${r.pmid}/`:`https://europepmc.org/article/${r.source||source}/${r.id}`};
}
