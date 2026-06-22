import React, { useMemo } from 'react'

/**
 * AutomatonViz — Diagrama SVG do autômato.
 *
 * Estados distribuídos em círculo.
 * Setas curvas quando há transição bidirecional.
 * Self-loops acima do nó.
 * Estado ativo destacado durante simulação.
 */
export default function AutomatonViz({
  states, transitions, initialState, finalStates, activeState, type = 'afd',
}) {
  const W = 480, H = 300
  const CX = W / 2, CY = H / 2
  const R = 105   // raio do círculo de distribuição
  const NR = 22   // raio dos nós

  // Posições dos estados em círculo
  const pos = useMemo(() => {
    const p = {}
    states.forEach((s, i) => {
      const angle = (2 * Math.PI * i / states.length) - Math.PI / 2
      p[s] = { x: CX + R * Math.cos(angle), y: CY + R * Math.sin(angle) }
    })
    return p
  }, [states])

  // Agrupa transições por par (from→to) para unir labels
  const groups = useMemo(() => {
    const g = {}
    Object.entries(transitions).forEach(([key, val]) => {
      const parts = key.split(',')
      const from = parts[0]
      let label, to
      if (type === 'ap') {
        label = `${parts[1]},${parts[2]}/${val.push || 'ε'}`
        to = val.nextState
      } else {
        label = parts[1]
        to = val
      }
      const k = `${from}→${to}`
      if (!g[k]) g[k] = { from, to, labels: [] }
      g[k].labels.push(label)
    })
    return g
  }, [transitions, type])

  const INK    = '#111'
  const MUTED  = '#aaa'
  const BLUE   = '#2563EB'
  const GREEN  = '#16A34A'

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}
      style={{ display: 'block', maxWidth: '100%', height: 'auto' }}>
      <defs>
        {[
          { id: 'arr',       color: MUTED  },
          { id: 'arr-active', color: BLUE  },
          { id: 'arr-init',   color: MUTED },
        ].map(({ id, color }) => (
          <marker key={id} id={id} markerWidth="7" markerHeight="7"
            refX="5" refY="3" orient="auto">
            <path d="M0,0 L0,6 L7,3 z" fill={color} />
          </marker>
        ))}
      </defs>

      {/* Setas de transição */}
      {Object.values(groups).map(({ from, to, labels }) => {
        const p1 = pos[from], p2 = pos[to]
        if (!p1 || !p2) return null

        const label = labels.join(' | ')
        const isAct = from === activeState
        const stroke = isAct ? BLUE : MUTED
        const arrow = isAct ? 'url(#arr-active)' : 'url(#arr)'

        // Self-loop
        if (from === to) {
          const lx = p1.x, ly = p1.y - NR
          return (
            <g key={`${from}→${to}`}>
              <path
                d={`M${lx-12},${ly} C${lx-30},${ly-45} ${lx+30},${ly-45} ${lx+12},${ly}`}
                fill="none" stroke={stroke} strokeWidth="1"
                markerEnd={arrow}
              />
              <text x={lx} y={ly - 43} textAnchor="middle"
                fontSize="10" fill={stroke}
                fontFamily="IBM Plex Mono, monospace">{label}</text>
            </g>
          )
        }

        const dx = p2.x - p1.x, dy = p2.y - p1.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        const sx = p1.x + (dx / dist) * NR
        const sy = p1.y + (dy / dist) * NR
        const ex = p2.x - (dx / dist) * (NR + 7)
        const ey = p2.y - (dy / dist) * (NR + 7)

        const hasRev = !!groups[`${to}→${from}`]
        const cv = hasRev ? 28 : 0
        const cpx = (sx + ex) / 2 - (dy / dist) * cv
        const cpy = (sy + ey) / 2 + (dx / dist) * cv
        const lx = (sx + ex) / 2 - (dy / dist) * (cv + 13)
        const ly = (sy + ey) / 2 + (dx / dist) * (cv + 13)

        return (
          <g key={`${from}→${to}`}>
            <path d={`M${sx},${sy} Q${cpx},${cpy} ${ex},${ey}`}
              fill="none" stroke={stroke} strokeWidth="1"
              markerEnd={arrow} />
            <text x={lx} y={ly} textAnchor="middle"
              fontSize="10" fill={stroke}
              fontFamily="IBM Plex Mono, monospace">{label}</text>
          </g>
        )
      })}

      {/* Nós dos estados */}
      {states.map(s => {
        const p = pos[s]
        if (!p) return null
        const isFinal  = finalStates.includes(s)
        const isInit   = s === initialState
        const isActive = s === activeState

        const fill   = isActive ? '#EFF4FF' : '#F7F7F5'
        const stroke = isActive ? BLUE : isFinal ? GREEN : '#CCCCCC'
        const textC  = isActive ? BLUE : isFinal ? GREEN : INK

        return (
          <g key={s}>
            {isInit && (
              <line
                x1={p.x - NR - 22} y1={p.y}
                x2={p.x - NR - 2}  y2={p.y}
                stroke={MUTED} strokeWidth="1"
                markerEnd="url(#arr-init)"
              />
            )}
            <circle cx={p.x} cy={p.y} r={NR}
              fill={fill} stroke={stroke} strokeWidth={isActive ? 1.5 : 1} />
            {isFinal && (
              <circle cx={p.x} cy={p.y} r={NR - 4}
                fill="none" stroke={stroke} strokeWidth="1" />
            )}
            <text x={p.x} y={p.y + 4} textAnchor="middle"
              fontSize="11" fontWeight="500" fill={textC}
              fontFamily="IBM Plex Mono, monospace">{s}</text>
          </g>
        )
      })}
    </svg>
  )
}
