import type { McpServerConfig } from "@anthropic-ai/claude-agent-sdk";

/**
 * MCP configuration structure
 */
interface McpConfigFile {
  mcpServers: Record<string, {
    command: string;
    args?: string[];
    env?: Record<string, string>;
  }>;
}

/**
 * Reads MCP server configurations from MCP_SERVERS env var.
 * Format: JSON string with { mcpServers: { ... } }
 *
 * @returns Record of server name to server config, or empty object if not configured
 */
export function getMcpServers(): Record<string, McpServerConfig> {
  const configContent = process.env.MCP_SERVERS;

  if (!configContent) {
    return {};
  }

  try {
    const config = JSON.parse(configContent) as McpConfigFile;

    if (!config.mcpServers || typeof config.mcpServers !== "object") {
      console.error("MCP_SERVERS must have an 'mcpServers' object");
      return {};
    }

    const mcpServers: Record<string, McpServerConfig> = {};

    for (const [name, server] of Object.entries(config.mcpServers)) {
      if (!server.command) {
        console.error(`MCP server '${name}' must have a 'command' field`);
        continue;
      }

      mcpServers[name] = {
        type: "stdio",
        command: server.command,
        args: server.args,
        env: server.env,
      };
    }

    return mcpServers;
  } catch (error) {
    console.error("Failed to parse MCP_SERVERS:", error);
    return {};
  }
}
