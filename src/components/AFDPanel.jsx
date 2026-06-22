import React, { useState, useEffect } from 'react'
import { useAFD } from '../hooks/useAFD'
import AutomatonViz from './AutomatonViz'
import s from './Panel.module.css'

/**
 * AFDPanel — Interface da Parte 1: Autômato Finito Determinístico.
 *
 * Layout: duas colunas separadas por linha vertical.
 *   Esquerda  → controles (estados, alfabeto, teste)
 *   Direita   → diagrama + trace
 */
export default function AFDPanel() {
  const afd = useAFD()
  const [newState, setNewState]   = useState('')
  const [testInput, setTestInput] = useState('aab')
  const [result, setResult]       = useState(null)
  const [activeState, setActiveState] = useState(null)
  const [stepIndex, setStepIndex] = useState(-1)

  /**
   * localTrans — espelho local da tabela de transições.
   *
   * Problema anterior: o input era 100% controlado pelo hook (value=transitions[key]).
   * Isso impedia digitar valores intermediários como "q" antes de completar "q1",
   * porque "q" não é um estado válido e o onChange ignorava.
   *
   * Solução: mantemos um estado local { "from,sym": valorDigitado } que atualiza
   * livremente enquanto o usuário digita. Só gravamos no hook (via setTransition)
   * quando o campo perde o foco (onBlur) e o valor é um estado válido.
   */
  const [localTrans, setLocalTrans] = useState({})

  // Sincroniza localTrans sempre que as transições do hook mudarem
  // (ex: quando um estado é removido e as transições somem)
  useEffect(() => {
    const copy = {}
    Object.entries(afd.transitions).forEach(([k, v]) => { copy[k] = v })
    setLocalTrans(copy)
  }, [afd.transitions])

  const handleTest = () => {
    const r = afd.testWord(testInput)
    setResult(r)
    setActiveState(afd.initialState)
    setStepIndex(0)
  }

  const handleStep = () => {
    if (!result) return
    const next = stepIndex + 1
    if (next <= result.trace.length) {
      const step = result.trace[next - 1]
      if (step && !step.dead) setActiveState(step.next)
      setStepIndex(next)
    }
  }

  const handleReset = () => {
    setResult(null); setActiveState(null); setStepIndex(-1)
  }

  return (
    <div className={s.layout}>

      {/* ── PAINEL ESQUERDO ── */}
      <div className={s.left}>

        {/* Estados */}
        <section className={s.section}>
          <label>ESTADOS</label>
          <div className={s.states}>
            {afd.states.map(st => (
              <button
                key={st}
                className={`${s.stateBtn}
                  ${st === afd.initialState ? s.stateBtnInit : ''}
                  ${afd.finalStates.includes(st) ? s.stateBtnFinal : ''}
                  ${st === activeState ? s.stateBtnActive : ''}
                `}
                onClick={() => afd.toggleFinal(st)}
                title="Clique para alternar estado final"
              >
                {st === afd.initialState && <span className={s.arrow}>→</span>}
                {st}
                {afd.finalStates.includes(st) && <span className={s.star}>*</span>}
              </button>
            ))}
          </div>
          <div className={s.row}>
            <input
              type="text" value={newState}
              onChange={e => setNewState(e.target.value)}
              placeholder="novo estado"
              onKeyDown={e => { if (e.key === 'Enter') { afd.addState(newState); setNewState('') } }}
            />
            <button className="primary"
              onClick={() => { afd.addState(newState); setNewState('') }}>
              + add
            </button>
          </div>
        </section>

        {/* Estado inicial */}
        <section className={s.section}>
          <label>ESTADO INICIAL</label>
          <select value={afd.initialState} onChange={e => afd.setInitialState(e.target.value)}>
            {afd.states.map(st => <option key={st} value={st}>{st}</option>)}
          </select>
        </section>

        {/* Alfabeto */}
        <section className={s.section}>
          <label>ALFABETO Σ</label>
          <input
            type="text"
            value={afd.alphabet.join(',')}
            onChange={e => afd.setAlphabet(
              e.target.value.split(',').map(x => x.trim()).filter(Boolean)
            )}
            placeholder="a,b"
          />
        </section>

        {/* Testar palavra */}
        <section className={s.section}>
          <label>TESTAR PALAVRA</label>
          <input
            type="text" value={testInput}
            onChange={e => setTestInput(e.target.value)}
            placeholder="palavra"
            onKeyDown={e => { if (e.key === 'Enter') handleTest() }}
          />
          <div className={s.btnRow}>
            <button className="primary" onClick={handleTest}>executar</button>
            {result && <>
              <button onClick={handleStep} disabled={stepIndex >= result.trace.length}>
                passo →
              </button>
              <button onClick={handleReset}>reset</button>
            </>}
          </div>
          {result && (
            <div className={result.accepted ? s.accepted : s.rejected}>
              {result.accepted ? `✓ aceita` : `✗ rejeitada`}
            </div>
          )}
        </section>

        {/* Tabela de transições */}
        <section className={s.section}>
          <label>TABELA DE TRANSIÇÕES δ</label>
          <div className={s.tableWrap}>
            <table className={s.table}>
              <thead>
                <tr>
                  <th>δ</th>
                  {afd.alphabet.map(sym => <th key={sym}>{sym}</th>)}
                </tr>
              </thead>
              <tbody>
                {afd.states.map(from => (
                  <tr key={from} className={from === activeState ? s.rowHl : ''}>
                    <td className={s.stateCell}>
                      {from === afd.initialState ? '→' : ''}{from}
                      {afd.finalStates.includes(from) ? '*' : ''}
                    </td>
                    {afd.alphabet.map(sym => {
                      const key = `${from},${sym}`
                      // Valor exibido: local (permite digitar livremente)
                      const displayVal = key in localTrans ? localTrans[key] : ''
                      // Cor vermelha se o valor digitado não é um estado válido
                      const isInvalid = displayVal !== '' && !afd.states.includes(displayVal)
                      return (
                        <td key={sym}>
                          <input
                            type="text"
                            value={displayVal}
                            onChange={e => {
                              // Atualiza local livremente durante digitação
                              setLocalTrans(prev => ({ ...prev, [key]: e.target.value }))
                            }}
                            onBlur={e => {
                              // Só grava no hook ao sair do campo, se for estado válido
                              const v = e.target.value.trim()
                              if (afd.states.includes(v)) {
                                afd.setTransition(from, sym, v)
                              } else if (v === '') {
                                afd.removeTransition(key)
                              }
                            }}
                            placeholder="—"
                            style={{
                              width: '48px',
                              color: isInvalid ? 'var(--red)' : undefined,
                            }}
                          />
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* ── PAINEL DIREITO ── */}
      <div className={s.right}>

        {/* Diagrama */}
        <section className={s.section}>
          <label>DIAGRAMA</label>
          <div className={s.viz}>
            <AutomatonViz
              states={afd.states}
              transitions={afd.transitions}
              initialState={afd.initialState}
              finalStates={afd.finalStates}
              activeState={activeState}
              type="afd"
            />
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
                  δ({step.state},{step.symbol}) →{' '}
                  {step.dead ? '∅' : step.next}
                </li>
              ))}
            </ul>
          </section>
        )}

      
      </div>
    </div>
  )
}
