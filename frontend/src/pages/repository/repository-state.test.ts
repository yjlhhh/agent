import { expect, it } from 'vitest'
import { getRepositoryStatus } from './repository-state'

it.each([
  [{ status: 'success' }, 'ready'],
  [{ status: 'processing' }, 'parsing'],
  [{ status: 'error' }, 'failed'],
])('maps %o to %s', (input, expected) => {
  expect(getRepositoryStatus(input)).toBe(expected)
})
