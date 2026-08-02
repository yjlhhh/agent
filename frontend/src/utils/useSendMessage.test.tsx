import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, it, vi } from 'vitest'
import { transportToChatEnter } from '@/pages/chat/shared'
import { renderWithApp } from '@/test/test-utils'
import useSendMessage from './useSendMessage'

const { navigate, createSession, addSession, setPageTransport } = vi.hoisted(() => ({
  navigate: vi.fn(),
  createSession: vi.fn(),
  addSession: vi.fn(),
  setPageTransport: vi.fn(),
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>(
    'react-router-dom',
  )

  return {
    ...actual,
    useNavigate: () => navigate,
  }
})

vi.mock('@/api', () => ({
  session: {
    create: createSession,
  },
}))

vi.mock('@/store/session', () => ({
  sessionActions: {
    add: addSession,
  },
}))

vi.mock('@/utils', async () => {
  const actual = await vi.importActual<typeof import('@/utils')>('@/utils')

  return {
    ...actual,
    setPageTransport,
  }
})

function TriggerSend() {
  const send = useSendMessage()

  return (
    <button
      type="button"
      onClick={() => {
        void send('测试消息').catch(() => undefined)
      }}
    >
      发送
    </button>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
})

it('creates a real session before navigating to chat', async () => {
  createSession.mockResolvedValue({
    data: {
      session_id: 'session-123',
    },
  })

  renderWithApp(<TriggerSend />)

  await userEvent.click(screen.getByRole('button', { name: '发送' }))

  await waitFor(() => {
    expect(createSession).toHaveBeenCalledOnce()
  })

  expect(addSession).toHaveBeenCalledWith({
    session_id: 'session-123',
    session_name: '测试消息',
    created_at: expect.any(String),
    updated_at: expect.any(String),
  })
  expect(setPageTransport).toHaveBeenCalledWith(transportToChatEnter, {
    data: {
      message: '测试消息',
    },
  })
  expect(navigate).toHaveBeenCalledWith('/chat/session-123')
})

it('does not write session state or navigate when session creation fails', async () => {
  createSession.mockRejectedValueOnce(new Error('create failed'))

  renderWithApp(<TriggerSend />)

  await userEvent.click(screen.getByRole('button', { name: '发送' }))

  await waitFor(() => {
    expect(createSession).toHaveBeenCalledOnce()
  })

  expect(addSession).not.toHaveBeenCalled()
  expect(setPageTransport).not.toHaveBeenCalled()
  expect(navigate).not.toHaveBeenCalled()
})
