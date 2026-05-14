import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { parse as parseYaml } from "yaml";
import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { config } from "../config/env.js";
import type { VectorDB } from "../db/vectordb.js";

interface SkillFrontmatter {
  name: string;
  description: string;
}

interface Skill {
  name: string;
  description: string;
  body: string;
}

const FRONTMATTER_RE = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;

function parseSkill(skillDir: string): Skill | null {
  const path = join(skillDir, "SKILL.md");
  if (!existsSync(path)) return null;
  const raw = readFileSync(path, "utf8");
  const match = raw.match(FRONTMATTER_RE);
  if (!match) return null;

  let fm: SkillFrontmatter;
  try {
    fm = parseYaml(match[1]) as SkillFrontmatter;
  } catch {
    return null;
  }
  if (!fm?.name || !fm?.description) return null;

  return {
    name: fm.name,
    description: fm.description.replace(/\s+/g, " ").trim(),
    body: match[2].trim(),
  };
}

function loadSkills(): Skill[] {
  const skillsDir = join(config.skillsPath, "skills");
  if (!existsSync(skillsDir)) {
    console.warn(`Skills dir not found: ${skillsDir} — no skill prompts registered.`);
    return [];
  }
  const skills: Skill[] = [];
  for (const entry of readdirSync(skillsDir)) {
    const dir = join(skillsDir, entry);
    if (!statSync(dir).isDirectory()) continue;
    if (entry === "shared") continue; // shared references, not a skill
    const skill = parseSkill(dir);
    if (skill) skills.push(skill);
  }
  return skills.sort((a, b) => a.name.localeCompare(b.name));
}

export function registerPrompts(server: McpServer, _db: VectorDB) {
  const skills = loadSkills();
  for (const skill of skills) {
    server.prompt(
      skill.name,
      skill.description,
      {
        request: z
          .string()
          .optional()
          .describe(
            "User's specific question or context. Optional — if omitted, the skill workflow guides general engagement."
          ),
      },
      async ({ request }) => {
        const intro = request
          ? `User request: ${request}\n\nFollow the workflow below. Use the MCP \`search_docs\` tool to pull bundled Cardano documentation as needed.\n\n---\n\n`
          : `Follow the skill workflow below. Use the MCP \`search_docs\` tool to pull bundled Cardano documentation as needed.\n\n---\n\n`;
        return {
          messages: [
            {
              role: "user" as const,
              content: {
                type: "text" as const,
                text: intro + skill.body,
              },
            },
          ],
        };
      }
    );
  }
  console.log(`  Registered ${skills.length} skill prompts from ${config.skillsPath}`);
}
