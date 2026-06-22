import { useState, useCallback } from 'react'

export function useAP() {
  const [states, setStates] = useState(['q0', 'q1', 'q2'])
  const [alphabet, setAlphabet] = useState(['a', 'b'])
  const [stackAlphabet, setStackAlphabet] = useState(['A', '$'])
  const [initialState, setInitialState] = useState('q0')
  const [finalStates, setFinalStates] = useState(['q2'])

  const [transitions, setTransitions] = useState({
    'q0,a,$': { nextState: 'q0', push: 'A$' },
    'q0,a,A': { nextState: 'q0', push: 'AA' },
    'q0,b,A': { nextState: 'q1', push: '' },
    'q1,b,A': { nextState: 'q1', push: '' },
    'q1,ε,$': { nextState: 'q2', push: '$' },
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
        if (from === name || next[k].nextState === name) delete next[k]
      })
      return next
    })
  }, [states, initialState])

  const setTransition = useCallback((from, symbol, stackTop, nextState, push) => {
    setTransitions(t => ({
      ...t,
      [`${from},${symbol},${stackTop}`]: { nextState, push },
    }))
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
    let stack = ['$']
    let pos = 0

    const apply = (key, consumedSymbol) => {
      const t = transitions[key]
      if (!t) return false

      const stackTop = stack[0]
      const newStack = stack.slice(1)
      const toPush = t.push.split('').filter(Boolean)

      stack = [...toPush, ...newStack]

      trace.push({
        state: current,
        symbol: consumedSymbol,
        stackTop,
        nextState: t.nextState,
        push: t.push || 'ε',
        stackAfter: [...stack],
      })

      current = t.nextState
      return true
    }

    while (pos < word.length) {
      const symbol = word[pos]
      const top = stack[0] || 'ε'

      if (transitions[`${current},${symbol},${top}`]) {
        apply(`${current},${symbol},${top}`, symbol)
        pos++
        continue
      }

      if (transitions[`${current},ε,${top}`]) {
        apply(`${current},ε,${top}`, 'ε')
        continue
      }

      trace.push({ state: current, symbol, stackTop: top, dead: true })
      return { accepted: false, trace }
    }

    let limit = 20
    while (limit-- > 0) {
      const top = stack[0] || 'ε'
      if (transitions[`${current},ε,${top}`]) {
        apply(`${current},ε,${top}`, 'ε')
      } else {
        break
      }
    }

    return {
      accepted: finalStates.includes(current),
      trace,
      finalStack: [...stack],
    }
  }, [initialState, finalStates, transitions])

  return {
    states,
    alphabet,
    stackAlphabet,
    initialState,
    finalStates,
    transitions,
    setAlphabet,
    setStackAlphabet,
    setInitialState,
    addState,
    removeState,
    setTransition,
    removeTransition,
    toggleFinal,
    testWord,
  }
}