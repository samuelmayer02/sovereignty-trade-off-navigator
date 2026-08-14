import { describe, it, expect } from 'vitest';
import { getAllProvenances } from '../lib/provenance';

describe('lib/provenance - getAllProvenances & getProvenance', () => {
  const mockTrees = [
    {
      id: 'TREE-1',
      title: 'Souveränitäts-Level',
      nodes: {
        q1: { name: 'Infrastruktur', text: 'Welches Modell?' }
      },
      results: {
        'res-1': { title: 'Self-Hosted K8s', level: 1 }
      }
    }
  ];

  const mockScenarios = [
    {
      scenario_id: 'SCEN-1',
      topic: 'Ausfallsicherheit (Outage Resilience)',
      options: [
        {
          label: 'Multi-Cloud Setup',
          referenced_requirements: ['REQ-001', 'REQ-002']
        }
      ]
    }
  ];

  it('extracts tree evaluations with ratings and comments', () => {
    const treeResults = {
      'TREE-1': {
        referenced_requirements: ['REQ-001'],
        resultNode: 'res-1',
        evaluations: {
          q1: {
            businessValue: 8,
            techRisk: 3,
            comment: 'Eigene Infrastruktur bietet maximale Souveränität'
          }
        }
      }
    };

    const provs = getAllProvenances('REQ-001', treeResults, {}, mockTrees, []);
    expect(provs).toHaveLength(1);
    expect(provs[0].source).toBe('tree');
    if (provs[0].source === 'tree') {
      expect(provs[0].data.treeTitle).toBe('Souveränitäts-Level');
      expect(provs[0].data.businessValue).toBe(8);
      expect(provs[0].data.techRisk).toBe(3);
      expect(provs[0].data.notes).toBe('Eigene Infrastruktur bietet maximale Souveränität');
    }
  });

  it('extracts scenario evaluations with ratings and notes', () => {
    const scenarioResults = {
      'SCEN-1': {
        optionIndex: 0,
        businessValue: 9,
        risk: 6,
        notes: 'Hohe Redundanz erforderlich wegen SLA Vorgaben'
      }
    };

    const provs = getAllProvenances('REQ-002', {}, scenarioResults, [], mockScenarios);
    expect(provs).toHaveLength(1);
    expect(provs[0].source).toBe('scenario');
    if (provs[0].source === 'scenario') {
      expect(provs[0].data.scenarioTopic).toBe('Ausfallsicherheit (Outage Resilience)');
      expect(provs[0].data.businessValue).toBe(9);
      expect(provs[0].data.risk).toBe(6);
      expect(provs[0].data.notes).toBe('Hohe Redundanz erforderlich wegen SLA Vorgaben');
    }
  });

  it('returns manual provenance when no tree/scenario results match and isManual is true', () => {
    const provs = getAllProvenances('REQ-999', {}, {}, [], [], true);
    expect(provs).toHaveLength(1);
    expect(provs[0].source).toBe('manual');
  });
});
