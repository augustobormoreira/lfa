# Autômatos Finitos — Trabalho Prático IFTM

Trabalho Prático de Teoria da Computação implementando:
- **Parte 1:** Autômato Finito Determinístico (AFD)
- **Parte 2:** Autômato com Pilha (AP / PDA)

## Como rodar

### Pré-requisitos
- Node.js 18+ instalado

### Instalação e execução

```bash
# Instala as dependências
npm install

# Inicia o servidor de desenvolvimento
npm run dev
```

Abra `http://localhost:5173` no navegador.

## Estrutura do projeto

```
src/
├── hooks/
│   ├── useAFD.js       # Lógica do AFD (5-tupla: Q, Σ, δ, q0, F)
│   └── useAP.js        # Lógica do AP (7-tupla: Q, Σ, Γ, δ, q0, Z0, F)
├── components/
│   ├── AutomatonViz.jsx       # Diagrama SVG do autômato
│   ├── AutomatonViz.module.css
│   ├── AFDPanel.jsx           # Interface da Parte 1
│   ├── APPanel.jsx            # Interface da Parte 2
│   └── Panel.module.css
├── App.jsx             # Componente raiz (navegação por abas)
├── App.module.css
├── main.jsx            # Entry point React
└── index.css           # Estilos globais e variáveis CSS
```

## Autômatos pré-carregados

### Parte 1 — AFD
Reconhece: `L = { w ∈ {a,b}* | w contém "aa" como substring }`

Teste: `aab` (aceita), `aba` (rejeita), `baab` (aceita)

### Parte 2 — Autômato com Pilha
Reconhece: `L = { aⁿbⁿ | n ≥ 1 }`

Teste: `ab` (aceita), `aabb` (aceita), `aaabbb` (aceita), `aab` (rejeita)

## Tecnologias
- React 18 + Vite
- CSS Modules
- SVG puro para visualização
