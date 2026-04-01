import type { FormatHandler, Section } from "./index.js";
import { registerFormat } from "./index.js";

const tomlHandler: FormatHandler = {
  extensions: [".toml"],

  sniff(content: string): boolean {
    const head = content.slice(0, 1000);
    // TOML markers: [section], key = value
    if (/^\[[\w.-]+\]/m.test(head)) return true;
    if (/^\w[\w-]*\s*=\s*/m.test(head)) return true;
    return false;
  },

  preprocess(content: string): string {
    return content;
  },

  splitSections(content: string): Section[] {
    // TOML files are config — treat as a single section
    return [{ title: "", content }];
  },
};

registerFormat("toml", tomlHandler);
