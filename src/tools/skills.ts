import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { parse as parseYaml } from "yaml";
import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { config } from "../config/env.js";

const FRONTMATTER_RE = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;

interface SkillMeta {
  name: string;
  description: string;
}

function readSkillsDir(): string {
  return join(config.skillsPath, "skills");
}

function listSkillNames(): string[] {
  const dir = readSkillsDir();
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((entry) => {
      if (entry === "shared") return false;
      const full = join(dir, entry);
      if (!statSync(full).isDirectory()) return false;
      return existsSync(join(full, "SKILL.md"));
    })
    .sort();
}

function readSkillMeta(name: string): SkillMeta | null {
  const path = join(readSkillsDir(), name, "SKILL.md");
  if (!existsSync(path)) return null;
  const raw = readFileSync(path, "utf8");
  const match = raw.match(FRONTMATTER_RE);
  if (!match) return null;
  try {
    const fm = parseYaml(match[1]) as any;
    if (!fm?.name || !fm?.description) return null;
    return {
      name: fm.name,
      description: String(fm.description).replace(/\s+/g, " ").trim(),
    };
  } catch {
    return null;
  }
}

function readSkillBody(name: string): string | null {
  const path = join(readSkillsDir(), name, "SKILL.md");
  if (!existsSync(path)) return null;
  return readFileSync(path, "utf8");
}

export function registerSkillTools(server: McpServer) {
  server.tool(
    "list_skills",
    "List all Cardano development skills (workflow guides) available from cardano-dev-skills. Each skill encodes a structured workflow for a common task — writing a validator, debugging a transaction, choosing tooling, etc. Use get_skill to retrieve the full workflow content.",
    {},
    async () => {
      const names = listSkillNames();
      const skills = names
        .map((n) => readSkillMeta(n))
        .filter((s): s is SkillMeta => s !== null);
      const text =
        skills.length === 0
          ? "No skills found. Check SKILLS_PATH configuration."
          : skills
              .map((s) => `**${s.name}** — ${s.description}`)
              .join("\n\n");
      return {
        content: [{ type: "text" as const, text }],
      };
    }
  );

  server.tool(
    "get_skill",
    "Retrieve the full workflow content of a specific Cardano development skill from cardano-dev-skills. Returns the raw SKILL.md (frontmatter + body) for the agent to follow step by step. Use list_skills first if you don't know the skill name.",
    {
      name: z
        .string()
        .describe(
          "The skill name (kebab-case), e.g. 'write-validator', 'explain-cip', 'debug-transaction'"
        ),
    },
    async ({ name }) => {
      const body = readSkillBody(name);
      if (body === null) {
        const available = listSkillNames();
        return {
          content: [
            {
              type: "text" as const,
              text: `Skill "${name}" not found. Available: ${available.join(", ")}`,
            },
          ],
          isError: true,
        };
      }
      return {
        content: [{ type: "text" as const, text: body }],
      };
    }
  );
}
