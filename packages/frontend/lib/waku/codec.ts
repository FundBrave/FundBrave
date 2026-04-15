/**
 * Waku Encoder/Decoder factory
 *
 * The Waku SDK's node.createDecoder() crashes when networkConfig isn't initialized.
 * The standalone createDecoder() needs routingInfo which requires networkConfig.
 *
 * This module creates decoders/encoders using the low-level SDK API with
 * the default network config (auto-sharding, clusterId=1, 8 shards).
 */

let _createDecoder: ((contentTopic: string, routingInfo: unknown) => unknown) | null = null;
let _createEncoder: ((params: { contentTopic: string; routingInfo: unknown; ephemeral?: boolean }) => unknown) | null = null;
let _createRoutingInfo: ((networkConfig: unknown, options: { contentTopic?: string }) => unknown) | null = null;
let _defaultNetworkConfig: unknown = null;

async function ensureImports() {
  if (_createDecoder) return;

  // Everything is re-exported from @waku/sdk
  const sdk = await import('@waku/sdk');

  _createDecoder = sdk.createDecoder as unknown as typeof _createDecoder;
  _createEncoder = sdk.createEncoder as unknown as typeof _createEncoder;
  _createRoutingInfo = (sdk.utils as { createRoutingInfo: typeof _createRoutingInfo }).createRoutingInfo;
  _defaultNetworkConfig = (sdk as unknown as { DefaultNetworkConfig: unknown }).DefaultNetworkConfig;
}

/**
 * Create a Waku decoder for the given content topic.
 * Uses the default auto-sharding network config.
 */
export async function makeDecoder(contentTopic: string): Promise<unknown> {
  await ensureImports();
  const routingInfo = _createRoutingInfo!(_defaultNetworkConfig, { contentTopic });
  return _createDecoder!(contentTopic, routingInfo);
}

/**
 * Create a Waku encoder for the given content topic.
 * Uses the default auto-sharding network config.
 */
export async function makeEncoder(contentTopic: string, ephemeral = false): Promise<unknown> {
  await ensureImports();
  const routingInfo = _createRoutingInfo!(_defaultNetworkConfig, { contentTopic });
  return _createEncoder!({ contentTopic, routingInfo, ephemeral });
}
