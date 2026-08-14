import React from 'react';
import { getDisplayId } from '@/store/useStore';
import defaultTrees from '@/data/decision_trees.json';

function formatBoldText(text: string) {
  if (!text) return null;
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index} style={{ fontWeight: '700', color: '#1E293B' }}>{part.slice(2, -2)}</strong>;
    }
    return <span key={index}>{part}</span>;
  });
}

interface PdfReportTemplateProps {
  componentName: string;
  activeReqs: any[];
  combinedReqs: Record<string, number>;
  conflicts: any[];
  allSystemConflicts?: any[];
  exportConflictFilter?: 'red' | 'all';
  acceptedRisks: Record<string, any>;
  allGroups: any[];
  treeResults?: Record<string, any>;
  scenarioResults?: Record<string, any>;
  decisionTrees?: any[];
  conflictResolutions?: Record<string, any>;
}

function chunkConflictsDynamically(conflictsList: any[], activeReqsList: any[]): any[][] {
  if (conflictsList.length === 0) return [[]];
  
  const pages: any[][] = [];
  let currentPage: any[] = [];
  let currentPageLines = 0;
  // Maximum estimated line count per page for conflicts table:
  const MAX_LINES_PER_PAGE = 45; 

  conflictsList.forEach(c => {
    const req1 = activeReqsList.find(r => r.uid === c.pair[0]);
    const req2 = activeReqsList.find(r => r.uid === c.pair[1]);
    
    // Estimate lines for columns
    const name1Lines = Math.ceil((req1?.name || c.pair[0] || "").length / 20);
    const name2Lines = Math.ceil((req2?.name || c.pair[1] || "").length / 20);
    const textLines = Math.ceil((c.conflict_text || "").length / 55); // Rationale has ~55% width
    
    // Height of row is max of columns + extra spacing line
    const rowLines = Math.max(name1Lines, name2Lines, textLines, 2) + 1.8;

    if (currentPage.length > 0 && currentPageLines + rowLines > MAX_LINES_PER_PAGE) {
      pages.push(currentPage);
      currentPage = [c];
      currentPageLines = rowLines;
    } else {
      currentPage.push(c);
      currentPageLines += rowLines;
    }
  });

  if (currentPage.length > 0) {
    pages.push(currentPage);
  }

  return pages;
}

function chunkRisksDynamically(entries: any[]): any[][] {
  if (entries.length === 0) return [];
  
  const pages: any[][] = [];
  let currentPage: any[] = [];
  let currentPageLines = 0;
  const MAX_LINES_PER_PAGE = 40;

  entries.forEach(entry => {
    // Rationale description height estimation
    const textLines = Math.ceil((entry.data?.rationale || "").length / 75);
    const rowLines = Math.max(textLines, 2) + 3.8; // Title block and padding takes about 3.8 lines

    if (currentPage.length > 0 && currentPageLines + rowLines > MAX_LINES_PER_PAGE) {
      pages.push(currentPage);
      currentPage = [entry];
      currentPageLines = rowLines;
    } else {
      currentPage.push(entry);
      currentPageLines += rowLines;
    }
  });

  if (currentPage.length > 0) {
    pages.push(currentPage);
  }

  return pages;
}

function chunkDecisionsDynamically(decisionsList: any[]): any[][] {
  if (decisionsList.length === 0) return [];
  
  const pages: any[][] = [];
  let currentPage: any[] = [];
  let currentPageLines = 0;
  const MAX_LINES_PER_PAGE = 40;

  decisionsList.forEach(dec => {
    const textLines = Math.ceil((dec.rationale || "").length / 75);
    const rowLines = Math.max(textLines, 2) + 3.8; // Title block and padding takes about 3.8 lines

    if (currentPage.length > 0 && currentPageLines + rowLines > MAX_LINES_PER_PAGE) {
      pages.push(currentPage);
      currentPage = [dec];
      currentPageLines = rowLines;
    } else {
      currentPage.push(dec);
      currentPageLines += rowLines;
    }
  });

  if (currentPage.length > 0) {
    pages.push(currentPage);
  }

  return pages;
}

