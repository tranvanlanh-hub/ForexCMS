import { loadEnvFile } from 'node:process';
import { writeFileSync } from 'node:fs';
import { PrismaClient } from '@prisma/client';
loadEnvFile('.env.local');
const origin='https://content-hub-cms-preview.content-hub-stack.workers.dev';
const prisma=new PrismaClient();
const results=[];
function check(name,pass,detail){results.push({name,pass,detail});if(!pass)process.exitCode=1;}
async function get(path,headers={}){const r=await fetch(origin+path,{headers,redirect:'manual',signal:AbortSignal.timeout(30000)});return {r,text:await r.text()};}
try{
 const published=await prisma.contentItem.findMany({where:{status:'PUBLISHED',market:{status:'ACTIVE'}},include:{seoMetadata:true}});
 const sitemap=await get('/sitemap.xml');
 check('sitemap index',sitemap.r.status===200 && sitemap.text.includes(`<loc>${origin}/sitemaps/content-0.xml</loc>`),{status:sitemap.r.status});
 const chunk=await get('/sitemaps/content-0.xml');
 const locations=[...chunk.text.matchAll(/<loc>(.*?)<\/loc>/g)].map(m=>m[1]);
 check('sitemap content',chunk.r.status===200 && locations.length===published.filter(i=>i.seoMetadata?.robotsIndex!=='NOINDEX').length && locations.every(u=>u.startsWith(origin+'/')),{status:chunk.r.status,urls:locations.length});
 const home=await get('/');check('homepage',home.r.status===200,{status:home.r.status});
 const robots=await get('/robots.txt');check('robots',robots.r.status===200&&robots.text.includes(origin+'/sitemap.xml')&&robots.text.includes('/admin/'),{status:robots.r.status,body:robots.text});
 const admin=await get('/admin/content/');
 check('admin redirects to sign-in',admin.r.status===307&&admin.r.headers.get('location')?.includes('/admin/login/')&&admin.r.headers.get('cache-control')?.includes('no-store'),{status:admin.r.status});
 const login=await get('/admin/login/');
 check('admin sign-in page',login.r.status===200&&login.text.includes('Welcome back')&&login.r.headers.get('cache-control')?.includes('no-store'),{status:login.r.status});
 const pages=new Map();
 for(const i of published){
  const x=await get(i.canonicalPath);pages.set(i.id,x.text);
  const canonical=/<link\b(?=[^>]*rel="canonical")(?=[^>]*href="([^"]+)")[^>]*>/.exec(x.text)?.[1];
  check(i.canonicalPath,x.r.status===200&&canonical===origin+i.canonicalPath&&(x.text.match(/<h1[\s>]/g)||[]).length===1,{status:x.r.status,canonical});
 }
 const links=await prisma.internalLinkSuggestion.findMany({where:{status:'ACCEPTED'},include:{sourceContentItem:true,targetContentItem:true}});
 for(const link of links) check('rendered internal link '+link.targetContentItem.canonicalPath,pages.get(link.sourceContentItemId)?.includes(`href="${link.targetContentItem.canonicalPath}"`),{source:link.sourceContentItem.canonicalPath});
 const comparison=await get('/global/compare/exness-vs-samplefx/');
 check('comparison',comparison.r.status===200&&comparison.text.includes('SampleFX')&&comparison.text.includes('Exness'),{status:comparison.r.status});
 const draft=await get('/global/articles/ai-import-pilot-draft/');check('draft private',draft.r.status===404,{status:draft.r.status});
 const testDestination=process.env.DEMO_AFFILIATE_DESTINATION_URL;
 const affiliate=testDestination?await prisma.affiliateLink.findFirst({where:{status:'ACTIVE',destinationUrl:testDestination,broker:{status:'ACTIVE'},market:{code:'global',status:'ACTIVE'}}}):null;
 if(affiliate){
  const click=await get('/affiliate/click/'+affiliate.id+'/');
  check('affiliate test redirect',[302,307].includes(click.r.status)&&click.r.headers.get('location')===testDestination&&click.r.headers.get('cache-control')?.includes('no-store'),{status:click.r.status,destinationMatchesConfiguredTest:true,followed:false});
 }else results.push({name:'affiliate redirect',skipped:true,reason:'No matching configured test destination'});
}catch{check('smoke execution',false,'Request or database check failed; credentials and response bodies omitted.');}finally{await prisma.$disconnect();writeFileSync('openspec/changes/021-post-deploy-launch-checkpoints/smoke-results.json',JSON.stringify({at:new Date().toISOString(),origin,results},null,2)+'\n');console.log(JSON.stringify(results,null,2));}
