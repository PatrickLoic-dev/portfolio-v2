"use client";

import { createContext, useContext, type ReactNode } from "react";

/** Which optional services are configured (env keys present), decided on the server. */
export type Features = { ai: boolean; mail: boolean };

const FeaturesContext = createContext<Features>({ ai: false, mail: false });

export function FeaturesProvider({ value, children }: { value: Features; children: ReactNode }) {
  return <FeaturesContext.Provider value={value}>{children}</FeaturesContext.Provider>;
}

export const useFeatures = () => useContext(FeaturesContext);
