// @ts-check

import http from 'node:http'

import handler from 'serve-handler'

const base = '/aponia.js'

const server = http.createServer((request, response) => {
  if (request.url?.startsWith(base)) {
    request.url = request.url.slice(base.length) || '/'
  }

  return handler(request, response, { public: './out' })
})

server.listen(8000, () => {
  console.log('Running at http://localhost:8000')
})
