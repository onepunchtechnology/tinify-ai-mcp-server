import * as path from "node:path";

interface OutputPathParams {
  inputPath: string;
  isUrl: boolean;
  filename: string;
  outputPath: string | undefined;
  outputFormat: string | undefined;
  cwd?: string;
}

function getTinifiedFilename(
  filename: string,
  outputFormat: string | undefined,
): string {
  const ext = path.extname(filename);
  const name = path.basename(filename, ext);

  let newExt: string;
  if (!outputFormat || outputFormat === "original") {
    newExt = ext || ".png";
  } else {
    newExt = `.${outputFormat}`;
  }

  return `${name}.tinified${newExt}`;
}

function isDirectoryPath(p: string): boolean {
  return p.endsWith("/") || p.endsWith(path.sep);
}

export function resolveOutputPath(params: OutputPathParams): string {
  const { inputPath, isUrl, filename, outputPath, outputFormat, cwd } = params;

  if (outputPath && !isDirectoryPath(outputPath)) {
    return path.resolve(outputPath);
  }

  const tinifiedName = getTinifiedFilename(filename, outputFormat);

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
