import { createRoot } from 'react-dom/client'

import { App } from './App'

const rootId = 'root'

function main() {
  const root = document.getElementById(rootId)

  if (root == null) {
    throw new Error(`Element with id ${rootId} not found`)
  }

  createRoot(root).render(<App />)
}

main()
