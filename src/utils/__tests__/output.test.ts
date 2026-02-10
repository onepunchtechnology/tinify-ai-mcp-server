import { describe, it, expect } from "vitest";
import { resolveOutputPath } from "../output.js";

describe("resolveOutputPath", () => {
  it("saves next to original with tinified suffix", () => {
    expect(
      resolveOutputPath({
        inputPath: "/Users/me/img/hero.png",
        isUrl: false,
        filename: "hero.png",
        outputPath: undefined,
        outputFormat: undefined,
      })
    ).toBe("/Users/me/img/hero.tinified.png");
  });

  it("uses new extension on format change", () => {
    expect(
      resolveOutputPath({
        inputPath: "/Users/me/img/hero.png",
        isUrl: false,
        filename: "hero.png",
        outputPath: undefined,
        outputFormat: "webp",
      })
    ).toBe("/Users/me/img/hero.tinified.webp");
  });

  it("uses explicit output path as-is", () => {
    expect(
      resolveOutputPath({
        inputPath: "/Users/me/img/hero.png",
        isUrl: false,
        filename: "hero.png",
        outputPath: "/Users/me/dist/hero.webp",
        outputFormat: "webp",
      })
    ).toBe("/Users/me/dist/hero.webp");
  });

  it("appends tinified filename to directory output_path", () => {
    expect(
      resolveOutputPath({
        inputPath: "/Users/me/img/hero.png",
        isUrl: false,
        filename: "hero.png",
        outputPath: "/Users/me/dist/",
        outputFormat: undefined,
      })
    ).toBe("/Users/me/dist/hero.tinified.png");
  });

  it("saves URL input to CWD with tinified suffix", () => {
    expect(
      resolveOutputPath({
        inputPath: "https://cdn.example.com/photo.jpg",
        isUrl: true,
        filename: "photo.jpg",
        outputPath: undefined,
        outputFormat: undefined,
        cwd: "/Users/me/project",
      })
    ).toBe("/Users/me/project/photo.tinified.jpg");
  });

  it("saves URL to output directory with tinified suffix", () => {
    expect(
      resolveOutputPath({
        inputPath: "https://cdn.example.com/photo.jpg",
        isUrl: true,
        filename: "photo.jpg",
        outputPath: "/Users/me/assets/",
        outputFormat: undefined,
      })
    ).toBe("/Users/me/assets/photo.tinified.jpg");
  });

  it("handles URL with format conversion", () => {
    expect(
      resolveOutputPath({
        inputPath: "https://cdn.example.com/photo.jpg",
        isUrl: true,
        filename: "photo.jpg",
        outputPath: undefined,
        outputFormat: "webp",
        cwd: "/Users/me/project",
      })
    ).toBe("/Users/me/project/photo.tinified.webp");
  });

  it("uses fallback filename for URLs without clear name", () => {
    expect(
      resolveOutputPath({
        inputPath: "https://api.example.com/image?id=123",
        isUrl: true,
        filename: "image",
        outputPath: undefined,
        outputFormat: "png",
        cwd: "/Users/me/project",
      })
    ).toBe("/Users/me/project/image.tinified.png");
  });

  it("treats 'original' format as keeping input extension", () => {
    expect(
      resolveOutputPath({
        inputPath: "/Users/me/hero.png",
        isUrl: false,
        filename: "hero.png",
        outputPath: undefined,
        outputFormat: "original",
      })
    ).toBe("/Users/me/hero.tinified.png");
  });
});
