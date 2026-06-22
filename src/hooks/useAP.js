// useState — cria variáveis de estado. Quando mudam, o componente re-renderiza.
// useCallback — memoriza uma função para ela não ser recriada do zero a cada render.
import { useState, useCallback } from 'react'

/**
 * useAP — Autômato com Pilha (Pushdown Automaton)
 *
 * 7-tupla: M = (Q, Σ, Γ, δ, q0, Z0, F)
 *   Q  → estados
 *   Σ  → alfabeto de entrada
 *   Γ  → alfabeto da pilha
 *   δ  → δ(estado, símbolo|ε, topoPilha) → (novoEstado, push)
 *   q0 → estado inicial
 *   Z0 → símbolo de fundo de pilha ('$')
 *   F  → estados de aceitação
 *
 * Autômato pré-carregado reconhece:
 *   L = { aⁿbⁿ | n ≥ 1 }
 *
 * Estratégia: empilha 'A' para cada 'a', desempilha para cada 'b'.
 * Aceita quando a pilha fica com só '$' ao final da entrada.
 *
 * Diferença fundamental em relação ao useAFD:
 *   O AFD só depende do estado atual + símbolo lido.
 *   O AP depende do estado atual + símbolo lido + TOPO DA PILHA.
 *   Isso dá memória ilimitada ao autômato, permitindo reconhecer
 *   linguagens que o AFD não consegue (como aⁿbⁿ).
 */