function chunkRequirementsDynamically(reqsList: any[]): any[][] {
  if (reqsList.length === 0) return [];
  
  const pages: any[][] = [];
  let currentPage: any[] = [];
  let currentPageLines = 0;
  const MAX_LINES_PER_PAGE = 48;

  reqsList.forEach(req => {
    const nameLines = Math.ceil((req.name || "").length / 50);
    const descLines = Math.ceil((req.description || "").length / 75);
    const rowLines = Math.max(nameLines + descLines, 2) + 1.2; // Spacing/padding

    if (currentPage.length > 0 && currentPageLines + rowLines > MAX_LINES_PER_PAGE) {
      pages.push(currentPage);
      currentPage = [req];
      currentPageLines = rowLines;
    } else {
      currentPage.push(req);
      currentPageLines += rowLines;
    }
  });

  if (currentPage.length > 0) {
    pages.push(currentPage);
  }

  return pages;
}

export const PdfReportTemplate = React.forwardRef<HTMLDivElement, PdfReportTemplateProps>(
  ({ componentName, activeReqs, combinedReqs, conflicts, allSystemConflicts, exportConflictFilter = 'all', acceptedRisks, allGroups, treeResults = {}, scenarioResults = {}, decisionTrees, conflictResolutions = {} }, ref) => {
    
    const treesToRender = (decisionTrees && decisionTrees.length > 0) ? decisionTrees : defaultTrees;

    const sealColorMap: Record<number, { bg: string; border: string; text: string; primary: string; subtitle: string }> = {
      0: { bg: '#F1F5F9', border: '#CBD5E1', text: '#475569', primary: '#64748B', subtitle: 'SEAL-0: Standard / Native Cloud' },
      1: { bg: '#EFF6FF', border: '#BFDBFE', text: '#1D4ED8', primary: '#2563EB', subtitle: 'SEAL-1: Formal / Vertragliche Absicherung' },
      2: { bg: '#ECFDF5', border: '#A7F3D0', text: '#047857', primary: '#059669', subtitle: 'SEAL-2: Physische EU-Residenz' },
      3: { bg: '#F5F3FF', border: '#DDD6FE', text: '#6D28D9', primary: '#7C3AED', subtitle: 'SEAL-3: Aktiver Schutz & Autarkie' },
      4: { bg: '#FFFBEB', border: '#FDE68A', text: '#B45309', primary: '#D97706', subtitle: 'SEAL-4: Exklusive EU-Kontrolle' },
    };

    const sortedReqs = [...activeReqs].sort((a, b) => (combinedReqs[b.uid] || 0) - (combinedReqs[a.uid] || 0));
    
    const acceptedRiskEntries = Object.entries(acceptedRisks).map(([key, data]) => {
      let reqA = activeReqs.find(r => r.uid === key.slice(0, 36));
      let reqB = activeReqs.find(r => r.uid === key.slice(37));

      if (!reqA) {
        reqA = activeReqs.find(r => key.startsWith(r.uid));
        if (reqA) {
          const remainder = key.slice(reqA.uid.length + 1);
          reqB = activeReqs.find(r => r.uid === remainder);
        }
      }

      if (!reqB) {
        reqB = activeReqs.find(r => key.endsWith(r.uid));
      }
      return { reqA, reqB, data, pairKey: key };
    }).filter(entry => entry.reqA && entry.reqB);

    // Calculate total system conflict metrics (unfiltered)
    const systemConflictsList = allSystemConflicts || conflicts;
    const totalUnacceptedConflicts = systemConflictsList.filter((c: any) => {
      return !acceptedRisks[`${c.pair[0]}-${c.pair[1]}`] && !acceptedRisks[`${c.pair[1]}-${c.pair[0]}`];
    });

    const hardConflicts = totalUnacceptedConflicts.filter((c: any) => c.status === 'red');
    const warningConflicts = totalUnacceptedConflicts.filter((c: any) => c.status === 'orange');
    
    // Sort conflicts: red first, then orange, then others
    const sortedConflicts = [...conflicts].sort((a, b) => {
      const statusOrder: Record<string, number> = { red: 1, orange: 2, blue: 3, green: 4, gray: 5 };
      const orderA = statusOrder[a.status] || 99;
      const orderB = statusOrder[b.status] || 99;
      return orderA - orderB;
    });

    // Dynamic chunking to prevent overflow and table truncation
    const conflictChunks = chunkConflictsDynamically(sortedConflicts, activeReqs);
    const riskChunks = chunkRisksDynamically(acceptedRiskEntries);
    const reqChunks = chunkRequirementsDynamically(sortedReqs);

    const pageStyle: React.CSSProperties = {
      width: '210mm',
      height: '297mm',
      backgroundColor: '#F8FAFC',
      color: '#334155',
      fontFamily: '"Lexend", "Inter", -apple-system, sans-serif',
      boxSizing: 'border-box',
      position: 'relative',
      overflow: 'hidden',
    };

    const CoverHeader = () => (
      <div style={{ backgroundColor: '#1E293B', padding: '30mm 20mm 20mm 20mm', color: '#F8FAFC', borderBottom: '6px solid #F97316' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <p style={{ fontSize: '12pt', textTransform: 'uppercase', letterSpacing: '1.5px', color: '#94A3B8', margin: '0 0 8px 0', fontWeight: '600' }}>
              Architecture Decision Record
            </p>
            <h1 style={{ fontSize: '26pt', fontWeight: '700', margin: 0, color: '#FFFFFF', lineHeight: '1.2' }}>
              Trade-Off & Konflikt-Analyse
            </h1>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '10pt', color: '#CBD5E1', marginBottom: '4px' }}>
              Erstellt am: {new Date().toLocaleDateString('de-DE')}
            </div>
            <div style={{ fontSize: '10pt', fontWeight: '600', color: '#F97316' }}>
              {componentName || 'Gesamtsystem'}
            </div>
          </div>
        </div>
      </div>
    );

    const MiniHeader = ({ title }: { title: string }) => (
      <div style={{ backgroundColor: '#1E293B', padding: '10mm 20mm', color: '#F8FAFC', borderBottom: '4px solid #F97316', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0, fontSize: '14pt', fontWeight: '600' }}>{title}</h2>
        <div style={{ fontSize: '10pt', color: '#94A3B8' }}>{componentName || 'Architektur Report'}</div>
      </div>
    );

    return (
      <div ref={ref} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* PAGE 1: Cover & Metrics */}
        <div className="pdf-page" style={pageStyle}>
          <CoverHeader />
          <div style={{ padding: '20mm' }}>
            <section style={{ marginBottom: '40px' }}>
              <div style={{ display: 'flex', gap: '24px' }}>
                <div style={{ flex: 1, backgroundColor: '#FFFFFF', padding: '24px', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                  <h3 style={{ margin: '0 0 20px 0', fontSize: '14pt', color: '#64748B', borderBottom: '2px solid #F1F5F9', paddingBottom: '10px' }}>
                    Konflikt-Metriken
                  </h3>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <span style={{ fontWeight: '500' }}>Harte Konflikte (Offen)</span>
                    <span style={{ fontWeight: '700', color: hardConflicts.length > 0 ? '#DC2626' : '#10B981', fontSize: '14pt' }}>{hardConflicts.length}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <span style={{ fontWeight: '500' }}>Warnungen (Offen)</span>
                    <span style={{ fontWeight: '700', color: warningConflicts.length > 0 ? '#F59E0B' : '#10B981', fontSize: '14pt' }}>{warningConflicts.length}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: '500' }}>Akzeptierte Risiken</span>
                    <span style={{ fontWeight: '700', color: '#64748B', fontSize: '14pt' }}>{acceptedRiskEntries.length}</span>
                  </div>
                </div>
                
                <div style={{ flex: 1, backgroundColor: '#FFFFFF', padding: '24px', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                  <h3 style={{ margin: '0 0 20px 0', fontSize: '14pt', color: '#64748B', borderBottom: '2px solid #F1F5F9', paddingBottom: '10px' }}>
                    System-Profil
                  </h3>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <span style={{ fontWeight: '500' }}>System Name</span>
                    <span style={{ fontWeight: '600' }}>{componentName || 'N/A'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <span style={{ fontWeight: '500' }}>Aktive Architektur-Optionen</span>
                    <span style={{ fontWeight: '700', fontSize: '14pt' }}>{activeReqs.length}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: '500' }}>Dimensionen</span>
                    <span style={{ fontWeight: '700', fontSize: '14pt' }}>{allGroups.length}</span>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* PAGE 2: SEAL-Stufen pro Souveränitäts-Dimension (Entscheidungsbäume) */}
        <div className="pdf-page" style={pageStyle}>
          <MiniHeader title="Souveränitäts-Profil & SEAL-Dimensionen" />
          <div style={{ padding: '12mm 20mm 15mm 20mm' }}>
            {/* Executive Overview Banner */}
            <div style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderLeft: '6px solid #F97316',
              borderRadius: '10px',
              padding: '16px 20px',
              marginBottom: '16px',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.03)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '13pt', fontWeight: '700', color: '#1E293B' }}>
                  Souveränitäts-Klassifizierung (SEAL)
                </h3>
                <p style={{ margin: 0, fontSize: '9pt', color: '#64748B' }}>
                  Ausgewählte Sicherheits- & Souveränitätsstufen über die 3 Kern-Architekturbäume
                </p>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {treesToRender.map((t: any, idx: number) => {
                  const tRes = treeResults[t.id] || treeResults[`TREE-${idx + 1}`] || treeResults[`SOV-${idx + 1}`];
                  const resNode = tRes?.resultNode || 'end-0';
                  const resObj = t.results?.[resNode] || { level: 0 };
                  const lvl = typeof resObj.level === 'number' ? resObj.level : 0;
                  const st = sealColorMap[lvl] || sealColorMap[0];
                  return (
                    <div key={idx} style={{
                      backgroundColor: st.bg,
                      border: `1px solid ${st.border}`,
                      color: st.text,
                      padding: '6px 10px',
                      borderRadius: '8px',
                      textAlign: 'center',
                      minWidth: '55px'
                    }}>
                      <div style={{ fontSize: '7.5pt', textTransform: 'uppercase', fontWeight: '600', color: st.primary, marginBottom: '2px' }}>
                        Dim {idx + 1}
                      </div>
                      <div style={{ fontSize: '10pt', fontWeight: '800' }}>
                        SEAL-{lvl}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Dimension Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {treesToRender.map((tree: any, treeIndex: number) => {
                const treeRes = treeResults[tree.id] || treeResults[`TREE-${treeIndex + 1}`] || treeResults[`SOV-${treeIndex + 1}`];
                const resultNode = treeRes?.resultNode || 'end-0';
                const resultObj = tree.results?.[resultNode] || { title: 'SEAL-0', level: 0, referenced_requirements: [] };
                const level = typeof resultObj.level === 'number' ? resultObj.level : parseInt(resultObj.title?.replace(/\D/g, '') || '0');
                const sealStyle = sealColorMap[level] || sealColorMap[0];

                let optionLabel = '';
                let optionRationale = '';
                if (tree.nodes) {
                  for (const nId in tree.nodes) {
                    const node = tree.nodes[nId];
                    const matchingOpt = node.options?.find((o: any) => o.target === resultNode);
                    if (matchingOpt) {
                      optionLabel = matchingOpt.label || '';
                      optionRationale = matchingOpt.rationale || matchingOpt.evaluationLabel || '';
                      break;
                    }
                  }
                }

                const comment = treeRes?.evaluations?.[resultNode]?.comment || '';
                const reqCount = (treeRes?.referenced_requirements || treeRes?.triggeredRequirements || resultObj.referenced_requirements || []).length;

                return (
                  <div key={tree.id || treeIndex} style={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: '12px',
                    padding: '16px 20px',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.03)',
                    position: 'relative'
                  }}>
                    {/* Header row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{
                            backgroundColor: '#F1F5F9',
                            color: '#475569',
                            fontSize: '8.5pt',
                            fontWeight: '700',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            border: '1px solid #E2E8F0'
                          }}>
                            Dimension {treeIndex + 1}
                          </span>
                          <h4 style={{ margin: 0, fontSize: '11.5pt', fontWeight: '700', color: '#1E293B' }}>
                            {tree.title}
                          </h4>
                        </div>
                        <p style={{ margin: '4px 0 0 0', fontSize: '8.5pt', color: '#64748B' }}>
                          {tree.description}
                        </p>
                      </div>

                      <div style={{
                        backgroundColor: sealStyle.bg,
                        border: `1.5px solid ${sealStyle.border}`,
                        color: sealStyle.text,
                        padding: '4px 14px',
                        borderRadius: '20px',
                        fontSize: '10pt',
                        fontWeight: '800',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        whiteSpace: 'nowrap'
                      }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: sealStyle.primary }} />
                        SEAL-{level}
                      </div>
                    </div>

                    {/* 5-Step Visual Progress Bar */}
                    <div style={{
                      backgroundColor: '#F8FAFC',
                      border: '1px solid #F1F5F9',
                      borderRadius: '8px',
                      padding: '10px 14px',
                      marginBottom: '10px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <span style={{ fontSize: '8pt', fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Stufen-Pfad (SEAL 0 - 4)
                        </span>
                        <span style={{ fontSize: '8.5pt', fontWeight: '700', color: sealStyle.text }}>
                          {sealStyle.subtitle}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {[0, 1, 2, 3, 4].map(l => {
                          const isActive = l === level;
                          const isPassed = l <= level;
                          const stepColor = sealColorMap[l] || sealColorMap[0];
                          return (
                            <React.Fragment key={l}>
                              {l > 0 && (
                                <div style={{
                                  flex: 1,
                                  height: '4px',
                                  borderRadius: '2px',
                                  backgroundColor: isPassed ? sealStyle.primary : '#E2E8F0'
                                }} />
                              )}
                              <div style={{
                                width: isActive ? '22px' : '16px',
                                height: isActive ? '22px' : '16px',
                                borderRadius: '50%',
                                backgroundColor: isActive ? sealStyle.primary : isPassed ? stepColor.bg : '#FFFFFF',
                                border: `2px solid ${isPassed ? (isActive ? sealStyle.primary : stepColor.primary) : '#CBD5E1'}`,
                                color: isActive ? '#FFFFFF' : isPassed ? stepColor.text : '#94A3B8',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: isActive ? '8.5pt' : '7.5pt',
                                fontWeight: '700',
                                boxShadow: isActive ? `0 0 6px ${sealStyle.primary}60` : 'none'
                              }}>
                                {l}
                              </div>
                            </React.Fragment>
                          );
                        })}
                      </div>
                    </div>

                    {/* Rationale & Metrics */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '8.5pt', color: '#475569' }}>
                      <div>
                        <span style={{ fontWeight: '600', color: '#334155' }}>Gewählte Option: </span>
                        <span style={{ fontWeight: '500', color: '#0F172A' }}>
                          {optionLabel || resultObj.title || `SEAL-${level}`}
                        </span>
                      </div>
                      <div style={{
                        backgroundColor: '#EFF6FF',
                        color: '#2563EB',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '8pt',
                        fontWeight: '700'
                      }}>
                        {reqCount} {reqCount === 1 ? 'Architektur-Option' : 'Architektur-Optionen'} getriggert
                      </div>
                    </div>

                    {/* Architect Comment (if present) */}
                    {comment && (
                      <div style={{
                        marginTop: '8px',
                        backgroundColor: '#F8FAFC',
                        borderLeft: `3px solid ${sealStyle.primary}`,
                        padding: '6px 10px',
                        borderRadius: '0 6px 6px 0',
                        fontSize: '8.5pt',
                        color: '#334155',
                        fontStyle: 'italic'
                      }}>
                        <span style={{ fontStyle: 'normal', fontWeight: '700', color: '#64748B', fontSize: '7.5pt', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>
                          Architekten-Begründung:
                        </span>
                        "{formatBoldText(comment)}"
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* PAGES: Trade-Off Analysis */}
        {conflictChunks.map((chunk, pageIndex) => (
          <div key={`conflict-page-${pageIndex}`} className="pdf-page" style={pageStyle}>
            <MiniHeader title={`Trade-Off Analyse ${conflictChunks.length > 1 ? `(Teil ${pageIndex + 1})` : ''}`} />
            <div style={{ padding: '15mm 20mm' }}>
              {chunk.length === 0 ? (
                <div style={{ backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', padding: '20px', borderRadius: '8px', color: '#15803D', fontWeight: '500' }}>
                  Es wurden keine architektonischen Konflikte in der aktuellen Konfiguration festgestellt.
                </div>
              ) : (
                <div style={{ borderRadius: '12px', border: '1px solid #E2E8F0', overflow: 'hidden', backgroundColor: '#FFFFFF' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10pt' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#F1F5F9', borderBottom: '2px solid #E2E8F0', textAlign: 'left' }}>
                        <th style={{ padding: '12px 16px', color: '#64748B', fontWeight: '600', width: '10%' }}>Status</th>
                        <th style={{ padding: '12px 16px', color: '#64748B', fontWeight: '600', width: '17.5%' }}>Architektur-Option A</th>
                        <th style={{ padding: '12px 16px', color: '#64748B', fontWeight: '600', width: '17.5%' }}>Architektur-Option B</th>
                        <th style={{ padding: '12px 16px', color: '#64748B', fontWeight: '600', width: '55%' }}>Begründung</th>
                      </tr>
                    </thead>
                    <tbody>
                      {chunk.map((c, idx) => {
                        const req1 = activeReqs.find(r => r.uid === c.pair[0]);
                        const req2 = activeReqs.find(r => r.uid === c.pair[1]);
                        const isAccepted = acceptedRisks[`${c.pair[0]}-${c.pair[1]}`] || acceptedRisks[`${c.pair[1]}-${c.pair[0]}`];
                        
                        return (
                          <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9', backgroundColor: isAccepted ? '#F8FAFC' : '#FFFFFF' }}>
                            <td style={{ padding: '12px 16px', verticalAlign: 'top' }}>
                              {isAccepted ? (
                                <span style={{ display: 'inline-block', padding: '4px 8px', backgroundColor: '#F0FDF4', color: '#15803D', borderRadius: '4px', fontSize: '8pt', fontWeight: '700', border: '1px solid #BBF7D0' }}>AKZEPTIERT</span>
                              ) : c.status === 'red' ? (
                                <span style={{ display: 'inline-block', padding: '4px 8px', backgroundColor: '#FEF2F2', color: '#DC2626', borderRadius: '4px', fontSize: '8pt', fontWeight: '700', border: '1px solid #FECACA' }}>KRITISCH</span>
                              ) : c.status === 'orange' ? (
                                <span style={{ display: 'inline-block', padding: '4px 8px', backgroundColor: '#FFFBEB', color: '#D97706', borderRadius: '4px', fontSize: '8pt', fontWeight: '700', border: '1px solid #FDE68A' }}>WARNUNG</span>
                              ) : c.status === 'blue' ? (
                                <span style={{ display: 'inline-block', padding: '4px 8px', backgroundColor: '#EFF6FF', color: '#2563EB', borderRadius: '4px', fontSize: '8pt', fontWeight: '700', border: '1px solid #BFDBFE' }}>NEUTRAL</span>
                              ) : c.status === 'green' ? (
                                <span style={{ display: 'inline-block', padding: '4px 8px', backgroundColor: '#F0FDF4', color: '#15803D', borderRadius: '4px', fontSize: '8pt', fontWeight: '700', border: '1px solid #BBF7D0' }}>SYNERGIE</span>
                              ) : (
                                <span style={{ display: 'inline-block', padding: '4px 8px', backgroundColor: '#F1F5F9', color: '#64748B', borderRadius: '4px', fontSize: '8pt', fontWeight: '700', border: '1px solid #E2E8F0' }}>POTENZIAL</span>
                              )}
                            </td>
                            <td style={{ padding: '12px 16px', fontWeight: '500', color: '#334155', verticalAlign: 'top', fontSize: '9pt' }}>{req1?.name || c.pair[0]}</td>
                            <td style={{ padding: '12px 16px', fontWeight: '500', color: '#334155', verticalAlign: 'top', fontSize: '9pt' }}>{req2?.name || c.pair[1]}</td>
                            <td style={{ padding: '12px 16px', color: '#64748B', verticalAlign: 'top', fontSize: '8.5pt' }}>{formatBoldText(c.conflict_text)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* PAGES: Risk Register */}
        {riskChunks.map((chunk, pageIndex) => (
          <div key={`risk-page-${pageIndex}`} className="pdf-page" style={pageStyle}>
            <MiniHeader title={`Risiko-Register (Akzeptierte Risiken) ${riskChunks.length > 1 ? `(Teil ${pageIndex + 1})` : ''}`} />
            <div style={{ padding: '15mm 20mm' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {chunk.map((entry, idx) => (
                  <div key={idx} style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderLeft: '6px solid #10B981', borderRadius: '8px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <h4 style={{ margin: 0, fontSize: '11pt', fontWeight: '600', color: '#1E293B' }}>
                        Konflikt: <span style={{ color: '#64748B', fontWeight: '400' }}>{entry.reqA.name}</span> vs <span style={{ color: '#64748B', fontWeight: '400' }}>{entry.reqB.name}</span>
                      </h4>
                      <span style={{ fontSize: '9pt', color: '#94A3B8', backgroundColor: '#F1F5F9', padding: '4px 8px', borderRadius: '4px' }}>
                        {new Date(entry.data.timestamp).toLocaleDateString('de-DE')}
                      </span>
                    </div>
                    <div style={{ backgroundColor: '#F8FAFC', padding: '12px', borderRadius: '6px', border: '1px solid #F1F5F9' }}>
                      <p style={{ margin: '0 0 4px 0', fontSize: '9pt', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600' }}>Architekten-Begründung</p>
                      <p style={{ margin: 0, fontSize: '10pt', color: '#334155', fontStyle: 'italic' }}>
                        "{formatBoldText(entry.data.rationale)}"
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}

        {/* PAGES: Decision Log */}
        {(() => {
          const decisions = [];
          for (const tid in treeResults) {
            const tr = treeResults[tid];
            if (tr.evaluations[tr.resultNode]?.comment) {
              decisions.push({
                type: 'Decision Tree',
                id: tid,
                priority: combinedReqs[tr.referenced_requirements?.[0]] || 5,
                rationale: tr.evaluations[tr.resultNode].comment,
              });
            }
          }
          for (const sid in scenarioResults) {
            const sr = scenarioResults[sid];
            if (sr.notes) {
              decisions.push({
                type: 'Scenario',
                id: sid,
                priority: combinedReqs[sr.triggeredReqs?.[0]] || 5,
                rationale: sr.notes,
              });
            }
          }
          if (decisions.length === 0) return null;

          const decisionChunks = chunkDecisionsDynamically(decisions);
          
          return decisionChunks.map((chunk, pageIndex) => (
            <div key={`decision-page-${pageIndex}`} className="pdf-page" style={pageStyle}>
              <MiniHeader title={`Decision Log ${decisionChunks.length > 1 ? `(Teil ${pageIndex + 1})` : ''}`} />
              <div style={{ padding: '15mm 20mm' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {chunk.map((dec, idx) => (
                    <div key={idx} style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderLeft: '6px solid #3B82F6', borderRadius: '8px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                        <h4 style={{ margin: 0, fontSize: '11pt', fontWeight: '600', color: '#1E293B' }}>
                          <span style={{ color: '#64748B', fontWeight: '400' }}>Quelle: </span>{dec.id}
                        </h4>
                        <span style={{ fontSize: '9pt', color: '#3B82F6', backgroundColor: '#EFF6FF', padding: '4px 8px', borderRadius: '4px', fontWeight: '600' }}>
                          Prio: {typeof dec.priority === 'number' ? dec.priority.toFixed(1) : dec.priority}
                        </span>
                      </div>
                      <div style={{ backgroundColor: '#F8FAFC', padding: '12px', borderRadius: '6px', border: '1px solid #F1F5F9', marginTop: '12px' }}>
                        <p style={{ margin: '0 0 4px 0', fontSize: '9pt', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600' }}>Rationale ({dec.type})</p>
                        <p style={{ margin: 0, fontSize: '10pt', color: '#334155', fontStyle: 'italic' }}>
                          "{formatBoldText(dec.rationale)}"
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ));
        })()}

        {/* PAGES: Protokoll der Architektur-Entscheidungen (Konfliktauflösungen) */}
        {(() => {
          const resolvedList = Object.values(conflictResolutions || {});
          if (resolvedList.length === 0) return null;

          const chunks = chunkDecisionsDynamically(resolvedList.map((res: any) => ({
            rationale: res.comment || 'Keine Begründung angegeben.',
            ...res
          })));

          return chunks.map((chunk, pageIndex) => (
            <div key={`conflict-res-page-${pageIndex}`} className="pdf-page" style={pageStyle}>
              <MiniHeader title={`Protokoll der Konfliktauflösungen ${chunks.length > 1 ? `(Teil ${pageIndex + 1})` : ''}`} />
              <div style={{ padding: '15mm 20mm' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {chunk.map((res: any, idx: number) => {
                    const keepReq = activeReqs.find(r => r.uid === res.keepId);
                    const rejectedNames = res.rejectedIds?.map((id: string) => {
                      const r = activeReqs.find(req => req.uid === id);
                      return r ? `${r.name} (${getDisplayId(id)})` : getDisplayId(id);
                    }).join(', ');

                    return (
                      <div key={idx} style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderLeft: '6px solid #F97316', borderRadius: '8px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                          <div>
                            <span style={{ fontSize: '8pt', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#64748B', fontWeight: '700' }}>
                              Konfliktgruppe: {res.groupName}
                            </span>
                            <h4 style={{ margin: '4px 0 0 0', fontSize: '11pt', fontWeight: '700', color: '#1E293B' }}>
                              Gewählt: <span style={{ color: '#F97316' }}>{keepReq?.name || getDisplayId(res.keepId)}</span> ({getDisplayId(res.keepId)})
                            </h4>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <span style={{ fontSize: '8.5pt', color: '#1E293B', backgroundColor: '#FFF7ED', padding: '4px 8px', borderRadius: '4px', border: '1px solid #FFEDD5', fontWeight: '700' }}>
                              SR: {res.sr}/10 | UR: {res.ur}/10
                            </span>
                          </div>
                        </div>

                        {rejectedNames && (
                          <p style={{ margin: '0 0 10px 0', fontSize: '8.5pt', color: '#64748B' }}>
                            <strong style={{ color: '#DC2626' }}>Verworfen:</strong> {rejectedNames}
                          </p>
                        )}

                        <div style={{ backgroundColor: '#F8FAFC', padding: '12px', borderRadius: '6px', border: '1px solid #F1F5F9' }}>
                          <p style={{ margin: '0 0 4px 0', fontSize: '8pt', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '700' }}>
                            Architekten-Begründung
                          </p>
                          <p style={{ margin: 0, fontSize: '9.5pt', color: '#334155', fontStyle: 'italic' }}>
                            "{formatBoldText(res.comment || 'Keine Begründung angegeben.')}"
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ));
        })()}

        {/* PAGES: Audit Trail */}
        {reqChunks.map((chunk, pageIndex) => (
          <div key={`audit-page-${pageIndex}`} className="pdf-page" style={pageStyle}>
            <MiniHeader title={`Audit-Trail / Anhang ${reqChunks.length > 1 ? `(Teil ${pageIndex + 1})` : ''}`} />
            <div style={{ padding: '15mm 20mm' }}>
              <div style={{ borderRadius: '12px', border: '1px solid #E2E8F0', overflow: 'hidden', backgroundColor: '#FFFFFF' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9pt' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#F1F5F9', borderBottom: '2px solid #E2E8F0', textAlign: 'left' }}>
                      <th style={{ padding: '10px 16px', color: '#64748B', fontWeight: '600', width: '15%' }}>ID</th>
                      <th style={{ padding: '10px 16px', color: '#64748B', fontWeight: '600', width: '70%' }}>Architektur-Option</th>
                      <th style={{ padding: '10px 16px', color: '#64748B', fontWeight: '600', width: '15%', textAlign: 'center' }}>Prio</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chunk.map((req, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '10px 16px', fontFamily: 'monospace', color: '#64748B', verticalAlign: 'top', fontSize: '8.5pt' }}>
                          {getDisplayId(req.uid)}
                        </td>
                        <td style={{ padding: '10px 16px', verticalAlign: 'top' }}>
                          <div style={{ fontWeight: '600', color: '#1E293B', marginBottom: '2px', fontSize: '9.5pt' }}>{req.name}</div>
                          <div style={{ color: '#64748B', fontSize: '8pt', lineHeight: '1.3' }}>{req.description}</div>
                        </td>
                        <td style={{ padding: '10px 16px', textAlign: 'center', verticalAlign: 'top' }}>
                          <span style={{ display: 'inline-block', backgroundColor: '#EFF6FF', color: '#2563EB', padding: '4px 10px', borderRadius: '12px', fontWeight: '700', fontSize: '8.5pt' }}>
                            {typeof combinedReqs[req.uid] === 'number' ? combinedReqs[req.uid].toFixed(1) : combinedReqs[req.uid]}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }
);
PdfReportTemplate.displayName = 'PdfReportTemplate';
