import React, { useState } from 'react'
import { useAP } from '../hooks/useAP'
import AutomatonViz from './AutomatonViz'
import s from './Panel.module.css'

/**
 * StackVisual — Visualização da pilha como coluna de blocos.
 *
 * Mostra cada símbolo como um bloco empilhado de baixo para cima.
 * O topo da pilha (índice 0) aparece no topo visual.
 * Se a pilha estiver vazia (apenas ['$'] ou []), mostra "VAZIA".
 *
 * A lógica de cores:
 *   '$' = cinza (fundo de pilha, sempre lá)
 *   'A','B', etc. = amarelo (símbolos empilhados pelo autômato)
 */
function StackVisual({ stack }) {
  // Pilha "vazia" = só tem o marcador de fundo '$', ou está realmente vazia
  const isEmpty = stack.length === 0 || (stack.length === 1 && stack[0] === '$' && false)
  // Exibimos de baixo para cima: invertemos o array para renderizar fundo embaixo
  const visual = [...stack].reverse()

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      gap: '2px',
      padding: '8px',
      border: '1px solid var(--rule)',
      minHeight: '48px',
      width: '100%',
    }}>
      {/* Label de topo */}
      {stack.length > 0 && (
        <div style={{ fontSize: '10px', color: 'var(--muted)', marginBottom: '4px', letterSpacing: '0.06em' }}>
          ← TOPO
        </div>
      )}

      {stack.length === 0 ? (
        <span style={{ fontSize: '12px', color: 'var(--muted)', fontStyle: 'italic' }}>VAZIA</span>
      ) : (
        // Renderiza do topo para baixo (índice 0 = topo = aparece primeiro)
        stack.map((sym, i) => {
          const isBottom = sym === '$'
          return (
            <div key={i} style={{
              padding: '4px 12px',
              border: `1px solid ${isBottom ? '#ccc' : '#DDAA44'}`,
              background: isBottom ? '#f5f5f5' : '#FFFBF0',
              color: isBottom ? '#888' : '#996600',
              fontSize: '13px',
              fontWeight: '500',
              minWidth: '36px',
              textAlign: 'center',
              width: '48px',
            }}>
              {sym}
            </div>
          )
        })
      )}

      {/* Label de fundo */}
      {stack.length > 0 && (
        <div style={{ fontSize: '10px', color: 'var(--muted)', marginTop: '4px', letterSpacing: '0.06em' }}>
          ← FUNDO
        </div>
      )}
    </div>
  )
}

/**
 * APPanel — Interface da Parte 2: Autômato com Pilha.
 */
