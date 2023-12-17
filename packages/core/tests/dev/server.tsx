import express from 'express'
import React from 'react'
import { useState } from 'react'
import { renderToString } from 'react-dom/server'

function MyComponent() {
  const [count, setCount] = useState(0)

  return (
    <div>
      <h1>Hello, World!</h1>
      <p>Count: {count}</p>
      <button onClick={() => setCount((currentCount) => currentCount + 1)}>Increment</button>
    </div>
  )
}

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
