import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  createPublicClient,
  createWalletClient,
  http,
  encodeFunctionData,
  encodeAbiParameters,
  erc20Abi,
  getContractAddress,
  hashTypedData,
  keccak256,
  concat,
  toHex,
  pad,
  type Address,
  type Hex,
  type PublicClient,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import type { ChainConfig } from '../../config/configuration';

/**
 * Canonical Safe v1.4.1 deployments — identical addresses on Ethereum,
 * Base, Polygon, Arbitrum, Sepolia and Base Sepolia (and most EVM chains).
 * https://github.com/safe-global/safe-deployments
 */
export const SAFE_PROXY_FACTORY: Address = '0x4e1DCf7AD4e460CfD30791CCC4F9c8a4f820ec67';
export const SAFE_L2_SINGLETON: Address = '0x29fcB43b46531BcA003ddC8FCB67FFE91900C762';
export const SAFE_FALLBACK_HANDLER: Address = '0xfd0732Dc9E303f09fCEf3a7388Ad10A83459Ec99';

const ZERO: Address = '0x0000000000000000000000000000000000000000';

const SETUP_ABI = [
  {
    type: 'function',
    name: 'setup',
    inputs: [
      { name: '_owners', type: 'address[]' },
      { name: '_threshold', type: 'uint256' },
      { name: 'to', type: 'address' },
      { name: 'data', type: 'bytes' },
      { name: 'fallbackHandler', type: 'address' },
      { name: 'paymentToken', type: 'address' },
      { name: 'payment', type: 'uint256' },
      { name: 'paymentReceiver', type: 'address' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
] as const;

const PROXY_CREATION_CODE_ABI = [
  {
    type: 'function',
    name: 'proxyCreationCode',
    inputs: [],
    outputs: [{ type: 'bytes' }],
    stateMutability: 'pure',
  },
] as const;

const CREATE_PROXY_ABI = [
  {
    type: 'function',
    name: 'createProxyWithNonce',
    inputs: [
      { name: '_singleton', type: 'address' },
      { name: 'initializer', type: 'bytes' },
      { name: 'saltNonce', type: 'uint256' },
    ],
    outputs: [{ name: 'proxy', type: 'address' }],
    stateMutability: 'nonpayable',
  },
] as const;

const SAFE_ABI = [
  {
    type: 'function',
    name: 'nonce',
    inputs: [],
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'execTransaction',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'value', type: 'uint256' },
      { name: 'data', type: 'bytes' },
      { name: 'operation', type: 'uint8' },
      { name: 'safeTxGas', type: 'uint256' },
      { name: 'baseGas', type: 'uint256' },
      { name: 'gasPrice', type: 'uint256' },
      { name: 'gasToken', type: 'address' },
      { name: 'refundReceiver', type: 'address' },
      { name: 'signatures', type: 'bytes' },
    ],
    outputs: [{ name: 'success', type: 'bool' }],
    stateMutability: 'payable',
  },
] as const;

export interface SafeTx {
  to: Address;
  value: bigint;
  data: Hex;
  operation: 0;
  safeTxGas: bigint;
  baseGas: bigint;
  gasPrice: bigint;
  gasToken: Address;
  refundReceiver: Address;
  nonce: bigint;
}

export interface SafeTypedData {
  domain: { chainId: number; verifyingContract: Address };
  types: {
    SafeTx: { name: string; type: string }[];
  };
  primaryType: 'SafeTx';
  message: Record<string, string>;
}

const SAFE_TX_TYPES = {
  SafeTx: [
    { name: 'to', type: 'address' },
    { name: 'value', type: 'uint256' },
    { name: 'data', type: 'bytes' },
    { name: 'operation', type: 'uint8' },
    { name: 'safeTxGas', type: 'uint256' },
    { name: 'baseGas', type: 'uint256' },
    { name: 'gasPrice', type: 'uint256' },
    { name: 'gasToken', type: 'address' },
    { name: 'refundReceiver', type: 'address' },
    { name: 'nonce', type: 'uint256' },
  ],
} as const;

/**
 * Computes counterfactual Safe 2-of-2 addresses (creator + root admin).
 * The proxy creation bytecode is read from the canonical factory on-chain
 * (correct by construction), then the CREATE2 address is derived locally.
 * Because factory, singleton, initializer and salt are identical on every
 * supported chain, the predicted address is identical on every chain.
 * Actual deployment is deferred to the first withdrawal (Phase 4).
 */
@Injectable()
export class SafeService {
  private readonly logger = new Logger(SafeService.name);
  private readonly chains: ChainConfig[];
  private readonly rootAdminAddress: string;
  private creationCodeCache: Hex | null = null;

  constructor(config: ConfigService) {
    this.chains = config.get<ChainConfig[]>('chains.enabled') ?? [];
    this.rootAdminAddress = config.get<string>('safe.rootAdminAddress') ?? '';
  }

  get isConfigured(): boolean {
    return /^0x[0-9a-fA-F]{40}$/.test(this.rootAdminAddress) && this.rootAdminAddress !== ZERO;
  }

  getRootAdminAddress(): Address {
    if (!this.isConfigured) {
      throw new ServiceUnavailableException(
        'ROOT_ADMIN_ADDRESS is not configured — campaign publishing is disabled',
      );
    }
    return this.rootAdminAddress as Address;
  }

  /** Fetch (and cache) the SafeProxy creation bytecode from the factory. */
  private async getProxyCreationCode(): Promise<Hex> {
    if (this.creationCodeCache) return this.creationCodeCache;
    let lastError: unknown;
    for (const chain of this.chains) {
      try {
        const client = createPublicClient({ transport: http(chain.rpcUrl) });
        const code = (await client.readContract({
          address: SAFE_PROXY_FACTORY,
          abi: PROXY_CREATION_CODE_ABI,
          functionName: 'proxyCreationCode',
        })) as Hex;
        this.creationCodeCache = code;
        return code;
      } catch (err) {
        lastError = err;
        this.logger.warn(`proxyCreationCode fetch failed on ${chain.name}: ${(err as Error).message}`);
      }
    }
    this.logger.error(`All RPCs failed fetching proxy creation code: ${String(lastError)}`);
    throw new ServiceUnavailableException('Could not reach any RPC to prepare the campaign wallet');
  }

  /** Deterministic setup() calldata for a 2-of-2 Safe. Owner order is normalized. */
  buildInitializer(creatorWallet: Address): Hex {
    const admin = this.getRootAdminAddress();
    const owners = [creatorWallet, admin].sort((a, b) =>
      a.toLowerCase() < b.toLowerCase() ? -1 : 1,
    );
    return encodeFunctionData({
      abi: SETUP_ABI,
      functionName: 'setup',
      args: [owners, 2n, ZERO, '0x', SAFE_FALLBACK_HANDLER, ZERO, 0n, ZERO],
    });
  }

  /** saltNonce derived from the campaign id (stable, collision-free). */
  saltNonceFor(campaignId: string): bigint {
    return BigInt(keccak256(toHex(campaignId)));
  }

  /**
   * Predict the CREATE2 address the canonical SafeProxyFactory would deploy to.
   * Mirrors SafeProxyFactory.createProxyWithNonce:
   *   salt = keccak256(keccak256(initializer) ++ saltNonce)
   *   deploymentData = proxyCreationCode ++ abi.encode(singleton)
   */
  async predictSafeAddress(creatorWallet: Address, campaignId: string): Promise<{
    safeAddress: Address;
    saltNonce: string;
  }> {
    const initializer = this.buildInitializer(creatorWallet);
    const saltNonce = this.saltNonceFor(campaignId);
    const creationCode = await this.getProxyCreationCode();

    const salt = keccak256(
      concat([keccak256(initializer), pad(toHex(saltNonce), { size: 32 })]),
    );
    const deploymentData = concat([
      creationCode,
      encodeAbiParameters([{ type: 'address' }], [SAFE_L2_SINGLETON]),
    ]);

    const safeAddress = getContractAddress({
      opcode: 'CREATE2',
      from: SAFE_PROXY_FACTORY,
      salt,
      bytecode: deploymentData,
    });

    return { safeAddress, saltNonce: saltNonce.toString() };
  }

  // ─── Execution layer (Phase 4) ────────────────────────────────

  chainConfig(chainId: number): ChainConfig {
    const chain = this.chains.find((c) => c.chainId === chainId);
    if (!chain) throw new ServiceUnavailableException(`Chain ${chainId} is not enabled`);
    return chain;
  }

  publicClient(chainId: number): PublicClient {
    return createPublicClient({ transport: http(this.chainConfig(chainId).rpcUrl) });
  }

  private relayerAccount() {
    const key = process.env.RELAYER_PRIVATE_KEY ?? '';
    if (!/^0x[0-9a-fA-F]{64}$/.test(key)) {
      throw new ServiceUnavailableException(
        'RELAYER_PRIVATE_KEY is not configured — withdrawals are disabled',
      );
    }
    return privateKeyToAccount(key as Hex);
  }

  async isDeployed(chainId: number, safeAddress: Address): Promise<boolean> {
    const code = await this.publicClient(chainId).getCode({ address: safeAddress });
    return code !== undefined && code !== '0x';
  }

  async getSafeNonce(chainId: number, safeAddress: Address): Promise<bigint> {
    if (!(await this.isDeployed(chainId, safeAddress))) return 0n;
    return this.publicClient(chainId).readContract({
      address: safeAddress,
      abi: SAFE_ABI,
      functionName: 'nonce',
    });
  }

  /** Build the SafeTx for a withdrawal (native or ERC-20 transfer). */
  buildWithdrawalTx(
    tokenAddress: Address | null,
    amountRaw: bigint,
    toAddress: Address,
    nonce: bigint,
  ): SafeTx {
    return {
      to: tokenAddress ?? toAddress,
      value: tokenAddress ? 0n : amountRaw,
      data: tokenAddress
        ? encodeFunctionData({
            abi: erc20Abi,
            functionName: 'transfer',
            args: [toAddress, amountRaw],
          })
        : '0x',
      operation: 0,
      safeTxGas: 0n,
      baseGas: 0n,
      gasPrice: 0n,
      gasToken: ZERO,
      refundReceiver: ZERO,
      nonce,
    };
  }

  /** EIP-712 typed data for wallet signing (Privy / wagmi signTypedData). */
  toTypedData(chainId: number, safeAddress: Address, tx: SafeTx): SafeTypedData {
    return {
      domain: { chainId, verifyingContract: safeAddress },
      types: { SafeTx: SAFE_TX_TYPES.SafeTx.map((t) => ({ ...t })) },
      primaryType: 'SafeTx',
      message: {
        to: tx.to,
        value: tx.value.toString(),
        data: tx.data,
        operation: String(tx.operation),
        safeTxGas: tx.safeTxGas.toString(),
        baseGas: tx.baseGas.toString(),
        gasPrice: tx.gasPrice.toString(),
        gasToken: tx.gasToken,
        refundReceiver: tx.refundReceiver,
        nonce: tx.nonce.toString(),
      },
    };
  }

  /** The digest owners sign — identical to what Safe verifies on-chain. */
  hashSafeTx(chainId: number, safeAddress: Address, tx: SafeTx): Hex {
    return hashTypedData({
      domain: { chainId, verifyingContract: safeAddress },
      types: SAFE_TX_TYPES,
      primaryType: 'SafeTx',
      message: {
        to: tx.to,
        value: tx.value,
        data: tx.data,
        operation: tx.operation,
        safeTxGas: tx.safeTxGas,
        baseGas: tx.baseGas,
        gasPrice: tx.gasPrice,
        gasToken: tx.gasToken,
        refundReceiver: tx.refundReceiver,
        nonce: tx.nonce,
      },
    });
  }

  /** Deploy the Safe on a chain via the canonical factory (relayer pays gas). */
  async deploySafe(chainId: number, creatorWallet: Address, campaignId: string, expectedAddress: Address): Promise<Hex> {
    const chain = this.chainConfig(chainId);
    const account = this.relayerAccount();
    const initializer = this.buildInitializer(creatorWallet);
    const saltNonce = this.saltNonceFor(campaignId);

    const wallet = createWalletClient({ account, transport: http(chain.rpcUrl) });
    const publicClient = this.publicClient(chainId);

    const txHash = await wallet.writeContract({
      chain: null,
      address: SAFE_PROXY_FACTORY,
      abi: CREATE_PROXY_ABI,
      functionName: 'createProxyWithNonce',
      args: [SAFE_L2_SINGLETON, initializer, saltNonce],
    });
    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash, timeout: 120_000 });
    if (receipt.status !== 'success') {
      throw new Error(`Safe deployment reverted (tx ${txHash})`);
    }
    if (!(await this.isDeployed(chainId, expectedAddress))) {
      throw new Error(`Safe deployment succeeded but code missing at ${expectedAddress}`);
    }
    this.logger.log(`Deployed Safe ${expectedAddress} on ${chain.name} (tx ${txHash})`);
    return txHash;
  }

  /**
   * Execute a Safe transaction with both owner signatures.
   * Safe requires signatures concatenated in ascending owner-address order.
   */
  async execTransaction(
    chainId: number,
    safeAddress: Address,
    tx: SafeTx,
    signatures: { signer: Address; signature: Hex }[],
  ): Promise<Hex> {
    const chain = this.chainConfig(chainId);
    const account = this.relayerAccount();
    const wallet = createWalletClient({ account, transport: http(chain.rpcUrl) });
    const publicClient = this.publicClient(chainId);

    const packed = concat(
      signatures
        .slice()
        .sort((a, b) => (a.signer.toLowerCase() < b.signer.toLowerCase() ? -1 : 1))
        .map((s) => s.signature),
    );

    const txHash = await wallet.writeContract({
      chain: null,
      address: safeAddress,
      abi: SAFE_ABI,
      functionName: 'execTransaction',
      args: [
        tx.to,
        tx.value,
        tx.data,
        tx.operation,
        tx.safeTxGas,
        tx.baseGas,
        tx.gasPrice,
        tx.gasToken,
        tx.refundReceiver,
        packed,
      ],
    });
    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash, timeout: 120_000 });
    if (receipt.status !== 'success') {
      throw new Error(`execTransaction reverted (tx ${txHash})`);
    }
    this.logger.log(`Executed Safe tx on chain ${chainId}: ${txHash}`);
    return txHash;
  }
}
