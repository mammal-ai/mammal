import Database from "@tauri-apps/plugin-sql";
// when using `"withGlobalTauri": true`, you may use
// const V = window.__TAURI__.sql;

const TIMEOUT = 250;

let db: Database | null = null;

const dbPromise = Database.load("sqlite:mammal.db");

(async () => {
  db = await dbPromise;
  await db.execute(`PRAGMA journal_mode=WAL;`);
  await db.execute(`PRAGMA busy_timeout = 5000;`);
  await db.execute(`PRAGMA cache_size = -20000;`);
  await db.execute(`PRAGMA foreign_keys = ON;`);
  await db.execute(`PRAGMA auto_vacuum = INCREMENTAL;`);
  await db.execute(`PRAGMA page_size = 8192;`);
})();

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default {
  select: async <T>(query: string, bindValues: any[] = []) => {
    if (!db) {
      await wait(TIMEOUT);
      if (!db) throw new Error("Database not loaded");
    }
    return (await db.select(query, bindValues)) as T[];
  },
  execute: async (query: string, bindValues: any[] = []) => {
    if (!db) {
      await wait(TIMEOUT);
      if (!db) throw new Error("Database not loaded");
    }
    return await db.execute(query, bindValues);
  },
};
