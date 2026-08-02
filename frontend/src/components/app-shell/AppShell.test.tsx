import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterAll, beforeAll, beforeEach, expect, it, vi } from 'vitest'
import { sessionActions } from '@/store/session'
import { renderWithApp } from '@/test/test-utils'
import AppShell from './AppShell'

const originalGetComputedStyle = window.getComputedStyle.bind(window)
const refreshSpy = vi.spyOn(sessionActions, 'refresh')

beforeAll(() => {
  vi.spyOn(window, 'getComputedStyle').mockImplementation(
    ((element: Element) => originalGetComputedStyle(element)) as typeof window.getComputedStyle,
  )
})

beforeEach(() => {
  refreshSpy.mockResolvedValue(undefined)
  refreshSpy.mockClear()
})

afterAll(() => {
  vi.restoreAllMocks()
})

it('keeps navigation hidden until the menu button is pressed', async () => {
  renderWithApp(
    <AppShell>
      <div>页面内容</div>
    </AppShell>,
  )

  expect(
    screen.queryByRole('dialog', { name: '导航' }),
  ).not.toBeInTheDocument()

  await userEvent.click(screen.getByRole('button', { name: '打开导航' }))

  expect(screen.getByRole('dialog', { name: '导航' })).toBeInTheDocument()
})

it('uses simplified Chinese navigation labels', async () => {
  renderWithApp(
    <AppShell>
      <div />
    </AppShell>,
  )

  await userEvent.click(screen.getByRole('button', { name: '打开导航' }))

  expect(screen.getByText('新对话')).toBeInTheDocument()
  expect(screen.getByText('知识库')).toBeInTheDocument()
})

it('refreshes session history on mount', () => {
  renderWithApp(
    <AppShell>
      <div />
    </AppShell>,
  )

  expect(refreshSpy).toHaveBeenCalledOnce()
})
