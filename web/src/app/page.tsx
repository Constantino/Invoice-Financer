"use client";

import { usePrivy } from '@privy-io/react-auth';
import Login from "@/components/auth/login";

export default function Home() {
  const { ready } = usePrivy();
  if (!ready) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background font-sans pt-16">
      <div className="flex flex-col items-center gap-4">
        <h1 className="max-w-xs text-4xl font-semibold leading-10 tracking-tight text-foreground flex items-center gap-3">
          Invoice Financer
        </h1>
        <h2 className="text-xl font-normal leading-6 tracking-tight text-muted-foreground whitespace-nowrap">
          Bringing real-world invoice financing on-chain to tap into global DeFi liquidity
        </h2>

        <Login />

      </div>
    </div>
  );
}
