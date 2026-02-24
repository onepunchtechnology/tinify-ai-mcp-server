import { exec } from "node:child_process";

export function openBrowser(url: string): boolean {
  const platform = process.platform;
  let command: string;

  if (platform === "darwin") {
    command = `open "${url}"`;
  } else if (platform === "win32") {
    command = `start "" "${url}"`;
  } else {
    command = `xdg-open "${url}"`;
  }

  let success = true;
  exec(command, (error) => {
    if (error) success = false;
  });
  return success;
}
