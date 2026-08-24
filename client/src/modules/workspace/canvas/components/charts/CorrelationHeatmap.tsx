// src/modules/workspace/components/charts/CorrelationHeatmap.tsx
import { useState } from 'react';
import { useWorkflowStore } from '../../../store/workflowStore';
import type { ChartPayload } from '../../../store/workflowStore';

const POS_RGB = '255, 122, 0'; // orange  (+1)
const NEG_RGB = '6, 182, 212'; // cyan    (-1)

function cellColor(v: number | null): string {
  if (v === null) return '#18253A';
  const intensity = Math.min(Math.abs(v), 1);
  return `rgba(${v >= 0 ? POS_RGB : NEG_RGB}, ${(0.12 + intensity * 0.88).toFixed(2)})`;
}

export default function CorrelationHeatmap({ chart }: { chart: ChartPayload }) {
  const columns: string[] = chart.data.columns ?? [];
  const matrix: (number | null)[][] = chart.data.matrix ?? [];
  const n = columns.length;
  const [hover, setHover] = useState<{ r: number; c: number } | null>(null);

  if (n === 0) return <div style={{ color: '#8B9BB4' }}>No correlation data.</div>;

  const cell = Math.max(14, Math.min(26, Math.floor(720 / n)));
  const labelStep = Math.max(1, Math.ceil(n / 20)); // thin labels on wide matrices

  return (
    <div>
      {/* Legend */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, fontSize: 11, color: '#8B9BB4' }}>
        <span>-1</span>
        <div style={{ width: 140, height: 8, borderRadius: 4, background: `linear-gradient(90deg, rgba(${NEG_RGB},1), rgba(${NEG_RGB},0.1), rgba(${POS_RGB},0.1), rgba(${POS_RGB},1))` }} />
        <span>+1</span>
        {hover && (
          <span style={{ marginLeft: 'auto', color: '#F4F7FB', background: '#0A1426', border: '1px solid #18253A', borderRadius: 6, padding: '3px 8px' }}>
            {columns[hover.r]} × {columns[hover.c]} = <b>{matrix[hover.r]?.[hover.c] ?? '—'}</b>
          </span>
        )}
      </div>

      {/* Grid */}
      <div style={{ overflowX: 'auto', border: '1px solid #18253A', borderRadius: 8, padding: 8, background: '#050B18' }}>
        <div style={{ display: 'grid', gridTemplateColumns: `90px repeat(${n}, ${cell}px)`, width: 'max-content' }}>
          {/* Header row */}
          <div />
          {columns.map((c, i) => (
            <div key={`h-${i}`} style={{ height: 56, fontSize: 10, color: '#8B9BB4', textAlign: 'left' }}>
              {i % labelStep === 0 && (
                <span style={{ display: 'inline-block', transform: 'rotate(-60deg) translateX(-4px)', transformOrigin: 'top left', whiteSpace: 'nowrap' }}>{c}</span>
              )}
            </div>
          ))}
          {/* Rows */}
          {columns.map((rowName, r) => (
            <div key={`r-${r}`} style={{ display: 'contents' }}>
              <div style={{ fontSize: 10, color: '#8B9BB4', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 8, whiteSpace: 'nowrap', overflow: 'hidden' }}>
                {r % labelStep === 0 ? rowName : ''}
              </div>
              {(matrix[r] ?? []).map((v, c) => (
                <div
                  key={`c-${r}-${c}`}
                  onMouseEnter={() => setHover({ r, c })}
                  onMouseLeave={() => setHover(null)}
                  style={{
                    width: cell, height: cell,
                    background: cellColor(v),
                    borderRadius: 2,
                    outline: hover?.r === r && hover?.c === c ? '1px solid #F4F7FB' : 'none',
                  }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}