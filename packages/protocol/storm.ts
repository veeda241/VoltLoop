const RING_SIZE = 64;
const JITTER_MIN_MS = 20;
const JITTER_MAX_MS = 100;

type RingEntry = {
  msgId: number;
  hears: number;
  firstHeardAt: number;
  windowMs: number;
  suppressed: boolean;
};

export type StormDecision = {
  isNew: boolean;
  jitterMs: number;
  suppress: boolean;
  hears: number;
};

function randomJitter(): number {
  return JITTER_MIN_MS + Math.floor(Math.random() * (JITTER_MAX_MS - JITTER_MIN_MS + 1));
}

/** 64-entry msg_id ring + 20–100 ms jitter + suppress if same id rebroadcast ≥2 times in window. */
export class StormSuppressor {
  private ring: RingEntry[] = [];
  private cursor = 0;

  observe(msgId: number, now = Date.now()): StormDecision {
    const existing = this.ring.find((e) => e.msgId === msgId);
    if (!existing) {
      const windowMs = randomJitter();
      const entry: RingEntry = {
        msgId,
        hears: 1,
        firstHeardAt: now,
        windowMs,
        suppressed: false,
      };
      if (this.ring.length < RING_SIZE) {
        this.ring.push(entry);
      } else {
        this.ring[this.cursor % RING_SIZE] = entry;
        this.cursor += 1;
      }
      return { isNew: true, jitterMs: windowMs, suppress: false, hears: 1 };
    }

    existing.hears += 1;
    const inWindow = now - existing.firstHeardAt <= existing.windowMs;
    // Original receive + ≥2 rebroadcasts heard in the jitter window → suppress own TX.
    if (inWindow && existing.hears >= 3) {
      existing.suppressed = true;
    }
    return {
      isNew: false,
      jitterMs: Math.max(0, existing.windowMs - (now - existing.firstHeardAt)),
      suppress: existing.suppressed,
      hears: existing.hears,
    };
  }

  seenIds(): number[] {
    return this.ring.map((e) => e.msgId);
  }

  reset() {
    this.ring = [];
    this.cursor = 0;
  }
}
