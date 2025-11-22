"use client";

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
import { useAccount } from "@/hooks/useAccount";
import ConnectWalletPrompt from "./not-connected";

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
    return <ConnectWalletPrompt 
      description="Please connect your wallet to manage your storage settings and balances."
    />;
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
      <div className="w-full space-y-4 sm:space-y-6 p-3 sm:p-6">
        <StorageBalanceHeader
          config={config}
          onConfigSave={handleConfigSave}
          pricePerTiBPerMonth={pricePerTiBPerMonth}
        />

        <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
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
            ? "border-destructive/50 bg-destructive/10"
            : status.includes("✅")
              ? "border-green-500/50 bg-green-500/10"
              : "border-blue-500/50 bg-blue-500/10"
            }`}>
            <CardContent className="pt-6">
              <p className={`text-sm ${status.includes("❌")
                ? "text-destructive"
                : status.includes("✅")
                  ? "text-green-700 dark:text-green-400"
                  : "text-primary"
                }`}>
                {status}
              </p>
            </CardContent>
          </Card>
        )}
        {revokeStatus && (
          <Card className={`${revokeStatus.includes("❌")
            ? "border-destructive/50 bg-destructive/10"
            : revokeStatus.includes("✅")
              ? "border-green-500/50 bg-green-500/10"
              : "border-blue-500/50 bg-blue-500/10"
            }`}>
            <CardContent className="pt-6">
              <p className={`text-sm ${revokeStatus.includes("❌")
                ? "text-destructive"
                : revokeStatus.includes("✅")
                  ? "text-green-700 dark:text-green-400"
                  : "text-primary"
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
        <CardTitle className="text-base sm:text-lg flex items-center gap-2">
          <Shield className="h-4 w-4 sm:h-5 sm:w-5" />
          Allowance Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 sm:space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
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
          <Card className="border-amber-500/50 bg-amber-500/10">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                <div className="space-y-2">
                  <p className="text-amber-800 dark:text-amber-200 font-medium">
                    Storage Rate Insufficient
                  </p>
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    Max configured storage is {config.storageCapacity} GB. Your current covered storage is{" "}
                    {balances?.currentRateAllowanceGB?.toLocaleString()} GB.
                  </p>
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    Currently using {balances?.currentStorageGB?.toLocaleString()} GB.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {!isLoading && !balances?.isLockupSufficient && (
          <Card className="border-amber-500/50 bg-amber-500/10">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                <div className="space-y-2">
                  <p className="text-amber-800 dark:text-amber-200 font-medium">
                    Lockup Period Insufficient
                  </p>
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    Max configured lockup is {config.persistencePeriod} days. Your current covered lockup is{" "}
                    {balances?.persistenceDaysLeft.toFixed(1)} days, which is less than the notice period of {config.minDaysThreshold} days.
                  </p>
                  <p className="text-xs text-amber-600 dark:text-amber-400">
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
        <div className="flex justify-start sm:justify-end">
          <Button
            variant="destructive"
            onClick={onRevoke}
            disabled={isLoading || isRevoking}
            className="w-full sm:w-auto"
            size="sm"
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
      <Card className="border-green-500/50 bg-green-500/10">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
            <div>
              <p className="text-green-800 dark:text-green-300 font-medium">Storage Balance Sufficient</p>
              <p className="text-sm text-green-700 dark:text-green-400">
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
          <Card className="border-destructive/50 bg-destructive/10">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                <div>
                  <p className="text-destructive font-medium">FIL Tokens Required</p>
                  <p className="text-sm text-destructive/90">
                    You need FIL tokens to pay for transaction fees. Please deposit FIL tokens to your wallet.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        {balances.usdfcBalance === BigInt(0) && (
          <Card className="border-destructive/50 bg-destructive/10">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                <div>
                  <p className="text-destructive font-medium">USDFC Tokens Required</p>
                  <p className="text-sm text-destructive/90">
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
        <Card className="border-destructive/50 bg-destructive/10">
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
              <div>
                <p className="text-destructive font-medium">Insufficient Storage Balance</p>
                <p className="text-sm text-destructive/90">
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
    <Card className="border-amber-500/50 bg-amber-500/10">
      <CardContent className="pt-6 space-y-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
          <div>
            <p className="text-amber-800 dark:text-amber-200 font-medium">Additional USDFC Required</p>
            <p className="text-sm text-amber-700 dark:text-amber-300">
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
    <Card className="border-amber-500/50 bg-amber-500/10">
      <CardContent className="pt-6 space-y-4">
        <div className="flex items-start gap-3">
          <TrendingUp className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
          <div>
            <p className="text-amber-800 dark:text-amber-200 font-medium">Rate Allowance Increase Required</p>
            <p className="text-sm text-amber-700 dark:text-amber-300">
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
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
          <div className="space-y-2">
            <CardTitle className="text-xl sm:text-2xl flex items-center gap-2">
              <Database className="h-5 w-5 sm:h-6 sm:w-6" />
              Storage Management
            </CardTitle>
            <CardDescription className="text-sm">
              Monitor your storage usage and manage USDFC deposits for Filecoin storage
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
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
          <div className="flex justify-start sm:justify-end items-center mt-2">
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
      <CardTitle className="text-base sm:text-lg flex items-center gap-2">
        <Wallet className="h-4 w-4 sm:h-5 sm:w-5" />
        Wallet Balances
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-3 sm:space-y-4">
      <div className="grid gap-3 sm:gap-4">
        <div className="flex items-center justify-between p-3 sm:p-4 rounded-sm border bg-muted/50">
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm font-medium">FIL Balance</span>
          </div>
          <span className="text-xs sm:text-sm">
            {isLoading ? "..." : `${balances?.filBalanceFormatted?.toLocaleString()} FIL`}
          </span>
        </div>
        <div className="flex items-center justify-between p-3 sm:p-4 rounded-sm border bg-muted/50">
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm font-medium">USDFC Balance</span>
          </div>
          <span className="text-xs sm:text-sm">
            {isLoading ? "..." : `${balances?.usdfcBalanceFormatted?.toLocaleString()} USDFC`}
          </span>
        </div>
        <div className="flex items-center justify-between p-3 sm:p-4 rounded-sm border bg-muted/50">
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm font-medium">Warm Storage Balance</span>
          </div>
          <span className="text-xs sm:text-sm">
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
        <CardTitle className="text-base sm:text-lg flex items-center gap-2">
          <HardDrive className="h-4 w-4 sm:h-5 sm:w-5" />
          Storage Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 sm:space-y-6">
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs sm:text-sm font-medium">Storage Usage</span>
            <span className="text-xs sm:text-sm text-muted-foreground">
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

        <div className="space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between p-3 rounded-sm border bg-muted/30">
            <div className="flex items-center gap-2">
              <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
              <span className="text-xs sm:text-sm">Persistence (Max Usage)</span>
            </div>
            <Badge variant={balances?.persistenceDaysLeft && balances.persistenceDaysLeft > 7 ? "default" : "destructive"} className="text-xs">
              {isLoading ? "..." : `${balances?.persistenceDaysLeft.toFixed(1)} days`}
            </Badge>
          </div>
          <div className="flex items-center justify-between p-3 rounded-md border bg-muted/30">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
              <span className="text-xs sm:text-sm">Persistence (Current Usage)</span>
            </div>
            <Badge variant={balances?.persistenceDaysLeftAtCurrentRate && balances.persistenceDaysLeftAtCurrentRate > 7 ? "default" : "destructive"} className="text-xs">
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
  <div className="flex items-center justify-between p-3 sm:p-4 rounded-sm border bg-muted/30">
    <span className="text-xs sm:text-sm font-medium">{label}</span>
    <div className="flex items-center gap-2">
      {isLoading ? (
        <span className="text-xs sm:text-sm text-muted-foreground">...</span>
      ) : isSufficient ? (
        <>
          <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 dark:text-green-400" />
          <Badge variant="outline" className="text-xs">
            Sufficient
          </Badge>
        </>
      ) : (
        <>
          <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 text-destructive" />
          <Badge variant="destructive" className="text-xs">
            Insufficient
          </Badge>
        </>
      )}
    </div>
  </div>
);
