import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { exportCategoryImpactsToJson, exportConflictsToJson } from "../lib/sync";
import OpenAI from "openai";
import "dotenv/config";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const url = process.env.DATABASE_URL || 'file:./prisma/dev.db';
const adapter = new PrismaBetterSqlite3({ url });
const prisma = new PrismaClient({ adapter });

// --- CONFIGURATION ---
const LLM_API_URL = process.env.LLM_API_URL || "https://api.openai.com/v1";
const LLM_API_KEY = process.env.LLM_API_KEY;
const LLM_MODEL = process.env.LLM_MODEL || "gpt-4o-mini";
const BATCH_SIZE = parseInt(process.env.BATCH_SIZE || "20", 10);
const DELAY_BETWEEN_BATCHES_MS = parseInt(process.env.DELAY_BETWEEN_BATCHES_MS || "4000", 10);

if (!LLM_API_KEY) {
  console.error("Missing LLM_API_KEY environment variable. Run with LLM_API_KEY=... tsx scripts/bootstrap-impacts.ts");
  process.exit(1);
}

// --- SYSTEM PROMPT ---
const SYSTEM_PROMPT = `Du bist ein Experte für Cloud-Architektur, verteilte Systeme, Hochverfügbarkeit (HA) und Digitale Souveränität. Deine Aufgabe ist es, architektonische Anforderungen systematisch auf Zielkonflikte zu evaluieren.

Als theoretisches Fundament dienen dir die folgenden Trade-off-Konflikte (TCs) aus der zugrundeliegenden wissenschaftlichen Thesis:
- TC-1 (Abstraktionsgrad): Native PaaS/SaaS (hohe HA, tiefer Lock-in) vs. Agnostische Abstraktion (hohe Souveränität, hohe operationelle Fehleranfälligkeit).
- TC-2 (Operative Komplexität): Zentralisiertes Provider-Management (hohe HA) vs. Multi-Cloud-Orchestrierung (hohe Souveränität, hohes Fehlerrisiko).
- TC-3 (Netzwerk & Latenz): Proprietäre Provider-Backbones (minimale Latenz für PACELC) vs. Öffentliches Internet/Standard-Peering (Souveränität, Latenz-Steuer).
- TC-4 (Geografische Redundanz): Globale Failover-Zonen (hohe HA) vs. Datenlokalisierung/Sovereign Landing Zones (Souveränität, Isolations-Risiko).
- TC-5 (Datenkonsistenz): Global replizierte Provider-Datenbanken (hohe HA) vs. Agnostische Replikation/eigener Konsens (Souveränität, Split-Brain-Risiko).
- TC-6 (Innovationsgeschwindigkeit): Sofortiger Zugriff auf HA-Features vs. Feature-Lag in zertifizierten Sovereign Clouds.
- TC-7 (Kryptographische Kontrolle): Integriertes Provider-KMS vs. Externes KMS/HYOK (Souveränität, aber Single Point of Failure).
- TC-8 (Ökonomische Hochverfügbarkeit): Skaleneffekte (OpEx) vs. Hohe Wechselkosten (Data Egress)/Lock-in.

Du antwortest IMMER in einem strikten JSON-Format wie angefordert.
`;

const openai = new OpenAI({
  baseURL: LLM_API_URL,
  apiKey: LLM_API_KEY
});

