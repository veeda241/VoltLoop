"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useStations, useUser } from "@/lib/hooks";

const StationMap = dynamic(() => import("@/components/StationMap"), { ssr: false });

export default function MapPage() {
  const { user } = useUser();
  const { stations, loading, refresh } = useStations();
  const [selected, setSelected] = useState<string | null>(null);
  const router = useRouter();

  return (
    <div className="h-[calc(100dvh-4.5rem-3rem)] md:h-[calc(100dvh-3.75rem)]">
      {loading && !stations.length ? (
        <div className="h-full animate-pulse bg-[var(--bg-card)]" />
      ) : (
        <StationMap
          stations={stations}
          selectedId={selected}
          onSelect={setSelected}
          onStart={(st) => router.push(`/session?station=${st.id}`)}
          onRefresh={() => void refresh()}
          canStart={Boolean(user)}
        />
      )}
    </div>
  );
}
