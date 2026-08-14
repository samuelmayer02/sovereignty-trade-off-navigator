import { exportConflictsToJson, exportCategoryImpactsToJson } from "../lib/sync";
async function run() {
  await exportConflictsToJson();
  await exportCategoryImpactsToJson();
  console.log("Export finished.");
}
run().catch(console.error);