export function useAP() {
  // Igual ao AFD: useState retorna [valorAtual, funçãoParaMudar]
  const [states, setStates]               = useState(['q0', 'q1', 'q2'])
  const [alphabet, setAlphabet]           = useState(['a', 'b'])

  // NOVO em relação ao AFD: o AP tem um segundo alfabeto — o da pilha (Γ).
  // Os símbolos da pilha não precisam ser os mesmos da entrada.
  // 'A' = símbolo que representa um 'a' contado, '$' = fundo de pilha.
  const [stackAlphabet, setStackAlphabet] = useState(['A', '$'])

  const [initialState, setInitialState]   = useState('q0')
  const [finalStates, setFinalStates]     = useState(['q2'])

  // δ como mapa "estado,símbolo,topoPilha" → { nextState, push }
  // Diferença do AFD: a chave agora tem 3 partes (antes eram 2).
  // push: string com os símbolos a empilhar após o pop do topo.
  //   push = 'A$' → desempilha o topo, empilha '$' depois 'A' (A fica no topo)
  //   push = ''   → só desempilha, não empilha nada (pop puro)
  const [transitions, setTransitions] = useState({
    'q0,a,$': { nextState: 'q0', push: 'A$' },  // 1º 'a': empilha A sobre $
    'q0,a,A': { nextState: 'q0', push: 'AA' },  // demais 'a': empilha mais um A
    'q0,b,A': { nextState: 'q1', push: '' },     // 1º 'b': desempilha A, muda para q1
    'q1,b,A': { nextState: 'q1', push: '' },     // demais 'b': desempilha A
    'q1,ε,$': { nextState: 'q2', push: '$' },    // pilha zerada → vai para estado final
  })

  // addState, removeState, toggleFinal têm a mesma lógica do AFD.
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
        // Diferença do AFD: o valor não é uma string simples, é um objeto { nextState, push }.
        // Por isso acessamos next[k].nextState em vez de apenas next[k].
        if (from === name || next[k].nextState === name) delete next[k]
      })
      return next
    })
  }, [states, initialState])

  const setTransition = useCallback((from, symbol, stackTop, nextState, push) => {
    // Diferença do AFD: a chave agora inclui stackTop (topo da pilha).
    // O valor é um objeto com dois campos: nextState e push.
    setTransitions(t => ({
      ...t,
      [`${from},${symbol},${stackTop}`]: { nextState, push },
    }))
  }, [])

  const removeTransition = useCallback((key) => {
    setTransitions(t => { const n = { ...t }; delete n[key]; return n })
  }, [])

  const toggleFinal = useCallback((state) => {
    // Operador ternário: se já é final, remove; se não é, adiciona.
    setFinalStates(f =>
      f.includes(state) ? f.filter(x => x !== state) : [...f, state]
    )
  }, [])

  /**
   * testWord — simula o AP sobre a entrada.
   *
   * Algoritmo:
   *   1. estado ← q0, pilha ← ['$']
   *   2. para cada símbolo da entrada:
   *        a. tenta δ(estado, símbolo, topo)
   *        b. se não achar, tenta δ(estado, ε, topo)  ← transição-ε
   *        c. aplica: pop topo, push novos símbolos
   *   3. ao fim da entrada, continua com transições-ε
   *   4. aceita se estado ∈ F
   *
   * Pilha representada como array onde índice 0 = TOPO.
   * Isso facilita: stack[0] = lê o topo, stack.slice(1) = remove o topo.
   */
  const testWord = useCallback((word) => {
    const trace = []           // registra cada passo para exibição
    let current = initialState // estado atual, começa em q0
    let stack = ['$']          // pilha inicial: só o marcador de fundo
    let pos = 0                // posição atual na palavra de entrada

    /**
     * apply — aplica uma transição ao estado e à pilha.
     *
     * Recebe a chave da transição e o símbolo consumido (pode ser 'ε').
     * Retorna false se a transição não existe, true se foi aplicada.
     *
     * Por que é uma função interna?
     *   Porque tanto a leitura normal quanto as transições-ε usam a mesma
     *   lógica de manipulação da pilha. Evita repetir o código duas vezes.
     */
    const apply = (key, consumedSymbol) => {
      const t = transitions[key]
      if (!t) return false              // transição não existe, aborta

      const stackTop = stack[0]         // guarda o topo atual para o trace
      const newStack = stack.slice(1)   // remove o topo da pilha (pop)
                                        // slice(1) retorna tudo a partir do índice 1

      // Converte a string de push em array de símbolos individuais.
      // t.push = 'A$' → ['A', '$']. filter(Boolean) remove strings vazias.
      const toPush = t.push.split('').filter(Boolean)

      // Empilha os novos símbolos na frente do array (spread operator).
      // [...toPush, ...newStack] significa: novos símbolos no topo, resto embaixo.
      // Ex: toPush=['A','$'], newStack=[] → stack=['A','$']
      stack = [...toPush, ...newStack]

      // Registra o passo no trace. [...stack] cria uma cópia do array atual
      // porque stack é mutável — sem a cópia, todos os passos apontariam
      // para o mesmo array no final.
      trace.push({
        state: current, symbol: consumedSymbol,
        stackTop, nextState: t.nextState,
        push: t.push || 'ε', stackAfter: [...stack],
      })

      current = t.nextState  // avança o estado
      return true
    }

    // Loop principal: processa cada símbolo da entrada
    while (pos < word.length) {
      const symbol = word[pos]       // símbolo atual
      const top = stack[0] || 'ε'   // topo da pilha ('ε' se estiver vazia)

      // Tenta transição normal: δ(estado, símbolo, topo)
      if (transitions[`${current},${symbol},${top}`]) {
        apply(`${current},${symbol},${top}`, symbol)
        pos++     // consome o símbolo — avança na palavra
        continue
      }

      // Tenta transição-ε: δ(estado, ε, topo)
      // Transições-ε mudam o estado e manipulam a pilha SEM consumir símbolo.
      // Por isso o pos NÃO é incrementado — o símbolo será lido de novo.
      if (transitions[`${current},ε,${top}`]) {
        apply(`${current},ε,${top}`, 'ε')
        continue  // não incrementa pos
      }

      // Nenhuma transição possível → estado morto, rejeita
      trace.push({ state: current, symbol, stackTop: top, dead: true })
      return { accepted: false, trace }
    }

    // Após consumir toda a entrada, ainda pode haver transições-ε pendentes.
    // Exemplo: a transição 'q1,ε,$' que leva ao estado final só dispara aqui.
    // limit=20 evita loop infinito caso o autômato esteja mal definido.
    let limit = 20
    while (limit-- > 0) {
      const top = stack[0] || 'ε'
      if (transitions[`${current},ε,${top}`]) apply(`${current},ε,${top}`, 'ε')
      else break  // nenhuma transição-ε disponível, para
    }

    // Aceita se o estado atual pertence ao conjunto F de estados finais.
    // finalStack é exportado para a visualização da pilha no final da execução.
    return { accepted: finalStates.includes(current), trace, finalStack: [...stack] }

  // As dependências garantem que testWord seja recriado quando o autômato mudar.
  }, [initialState, finalStates, transitions])

  // Exporta tudo que os componentes precisam para ler e modificar o autômato.
  // stackAlphabet e setStackAlphabet são extras em relação ao useAFD.
  return {
    states, alphabet, stackAlphabet, initialState, finalStates, transitions,
    setAlphabet, setStackAlphabet, setInitialState,
    addState, removeState, setTransition, removeTransition, toggleFinal,
    testWord,
  }
}
