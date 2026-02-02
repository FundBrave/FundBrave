"use client";

import { InfoIcon, Shield, Clock, TrendingUp, Users } from "lucide-react";

interface StakingInfoPanelProps {
  estimatedAPY: number;
}

/**
 * StakingInfoPanel - Educational information about staking
 * Explains how staking works, benefits, and risks
 */
export default function StakingInfoPanel({ estimatedAPY }: StakingInfoPanelProps) {
  return (
    <div className="bg-surface-elevated border border-white/10 rounded-xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <InfoIcon className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">How Staking Works</h3>
      </div>

      <div className="space-y-4">
        <div className="flex gap-3">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-primary" />
          </div>
          <div>
            <div className="font-medium text-sm mb-1">Earn {estimatedAPY}% Annual Yield</div>
            <div className="text-xs text-text-tertiary">
              Your USDC earns yield through DeFi protocols while supporting this campaign
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
            <Clock className="w-4 h-4 text-primary" />
          </div>
          <div>
            <div className="font-medium text-sm mb-1">No Lock-Up Period</div>
            <div className="text-xs text-text-tertiary">
              You can unstake at any time with no penalties or waiting periods
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
            <Users className="w-4 h-4 text-primary" />
          </div>
          <div>
            <div className="font-medium text-sm mb-1">Support the Campaign</div>
            <div className="text-xs text-text-tertiary">
              A portion of the yield generated goes directly to the campaign creator
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
            <Shield className="w-4 h-4 text-primary" />
          </div>
          <div>
            <div className="font-medium text-sm mb-1">Automatic Compounding</div>
            <div className="text-xs text-text-tertiary">
              Yield is automatically reinvested to maximize your returns
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
        <div className="text-xs text-orange-400">
          <strong>Important:</strong> Staking involves smart contract risk. Only stake what you can afford to lose.
          APY is an estimate and may vary based on market conditions.
        </div>
      </div>
    </div>
  );
}
