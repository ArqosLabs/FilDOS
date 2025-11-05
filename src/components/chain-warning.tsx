"use client";

import { useSwitchActiveWalletChain } from "thirdweb/react";
import { filecoinCalibration } from "@/utils/chains";
import { useEffect, useState } from "react";
import { useAccount } from "@/hooks/useAccount";

export const ChainWarning = () => {
  const { chainId, isConnected } = useAccount();
  const switchChain = useSwitchActiveWalletChain();
  const [autoSwitchAttempted, setAutoSwitchAttempted] = useState(false);

  useEffect(() => {
    const attemptSwitch = async () => {
      if (isConnected && !autoSwitchAttempted && chainId && chainId !== 314159 && chainId !== 314) {
        setAutoSwitchAttempted(true);
        try {
          await switchChain(filecoinCalibration);
          console.log("Auto-switched to Filecoin Calibration");
        } catch (error) {
          console.error("Auto-switch failed:", error);
        }
      }
    };
    
    attemptSwitch();
  }, [isConnected, chainId, autoSwitchAttempted, switchChain]);

  return null;
};
