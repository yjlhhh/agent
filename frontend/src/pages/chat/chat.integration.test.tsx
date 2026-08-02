import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, it, vi } from 'vitest'
import { useChatStream } from '@/hooks/useChatStream'
import { historyToStreamState } from '@/lib/stream/history'
import { createSseParser } from '@/lib/stream/sse-parser'
import { initialStreamState, streamReducer } from '@/lib/stream/stream-reducer'
import { renderWithApp } from '@/test/test-utils'
import Chat from './index'

const { detail } = vi.hoisted(() => ({
  detail: vi.fn(),
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>(
    'react-router-dom',
  )

  return {
    ...actual,
    useParams: () => ({ id: 'abc' }),
  }
})

vi.mock('@/api', () => ({
  session: {
    detail,
  },
}))

vi.mock('@/hooks/useChatStream', () => ({
  useChatStream: vi.fn(),
}))

vi.mock('@/utils/usePageTransport', () => ({
  usePageTransport: () => ({
    data: undefined,
    setData: vi.fn(),
  }),
}))

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(useChatStream).mockReturnValue({
    state: initialStreamState,
    send: vi.fn(),
    stop: vi.fn(),
    reset: vi.fn(),
  })
})

it('turns backend SSE into a completed public answer', () => {
  let state = initialStreamState
  const parser = createSseParser((event) => {
    state = streamReducer(state, event)
  })

  parser.push(
    'data: {"content":"searching sources","thinking":true}\n\ndata: {"content":"Ceph 是分布式存储","thinking":false}\n\ndata: [DONE]\n\n',
  )

  expect(state.content).toBe('Ceph 是分布式存储')
  expect(state.milestones).toEqual(['搜索资料'])
  expect(JSON.stringify(state)).not.toContain('searching sources')
})

it('turns deep research SSE into a completed public answer', () => {
  let state = initialStreamState
  const parser = createSseParser((event) => {
    state = streamReducer(state, event)
  })

  parser.push(
    'event: message\ndata: {"content":"searching sources","thinking":true}\n\nevent: message\ndata: {"content":"Ceph 是分布式存储系统。","thinking":false}\n\ndata: [DONE]\n\n',
  )

  expect(state).toMatchObject({
    status: 'completed',
    content: 'Ceph 是分布式存储系统。',
    milestones: ['搜索资料'],
  })
  expect(JSON.stringify(state)).not.toContain('searching sources')
})

it('loads history without copying the think field', () => {
  const state = historyToStreamState({
    model_answer: '历史回答',
    documents: '[{"title":"文档","url":"https://example.com","content":"摘要"}]',
    recommended_questions: ['继续'],
  })

  expect(state.content).toBe('历史回答')
  expect(JSON.stringify(state)).not.toContain('think')
})

it('loads session history when transport has no message', async () => {
  detail.mockResolvedValue({
    data: [
      {
        created_at: '',
        message_id: 'msg-0',
        session_id: 'abc',
        user_question: '更早的问题',
        model_answer: '更早的回答',
        documents: '[]',
        recommended_questions: [],
      },
      {
        created_at: '',
        message_id: 'msg-1',
        session_id: 'abc',
        user_question: '历史问题',
        model_answer: '历史回答',
        think: 'searching sources',
        documents: '[{"title":"文档","url":"https://example.com","content":"摘要"}]',
        recommended_questions: ['继续'],
      },
    ],
  })

  renderWithApp(<Chat />, ['/chat/abc'])

  await waitFor(() => {
    expect(detail).toHaveBeenCalledWith({ session_id: 'abc' })
  })

  expect(await screen.findByText('历史问题')).toBeInTheDocument()
  expect(screen.getByText('历史回答')).toBeInTheDocument()
  expect(screen.getByText('更早的问题')).toBeInTheDocument()
  expect(screen.getByText('更早的回答')).toBeInTheDocument()
  expect(screen.queryByText(/已完成研究/)).not.toBeInTheDocument()
  expect(
    screen.getByRole('button', { name: '来源 1' }),
  ).toBeInTheDocument()
})

it('keeps the previous turn visible after a second question is sent', async () => {
  const send = vi.fn().mockResolvedValue(undefined)
  vi.mocked(useChatStream).mockReturnValue({
    state: initialStreamState,
    send,
    stop: vi.fn(),
    reset: vi.fn(),
  })
  detail.mockResolvedValue({
    data: [
      {
        created_at: '',
        message_id: 'msg-1',
        session_id: 'abc',
        user_question: '第一次提问',
        model_answer: '第一次回答',
        documents: '[]',
        recommended_questions: [],
      },
    ],
  })

  renderWithApp(<Chat />, ['/chat/abc'])

  expect(await screen.findByText('第一次回答')).toBeInTheDocument()

  await userEvent.type(screen.getByRole('textbox'), '第二次提问{enter}')

  await waitFor(() => {
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'abc',
        message: '第二次提问',
      }),
    )
  })
  expect(screen.getByText('第一次提问')).toBeInTheDocument()
  expect(screen.getByText('第一次回答')).toBeInTheDocument()
  expect(screen.getByText('第二次提问')).toBeInTheDocument()
})
