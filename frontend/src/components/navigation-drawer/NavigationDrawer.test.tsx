import { screen } from '@testing-library/react'
import { afterAll, beforeAll, expect, it, vi } from 'vitest'
import { renderWithApp } from '@/test/test-utils'
import NavigationDrawer from './NavigationDrawer'

const originalGetComputedStyle = window.getComputedStyle.bind(window)

beforeAll(() => {
  vi.spyOn(window, 'getComputedStyle').mockImplementation(
    ((element: Element) => originalGetComputedStyle(element)) as typeof window.getComputedStyle,
  )
})

afterAll(() => {
  vi.restoreAllMocks()
})

it('renders session history as chat links', () => {
  renderWithApp(
    <NavigationDrawer
      open
      onClose={() => {}}
      sessions={[
        {
          session_id: 'abc',
          session_name: 'Ceph 研究',
          created_at: '',
          updated_at: '',
        },
      ]}
    />,
  )

  expect(screen.getByRole('link', { name: 'Ceph 研究' })).toHaveAttribute(
    'href',
    '/chat/abc',
  )
})
