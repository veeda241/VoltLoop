import { mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { createSeedStore } from "./seed";
import type { DemoStore } from "./types";

const STORE_PATH = join(process.cwd(), ".data", "store.json");

let memory: DemoStore | null = null;
let writeQueue: Promise<void> = Promise.resolve();

function ensureLoaded(): DemoStore {
  if (memory) return memory;
  try {
    const raw = readFileSync(STORE_PATH, "utf8");
    memory = JSON.parse(raw) as DemoStore;
    return memory;
  } catch {
    memory = createSeedStore();
    persist(memory);
    return memory;
  }
}

function persist(store: DemoStore) {
  writeQueue = writeQueue.then(() => {
    mkdirSync(dirname(STORE_PATH), { recursive: true });
    writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), "utf8");
  });
}

export function readStore(): DemoStore {
  return ensureLoaded();
}

export function mutateStore<T>(fn: (store: DemoStore) => T): T {
  const store = ensureLoaded();
  const result = fn(store);
  persist(store);
  return result;
}

export function resetStore() {
  memory = createSeedStore();
  persist(memory);
}
