import { act, renderHook } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import * as sessionApi from '@/api/session'
import { useChatStream } from './useChatStream'

function createStream(chunks: string[]) {
  const encoder = new TextEncoder()

  return new ReadableStream<Uint8Array>({
    start(controller) {
      chunks.forEach((chunk) => controller.enqueue(encoder.encode(chunk)))
      controller.close()
    },
  })
}

it('stops an active request and preserves partial content', async () => {
  vi.spyOn(sessionApi, 'chat').mockImplementation(() => new Promise(() => {}) as never)
  const { result } = renderHook(() => useChatStream())

  act(() => {
    void result.current.send({
      id: '1',
      message: 'Ceph',
      webSearch: true,
      deepResearch: true,
      attachments: [],
    })
  })

  act(() => result.current.stop())

  expect(result.current.state.status).toBe('stopped')
})

it('passes AbortSignal to chat requests', async () => {
  const chat = vi.spyOn(sessionApi, 'chat').mockResolvedValue({
    data: createStream([]),
  } as never)
  const { result } = renderHook(() => useChatStream())

  await act(async () => {
    await result.current.send({
      id: '1',
      message: 'Ceph',
      webSearch: true,
      deepResearch: false,
      attachments: ['file-1'],
    })
  })

  expect(chat).toHaveBeenCalledWith(
    {
      id: '1',
      message: 'Ceph',
      web_search: true,
      deep_research: false,
      attachments: ['file-1'],
    },
    expect.objectContaining({ signal: expect.any(AbortSignal) }),
  )
})

it('streams content from chat and completes', async () => {
  vi.spyOn(sessionApi, 'chat').mockResolvedValue({
    data: createStream([
      'data: {"content":"第一段"}\n\n',
      'data: {"content":"第二段"}\n\n',
      'data: [DONE]\n\n',
    ]),
  } as never)
  const { result } = renderHook(() => useChatStream())

  await act(async () => {
    await result.current.send({
      id: '1',
      message: 'Ceph',
      webSearch: true,
      deepResearch: false,
      attachments: [],
    })
  })

  expect(result.current.state).toMatchObject({
    status: 'completed',
    content: '第一段第二段',
  })
})

it('sets failed state when chat rejects', async () => {
  vi.spyOn(sessionApi, 'chat').mockRejectedValue(new Error('boom'))
  const { result } = renderHook(() => useChatStream())

  await act(async () => {
    await result.current.send({
      id: '1',
      message: 'Ceph',
      webSearch: false,
      deepResearch: false,
      attachments: [],
    })
  })

  expect(result.current.state).toMatchObject({
    status: 'failed',
    error: 'boom',
  })
})
