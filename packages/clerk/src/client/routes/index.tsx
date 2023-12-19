import React from 'react'
import { hydrateRoot } from 'react-dom/client'

import { MyComponent } from '../../components/my-component'

function main() {
  const root = document.getElementById('root')

  if (root) {
    hydrateRoot(root, <MyComponent />)
  }
}

main()
