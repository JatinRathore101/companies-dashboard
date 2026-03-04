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
 */
const ndJsonToSafeJson = <T = any>(content: string): T[] => {
  let lineNumber = 0;

  return content
    ?.split("\n")
    ?.map((line) => {
      lineNumber++;

      const i = line.indexOf("{");
      const j = line.lastIndexOf("}");

      if (i === -1 || j === -1 || j < i) {
        return null;
      }

      const jsonLine = line.slice(i, j + 1);

      try {
        return JSON5.parse(jsonLine) as T;
      } catch (error) {
        console.error(
          "Invalid JSON in line:",
          lineNumber,
          " | ERROR ~ ",
          error,
        );
        return false;
      }
    })
    ?.filter(Boolean) as T[];
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
  const dbPath = path.join(process.cwd(), "database.sqlite");
  const db = new Database(dbPath);

  db.pragma("foreign_keys = ON");

  console.log("✅ Connected to SQLite");

  try {
    console.log("📖 Parsing tech index...");
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

    console.log("📖 Parsing tech data...");
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
    console.log(`✅ Parsed ${techData.length} tech rows`);

    console.log("📖 Parsing metadata...");

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

    techData?.forEach(({ domain }) => {
      if (!metaDataDomainsMap?.[domain]) {
        metaDataDomainsMap[domain] = true;
        metaData.push({ domain });
      }
    });

    // writeToFile(metaData, "src/sample-data/metaData.output.json");
    console.log(`✅ Parsed ${metaData.length} metadata rows`);

    /* ---------------- SINGLE ATOMIC TRANSACTION ---------------- */

    console.log("🚀 Starting transaction...");

    db.exec("BEGIN");

    try {
      console.log("📦 Removing tables if found...");

      db.exec(`
        DROP TABLE IF EXISTS companies_techdata;
        DROP TABLE IF EXISTS companies_metadata;
        `);

      console.log("📦 Creating tables...");

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

      console.log("💾 Inserting metadata...");
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

      console.log("💾 Inserting tech data...");
      const insertTech = db.prepare(`
        INSERT INTO companies_techdata
        (name, category, domain)
        VALUES (?, ?, ?)
      `);

      for (const row of techData) {
        insertTech.run(row.name, row.category ?? null, row.domain);
      }

      db.exec("COMMIT");
      console.log("🎉 Transaction committed successfully");
    } catch (err) {
      console.error("❌ Error occurred, rolling back...");
      db.exec("ROLLBACK");
      throw err;
    }
  } catch (error) {
    console.error("❌ Setup failed:", error);
  } finally {
    db.close();
    console.log("🔒 Database connection closed");
  }
})();
