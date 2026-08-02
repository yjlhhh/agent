import { describe, expect, it, vi } from 'vitest'
import { createSseParser } from './sse-parser'

describe('createSseParser', () => {
  it('joins chunks and ignores event metadata', () => {
    const onEvent = vi.fn()
    const parser = createSseParser(onEvent)
    parser.push('event: message\ndata: {"content":"Ce')
    parser.push('ph","thinking":false}\n\n')
    expect(onEvent).toHaveBeenCalledWith({ type: 'content', content: 'Ceph' })
  })

  it('reports malformed JSON without throwing', () => {
    const onEvent = vi.fn()
    const parser = createSseParser(onEvent)
    parser.push('data: {bad}\n\n')
    expect(onEvent).toHaveBeenCalledWith({ type: 'protocol-error', message: '无法解析流数据' })
  })
})
