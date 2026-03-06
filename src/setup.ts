import fs from "fs";
import path from "path";
import JSON5 from "json5";
import Database from "better-sqlite3";

/* ---------------- FILE HELPERS ---------------- */

const readFromFile = (
  inputPath: string,
  encoding: BufferEncoding = "utf8",
): string => {
  return fs.readFileSync(path.join(process.cwd(), inputPath), encoding);
};

const writeToFile = (content: unknown, outputPath: string): void => {
  fs.writeFileSync(
    path.join(process.cwd(), outputPath),
    JSON.stringify(content, null, 2),
    "utf8",
  );
};

/**
 * Converts NDJSON (newline separated JSON)
 * into a parsed JSON array safely.
 *
 * Logs a [PARSE ERROR] for every malformed line so broken records can be
 * identified without halting the entire import.
 */
const ndJsonToSafeJson = <T = any>(content: string): T[] => {
  let lineNumber = 0;
  let skipped = 0;

  const result = content
    ?.split("\n")
    ?.map((line) => {
      lineNumber++;

      const i = line.indexOf("{");
      const j = line.lastIndexOf("}");

      if (i === -1 || j === -1 || j < i) {
        skipped++;
        return null;
      }

      const jsonLine = line.slice(i, j + 1);

      try {
        return JSON5.parse(jsonLine) as T;
      } catch (error) {
        console.error(
          `[PARSE ERROR] Line ${lineNumber}: invalid JSON — ${error}`,
        );
        skipped++;
        return false;
      }
    })
    ?.filter(Boolean) as T[];

  console.log(`[PARSE]    ndJsonToSafeJson — ${lineNumber} lines read, ${skipped} skipped, ${result.length} parsed`);
  return result;
};

/* ---------------- INTERFACES ---------------- */

interface MetaDataInput {
  D?: string;
  C?: string;
  CAT?: string;
  ST?: string;
  CO?: string;
  Z?: string;
  CN?: string;
}

interface MetaDataOutput {
  domain: string;
  name?: string;
  category?: string;
  city?: string;
  state?: string;
  country?: string;
  zipcode?: string;
}

interface TechIndexItem {
  Name?: string;
  Category?: string;
}

interface TechDataInput {
  D?: string;
  T?: Array<{ N?: string }>;
}

interface TechDataOutput {
  domain: string;
  name: string;
  category?: string;
}

/* ---------------- MAIN EXECUTION ---------------- */