// --- LLM CALL WRAPPER ---
async function callLLM(prompt: string): Promise<any> {
  console.log(`[LLM] Sende Request an ${LLM_MODEL} auf ${LLM_API_URL}...`);
  const startTime = Date.now();
  
  const payload: any = {
    model: LLM_MODEL,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: prompt }
    ],
    temperature: 0.2, // lowered temperature back down to avoid malformed json
    top_p: 0.95,
    max_tokens: 16384,
  };

  // Model-specific payload tweaks for NVIDIA endpoint quirks
  if (LLM_MODEL.includes("nemotron")) {
    payload.chat_template_kwargs = { enable_thinking: true };
    payload.reasoning_budget = 16384;
  } else if (LLM_MODEL.includes("deepseek")) {
    payload.chat_template_kwargs = { thinking: false };
  } else {
    // For general OpenAI models, explicitly require JSON
    payload.response_format = { type: "json_object" };
  }

  let attempt = 0;
  const maxRetries = 5;

  while (attempt < maxRetries) {
    try {
      const completion = await openai.chat.completions.create(payload);

      // We are not streaming because we need the final JSON. 
      // The nemotron model will return the reasoning in reasoning_content (if supported) and the actual json in the content.
      let content = completion.choices[0].message.content || "";
      
      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`[LLM] Antwort erhalten nach ${duration} Sekunden.`);
      
      // Clean markdown json blocks if present
      if (content.startsWith("\`\`\`json")) {
        content = content.replace(/^\`\`\`json\n/, "").replace(/\n\`\`\`$/, "");
      } else if (content.startsWith("\`\`\`")) {
        content = content.replace(/^\`\`\`\n/, "").replace(/\n\`\`\`$/, "");
      }

      try {
        const parsed = JSON.parse(content);
        console.log(`[LLM] JSON erfolgreich geparst (${parsed.results?.length || 0} Ergebnisse gefunden).`);
        return parsed;
      } catch (e) {
        console.error("[LLM] Fehler beim Parsen des JSON-Outputs:", content.substring(0, 200) + "...");
        throw e;
      }
    } catch (error: any) {
      if (error.status === 429 || error.status >= 500 || error.message?.includes("429")) {
        attempt++;
        const waitTime = Math.pow(2, attempt) * 2000; // 4s, 8s, 16s, 32s, 64s
        console.warn(`[WARN] Rate Limit oder Server Fehler (${error.status || '429'}). Warte ${waitTime / 1000}s und starte erneuten Versuch (${attempt}/${maxRetries})...`);
        await sleep(waitTime);
      } else {
        throw error;
      }
    }
  }
  throw new Error("Maximale Anzahl an Retries überschritten. Breche Batch ab.");
}

// --- PHASE 1: CATEGORY IMPACTS ---
async function bootstrapCategoryImpacts() {
  console.log("--- PHASE 1: Bootstrapping Category Impacts ---");
  const reqs = await prisma.requirement.findMany();
  const categories = await prisma.category.findMany();
  const existing = await prisma.categoryImpact.findMany();
  const existingSet = new Set(existing.map(i => `${i.requirementId}:${i.categoryName}`));

  const unrated = [];
  for (const req of reqs) {
    for (const cat of categories) {
      if (!existingSet.has(`${req.uid}:${cat.name}`)) {
        unrated.push({ req, cat });
      }
    }
  }

  console.log(`Found ${unrated.length} unrated CategoryImpact pairs.`);

  for (let i = 0; i < unrated.length; i += BATCH_SIZE) {
    const batch = unrated.slice(i, i + BATCH_SIZE);
    console.log(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1} of ${Math.ceil(unrated.length / BATCH_SIZE)} (Size: ${batch.length})...`);
    
    const prompt = `[FALLS REQ vs CATEGORY]:
Bewerte für die folgenden Paare von Anforderungen und Kategorien die Auswirkungen.
Referenziere zwingend einen oder mehrere der TCs (z.B. [TC-4]), um deine Bewertung wissenschaftlich zu fundieren.

Zu bewertende Paare:
${batch.map((p, idx) => `ID ${idx}: Anforderung "${p.req.name}" (${p.req.description}) vs. Kategorie "${p.cat.name}"`).join('\n')}

Antworte mit einem strikten JSON-Objekt, das ein Array "results" enthält:
{
  "results": [
    {
      "id": <ID_NUMMER>,
      "status": "red" | "orange" | "green" | "gray",
      "reasoning": "<Deine ausführliche Begründung mit TC-Referenz>"
    }
  ]
}
`;

    try {
      const result = await callLLM(prompt);
      
      let savedCount = 0;
      for (const res of result.results) {
        const pair = batch[res.id];
        if (!pair) {
          console.warn(`[WARN] Ungültige ID vom LLM zurückgegeben: ${res.id}`);
          continue;
        }
        await prisma.categoryImpact.create({
          data: {
            requirementId: pair.req.uid,
            categoryName: pair.cat.name,
            status: res.status,
            reasoning: res.reasoning
          }
        });
        savedCount++;
      }
      console.log(`[DB] Synchronisiere Kategorie-Bewertungen ins Dateisystem...`);
      await exportCategoryImpactsToJson();
      console.log(`[SUCCESS] Batch von ${savedCount} Paaren erfolgreich in der DB und als JSON gespeichert.\n`);
      
      if (DELAY_BETWEEN_BATCHES_MS > 0) {
        console.log(`[SYS] Warte ${DELAY_BETWEEN_BATCHES_MS / 1000}s bis zum nächsten Batch (Rate Limit Schutz)...`);
        await sleep(DELAY_BETWEEN_BATCHES_MS);
      }
    } catch (e: any) {
      console.error(`[ERROR] Fehler in Batch: ${e.message}\n`);
      // Break on error so we can resume later
      break;
    }
  }
}

