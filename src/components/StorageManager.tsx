"use client";

import { useAccount } from "wagmi";
import { useBalances } from "@/hooks/useBalances";
import { usePayment, useRevokeService } from "@/hooks/usePayment";
import { config as defaultConfig } from "@/config";
import { formatUnits } from "viem";
import { AllowanceItemProps, PaymentActionProps, SectionProps } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Wallet,
  HardDrive,
  Clock,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Coins,
  Database,
  Shield
} from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { useSynapse } from "@/providers/SynapseProvider";
import { StorageConfigDialog, StorageConfig } from "./storage-config-dialog";
import { fetchWarmStorageCosts } from "@/utils/warmStorageUtils";
import { getPricePerTBPerMonth } from "@/utils";

const STORAGE_CONFIG_KEY = "fildos_user_storage_config";

export const StorageManager = () => {
  const { isConnected } = useAccount();
  const revokeService = useRevokeService();
  const { synapse } = useSynapse();
  const [revokeStatus, setRevokeStatus] = useState<string>("");
  const [pricePerTiBPerMonth, setPricePerTiBPerMonth] = useState<string | null>(null);

  const [userConfig, setUserConfig] = useState<StorageConfig>(() => {
    if (typeof window === "undefined") {
      return {
        storageCapacity: defaultConfig.storageCapacity,
        persistencePeriod: defaultConfig.persistencePeriod,
        minDaysThreshold: defaultConfig.minDaysThreshold,
      };
    }

    try {
      const saved = localStorage.getItem(STORAGE_CONFIG_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error("Failed to load storage config from localStorage:", error);
    }

    return {
      storageCapacity: defaultConfig.storageCapacity,
      persistencePeriod: defaultConfig.persistencePeriod,
      minDaysThreshold: defaultConfig.minDaysThreshold,
    };
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_CONFIG_KEY, JSON.stringify(userConfig));
      } catch (error) {
        console.error("Failed to save storage config to localStorage:", error);
      }
    }
  }, [userConfig]);

  useEffect(() => {
    const fetchPricing = async () => {
      if (synapse) {
        try {
          const storageCosts = await fetchWarmStorageCosts(synapse);
          const pricePerTiB = getPricePerTBPerMonth(storageCosts);
          const priceInUSDFC = Number(formatUnits(pricePerTiB, 18));
          setPricePerTiBPerMonth(priceInUSDFC.toFixed(2));
        } catch (error) {
          console.error("Failed to fetch storage pricing:", error);
        }
      }
    };
    fetchPricing();
  }, [synapse]);

  const config = useMemo(
    () => ({
      ...defaultConfig,
      ...userConfig,
    }),
    [userConfig]
  );

  const {
    data,
    isLoading: isBalanceLoading,
    refetch: refetchBalances,
  } = useBalances(
    config.storageCapacity,
    config.persistencePeriod,
    config.minDaysThreshold
  );
  const balances = data;
  const { mutation: paymentMutation, status } = usePayment();
  const { mutateAsync: handlePayment, isPending: isProcessingPayment } =
    paymentMutation;

  const [isRevoking, setIsRevoking] = useState(false);

  const handleRefetchBalances = async () => {
    await refetchBalances();
  };

  const handleConfigSave = (newConfig: StorageConfig) => {
    setUserConfig(newConfig);
    refetchBalances();
  };

  if (!isConnected) {
    return null;
  }

  const handleRevoke = async () => {
    const { mutation, status } = revokeService;
    try {
      if (!synapse) throw new Error("Synapse not ready");
      setIsRevoking(true);
      setRevokeStatus(status);
      await mutation.mutateAsync({
        service: synapse.getWarmStorageAddress()
      });
      setRevokeStatus(status);
      await refetchBalances();
    } catch (err) {
      const message =
        typeof err === "object" && err !== null && "message" in err
          ? String((err as { message?: string }).message)
          : "Failed to revoke approval";
      setRevokeStatus(`❌ ${message}`);
    } finally {
      setIsRevoking(false);
    }
  };

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-7xl space-y-6 p-6">
        <StorageBalanceHeader
          config={config}
          onConfigSave={handleConfigSave}
          pricePerTiBPerMonth={pricePerTiBPerMonth}
        />

        <div className="grid gap-6 md:grid-cols-2">
          <WalletBalancesSection
            balances={balances}
            isLoading={isBalanceLoading}
          />
          <StorageStatusSection
            balances={balances}
            isLoading={isBalanceLoading}
            config={config}
          />
        </div>

        <AllowanceStatusSection
          balances={balances}
          isLoading={isBalanceLoading}
          onRevoke={handleRevoke}
          isRevoking={isRevoking}
          config={config}
        />

        <ActionSection
          balances={balances}
          isLoading={isBalanceLoading}
          isProcessingPayment={isProcessingPayment}
          onPayment={handlePayment}
          handleRefetchBalances={handleRefetchBalances}
          config={config}
        />

        {status && (
          <Card className={`${status.includes("❌")
            ? "border-red-200 bg-red-50"
            : status.includes("✅")
              ? "border-green-200 bg-green-50"
              : "border-blue-200 bg-blue-50"
            }`}>
            <CardContent className="pt-6">
              <p className={`text-sm ${status.includes("❌")
                ? "text-red-700"
                : status.includes("✅")
                  ? "text-green-700"
                  : "text-blue-700"
                }`}>
                {status}
              </p>
            </CardContent>
          </Card>
        )}
        {revokeStatus && (
          <Card className={`${revokeStatus.includes("❌")
            ? "border-red-200 bg-red-50"
            : revokeStatus.includes("✅")
              ? "border-green-200 bg-green-50"
              : "border-blue-200 bg-blue-50"
            }`}>
            <CardContent className="pt-6">
              <p className={`text-sm ${revokeStatus.includes("❌")
                ? "text-red-700"
                : revokeStatus.includes("✅")
                  ? "text-green-700"
                  : "text-blue-700"
                }`}>
                {revokeStatus}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

/**
 * Section displaying allowance status
 */
const AllowanceStatusSection = ({
  balances,
  isLoading,
  onRevoke,
  isRevoking,
  config,
}: SectionProps & {
  onRevoke?: () => void | Promise<void>;
  isRevoking?: boolean;
  config: StorageConfig & { withCDN: boolean; aiServerUrl: string };
}) => {
  const depositNeededFormatted = Number(
    formatUnits(balances?.depositNeeded ?? BigInt(0), 18)
  ).toFixed(3);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Allowance Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <AllowanceItem
            label="Rate Allowance"
            isSufficient={balances?.isRateSufficient}
            isLoading={isLoading}
          />
          <AllowanceItem
            label="Lockup Allowance"
            isSufficient={balances?.isLockupSufficient}
            isLoading={isLoading}
          />
        </div>

        {!isLoading && !balances?.isRateSufficient && (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                <div className="space-y-2">
                  <p className="text-amber-800 font-medium">
                    Storage Rate Insufficient
                  </p>
                  <p className="text-sm text-amber-700">
                    Max configured storage is {config.storageCapacity} GB. Your current covered storage is{" "}
                    {balances?.currentRateAllowanceGB?.toLocaleString()} GB.
                  </p>
                  <p className="text-xs text-amber-600">
                    Currently using {balances?.currentStorageGB?.toLocaleString()} GB.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {!isLoading && !balances?.isLockupSufficient && (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                <div className="space-y-2">
                  <p className="text-amber-800 font-medium">
                    Lockup Period Insufficient
                  </p>
                  <p className="text-sm text-amber-700">
                    Max configured lockup is {config.persistencePeriod} days. Your current covered lockup is{" "}
                    {balances?.persistenceDaysLeft.toFixed(1)} days, which is less than the notice period of {config.minDaysThreshold} days.
                  </p>
                  <p className="text-xs text-amber-600">
                    Currently using {balances?.currentStorageGB?.toLocaleString()} GB.
                    Deposit {depositNeededFormatted} USDFC to extend lockup for{" "}
                    {(config.persistencePeriod - (balances?.persistenceDaysLeft ?? 0)).toFixed(1)} more days.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
      <CardContent>
        <div className="flex justify-end">
          <Button
            variant="destructive"
            onClick={onRevoke}
            disabled={isLoading || isRevoking}
          >
            {isRevoking ? "Revoking..." : "Revoke Warm Storage Approval"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Section for payment actions
 */
const ActionSection = ({
  balances,
  isLoading,
  isProcessingPayment,
  onPayment,
  handleRefetchBalances,
  config,
}: PaymentActionProps & { config: StorageConfig & { withCDN: boolean; aiServerUrl: string } }) => {
  if (isLoading || !balances) return null;

  if (balances.isSufficient) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-green-800 font-medium">Storage Balance Sufficient</p>
              <p className="text-sm text-green-700">
                Your storage balance supports {config.storageCapacity}GB for {balances.persistenceDaysLeft.toFixed(1)} days.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const depositNeededFormatted = Number(
    formatUnits(balances?.depositNeeded ?? BigInt(0), 18)
  ).toFixed(3);

  if (balances.filBalance === BigInt(0) || balances.usdfcBalance === BigInt(0)) {
    return (
      <div className="space-y-4">
        {balances.filBalance === BigInt(0) && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <div>
                  <p className="text-red-800 font-medium">FIL Tokens Required</p>
                  <p className="text-sm text-red-700">
                    You need FIL tokens to pay for transaction fees. Please deposit FIL tokens to your wallet.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        {balances.usdfcBalance === BigInt(0) && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <div>
                  <p className="text-red-800 font-medium">USDFC Tokens Required</p>
                  <p className="text-sm text-red-700">
                    You need USDFC tokens to pay for storage. Please deposit USDFC tokens to your wallet.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {balances.isRateSufficient && !balances.isLockupSufficient && (
        <LockupIncreaseAction
          totalLockupNeeded={balances.totalLockupNeeded}
          depositNeeded={balances.depositNeeded}
          rateNeeded={balances.rateNeeded}
          isProcessingPayment={isProcessingPayment}
          onPayment={onPayment}
          handleRefetchBalances={handleRefetchBalances}
        />
      )}
      {!balances.isRateSufficient && balances.isLockupSufficient && (
        <RateIncreaseAction
          currentLockupAllowance={balances.currentLockupAllowance}
          rateNeeded={balances.rateNeeded}
          isProcessingPayment={isProcessingPayment}
          onPayment={onPayment}
          handleRefetchBalances={handleRefetchBalances}
        />
      )}
      {!balances.isRateSufficient && !balances.isLockupSufficient && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <p className="text-red-800 font-medium">Insufficient Storage Balance</p>
                <p className="text-sm text-red-700">
                  You need to deposit {depositNeededFormatted} USDFC & increase your rate allowance to meet your storage needs.
                </p>
              </div>
            </div>
            <Button
              onClick={async () => {
                await onPayment({
                  lockupAllowance: balances.totalLockupNeeded,
                  epochRateAllowance: balances.rateNeeded,
                  depositAmount: balances.depositNeeded,
                });
                await handleRefetchBalances();
              }}
              disabled={isProcessingPayment}
              className="w-full"
              size="lg"
            >
              {isProcessingPayment ? "Processing transactions..." : "Deposit & Increase Allowances"}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

/**
 * Component for handling lockup deposit action
 */
const LockupIncreaseAction = ({
  totalLockupNeeded,
  depositNeeded,
  rateNeeded,
  isProcessingPayment,
  onPayment,
  handleRefetchBalances,
}: PaymentActionProps) => {
  if (!totalLockupNeeded || !depositNeeded || !rateNeeded) return null;

  const depositNeededFormatted = Number(
    formatUnits(depositNeeded ?? BigInt(0), 18)
  ).toFixed(3);

  return (
    <Card className="border-amber-200 bg-amber-50">
      <CardContent className="pt-6 space-y-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
          <div>
            <p className="text-amber-800 font-medium">Additional USDFC Required</p>
            <p className="text-sm text-amber-700">
              Deposit {depositNeededFormatted} USDFC to extend storage lockup period.
            </p>
          </div>
        </div>
        <Button
          onClick={async () => {
            await onPayment({
              lockupAllowance: totalLockupNeeded,
              epochRateAllowance: rateNeeded,
              depositAmount: depositNeeded,
            });
            await handleRefetchBalances();
          }}
          disabled={isProcessingPayment}
          className="w-full"
          size="lg"
        >
          {isProcessingPayment ? "Processing transactions..." : "Deposit & Increase Lockup"}
        </Button>
      </CardContent>
    </Card>
  );
};

/**
 * Component for handling rate deposit action
 */
const RateIncreaseAction = ({
  currentLockupAllowance,
  rateNeeded,
  isProcessingPayment,
  onPayment,
  handleRefetchBalances,
}: PaymentActionProps) => {
  if (!currentLockupAllowance || !rateNeeded) return null;

  return (
    <Card className="border-amber-200 bg-amber-50">
      <CardContent className="pt-6 space-y-4">
        <div className="flex items-start gap-3">
          <TrendingUp className="h-5 w-5 text-amber-600 mt-0.5" />
          <div>
            <p className="text-amber-800 font-medium">Rate Allowance Increase Required</p>
            <p className="text-sm text-amber-700">
              Increase your rate allowance to meet your storage capacity needs.
            </p>
          </div>
        </div>
        <Button
          onClick={async () => {
            await onPayment({
              lockupAllowance: currentLockupAllowance,
              epochRateAllowance: rateNeeded,
              depositAmount: BigInt(0),
            });
            await handleRefetchBalances();
          }}
          disabled={isProcessingPayment}
          className="w-full"
          size="lg"
        >
          {isProcessingPayment ? "Increasing Rate..." : "Increase Rate"}
        </Button>
      </CardContent>
    </Card>
  );
};

/**
 * Header section with title and USDFC faucet button
 */
const StorageBalanceHeader = ({
  config,
  onConfigSave,
  pricePerTiBPerMonth,
}: {
  config: StorageConfig & { withCDN: boolean; aiServerUrl: string };
  onConfigSave: (config: StorageConfig) => void;
  pricePerTiBPerMonth: string | null;
}) => {
  const { chainId } = useAccount();

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <CardTitle className="text-2xl flex items-center gap-2">
              <Database className="h-6 w-6" />
              Storage Management
            </CardTitle>
            <CardDescription>
              Monitor your storage usage and manage USDFC deposits for Filecoin storage
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <StorageConfigDialog
              currentConfig={{
                storageCapacity: config.storageCapacity,
                persistencePeriod: config.persistencePeriod,
                minDaysThreshold: config.minDaysThreshold,
              }}
              onSave={onConfigSave}
            />
            {chainId === 314159 && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    window.open(
                      "https://forest-explorer.chainsafe.dev/faucet/calibnet_usdfc",
                      "_blank"
                    );
                  }}
                >
                  <Coins className="h-4 w-4 mr-2" />
                  Get tUSDFC
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    window.open(
                      "https://faucet.calibnet.chainsafe-fil.io/funds.html",
                      "_blank"
                    );
                  }}
                >
                  <Coins className="h-4 w-4 mr-2" />
                  Get tFIL
                </Button>
              </>
            )}
          </div>
        </div>
        {pricePerTiBPerMonth && (
          <div className="flex justify-end items-center">
            <Badge variant="outline" className="text-xs">
              Current Pricing:{" "} {pricePerTiBPerMonth} USDFC per TiB/month
            </Badge>
          </div>
        )}
      </CardHeader>
    </Card>
  );
};

/**
 * Section displaying wallet balances
 */
const WalletBalancesSection = ({ balances, isLoading }: SectionProps) => (
  <Card>
    <CardHeader>
      <CardTitle className="text-lg flex items-center gap-2">
        <Wallet className="h-5 w-5" />
        Wallet Balances
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="grid gap-4">
        <div className="flex items-center justify-between p-4 rounded-sm border bg-muted/50">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">FIL Balance</span>
          </div>
          <span className="text-sm">
            {isLoading ? "..." : `${balances?.filBalanceFormatted?.toLocaleString()} FIL`}
          </span>
        </div>
        <div className="flex items-center justify-between p-4 rounded-sm border bg-muted/50">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">USDFC Balance</span>
          </div>
          <span className="text-sm">
            {isLoading ? "..." : `${balances?.usdfcBalanceFormatted?.toLocaleString()} USDFC`}
          </span>
        </div>
        <div className="flex items-center justify-between p-4 rounded-sm border bg-muted/50">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Warm Storage Balance</span>
          </div>
          <span className="text-sm">
            {isLoading ? "..." : `${balances?.warmStorageBalanceFormatted?.toLocaleString()} USDFC`}
          </span>
        </div>
      </div>
    </CardContent>
  </Card>
);

/**
 * Section displaying storage status
 */
const StorageStatusSection = ({
  balances,
  isLoading,
}: SectionProps & { config: StorageConfig & { withCDN: boolean; aiServerUrl: string } }) => {
  const storageUsagePercent = balances?.currentRateAllowanceGB
    ? (balances.currentStorageGB / balances.currentRateAllowanceGB) * 100
    : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <HardDrive className="h-5 w-5" />
          Storage Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Storage Usage</span>
            <span className="text-sm text-muted-foreground">
              {isLoading ? "..." : `${balances?.currentStorageGB?.toLocaleString()} GB / ${balances?.currentRateAllowanceGB?.toLocaleString()} GB`}
            </span>
          </div>
          {!isLoading && (
            <Progress value={storageUsagePercent} className="h-2" />
          )}
          <p className="text-xs text-muted-foreground">
            {isLoading ? "..." : `${storageUsagePercent.toFixed(1)}% of allocated storage used`}
          </p>
        </div>

        <Separator />

        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-sm border bg-muted/30">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Persistence (Max Usage)</span>
            </div>
            <Badge variant={balances?.persistenceDaysLeft && balances.persistenceDaysLeft > 7 ? "default" : "destructive"}>
              {isLoading ? "..." : `${balances?.persistenceDaysLeft.toFixed(1)} days`}
            </Badge>
          </div>
          <div className="flex items-center justify-between p-3 rounded-md border bg-muted/30">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Persistence (Current Usage)</span>
            </div>
            <Badge variant={balances?.persistenceDaysLeftAtCurrentRate && balances.persistenceDaysLeftAtCurrentRate > 7 ? "default" : "destructive"}>
              {isLoading ? "..." : `${balances?.persistenceDaysLeftAtCurrentRate.toFixed(1)} days`}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
/**
 * Component for displaying an allowance status
 */
const AllowanceItem = ({
  label,
  isSufficient,
  isLoading,
}: AllowanceItemProps) => (
  <div className="flex items-center justify-between p-4 rounded-sm border bg-muted/30">
    <span className="text-sm font-medium">{label}</span>
    <div className="flex items-center gap-2">
      {isLoading ? (
        <span className="text-sm text-muted-foreground">...</span>
      ) : isSufficient ? (
        <>
          <CheckCircle className="h-4 w-4 text-green-600" />
          <Badge variant="outline">
            Sufficient
          </Badge>
        </>
      ) : (
        <>
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <Badge variant="destructive">
            Insufficient
          </Badge>
        </>
      )}
    </div>
  </div>
);
