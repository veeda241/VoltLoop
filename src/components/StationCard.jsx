import React from "react";
import { motion } from "framer-motion";
import { Card, Pill, Button } from "./ui";
import { stationDerived } from "../state/store";

const statusMap = {
  free: { tone: "volt", label: "Bays available" },
  almost: { tone: "warn", label: "Almost full" },
  full: { tone: "danger", label: "No bays left" },
};

export default function StationCard({ station, onStart, selected, onClick }) {
  const { vacant, occupied, status } = stationDerived(station);
  const s = statusMap[status];

  return (
    <motion.div layout whileHover={{ y: -2 }} onClick={onClick}>
      <Card
        className={`cursor-pointer transition-colors ${selected ? "border-volt/60" : "hover:border-line/150"}`}
      >
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <h3 className="font-semibold text-text leading-tight">{station.name}</h3>
            <p className="text-xs text-muted mt-1 font-mono-tight">{station.kw} kW · {station.bays} bays</p>
          </div>
          <Pill tone={s.tone}>{s.label}</Pill>
        </div>

        <div className="flex items-center gap-4 mb-3">
          <div>
            <p className="text-lg font-bold font-mono-tight text-volt">{vacant}</p>
            <p className="text-[10px] uppercase tracking-wide text-muted">Free now</p>
          </div>
          <div className="h-8 w-px bg-line" />
          <div>
            <p className="text-lg font-bold font-mono-tight text-text">{occupied}</p>
            <p className="text-[10px] uppercase tracking-wide text-muted">In use</p>
          </div>
          <div className="h-8 w-px bg-line" />
          <div className="flex-1">
            <p className="text-[10px] uppercase tracking-wide text-muted mb-1">Drivers finish in</p>
            <div className="flex flex-wrap gap-1">
              {station.minutesList.length === 0 && <span className="text-xs text-muted">—</span>}
              {station.minutesList.map((m, i) => (
                <span key={i} className="text-[10px] font-mono-tight px-1.5 py-0.5 rounded bg-line/60 text-muted">
                  {m}m
                </span>
              ))}
            </div>
          </div>
        </div>

        {onStart && (
          <Button
            variant={vacant > 0 ? "primary" : "secondary"}
            disabled={vacant === 0}
            className="w-full mt-1"
            onClick={(e) => {
              e.stopPropagation();
              onStart(station);
            }}
          >
            {vacant > 0 ? "Start charging" : "All bays in use"}
          </Button>
        )}
      </Card>
    </motion.div>
  );
}
