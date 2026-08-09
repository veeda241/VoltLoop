import React from "react";
import { Card, PageIn, SectionEyebrow } from "../components/ui";

const TERMS = [
  "VL is in-app credit for charging and partner stores. It cannot be withdrawn as cash, transferred to a bank, or paid out over UPI.",
  "VL cannot be sold or moved between accounts. Rewards stay with the account that earned them.",
  "Misusing the mesh — faking vehicle relays or replaying offers — can suspend your account.",
];

const PRIVACY = [
  "We use your location and charge time only to show nearby offers and bay availability.",
  "We do not sell your data to third parties.",
  "You can view or delete your data at any time.",
  "Vehicle identifiers rotate and are not tied to your name or phone number.",
  "Thulir follows India’s Digital Personal Data Protection Act, 2023.",
];

export default function Legal() {
  return (
    <PageIn className="max-w-2xl">
      <div className="pt-6 pb-4">
        <SectionEyebrow>Legal</SectionEyebrow>
        <h1 className="font-display text-2xl md:text-3xl font-bold">Privacy &amp; terms</h1>
        <p className="text-sm text-muted mt-2">How Thulir rewards work, and how we handle your data.</p>
      </div>

      <Card className="mb-5">
        <h2 className="font-semibold mb-4">VL rewards</h2>
        <ul className="space-y-3">
          {TERMS.map((p) => (
            <li key={p} className="flex gap-3 text-sm text-muted">
              <span className="text-volt mt-0.5">●</span>
              <span>{p}</span>
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <h2 className="font-semibold mb-4">Privacy</h2>
        <ul className="space-y-3">
          {PRIVACY.map((p) => (
            <li key={p} className="flex gap-3 text-sm text-muted">
              <span className="text-cyan mt-0.5">●</span>
              <span>{p}</span>
            </li>
          ))}
        </ul>
      </Card>
    </PageIn>
  );
}
