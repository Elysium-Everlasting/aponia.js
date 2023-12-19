import express from 'express'
import React from 'react'
import { renderToString } from 'react-dom/server'

import { MyComponent } from '../../components/my-component'

const PORT = 8080

function main() {
  const app = express()

  app.get('/', (_req, res) => {
    const html = renderToString(<MyComponent />)

    res.send(`<!DOCTYPE html><html><body>${html}</body></html>`)
  })

  app.listen(PORT, () => {
    console.log(`Server listening at http://localhost:${PORT}`)
  })
}

main()
