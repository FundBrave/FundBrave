export interface ChainConfig {
  chainId: number;
  name: string;
  rpcUrl: string;
  explorerUrl: string;
  nativeSymbol: string;
  isTestnet: boolean;
}

/** All chains the platform knows about. Enabled set comes from ENABLED_CHAIN_IDS. */
export const CHAINS: Record<number, Omit<ChainConfig, 'rpcUrl'> & { rpcEnvVar: string; defaultRpc: string }> = {
  84532: {
    chainId: 84532,
    name: 'Base Sepolia',
    rpcEnvVar: 'BASE_SEPOLIA_RPC_URL',
    defaultRpc: 'https://sepolia.base.org',
    explorerUrl: 'https://sepolia.basescan.org',
    nativeSymbol: 'ETH',
    isTestnet: true,
  },
  11155111: {
    chainId: 11155111,
    name: 'Sepolia',
    rpcEnvVar: 'SEPOLIA_RPC_URL',
    defaultRpc: 'https://ethereum-sepolia-rpc.publicnode.com',
    explorerUrl: 'https://sepolia.etherscan.io',
    nativeSymbol: 'ETH',
    isTestnet: true,
  },
  8453: {
    chainId: 8453,
    name: 'Base',
    rpcEnvVar: 'BASE_RPC_URL',
    defaultRpc: 'https://mainnet.base.org',
    explorerUrl: 'https://basescan.org',
    nativeSymbol: 'ETH',
    isTestnet: false,
  },
  1: {
    chainId: 1,
    name: 'Ethereum',
    rpcEnvVar: 'ETHEREUM_RPC_URL',
    defaultRpc: 'https://eth.llamarpc.com',
    explorerUrl: 'https://etherscan.io',
    nativeSymbol: 'ETH',
    isTestnet: false,
  },
  137: {
    chainId: 137,
    name: 'Polygon',
    rpcEnvVar: 'POLYGON_RPC_URL',
    defaultRpc: 'https://polygon-rpc.com',
    explorerUrl: 'https://polygonscan.com',
    nativeSymbol: 'POL',
    isTestnet: false,
  },
  42161: {
    chainId: 42161,
    name: 'Arbitrum',
    rpcEnvVar: 'ARBITRUM_RPC_URL',
    defaultRpc: 'https://arb1.arbitrum.io/rpc',
    explorerUrl: 'https://arbiscan.io',
    nativeSymbol: 'ETH',
    isTestnet: false,
  },
};

export const configuration = () => {
  const enabledChainIds = (process.env.ENABLED_CHAIN_IDS ?? '84532,11155111')
    .split(',')
    .map((s) => parseInt(s.trim(), 10))
    .filter((id) => id in CHAINS);

  const chains: ChainConfig[] = enabledChainIds.map((id) => {
    const c = CHAINS[id];
    return {
      chainId: c.chainId,
      name: c.name,
      rpcUrl: process.env[c.rpcEnvVar] ?? c.defaultRpc,
      explorerUrl: c.explorerUrl,
      nativeSymbol: c.nativeSymbol,
      isTestnet: c.isTestnet,
    };
  });

  const port = parseInt(process.env.PORT ?? '4000', 10);
  const nodeEnv = process.env.NODE_ENV ?? 'development';

  return {
    port,
    nodeEnv,
    /** Public base URL of this API (used to build dev upload URLs). */
    apiBaseUrl: process.env.PUBLIC_API_URL ?? `http://localhost:${port}`,
    cors: {
      origin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
    },
    webhookBaseUrl: process.env.WEBHOOK_BASE_URL ?? '',
    databaseUrl: process.env.DATABASE_URL,
    privy: {
      appId: process.env.PRIVY_APP_ID ?? '',
      appSecret: process.env.PRIVY_APP_SECRET ?? '',
    },
    chains: {
      defaultChainId: parseInt(process.env.DEFAULT_CHAIN_ID ?? '84532', 10),
      enabled: chains,
    },
    safe: {
      rootAdminAddress: process.env.ROOT_ADMIN_ADDRESS ?? '',
      relayerPrivateKey: process.env.RELAYER_PRIVATE_KEY ?? '',
    },
    donations: {
      moralisApiKey: process.env.MORALIS_API_KEY ?? '',
      moralisStreamSecret: process.env.MORALIS_STREAM_SECRET ?? '',
      coingeckoApiKey: process.env.COINGECKO_API_KEY ?? '',
      confirmations: parseInt(process.env.DONATION_CONFIRMATIONS ?? '5', 10),
    },
    aws: {
      region: process.env.AWS_REGION ?? 'us-east-1',
      accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? '',
      s3Bucket: process.env.S3_BUCKET ?? '',
      s3PublicUrl: process.env.S3_PUBLIC_URL ?? '',
    },
    uploads: {
      /** When S3 is unconfigured in development, store media on local disk. */
      devFallback: nodeEnv !== 'production',
      localDir: process.env.UPLOADS_DIR ?? 'dev-uploads',
    },
    email: {
      resendApiKey: process.env.RESEND_API_KEY ?? '',
      from: process.env.EMAIL_FROM ?? 'FundBrave <no-reply@localhost>',
    },
    admin: {
      rootAdminEmail: process.env.ROOT_ADMIN_EMAIL ?? '',
    },
  };
};

export type AppConfig = ReturnType<typeof configuration>;
