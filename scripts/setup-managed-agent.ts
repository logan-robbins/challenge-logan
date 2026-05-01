/**
 * ONE-TIME SETUP — creates the Managed Agents environment + agent.
 * Run once: npx tsx scripts/setup-managed-agent.ts
 * Then add the printed IDs to .env.local.
 */
import Anthropic from "@anthropic-ai/sdk";

if (!process.env.ANTHROPIC_API_KEY) {
  console.error("Error: ANTHROPIC_API_KEY is not set");
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

async function setup() {
  console.log("Creating environment...");
  const env = await client.beta.environments.create({
    name: "help-chat-env",
    config: {
      type: "cloud",
      networking: { type: "unrestricted" },
    },
  });
  console.log(`Created environment: ${env.id}`);

  const mcpServers: Array<{ type: "url"; name: string; url: string }> = [
    {
      type: "url",
      name: "microsoft-learn",
      url: "https://learn.microsoft.com/api/mcp",
    },
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

  console.log("Creating agent...");
  const agent = await client.beta.agents.create({
    name: "help-chat-agent",
    model: "claude-opus-4-7",
    system: SYSTEM_PROMPT,
    tools: [
      { type: "agent_toolset_20260401" },
      ...mcpServers.map((s) => ({ type: "mcp_toolset" as const, mcp_server_name: s.name })),
    ],
    mcp_servers: mcpServers,
  });
  console.log(`Created agent: ${agent.id} (version: ${agent.version})`);

  console.log("\n=== Add these to your .env.local ===");
  console.log(`ENV_ID=${env.id}`);
  console.log(`AGENT_ID=${agent.id}`);
  console.log("=====================================");
}

setup().catch((err) => {
  console.error("Setup failed:", err);
  process.exit(1);
});