// --- PHASE 2: CONFLICTS ---
async function bootstrapConflicts() {
  console.log("--- PHASE 2: Bootstrapping Conflicts (Req vs Req) ---");
  const reqs = await prisma.requirement.findMany();
  const existing = await prisma.conflict.findMany();
  const existingSet = new Set(existing.map(c => `${c.req1Id}:${c.req2Id}`));

  const unratedPairs = [];
  for (let i = 0; i < reqs.length; i++) {
    for (let j = i + 1; j < reqs.length; j++) {
      const [id1, id2] = [reqs[i].uid, reqs[j].uid].sort();
      if (!existingSet.has(`${id1}:${id2}`)) {
        const r1 = id1 === reqs[i].uid ? reqs[i] : reqs[j];
        const r2 = id1 === reqs[i].uid ? reqs[j] : reqs[i];
        unratedPairs.push({ r1, r2 });
      }
    }
  }

  console.log(`Found ${unratedPairs.length} unrated Requirement vs Requirement pairs.`);

  for (let i = 0; i < unratedPairs.length; i += BATCH_SIZE) {
    const batch = unratedPairs.slice(i, i + BATCH_SIZE);
    console.log(`Processing conflict batch ${Math.floor(i / BATCH_SIZE) + 1} of ${Math.ceil(unratedPairs.length / BATCH_SIZE)} (Size: ${batch.length})...`);
    
    const prompt = `[FALLS REQ vs REQ]:
Bewerte den Zielkonflikt zwischen Anforderung A und Anforderung B für die folgenden Paare.
Gibt es einen inhärenten Konflikt, wenn ein Architekt versucht, beide Anforderungen gleichzeitig zu erfüllen? 
Referenziere zwingend die TCs in deiner Begründung. Gib zudem einen Best-Practice-Ansatz an, wie dieser Konflikt architektonisch gelöst oder gemildert werden kann.

Zu bewertende Paare:
${batch.map((p, idx) => `ID ${idx}: "${p.r1.name}" (${p.r1.description}) vs. "${p.r2.name}" (${p.r2.description})`).join('\n')}

Antworte mit einem strikten JSON-Objekt, das ein Array "results" enthält:
{
  "results": [
    {
      "id": <ID_NUMMER>,
      "status": "red" | "orange" | "green" | "blue",
      "conflict_text": "<Deine ausführliche Begründung mit TC-Referenz. Sag 'Kein Konflikt' wenn status=blue/green>",
      "best_practice": "<Best Practice oder Lösungsansatz>"
    }
  ]
}

Status-Werte: 
- red: Starker Trade-off (fundamental)
- orange: Moderater Trade-off (lösbar, aber komplex)
- green: Synergie (begünstigen sich)
- blue: Kein Konflikt / Neutral
`;

    try {
      const result = await callLLM(prompt);
      
      let savedCount = 0;
      for (const res of result.results) {
        const pair = batch[res.id];
        if (!pair) {
          console.warn(`[WARN] Ungültige ID vom LLM zurückgegeben: ${res.id}`);
          continue;
        }
        await prisma.conflict.create({
          data: {
            req1Id: pair.r1.uid,
            req2Id: pair.r2.uid,
            status: res.status,
            conflictText: res.conflict_text,
            bestPractice: res.best_practice
          }
        });
        savedCount++;
      }
      console.log(`[DB] Synchronisiere Matrix-Konflikte ins Dateisystem...`);
      await exportConflictsToJson();
      console.log(`[SUCCESS] Batch von ${savedCount} Paaren erfolgreich in der DB und als JSON gespeichert.\n`);
      
      if (DELAY_BETWEEN_BATCHES_MS > 0) {
        console.log(`[SYS] Warte ${DELAY_BETWEEN_BATCHES_MS / 1000}s bis zum nächsten Batch (Rate Limit Schutz)...`);
        await sleep(DELAY_BETWEEN_BATCHES_MS);
      }
    } catch (e: any) {
      console.error(`[ERROR] Fehler in Batch: ${e.message}\n`);
      break;
    }
  }
}

async function main() {
  await bootstrapCategoryImpacts();
  await bootstrapConflicts();
  console.log("Bootstrapping complete!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
