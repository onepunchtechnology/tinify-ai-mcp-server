import * as fs from "node:fs";
import * as path from "node:path";

interface OutputPathParams {
  inputPath: string;
  isUrl: boolean;
  filename: string;
  outputPath: string | undefined;
  outputFormat: string | undefined;
  seoFilename?: string;
  cwd?: string;
}

function getTinifiedFilename(
  filename: string,
  outputFormat: string | undefined,
  seoFilename?: string,
): string {
  const ext = path.extname(filename);

  let newExt: string;
  if (!outputFormat || outputFormat === "original") {
    newExt = ext || ".png";
  } else {
    newExt = `.${outputFormat}`;
  }

  if (seoFilename) {
    return `${seoFilename}${newExt}`;
  }

  const name = path.basename(filename, ext);
  return `${name}.tinified${newExt}`;
}

function isDirectoryPath(p: string): boolean {
  return p.endsWith("/") || p.endsWith(path.sep);
}

export function resolveOutputPath(params: OutputPathParams): string {
  const { inputPath, isUrl, filename, outputPath, outputFormat, seoFilename, cwd } = params;

  if (outputPath && !isDirectoryPath(outputPath)) {
    return path.resolve(outputPath);
  }

  const tinifiedName = getTinifiedFilename(filename, outputFormat, seoFilename);

  if (outputPath && isDirectoryPath(outputPath)) {
    return path.join(path.resolve(outputPath), tinifiedName);
  }

  if (isUrl) {
    const baseDir = cwd ?? process.cwd();
    return path.join(baseDir, tinifiedName);
  }

  const inputDir = path.dirname(path.resolve(inputPath));
  return path.join(inputDir, tinifiedName);
}

export function resolveUniqueOutputPath(params: OutputPathParams): string {
  let outputPath = resolveOutputPath(params);
  if (!fs.existsSync(outputPath)) return outputPath;

  const ext = path.extname(outputPath);
  const base = outputPath.slice(0, -ext.length || undefined);
  let counter = 2;
  while (fs.existsSync(`${base}-${counter}${ext}`)) {
    counter++;
  }
  return `${base}-${counter}${ext}`;
}
