import { XMLParser } from 'fast-xml-parser';

const BASE = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';
const parser = new XMLParser({ ignoreAttributes:false, removeNSPrefix:true, trimValues:true });
const arr = x => x == null ? [] : Array.isArray(x) ? x : [x];
const text = x => typeof x === 'string' ? x : x?.['#text'] || '';
const clean = s => String(s||'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();

function apiParams(extra={}) {
  const p = new URLSearchParams({tool:process.env.NCBI_TOOL||'medscope-ai',email:process.env.NCBI_EMAIL||'unset@example.com',...extra});
  if (process.env.NCBI_API_KEY) p.set('api_key', process.env.NCBI_API_KEY);
  return p;
}

async function ncbi(path, params) {
  const url = `${BASE}/${path}?${apiParams(params)}`;
  const res = await fetch(url, {headers:{'User-Agent':'MedScope-AI/3.0 (medical-literature-prototype)'}});
  if (!res.ok) throw new Error(`NCBI returned HTTP ${res.status}`);
  return res.text();
}

export async function searchPubMed(query, limit=12) {
  const capped = Math.min(Math.max(Number(limit)||12,1),20);
  const xml = await ncbi('esearch.fcgi',{db:'pubmed',term:query,retmode:'xml',retmax:String(capped),sort:'relevance'});
  const data = parser.parse(xml);
  const ids = arr(data?.eSearchResult?.IdList?.Id).map(text).filter(Boolean);
  if (!ids.length) return [];
  const recordXml = await ncbi('efetch.fcgi',{db:'pubmed',id:ids.join(','),retmode:'xml'});
  return parsePubMedXml(recordXml);
}

export async function getPubMedById(pmid) {
  const recordXml = await ncbi('efetch.fcgi',{db:'pubmed',id:String(pmid),retmode:'xml'});
  return parsePubMedXml(recordXml)[0] || null;
}

export function parsePubMedXml(xml) {
  const data = parser.parse(xml);
  const articles = arr(data?.PubmedArticleSet?.PubmedArticle);
  return articles.map(article => {
    const med = article.MedlineCitation || {};
    const pmid = text(med.PMID);
    const citation = med.Article || {};
    const abstractParts = arr(citation.Abstract?.AbstractText).map(x => typeof x === 'object' ? `${x.Label ? `${x.Label}: ` : ''}${text(x)}` : text(x)).filter(Boolean);
    const authors = arr(citation.AuthorList?.Author).slice(0,10).map(a => `${text(a.ForeName)} ${text(a.LastName)}`.trim() || text(a.CollectiveName)).filter(Boolean).join(', ');
    const ids = arr(article.PubmedData?.ArticleIdList?.ArticleId);
    const doi = ids.find(x => x?.['@_IdType']==='doi');
    const pmcid = ids.find(x => x?.['@_IdType']==='pmc');
    const pubTypes = arr(citation.PublicationTypeList?.PublicationType).map(text).filter(Boolean);
    const mesh = arr(med.MeshHeadingList?.MeshHeading).slice(0,12).map(x=>text(x.DescriptorName)).filter(Boolean);
    return {
      id:`pubmed-${pmid}`, source:'PubMed', pmid, pmcid:pmcid?text(pmcid):'',
      title:clean(text(citation.ArticleTitle)), authors, journal:clean(text(citation.Journal?.Title)),
      year:text(citation.Journal?.JournalIssue?.PubDate?.Year)||text(citation.ArticleDate?.Year),
      abstract:clean(abstractParts.join(' ')), doi:doi?text(doi):'', publicationTypes:pubTypes, mesh,
      url:`https://pubmed.ncbi.nlm.nih.gov/${pmid}/`
    };
  }).filter(r=>r.title);
}