((): void => {
  console.log(`[SETUP START] Initialising database at: database.sqlite`);

  const dbPath = path.join(process.cwd(), "database.sqlite");
  const db = new Database(dbPath);

  db.pragma("foreign_keys = ON");
  console.log(`[DB]       Connected to SQLite — foreign_keys=ON`);

  try {
    /* -------- TECH INDEX -------- */
    console.log(`[PARSE]    Reading tech index: src/sample-data/techIndex.sample.json`);
    const techToCategoryMapping: Record<string, string> = {};
    (
      JSON5.parse(
        readFromFile("src/sample-data/techIndex.sample.json"),
      ) as TechIndexItem[]
    )?.forEach(({ Name, Category }) => {
      if (Name?.trim() && Category?.trim()) {
        techToCategoryMapping[Name.toUpperCase().trim()] = Category.trim();
      }
    });
    console.log(`[PARSE]    Tech index loaded — ${Object.keys(techToCategoryMapping).length} name→category mappings`);

    /* -------- TECH DATA -------- */
    console.log(`[PARSE]    Reading tech data: src/sample-data/techData.sample.json (utf16le)`);
    let techData: TechDataOutput[] = [];

    ndJsonToSafeJson<TechDataInput>(
      readFromFile("src/sample-data/techData.sample.json", "utf16le"),
    )?.forEach(({ D, T }) => {
      if (!D?.trim() || !Array.isArray(T)) return;

      const techArr = T?.filter(
        (v): v is { N?: string } =>
          typeof v === "object" && Boolean(v?.N?.trim()),
      )?.map(({ N }) => N!.trim());

      if (techArr?.length) {
        techData.push(
          ...techArr.map((t) => ({
            domain: D.toLowerCase().trim(),
            name: t,
            category: techToCategoryMapping?.[t.toUpperCase()],
          })),
        );
      }
    });

    // writeToFile(techData, "src/sample-data/techData.output.json");
    console.log(`[PARSE]    Tech data processed — ${techData.length} tech rows across ${new Set(techData.map((r) => r.domain)).size} domains`);

    /* -------- METADATA -------- */
    console.log(`[PARSE]    Reading metadata: src/sample-data/metaData.sample.json (utf16le)`);

    const metaDataDomainsMap: Record<string, boolean> = {};

    const metaData = ndJsonToSafeJson<MetaDataInput>(
      readFromFile("src/sample-data/metaData.sample.json", "utf16le"),
    )
      ?.map(({ D, C, CAT, ST, CO, Z, CN }): MetaDataOutput | {} => {
        const domain = D?.toLowerCase()?.trim() ?? "";

        if (!domain || metaDataDomainsMap[domain]) {
          return {};
        }

        metaDataDomainsMap[domain] = true;

        return {
          domain,
          name: CN?.trim(),
          category: CAT?.trim(),
          city: C?.trim(),
          state: ST?.trim(),
          country: CO?.trim(),
          zipcode: Z?.trim(),
        };
      })
      ?.filter((row): row is MetaDataOutput => Object.keys(row).length > 0);

    let metaOnlyDomains = 0;
    techData?.forEach(({ domain }) => {
      if (!metaDataDomainsMap?.[domain]) {
        metaDataDomainsMap[domain] = true;
        metaData.push({ domain });
        metaOnlyDomains++;
      }
    });

    // writeToFile(metaData, "src/sample-data/metaData.output.json");
    console.log(`[PARSE]    Metadata processed — ${metaData.length} total rows (${metaOnlyDomains} tech-only domain stubs added)`);

    /* -------- TRANSACTION -------- */
    console.log(`[DB]       Starting atomic transaction`);
    db.exec("BEGIN");

    try {
      console.log(`[DB]       Dropping existing tables (if any)`);
      db.exec(`
        DROP TABLE IF EXISTS companies_techdata;
        DROP TABLE IF EXISTS companies_metadata;
        `);

      console.log(`[DB]       Creating tables: companies_metadata, companies_techdata + indexes`);
      db.exec(`
        CREATE TABLE companies_metadata (
          domain TEXT PRIMARY KEY,
          name TEXT,
          category TEXT,
          city TEXT,
          state TEXT,
          country TEXT,
          zipcode TEXT
        );

        CREATE TABLE companies_techdata (
          name TEXT NOT NULL,
          category TEXT,
          domain TEXT NOT NULL,
          PRIMARY KEY (name, domain),
          FOREIGN KEY (domain)
            REFERENCES companies_metadata(domain)
            ON UPDATE CASCADE
            ON DELETE CASCADE
        );

        -- Indexes for companies_metadata
        CREATE INDEX idx_companies_metadata_category
          ON companies_metadata (category);

        CREATE INDEX idx_companies_metadata_country
          ON companies_metadata (country);

        -- Index for companies_techdata
        CREATE INDEX idx_companies_techdata_domain
          ON companies_techdata (domain);

        `);
      console.log(`[DB]       Tables and indexes created`);

      /* -------- INSERT METADATA -------- */
      console.log(`[DB]       Inserting ${metaData.length} metadata rows into companies_metadata`);
      const insertMeta = db.prepare(`
        INSERT INTO companies_metadata
        (domain, name, category, city, state, country, zipcode)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      for (const row of metaData) {
        insertMeta.run(
          row.domain,
          row.name ?? null,
          row.category ?? null,
          row.city ?? null,
          row.state ?? null,
          row.country ?? null,
          row.zipcode ?? null,
        );
      }
      console.log(`[DB]       companies_metadata insert complete — ${metaData.length} rows`);

      /* -------- INSERT TECH DATA -------- */
      console.log(`[DB]       Inserting ${techData.length} tech rows into companies_techdata`);
      const insertTech = db.prepare(`
        INSERT INTO companies_techdata
        (name, category, domain)
        VALUES (?, ?, ?)
      `);

      for (const row of techData) {
        insertTech.run(row.name, row.category ?? null, row.domain);
      }
      console.log(`[DB]       companies_techdata insert complete — ${techData.length} rows`);

      db.exec("COMMIT");
      console.log(`[DB]       Transaction committed successfully`);
      console.log(`[SETUP START] Setup complete — ${metaData.length} metadata rows, ${techData.length} tech rows`);
    } catch (err) {
      console.error(`[ERROR]    Error during transaction — rolling back`);
      if (err instanceof Error) {
        console.error(`[ERROR]    ${err.message}`);
        if (err.stack) console.error(`[ERROR]    Stack trace:\n${err.stack}`);
      }
      db.exec("ROLLBACK");
      throw err;
    }
  } catch (error) {
    console.error(`[ERROR]    Setup failed:`, error);
    if (error instanceof Error && error.stack) {
      console.error(`[ERROR]    Stack trace:\n${error.stack}`);
    }
  } finally {
    db.close();
    console.log(`[DB]       Database connection closed`);
  }
})();
