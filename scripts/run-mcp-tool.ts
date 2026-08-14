import { handleToolCall } from './mcp-server.js';
import fs from 'fs';

async function main() {
  const tool = process.argv[2];
  let argStr = process.argv[3] || '{}';
  if (argStr.startsWith('@')) {
    argStr = fs.readFileSync(argStr.slice(1), 'utf-8');
  }
  const args = JSON.parse(argStr);
  const result = await handleToolCall(tool, args);
  console.log(JSON.stringify(result));
  process.exit(0);
}

main().catch(console.error);
