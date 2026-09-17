import React from "react";

interface CalloutProps {
  type: "claim" | "warrant" | "qualifier" | "rebuttal" | "note";
  children?: React.ReactNode;
}

const labels: Record<string, string> = {
  claim: "Claim",
  warrant: "Warrant",
  qualifier: "Qualifier",
  rebuttal: "Rebuttal",
  note: "Note",
};

export default function Callout({ type, children }: CalloutProps) {
  const variant = type || "note";

  return (
    <div className={`callout-card callout-card--${variant}`}>
      <p className="callout-label">{labels[variant] || variant}</p>
      <div className="callout-body">{children}</div>
    </div>
  );
}
