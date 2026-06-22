import React, { useState } from 'react'
import AFDPanel from './components/AFDPanel'
import APPanel from './components/APPanel'
import styles from './App.module.css'

export default function App() {
  const [tab, setTab] = useState('afd')

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.title}>Autômatos Finitos</span>
          <span className={styles.subtitle}>Teoria da Computação — IFTM</span>
        </div>
        <nav className={styles.tabs}>
          <button
            className={`${styles.tab} ${tab === 'afd' ? styles.tabActive : ''}`}
            onClick={() => setTab('afd')}>
            Parte 1 · AFD
          </button>
          <button
            className={`${styles.tab} ${tab === 'ap' ? styles.tabActive : ''}`}
            onClick={() => setTab('ap')}>
            Parte 2 · Pilha
          </button>
        </nav>
      </header>

      <main className={styles.main}>
        {tab === 'afd' ? <AFDPanel /> : <APPanel />}
      </main>
    </div>
  )
}
