/**
 * Temporary file to verify MCP can push to this repo.
 * Safe to delete after testing.
 */
export const MCP_TEST_MARKER = 'mcp-push-ok';

export function mcpTestPing() {
  return MCP_TEST_MARKER;
}
