import { hydrateRoot } from 'react-dom/client'

function main() {
  const root = document.getElementById('root')

  if (root) {
    hydrateRoot(root)
  }
}

main()
