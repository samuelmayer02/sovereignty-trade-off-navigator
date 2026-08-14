export interface TreeProvenance {
  treeId: string;
  treeTitle: string;
  resultTitle: string;
  level?: number;
  questionName?: string;
  questionText?: string;
  optionLabel?: string;
  businessValue?: number;
  techRisk?: number;
  notes?: string;
}

export interface ScenarioProvenance {
  scenarioId: string;
  scenarioTopic: string;
  metricQuestion?: string;
  optionLabel: string;
  optionDescription?: string;
  businessValue: number;
  risk: number;
  notes: string;
}

export interface ManualProvenance {
  title: string;
  optionLabel: string;
}

export type Provenance =
  | { source: 'tree'; data: TreeProvenance }
  | { source: 'scenario'; data: ScenarioProvenance }
  | { source: 'manual'; data: ManualProvenance };

export function findTreeProvenance(reqUid: string, treeResults: Record<string, any>, allTrees: any[]): TreeProvenance | null {
  for (const [treeId, result] of Object.entries(treeResults)) {
    if (!(result as any).referenced_requirements?.includes(reqUid)) continue;
    const tree = allTrees.find(t => t.id === treeId);
    const resultNode = tree?.results?.[(result as any).resultNode];
    const level = resultNode?.level ?? 0;

    const questionNodeKey = `q${Math.max(1, level)}`;
    const questionNode = tree?.nodes?.[questionNodeKey] || tree?.nodes?.['q1'];
    const questionName = questionNode?.name;
    const questionText = questionNode?.text;

    let optionLabel = '';
    if (tree && tree.nodes) {
      for (const node of Object.values(tree.nodes) as any[]) {
        const opt = node.options?.find((o: any) => o.target === (result as any).resultNode);
        if (opt) {
          optionLabel = opt.label;
          break;
        }
      }
    }
    
    let totalBv = 0;
    let totalTr = 0;
    let count = 0;
    let comments: string[] = [];
    if ((result as any).evaluations) {
      Object.values((result as any).evaluations).forEach((evalData: any) => {
        if (evalData.businessValue !== undefined || evalData.techRisk !== undefined) {
          totalBv += evalData.businessValue || 0;
          totalTr += evalData.techRisk || 0;
          count++;
        }
        if (evalData.comment && evalData.comment.trim()) comments.push(evalData.comment.trim());
      });
    }
    const businessValue = count > 0 ? Math.round(totalBv / count) : undefined;
    const techRisk = count > 0 ? Math.round(totalTr / count) : undefined;
    const notes = comments.join(' | ');

    return {
      treeId,
      treeTitle: tree?.title ?? treeId,
      resultTitle: resultNode?.title ?? (result as any).resultNode,
      level,
      questionName,
      questionText,
      optionLabel,
      businessValue,
      techRisk,
      notes
    };
  }
  return null;
}

export function findScenarioProvenance(reqUid: string, scenarioResults: Record<string, any>, allScenarios: any[]): ScenarioProvenance | null {
  for (const [scenarioId, result] of Object.entries(scenarioResults)) {
    const scenario = allScenarios.find(s => s.scenario_id === scenarioId);
    if (!scenario) continue;
    const option = scenario.options[(result as any).optionIndex];
    if (!option?.referenced_requirements?.includes(reqUid)) continue;
    return {
      scenarioId,
      scenarioTopic: scenario.topic,
      metricQuestion: scenario.metric_question || scenario.stimulus,
      optionLabel: option.label,
      optionDescription: option.description,
      businessValue: (result as any).businessValue,
      risk: (result as any).risk,
      notes: (result as any).notes || '',
    };
  }
  return null;
}

export function getAllProvenances(
  id: string,
  treeResults: Record<string, any>,
  scenarioResults: Record<string, any>,
  allTrees: any[],
  allScenarios: any[],
  isManual: boolean = false
): Provenance[] {
  const list: Provenance[] = [];

  for (const [treeId, result] of Object.entries(treeResults || {})) {
    if (!(result as any).referenced_requirements?.includes(id)) continue;
    const tree = allTrees?.find(t => t.id === treeId);
    const resultNode = tree?.results?.[(result as any).resultNode];
    const level = resultNode?.level ?? 0;

    const questionNodeKey = `q${Math.max(1, level)}`;
    const questionNode = tree?.nodes?.[questionNodeKey] || tree?.nodes?.['q1'];
    const questionName = questionNode?.name;
    const questionText = questionNode?.text;

    let optionLabel = '';
    if (tree && tree.nodes) {
      for (const node of Object.values(tree.nodes) as any[]) {
        const opt = node.options?.find((o: any) => o.target === (result as any).resultNode);
        if (opt) {
          optionLabel = opt.label;
          break;
        }
      }
    }

    let totalBv = 0;
    let totalTr = 0;
    let count = 0;
    let comments: string[] = [];
    if ((result as any).evaluations) {
      Object.values((result as any).evaluations).forEach((evalData: any) => {
        if (evalData.businessValue !== undefined || evalData.techRisk !== undefined) {
          totalBv += evalData.businessValue || 0;
          totalTr += evalData.techRisk || 0;
          count++;
        }
        if (evalData.comment && evalData.comment.trim()) {
          comments.push(evalData.comment.trim());
        }
      });
    }
    const businessValue = count > 0 ? Math.round(totalBv / count) : undefined;
    const techRisk = count > 0 ? Math.round(totalTr / count) : undefined;
    const notes = comments.join(' | ');

    list.push({
      source: 'tree',
      data: {
        treeId,
        treeTitle: tree?.title ?? treeId,
        resultTitle: resultNode?.title ?? (result as any).resultNode,
        level,
        questionName,
        questionText,
        optionLabel,
        businessValue,
        techRisk,
        notes
      }
    });
  }

  for (const [scenarioId, result] of Object.entries(scenarioResults || {})) {
    const scenario = allScenarios?.find(s => s.scenario_id === scenarioId);
    if (!scenario) continue;
    const option = scenario.options[(result as any).optionIndex];
    if (!option?.referenced_requirements?.includes(id)) continue;
    list.push({
      source: 'scenario',
      data: {
        scenarioId,
        scenarioTopic: scenario.topic,
        metricQuestion: scenario.metric_question || scenario.stimulus,
        optionLabel: option.label,
        optionDescription: option.description,
        businessValue: (result as any).businessValue,
        risk: (result as any).risk,
        notes: (result as any).notes || '',
      }
    });
  }

  if (list.length === 0 && isManual) {
    list.push({
      source: 'manual',
      data: { title: 'Manuelle Auswahl', optionLabel: 'Manuell im Katalog aktiviert' }
    });
  }

  return list;
}

export function getProvenance(
  id: string,
  treeResults: Record<string, any>,
  scenarioResults: Record<string, any>,
  allTrees: any[],
  allScenarios: any[],
  isManual: boolean = false
): Provenance | null {
  if (isManual) {
    return { source: 'manual', data: { title: 'Manuelle Auswahl', optionLabel: 'Manuell in der Seitenleiste oder Matrix aktiviert' } };
  }

  const treeData = findTreeProvenance(id, treeResults, allTrees);
  if (treeData) return { source: 'tree', data: treeData };

  const scenarioData = findScenarioProvenance(id, scenarioResults, allScenarios);
  if (scenarioData) return { source: 'scenario', data: scenarioData };

  return null;
}

