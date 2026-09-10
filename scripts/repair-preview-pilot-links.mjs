import { loadEnvFile } from 'node:process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { PrismaClient } from '@prisma/client';
loadEnvFile('.env.local');
const prisma = new PrismaClient();
// Explicit pilot-only editorial links, one new outgoing link per source.
const pairs = [
 ['global/articles/pips-lots-margin-leverage','global/articles/forex-risk-management-checklist'],
 ['global/articles/forex-risk-management-checklist','global/articles/pips-lots-margin-leverage'],
 ['global/guides/how-to-open-a-forex-trading-account','global/guides/how-to-verify-a-forex-broker'],
 ['global/guides/how-to-verify-a-forex-broker','global/broker-reviews/exness-review'],
 ['global/broker-reviews/exness-review','global/broker-reviews/samplefx-review'],
 ['global/broker-reviews/samplefx-review','global/articles/forex-trading-faq'],
 ['global/best-brokers/best-forex-brokers-for-beginners','global/best-brokers/best-forex-brokers-low-minimum-deposit'],
 ['global/best-brokers/best-forex-brokers-low-minimum-deposit','global/articles/forex-trading-basics'],
 ['vn/articles/pip-lot-va-don-bay-trong-forex','vn/articles/forex-la-gi'],
 ['vn/guides/cach-mo-tai-khoan-forex','vn/articles/pip-lot-va-don-bay-trong-forex'],
 ['vn/best-brokers/san-forex-uy-tin-cho-nguoi-moi','vn/broker-reviews/exness-review-vietnam'],
 ['vn/broker-reviews/exness-review-vietnam','vn/articles/cau-hoi-thuong-gap-ve-forex'],
 ['global/articles/forex-trading-faq','global/best-brokers/best-forex-brokers-for-beginners','best forex brokers for beginners'],
 ['vn/articles/cau-hoi-thuong-gap-ve-forex','vn/best-brokers/san-forex-uy-tin-cho-nguoi-moi','san forex uy tin'],
];
try {
 const items = await prisma.contentItem.findMany({where:{canonicalPath:{in:pairs.flatMap(([a,b])=>[a,b]).map(p=>`/${p}/`)}},include:{market:true}});
 const plans = pairs.map(([a,b,existingAnchor])=>{
  const source=items.find(i=>i.canonicalPath===`/${a}/`),target=items.find(i=>i.canonicalPath===`/${b}/`);
  if(!source||!target||source.status!=='PUBLISHED'||target.status!=='PUBLISHED'||source.marketId!==target.marketId||source.market.languageCode!==target.market.languageCode) throw new Error('Pilot scope validation failed');
  if(source.body.blocks || typeof source.body.markdown!=='string') throw new Error('Expected legacy pilot markdown only');
  const anchorText=existingAnchor||target.title;
  const note=source.market.languageCode==='vi'?`Doc them: ${anchorText}.`:`Further reading: ${anchorText}.`;
  let markdown=source.body.markdown.includes(note)?source.body.markdown:source.body.markdown.replace('\n## FAQ',`\n${note}\n\n## FAQ`);
  // FAQ-only pilots otherwise put this paragraph inside the summary block,
  // where contextual links are intentionally not rendered.
  if(existingAnchor && !markdown.includes('## Further reading')) markdown=markdown.replace(note,`## Further reading\n\n${note}`);
  if(!markdown.includes(note)) throw new Error('Expected FAQ insertion point missing');
  return {source,target,anchorText,body:{...source.body,markdown}};
 });
 console.log(JSON.stringify(plans.map(p=>({source:p.source.canonicalPath,target:p.target.canonicalPath,anchor:p.anchorText})),null,2));
 if(process.argv.includes('--apply')) {
  mkdirSync('backups/pilot-repair',{recursive:true});
  writeFileSync(`backups/pilot-repair/before-${Date.now()}.json`,JSON.stringify(items,null,2));
  await prisma.$transaction(async tx=>{
   for(const p of plans){
    const current=await tx.contentItem.findUniqueOrThrow({where:{id:p.source.id}});
    if(current.updatedAt.getTime()!==p.source.updatedAt.getTime()) throw new Error('Concurrent edit; aborting');
    if(JSON.stringify(current.body)!==JSON.stringify(p.body)){
     const last=await tx.contentRevision.aggregate({where:{contentItemId:current.id},_max:{revisionNumber:true}});
     await tx.contentItem.update({where:{id:current.id},data:{body:p.body}});
     await tx.contentRevision.create({data:{contentItemId:current.id,revisionNumber:(last._max.revisionNumber??0)+1,title:current.title,summary:current.summary,body:p.body,status:current.status,createdBy:'checkpoint-37-pilot-link-repair'}});
    }
    await tx.internalLinkSuggestion.upsert({where:{sourceContentItemId_targetContentItemId_anchorText:{sourceContentItemId:current.id,targetContentItemId:p.target.id,anchorText:p.anchorText}},update:{status:'ACCEPTED'},create:{sourceContentItemId:current.id,targetContentItemId:p.target.id,marketId:current.marketId,languageCode:p.source.market.languageCode,anchorText:p.anchorText,status:'ACCEPTED',reason:'Checkpoint 37: reviewed pilot further-reading link; same market and language.',score:50}});
   }
  },{timeout:30000});
  console.log(`Verified ${plans.length} reviewed pilot links; prior content snapshot saved under ignored backups/.`);
 } else console.log('Dry run: no database writes. Use --apply only for this preview pilot repair.');
} finally {await prisma.$disconnect();}
