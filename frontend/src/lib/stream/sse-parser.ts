import type { ResearchActivityItem, StreamEvent } from './types'

function mapAgentMessage(content: string): ResearchActivityItem {
  const query = content.match(/[“"']([^”"']+)[”"']/)?.[1]?.trim()

  if (content.includes('本地文档搜索')) {
    return {
      kind: 'search',
      title: '搜索本地知识库',
      detail: query || '查找与问题相关的文档内容',
    }
  }

  if (content.includes('网络搜索')) {
    return {
      kind: 'search',
      title: '搜索网络信息',
      detail: query || '查找最新的公开信息',
    }
  }

  if (content.includes('补充检索')) {
    return {
      kind: 'verification',
      title: '补充验证',
      detail: '补充缺失信息并检查现有结论',
    }
  }

  return {
    kind: 'analysis',
    title: '执行研究步骤',
    detail: content.slice(0, 120),
  }
}

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

      if (value.role === 'agent' && value.content) {
        onEvent({ type: 'activity', activity: mapAgentMessage(value.content) })
      } else if (value.content) {
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
