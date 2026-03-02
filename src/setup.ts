import fs from "fs";
import path from "path";
import JSON5 from "json5";

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
        console.error(
          "--------------------------------------------------------------------------------------------------",
        );
        return false;
      }
    })
    ?.filter(Boolean) as T[];
};

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

((): void => {
  const metaData = ndJsonToSafeJson<MetaDataInput>(
    readFromFile("src/sample-data/metaData.sample.json", "utf16le"),
  )
    ?.map(
      ({ D, C, CAT, ST, CO, Z, CN }): MetaDataOutput => ({
        domain: D?.toLowerCase()?.trim() ?? "",
        name: CN?.trim(),
        category: CAT?.trim(),
        city: C?.trim(),
        state: ST?.trim(),
        country: CO?.trim(),
        zipcode: Z?.trim(),
      }),
    )
    ?.filter(({ domain }) => Boolean(domain));

  writeToFile(metaData, "src/sample-data/metaData.output.json");

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

  let techData: TechDataOutput[] = [];

  ndJsonToSafeJson<TechDataInput>(
    readFromFile("src/sample-data/techData.sample.json", "utf16le"),
  )?.forEach(({ D, T }) => {
    let techArr: string[] | undefined;

    if (Array.isArray(T)) {
      techArr = T?.filter(
        (v): v is { N?: string } =>
          typeof v === "object" && Boolean(v?.N?.trim()),
      )?.map(({ N }) => N!.trim());
    }

    if (D?.trim() && techArr?.length) {
      techData = [
        ...techData,
        ...techArr.map((t) => ({
          domain: D.toLowerCase().trim(),
          name: t,
          category: techToCategoryMapping?.[t.toUpperCase()],
        })),
      ];
    }
  });

  writeToFile(techData, "src/sample-data/techData.output.json");
})();
