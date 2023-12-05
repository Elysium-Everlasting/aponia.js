export const ACTIONS = [
  'login',
  'register',
  'callback',
  'logout',
  'update',
  'forgot',
  'reset',
  'none',
] as const

export type Action = (typeof ACTIONS)[number]
