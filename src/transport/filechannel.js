// src/transport/filechannel.js — A13: inline <=10M / SFTP-staged >10M, real crypto + staging.
import { gzipSync, gunzipSync } from 'node:zlib';
import { createHash, createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { b64, unb64 } from '../contract.js';
const IV=Buffer.alloc(16);
export function createFileChannel(cfg){
  const f=cfg.file||{}, limit=f.inlineLimitBytes??10*1024*1024, dir=resolve(f.sftpDir||'./.data/sftp');
  mkdirSync(dir,{recursive:true}); mkdirSync(join(dir,'remote'),{recursive:true});
  const daily=new Map(), n={inline:0,sftp:0,received:0};
  const keyFor=(mode)=>{if(mode==='inline')return{key:randomBytes(32),keyId:'PER_MSG_'+Date.now()+'_'+n.inline};const d=new Date().toISOString().slice(0,10);if(!daily.has(d))daily.set(d,{key:randomBytes(32),keyId:'DAILY_'+d});return daily.get(d);};
  const enc=(b,k)=>{const c=createCipheriv('aes-256-cbc',k,IV);return Buffer.concat([c.update(b),c.final()]);};
  const dec=(b,k)=>{const d=createDecipheriv('aes-256-cbc',k,IV);return Buffer.concat([d.update(b),d.final()]);};
  function send(payload,opts={}){
    const raw=Buffer.isBuffer(payload)?payload:Buffer.from(typeof payload==='string'?payload:JSON.stringify(payload),'utf8');
    const z=gzipSync(raw), mode=z.length<=limit?'inline':'sftp', {key,keyId}=keyFor(mode), e=enc(z,key);
    const m={mode,compressedBytes:z.length,originalBytes:raw.length,keyScope:mode==='inline'?'ONE_TIME_PER_MESSAGE':'ONE_PER_DAY',keyId,sha256:createHash('sha256').update(raw).digest('hex'),createdAt:new Date().toISOString(),cipher:'aes-256-cbc',iv:'16x00',compression:'gzip'};
    if(mode==='inline'){n.inline++;return{mode,body:b64(e),envelope:{...m,key:b64(key)},manifest:m};}
    n.sftp++; const name='batch_'+keyId+'_'+Date.now()+'.bin', local=join(dir,name); writeFileSync(local,e);
    const up=opts.upload||f.sftp?.upload||((lp,rp)=>{writeFileSync(join(dir,rp),readFileSync(lp));return join(dir,rp);});
    return{mode,localPath:local,remotePath:up(local,'remote/'+name),envelope:m,manifest:m,oneTimePerDay:true};
  }
  function receive(env,opts={}){
    let k; if(env.key)k=unb64(env.key); else if(env.keyScope==='ONE_PER_DAY')k=daily.get(env.keyId?.replace('DAILY_',''))?.key;
    if(!k)throw new Error('FileChannel: no decrypt key for '+env.keyId);
    const b=env.mode==='inline'?unb64(opts.body):readFileSync(env.localPath||env.remotePath);
    const raw=gunzipSync(dec(b,k));
    if(createHash('sha256').update(raw).digest('hex')!==env.sha256)throw new Error('FileChannel: sha256 mismatch');
    n.received++; return raw;
  }
  return{send,receive,stats:()=>({...n,dailyKeys:[...daily.keys()]}),sftpDir:dir};
}