export default function APPanel() {
  const ap = useAP()
  const [newState, setNewState]   = useState('')
  const [testInput, setTestInput] = useState('aaabbb')
  const [result, setResult]       = useState(null)
  const [activeState, setActiveState] = useState(null)
  const [stepIndex, setStepIndex] = useState(-1)
  const [nt, setNt] = useState({ from:'q0', sym:'a', top:'$', next:'q0', push:'A$' })

  const handleTest = () => {
    const r = ap.testWord(testInput)
    setResult(r)
    setActiveState(ap.initialState)
    setStepIndex(0)
  }

  const handleStep = () => {
    if (!result) return
    const next = stepIndex + 1
    if (next <= result.trace.length) {
      const step = result.trace[next - 1]
      if (step && !step.dead) setActiveState(step.nextState)
      setStepIndex(next)
    }
  }

  const handleReset = () => {
    setResult(null); setActiveState(null); setStepIndex(-1)
  }

  const currentStack = () => {
    if (!result || stepIndex <= 0) return ['$']
    return result.trace[stepIndex - 1]?.stackAfter || ['$']
  }

  return (
    <div className={s.layout}>

      {/* ── PAINEL ESQUERDO ── */}
      <div className={s.left}>

        {/* Estados */}
        <section className={s.section}>
          <label>ESTADOS</label>
          <div className={s.states}>
            {ap.states.map(st => (
              <button key={st}
                className={`${s.stateBtn}
                  ${st === ap.initialState ? s.stateBtnInit : ''}
                  ${ap.finalStates.includes(st) ? s.stateBtnFinal : ''}
                  ${st === activeState ? s.stateBtnActive : ''}
                `}
                onClick={() => ap.toggleFinal(st)}>
                {st === ap.initialState && <span className={s.arrow}>→</span>}
                {st}
                {ap.finalStates.includes(st) && <span className={s.star}>*</span>}
              </button>
            ))}
          </div>
          <div className={s.row}>
            <input type="text" value={newState}
              onChange={e => setNewState(e.target.value)}
              placeholder="novo estado"
              onKeyDown={e => { if (e.key === 'Enter') { ap.addState(newState); setNewState('') } }}
            />
            <button className="primary"
              onClick={() => { ap.addState(newState); setNewState('') }}>
              + add
            </button>
          </div>
          <div style={{ marginTop: '10px' }}>
            <label>ESTADO INICIAL</label>
            <select value={ap.initialState} onChange={e => ap.setInitialState(e.target.value)}>
              {ap.states.map(st => <option key={st} value={st}>{st}</option>)}
            </select>
          </div>
        </section>

        {/* Nova transição */}
        <section className={s.section}>
          <label>NOVA TRANSIÇÃO δ(estado, símbolo, topo) → (estado, push)</label>
          <div className={s.transGrid}>
            <div>
              <label>de</label>
              <select value={nt.from} onChange={e => setNt(t => ({...t, from: e.target.value}))}>
                {ap.states.map(st => <option key={st} value={st}>{st}</option>)}
              </select>
            </div>
            <div>
              <label>símbolo</label>
              <input type="text" value={nt.sym}
                onChange={e => setNt(t => ({...t, sym: e.target.value}))}
                placeholder="a / ε" />
            </div>
            <div>
              <label>topo pilha</label>
              <input type="text" value={nt.top}
                onChange={e => setNt(t => ({...t, top: e.target.value}))}
                placeholder="$" />
            </div>
            <div>
              <label>para</label>
              <select value={nt.next} onChange={e => setNt(t => ({...t, next: e.target.value}))}>
                {ap.states.map(st => <option key={st} value={st}>{st}</option>)}
              </select>
            </div>
            <div>
              <label>push (vazio=pop)</label>
              <input type="text" value={nt.push}
                onChange={e => setNt(t => ({...t, push: e.target.value}))}
                placeholder="A$" />
            </div>
          </div>
          <button className="primary" style={{ marginTop: '8px' }}
            onClick={() => ap.setTransition(nt.from, nt.sym, nt.top, nt.next, nt.push)}>
            + adicionar
          </button>
        </section>

        {/* Testar */}
        <section className={s.section}>
          <label>TESTAR PALAVRA</label>
          <input type="text" value={testInput}
            onChange={e => setTestInput(e.target.value)}
            placeholder="palavra"
            onKeyDown={e => { if (e.key === 'Enter') handleTest() }}
          />
          <div className={s.btnRow}>
            <button className="primary" onClick={handleTest}>executar</button>
            {result && <>
              <button onClick={handleStep} disabled={stepIndex >= result.trace.length}>passo →</button>
              <button onClick={handleReset}>reset</button>
            </>}
          </div>
          {result && (
            <div className={result.accepted ? s.accepted : s.rejected}>
              {result.accepted ? `✓ aceita` : `✗ rejeitada`}
            </div>
          )}
          {/* Pilha visual — sempre visível após executar */}
          {result && (
            <div style={{ marginTop: '10px' }}>
              <label>PILHA</label>
              <StackVisual stack={stepIndex > 0 ? currentStack() : ['$']} />
            </div>
          )}
        </section>
      </div>

      {/* ── PAINEL DIREITO ── */}
      <div className={s.right}>

        {/* Diagrama */}
        <section className={s.section}>
          <label>DIAGRAMA</label>
          <div className={s.viz}>
            <AutomatonViz
              states={ap.states}
              transitions={ap.transitions}
              initialState={ap.initialState}
              finalStates={ap.finalStates}
              activeState={activeState}
              type="ap"
            />
          </div>
        </section>

        {/* Tabela de transições */}
        <section className={s.section}>
          <label>TRANSIÇÕES</label>
          <div className={s.tableWrap}>
            <table className={s.table}>
              <thead>
                <tr>
                  <th>estado</th><th>símbolo</th><th>topo</th>
                  <th>→ estado</th><th>push</th><th></th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(ap.transitions).map(([key, val]) => {
                  const [from, sym, top] = key.split(',')
                  return (
                    <tr key={key} className={from === activeState ? s.rowHl : ''}>
                      <td>{from}</td><td>{sym}</td><td>{top}</td>
                      <td>{val.nextState}</td>
                      <td>{val.push || 'ε'}</td>
                      <td>
                        <button className="ghost"
                          onClick={() => ap.removeTransition(key)}>✕</button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Trace */}
        {result && result.trace.length > 0 && (
          <section className={s.section}>
            <label>TRACE</label>
            <ul className={s.trace}>
              {result.trace.map((step, i) => (
                <li key={i} className={`${s.traceRow}
                  ${i === stepIndex - 1 ? s.traceCur : ''}
                  ${step.dead ? s.traceRej : ''}
                  ${i === result.trace.length - 1 && result.accepted && !step.dead ? s.traceAcc : ''}
                `}>
                  {step.dead
                    ? `δ(${step.state},${step.symbol},${step.stackTop}) → ∅`
                    : `δ(${step.state},${step.symbol},${step.stackTop}) → (${step.nextState},${step.push})`
                  }
                </li>
              ))}
            </ul>
          </section>
        )}

        
      </div>
    </div>
  )
}
