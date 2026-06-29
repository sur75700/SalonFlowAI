import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { fetchBillingStatus, readStoredToken, setBillingPlan, type BillingStatus } from "../lib/api";
import type { PricingPlanCode } from "../lib/pricing/plans";

type BillingContextValue = {
  billingStatus: BillingStatus | null;
  billingLoading: boolean;
  currentPlan: PricingPlanCode;
  refreshBilling: (tokenOverride?: string) => Promise<void>;
  updateBillingPlan: (plan: PricingPlanCode, tokenOverride?: string) => Promise<void>;
  clearBilling: () => void;
};

const BillingContext = createContext<BillingContextValue | null>(null);

export function BillingProvider({ children }: { children: React.ReactNode }) {
  const [billingStatus, setBillingStatus] = useState<BillingStatus | null>(null);
  const [billingLoading, setBillingLoading] = useState(false);

  const clearBilling = useCallback(() => {
    setBillingStatus(null);
  }, []);

  const refreshBilling = useCallback(async (tokenOverride?: string) => {
    const token = tokenOverride || readStoredToken();

    if (!token) {
      clearBilling();
      return;
    }

    try {
      setBillingLoading(true);
      const status = await fetchBillingStatus(token);
      setBillingStatus(status);
    } catch {
      clearBilling();
    } finally {
      setBillingLoading(false);
    }
  }, [clearBilling]);


  const updateBillingPlan = useCallback(async (
    plan: PricingPlanCode,
    tokenOverride?: string
  ) => {
    const token = tokenOverride || readStoredToken();

    if (!token) {
      clearBilling();
      return;
    }

    try {
      setBillingLoading(true);
      const status = await setBillingPlan(token, plan);
      setBillingStatus(status);
    } finally {
      setBillingLoading(false);
    }
  }, [clearBilling]);

  useEffect(() => {
    refreshBilling();
  }, [refreshBilling]);

  const currentPlan = useMemo<PricingPlanCode>(() => {
    return billingStatus?.plan || "business";
  }, [billingStatus?.plan]);

  const value = useMemo(
    () => ({
      billingStatus,
      billingLoading,
      currentPlan,
      refreshBilling,
      updateBillingPlan,
      clearBilling,
    }),
    [billingLoading, billingStatus, clearBilling, currentPlan, refreshBilling, updateBillingPlan]
  );

  return (
    <BillingContext.Provider value={value}>
      {children}
    </BillingContext.Provider>
  );
}

export function useBilling() {
  const context = useContext(BillingContext);

  if (!context) {
    throw new Error("useBilling must be used inside BillingProvider");
  }

  return context;
}
