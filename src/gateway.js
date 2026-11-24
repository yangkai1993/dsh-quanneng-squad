// src/gateway.js — composition root. Wires every layer into a runnable gateway.
import { loadConfig } from './config.js';
import { createProvider } from './crypto/provider.js';
import { createAdapter } from './protocol/adapter.js';
import { createUpstreamClient } from './transport/client.js';
import { createFileChannel } from './transport/filechannel.js';
import { createMemoryStores, createFileStores } from './core/store.js';
import { createOrchestrator } from './core/orchestrator.js';
import { createReconciler } from './core/reconcile.js';
import { createMetrics } from './observability/metrics.js';
import { createMockUp } from './mock/server.js';
import { createInbound } from './inbound/server.js';
import { createNorthServer } from './north/server.js';

export function createGateway(opts = {}) {
  const cfg = opts.cfg || loadConfig(opts.configOpts);
  // Hooks that let the Mock sandbox perform REAL signature verification and envelope decryption.
  const provider = createProvider(cfg);
  cfg._verifyInbound = (canon, sign, headers) => provider.verifyInbound(canon, sign, headers);
  cfg._sign = (canon) => provider.signAsUp(canon);
  cfg._decrypt = (env) => provider.decryptEncryptData(env);

  const adapter = createAdapter(cfg);
  const upstream = createUpstreamClient(cfg);
  const stores = opts.fileStoreDir ? createFileStores(opts.fileStoreDir) : createMemoryStores();
  const metrics = createMetrics(cfg);
  const reconciler = createReconciler(stores, cfg);
  const fileChannel = createFileChannel(cfg);
  const orchestrator = createOrchestrator({ cfg, provider, adapter, upstream, stores, metrics, reconciler });
  orchestrator.upstreamStats = () => upstream.stats();
  orchestrator.upstreamProbe = () => upstream.probe();

  let mock = null, inbound = null, north = null;
  async function start() {
    if (cfg.up.channel === 'mock') { mock = createMockUp(cfg); await mock.start(); }
    if (opts.withInbound !== false) { inbound = createInbound(cfg); await inbound.start(); }
    north = createNorthServer(cfg, orchestrator, stores, metrics, reconciler, fileChannel, provider);
    await north.start();
    return { north: north.port, mock: mock?.port ?? null, inbound: inbound?.port ?? null };
  }
  async function stop() {
    if (north) await north.stop(); if (inbound) await inbound.stop(); if (mock) await mock.stop();
    upstream.destroy();
  }
  return { cfg, provider, adapter, upstream, stores, metrics, reconciler, fileChannel, orchestrator,
    get mock() { return mock; }, get inbound() { return inbound; }, get north() { return north; },
    start, stop, snapshot: () => ({ metrics: metrics.snapshot(), alerts: metrics.evaluate() }) };
}
