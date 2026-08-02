import type { StreamEvent } from './types'

export function createSseParser(onEvent: (event: StreamEvent) => void) {
  let buffer = ''

  function parseBlock(block: string) {
    const data = block
      .split('\n')
      .filter((line) => line.startsWith('data:'))
      .map((line) => line.slice(5).trimStart())
      .join('\n')

    if (!data) return

    if (data === '[DONE]') {
      onEvent({ type: 'done' })
      return
    }

    try {
      const value = JSON.parse(data)

      if (value.content) {
        onEvent({ type: value.thinking ? 'thinking' : 'content', content: value.content })
      }

      if (Array.isArray(value.documents)) {
        onEvent({ type: 'sources', sources: value.documents })
      }

      if (value.image_results?.images) {
        onEvent({ type: 'images', images: value.image_results.images })
      }

      if (Array.isArray(value.recommended_questions)) {
        onEvent({ type: 'recommendations', questions: value.recommended_questions })
      }
    } catch {
      onEvent({ type: 'protocol-error', message: '无法解析流数据' })
    }
  }

  return {
    push(chunk: string) {
      buffer += chunk.replace(/\r\n/g, '\n')
      const blocks = buffer.split('\n\n')
      buffer = blocks.pop() ?? ''
      blocks.forEach(parseBlock)
    },
    finish() {
      if (buffer.trim()) {
        parseBlock(buffer)
      }
      buffer = ''
    },
  }
}
