import React, { useState } from 'react'

export function MyComponent() {
  const [count, setCount] = useState(0)

  return (
    <div>
      <h1>Hello, World!</h1>
      <p>Count: {count}</p>
      <button onClick={() => setCount((currentCount) => currentCount + 1)}>Increment</button>
    </div>
  )
}
