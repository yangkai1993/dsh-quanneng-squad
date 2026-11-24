// src/cli.js — start the whole gateway locally.
import { createGateway } from './gateway.js';
const g = createGateway({ withInbound: true });
const ports = await g.start();
console.log('SN26 gateway up:', JSON.stringify(ports));
console.log('north:  http://127.0.0.1:' + ports.north + '/health   (Bearer LOCAL_DEV_TOKEN)');
console.log('mock:   http://127.0.0.1:' + ports.mock + '/api/trans.do');
console.log('inbound:http://127.0.0.1:' + ports.inbound + '/cert/upget');
const stop = async () => { await g.stop(); process.exit(0); };
process.on('SIGINT', stop); process.on('SIGTERM', stop);
