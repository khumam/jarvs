"use client";

import type { ReactNode } from "react";

interface HudPanelProps {
  position: "tl" | "tr" | "bl" | "br";
  title: string;
  dotColor?: "cyan" | "amber" | "green" | "magenta";
  children: ReactNode;
}

export function HudPanel({ position, title, dotColor = "cyan", children }: HudPanelProps) {
  return (
    <div className={`hud-panel panel-${position}`}>
      <div className="panel-title">
        <span className={`dot ${dotColor}`} />
        {title}
      </div>
      {children}
    </div>
  );
}
