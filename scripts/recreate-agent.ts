/**
 * Recreate the help-chat Managed Agent on a new model.
 * Reuses the existing ENV_ID, archives the old AGENT_ID, creates a fresh agent.
 *
 * Run: npx tsx scripts/recreate-agent.ts
 * Then update AGENT_ID in .env.local and on Cloud Run.
 */
import Anthropic from "@anthropic-ai/sdk";

const NEW_MODEL: "claude-sonnet-4-6" = "claude-sonnet-4-6";

if (!process.env.ANTHROPIC_API_KEY) {
  console.error("Error: ANTHROPIC_API_KEY is not set");
  process.exit(1);
}
if (!process.env.ENV_ID) {
  console.error("Error: ENV_ID is not set (read from .env.local)");
  process.exit(1);
}

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are an expert engineering assistant running inside a cloud container. You have access to bash, file operations, web search, and MCP tools. Use them proactively for analysis, evaluations, and long-running tasks.

Guidelines:
- Write output artifacts (reports, scripts, analysis) to /mnt/session/outputs/ so the user can download them.
- Cite sources when using web tools.
- Prefer concise, actionable responses.
- Use GitHub-flavored markdown — fenced code blocks with language tags, tables, lists, headings.
- For long-running tasks, provide progress updates via text output.`;

async function main() {
  const oldAgentId = process.env.AGENT_ID;
  const envId = process.env.ENV_ID!;

  const mcpServers: Array<{ type: "url"; name: string; url: string }> = [
    { type: "url", name: "microsoft-learn", url: "https://learn.microsoft.com/api/mcp" },
  ];
  if (process.env.BRIGHTDATA_API_TOKEN) {
    mcpServers.push({
      type: "url",
      name: "brightdata",
      url: `https://mcp.brightdata.com/mcp?token=${process.env.BRIGHTDATA_API_TOKEN}`,
    });
  } else {
    console.warn("Warning: BRIGHTDATA_API_TOKEN not set — BrightData MCP server will not be configured");
  }

  console.log(`Reusing environment: ${envId}`);
  console.log(`Creating new agent on model: ${NEW_MODEL}...`);
  const agent = await client.beta.agents.create({
    name: "help-chat-agent",
    model: NEW_MODEL,
    system: SYSTEM_PROMPT,
    tools: [
      { type: "agent_toolset_20260401" },
      ...mcpServers.map((s) => ({ type: "mcp_toolset" as const, mcp_server_name: s.name })),
    ],
    mcp_servers: mcpServers,
  });
  console.log(`Created agent: ${agent.id} (version: ${agent.version})`);

  if (oldAgentId && oldAgentId !== agent.id) {
    console.log(`Archiving old agent: ${oldAgentId}...`);
    try {
      await client.beta.agents.archive(oldAgentId);
      console.log(`Archived old agent: ${oldAgentId}`);
    } catch (err) {
      console.warn(`Failed to archive old agent ${oldAgentId}:`, (err as Error).message);
    }
  }

  console.log("\n=== Update these in .env.local AND on Cloud Run ===");
  console.log(`AGENT_ID=${agent.id}`);
  console.log(`ENV_ID=${envId}`);
  console.log("===================================================");
}

main().catch((err) => {
  console.error("Recreate failed:", err);
  process.exit(1);
});
