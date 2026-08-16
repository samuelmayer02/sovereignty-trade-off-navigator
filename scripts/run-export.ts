import { exportConflictsToJson } from "../lib/sync";
async function run() {
  await exportConflictsToJson();
  console.log("Export finished.");
}
run().catch(console.error);
