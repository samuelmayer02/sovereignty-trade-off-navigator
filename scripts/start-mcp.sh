#!/usr/bin/env bash

# This wrapper script ensures that the correct Node.js environment is loaded
# before starting the MCP server. This prevents ABI mismatch issues with
# native addons like better-sqlite3 when the MCP client (e.g. Antigravity)
# invokes the server using a system-wide Node executable.

# Change to the project directory
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR/.." || exit 1

# If a local nvm exists, load it so we get the exact node version
if [ -s "$HOME/.nvm/nvm.sh" ]; then
  \. "$HOME/.nvm/nvm.sh"
else
  # FNM, N or other managers typically hook into the interactive shell,
  # but npx below will usually pick up the path if run interactively.
  # We just ensure the PATH is standard.
  export PATH="/usr/local/bin:/opt/homebrew/bin:$PATH"
fi

# Run the MCP server using npx which guarantees we use the locally installed tsx and matching node
exec npx tsx scripts/mcp-server.ts
