// src/core/state.js
import { STATE, BIZ } from '../contract.js';
export const EVENT={QUERY_SALEABLE:'QUERY_SALEABLE',QUERY_NOT_SALEABLE:'QUERY_NOT_SALEABLE',OCCUPY_SUBMIT:'OCCUPY_SUBMIT',OCCUPY_OK:'OCCUPY_OK',OCCUPY_DUP:'OCCUPY_DUP',OCCUPY_FAIL:'OCCUPY_FAIL',RELEASE_SUBMIT:'RELEASE_SUBMIT',RELEASE_OK:'RELEASE_OK',RELEASE_FAIL:'RELEASE_FAIL',TIMEOUT:'TIMEOUT',UNKNOWN:'UNKNOWN',EXCEPTION:'EXCEPTION',RECON_DONE:'RECON_DONE'};
const T={[STATE.NEW]:{QUERY_SALEABLE:STATE.SALEABLE,QUERY_NOT_SALEABLE:STATE.NOT_SALEABLE,OCCUPY_SUBMIT:STATE.OCCUPYING},[STATE.SALEABLE]:{OCCUPY_SUBMIT:STATE.OCCUPYING,QUERY_NOT_SALEABLE:STATE.NOT_SALEABLE},[STATE.NOT_SALEABLE]:{QUERY_SALEABLE:STATE.SALEABLE},[STATE.OCCUPYING]:{OCCUPY_OK:STATE.OCCUPIED,OCCUPY_DUP:STATE.OCCUPIED_DUP,OCCUPY_FAIL:STATE.OCCUPY_FAILED,TIMEOUT:STATE.UNKNOWN,UNKNOWN:STATE.UNKNOWN,EXCEPTION:STATE.UNKNOWN},[STATE.OCCUPIED]:{RELEASE_SUBMIT:STATE.RELEASING},[STATE.OCCUPIED_DUP]:{RELEASE_SUBMIT:STATE.RELEASING},[STATE.OCCUPY_FAILED]:{OCCUPY_SUBMIT:STATE.OCCUPYING},[STATE.RELEASING]:{RELEASE_OK:STATE.RELEASED,RELEASE_FAIL:STATE.RELEASE_FAILED,TIMEOUT:STATE.UNKNOWN,UNKNOWN:STATE.UNKNOWN,EXCEPTION:STATE.UNKNOWN},[STATE.RELEASE_FAILED]:{RELEASE_SUBMIT:STATE.RELEASING},[STATE.UNKNOWN]:{RECON_DONE:STATE.PENDING_RECON},[STATE.PENDING_RECON]:{RECON_DONE:STATE.PENDING_RECON,OCCUPY_OK:STATE.OCCUPIED,RELEASE_OK:STATE.RELEASED}};
export const transition=(c,e)=>T[c]?.[e]??c;
const UK=new Set(['UNKNOWN','UNMAPPED','COMM_FAILURE','UP_UNAVAILABLE']);
export function applyResponse(current,normalized,bizMethod){const k=normalized.kind;let event=null,actionable={resend:false,reason:''};
 if(k==='COMM_FAILURE'){event=EVENT.TIMEOUT;actionable={resend:false,switchCenter:true,reason:'communication failure; retry another center with the SAME idemKey'};}
 else if(UK.has(k)||normalized.bizStatus==='EXCEPTION'){event=EVENT.UNKNOWN;actionable={resend:false,recon:true,reason:'result unknown -> PENDING_RECON + timed reconciliation'};}
 else if(k==='PENDING')actionable={resend:false,poll:true,reason:'processing; await async callback or query'};
 else if(k==='DUP_REQ'||k==='ORIG_NOT_FOUND')actionable={resend:true,keepPrimaryKey:true,reason:'retry with ORIGINAL transaction data and primary key unchanged'};
 else if(k==='SECURITY_REJECT'||k==='PARAM_INVALID')actionable={resend:false,reason:'do NOT blindly retry; fix sign/cert/params'};
 else if(k==='OK'){const b=String(normalized.bizStatus||'').toUpperCase();if(bizMethod===BIZ.query)event=b.includes('NOT')?EVENT.QUERY_NOT_SALEABLE:EVENT.QUERY_SALEABLE;else if(bizMethod===BIZ.occupancy)event=b==='DUP'?EVENT.OCCUPY_DUP:b==='FAIL'?EVENT.OCCUPY_FAIL:EVENT.OCCUPY_OK;else if(bizMethod===BIZ.release)event=b==='FAIL'?EVENT.RELEASE_FAIL:EVENT.RELEASE_OK;}
 else actionable={resend:false,reason:'business failure '+k};
 if(event===EVENT.UNKNOWN&&bizMethod===BIZ.occupancy)actionable.reason+='; NO occupancy-state query exists, so occupancy is NEVER auto-resent';
 let base=current;if(bizMethod===BIZ.occupancy&&event&&!T[base]?.[event])base=STATE.OCCUPYING;if(bizMethod===BIZ.release&&event&&!T[base]?.[event])base=STATE.RELEASING;
 return{state:event?transition(base,event):base,actionable,event};}
export const assertNoResend=(s,m)=>!(s===STATE.UNKNOWN&&m===BIZ.occupancy);
