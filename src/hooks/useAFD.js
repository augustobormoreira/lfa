// useState — cria variáveis de estado. Quando mudam, o componente re-renderiza.
// useCallback — memoriza uma função para ela não ser recriada do zero a cada render.
import { useState, useCallback } from 'react'

/**
 * useAFD — Autômato Finito Determinístico
 *
 * 5-tupla: M = (Q, Σ, δ, q0, F)
 *   Q  → estados
 *   Σ  → alfabeto de entrada
 *   δ  → função de transição: δ(estado, símbolo) → estado
 *   q0 → estado inicial
 *   F  → estados de aceitação
 *
 * Autômato pré-carregado reconhece:
 *   L = { w ∈ {a,b}* | w contém "aa" como substring }
 *
 * Correção: q2,b → q2 (mantém aceitação após qualquer sufixo)
 */
export function useAFD() {
  // useState retorna sempre um par: [valorAtual, funçãoParaMudar].
  // Quando você chama setStates(novoValor), o React atualiza e re-renderiza.
  const [states, setStates]             = useState(['q0', 'q1', 'q2'])

  // O alfabeto Σ. Array de strings, uma por símbolo.
  const [alphabet, setAlphabet]         = useState(['a', 'b'])

  // O estado inicial q0. É só uma string.
  const [initialState, setInitialState] = useState('q0')

  // O conjunto F de estados de aceitação. Array porque pode ter mais de um.
  const [finalStates, setFinalStates]   = useState(['q2'])

  // A função δ representada como um objeto JavaScript.
  // A chave é "estado,símbolo" e o valor é o próximo estado.
  // Por exemplo, transitions['q1,a'] retorna 'q2', que é δ(q1, a).
  const [transitions, setTransitions] = useState({
    'q0,a': 'q1',  // primeiro 'a'
    'q0,b': 'q0',  // 'b' sem histórico de 'a'
    'q1,a': 'q2',  // segundo 'a' consecutivo → encontrou "aa"
    'q1,b': 'q0',  // 'b' quebra a sequência
    'q2,a': 'q2',  // já aceitou, laço em q2
    'q2,b': 'q2',  // CORRIGIDO: b não sai do estado de aceitação
  })

  // useCallback recebe a função e um array de dependências [states].
  // Significa "recrie essa função só quando states mudar".
  const addState = useCallback((name) => {
    const n = name.trim()  // remove espaços das bordas
    // s => [...s, n] cria um array novo com todos os estados anteriores mais o novo.
    // Não muta o original — essa é a regra do React.
    if (n && !states.includes(n)) setStates(s => [...s, n])
  }, [states])

  const removeState = useCallback((name) => {
    // .filter retorna um novo array apenas com os elementos que passam na condição.
    setStates(s => s.filter(x => x !== name))       // remove o estado da lista
    setFinalStates(f => f.filter(x => x !== name))  // remove dos finais se estava lá
    if (initialState === name) setInitialState('')   // limpa inicial se era ele

    setTransitions(t => {
      const next = { ...t }  // { ...t } é spread operator — cria uma cópia rasa do objeto antes de deletar chaves
      Object.keys(next).forEach(k => {
        // k é algo como "q1,a". split(',') vira ["q1", "a"].
        // const [from] é desestruturação de array — pega só o primeiro elemento.
        const [from] = k.split(',')
        // Remove transições que saem do estado removido OU chegam nele.
        if (from === name || next[k] === name) delete next[k]
      })
      return next
    })
  }, [states, initialState])

  const setTransition = useCallback((from, symbol, to) => {
    // `${from},${symbol}` é uma computed property — monta a chave dinamicamente.
    // { ...t, novaChave: valor } copia tudo e adiciona/sobrescreve a nova chave.
    setTransitions(t => ({ ...t, [`${from},${symbol}`]: to }))
  }, [])  // [] vazio nas dependências: crie essa função uma vez só, nunca recrie

  const removeTransition = useCallback((key) => {
    // Copia o objeto, deleta a chave pelo nome exato, retorna a cópia.
    setTransitions(t => { const n = { ...t }; delete n[key]; return n })
  }, [])

  const toggleFinal = useCallback((state) => {
    setFinalStates(f =>
      // Operador ternário: condição ? seVerdadeiro : seFalso.
      // Se o estado já está em F, remove. Se não está, adiciona. Funciona como checkbox.
      f.includes(state) ? f.filter(x => x !== state) : [...f, state]
    )
  }, [])

  /**
   * testWord — executa o AFD sobre a palavra de entrada.
   *
   * Algoritmo:
   *   1. estado ← q0
   *   2. para cada símbolo w[i]:
   *        a. consulta δ(estado, w[i])
   *        b. se não existe → rejeita (estado morto ∅)
   *        c. estado ← δ(estado, w[i])
   *   3. aceita se estado ∈ F
   */
  const testWord = useCallback((word) => {
    const trace = []           // vai guardar cada passo para exibir depois
    let current = initialState // começa no estado inicial

    // Caso especial: palavra vazia (representada por ε).
    // Aceita se e somente se o estado inicial já é final.
    if (word.length === 0) {
      return {
        accepted: finalStates.includes(current),
        trace: [{ state: current, symbol: 'ε', next: current }],
        finalState: current,
      }
    }

    for (let i = 0; i < word.length; i++) {
      const symbol = word[i]                             // word[i] acessa o i-ésimo caractere da string
      const next = transitions[`${current},${symbol}`]  // consulta δ — se não existir, retorna undefined

      // === undefined (triplo igual) checa tipo e valor.
      // Se não tem transição, vai para estado morto e para tudo.
      if (next === undefined) {
        trace.push({ state: current, symbol, next: null, dead: true })
        return { accepted: false, trace }
      }

      // { state: current, symbol, next } é shorthand:
      // equivale a { state: current, symbol: symbol, next: next }
      trace.push({ state: current, symbol, next })
      current = next  // avança para o próximo estado
    }

    return {
      accepted: finalStates.includes(current),  // aceita se estado final ∈ F
      trace,
      finalState: current,
    }
  // As dependências dizem ao React: "recrie testWord sempre que qualquer um desses mudar",
  // necessário porque a função usa essas variáveis internamente.
  }, [initialState, finalStates, transitions])

  // O hook expõe tudo que os componentes precisam:
  // estado para leitura (states, transitions...) e funções para escrita (addState, setTransition...).
  // Quem chama useAFD() recebe esse objeto e desestrutura o que precisar.
  return {
    states, alphabet, initialState, finalStates, transitions,
    setAlphabet, setInitialState,
    addState, removeState, setTransition, removeTransition, toggleFinal,
    testWord,
  }
}
