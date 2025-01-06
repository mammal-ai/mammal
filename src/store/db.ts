import Database from "@tauri-apps/plugin-sql";

const TIMEOUT = 2500;

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

let isNotified = false;
const notify = () => {
  if (!isNotified) isNotified = true;

  alert("Could not open db in a reasonable amount of time");
};

export default {
  select: async <T>(query: string, bindValues: any[] = []) => {
    let can_run = { status: false };
    let abortable = setTimeout(() => {
      if (!can_run.status) {
        notify();
      }
    }, TIMEOUT);
    await dbPromise;
    clearTimeout(abortable);

    if (!db) {
      throw new Error("Database not loaded");
    }

    return (await db.select(query, bindValues)) as T[];
  },
  execute: async (query: string, bindValues: any[] = []) => {
    let can_run = { status: false };
    let abortable = setTimeout(() => {
      if (!can_run.status) {
        notify();
      }
    }, TIMEOUT);
    await dbPromise;
    clearTimeout(abortable);

    if (!db) {
      throw new Error("Database not loaded");
    }

    return await db.execute(query, bindValues);
  },
};
