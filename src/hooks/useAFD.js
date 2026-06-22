import { useState, useCallback } from 'react'

export function useAFD() {
  const [states, setStates] = useState(['q0', 'q1', 'q2'])
  const [alphabet, setAlphabet] = useState(['a', 'b'])
  const [initialState, setInitialState] = useState('q0')
  const [finalStates, setFinalStates] = useState(['q2'])

  const [transitions, setTransitions] = useState({
    'q0,a': 'q1',
    'q0,b': 'q0',
    'q1,a': 'q2',
    'q1,b': 'q0',
    'q2,a': 'q2',
    'q2,b': 'q2',
  })

  const addState = useCallback((name) => {
    const n = name.trim()
    if (n && !states.includes(n)) setStates(s => [...s, n])
  }, [states])

  const removeState = useCallback((name) => {
    setStates(s => s.filter(x => x !== name))
    setFinalStates(f => f.filter(x => x !== name))
    if (initialState === name) setInitialState('')

    setTransitions(t => {
      const next = { ...t }
      Object.keys(next).forEach(k => {
        const [from] = k.split(',')
        if (from === name || next[k] === name) delete next[k]
      })
      return next
    })
  }, [states, initialState])

  const setTransition = useCallback((from, symbol, to) => {
    setTransitions(t => ({ ...t, [`${from},${symbol}`]: to }))
  }, [])

  const removeTransition = useCallback((key) => {
    setTransitions(t => {
      const n = { ...t }
      delete n[key]
      return n
    })
  }, [])

  const toggleFinal = useCallback((state) => {
    setFinalStates(f =>
      f.includes(state)
        ? f.filter(x => x !== state)
        : [...f, state]
    )
  }, [])

  const testWord = useCallback((word) => {
    const trace = []
    let current = initialState

    if (word.length === 0) {
      return {
        accepted: finalStates.includes(current),
        trace: [{ state: current, symbol: 'ε', next: current }],
        finalState: current,
      }
    }

    for (let i = 0; i < word.length; i++) {
      const symbol = word[i]
      const next = transitions[`${current},${symbol}`]

      if (next === undefined) {
        trace.push({ state: current, symbol, next: null, dead: true })
        return { accepted: false, trace }
      }

      trace.push({ state: current, symbol, next })
      current = next
    }

    return {
      accepted: finalStates.includes(current),
      trace,
      finalState: current,
    }
  }, [initialState, finalStates, transitions])

  return {
    states,
    alphabet,
    initialState,
    finalStates,
    transitions,
    setAlphabet,
    setInitialState,
    addState,
    removeState,
    setTransition,
    removeTransition,
    toggleFinal,
    testWord,
  }
}