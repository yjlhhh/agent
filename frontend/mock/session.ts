import { MockMethod } from 'vite-plugin-mock'

const now = () => new Date().toISOString()

const ssePayload = [
  'event: message',
  'data: {"content":"searching sources","thinking":true}',
  '',
  'event: message',
  'data: {"content":"Ceph 是分布式存储系统。","thinking":false}',
  '',
  'data: [DONE]',
  '',
]

async function streamChatResponse(res: {
  setHeader: (name: string, value: string) => void
  flushHeaders: () => void
  write: (chunk: string) => void
  end: () => void
}) {
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders()

  for (const line of ssePayload) {
    await new Promise((resolve) => setTimeout(resolve, 1))
    res.write(line)
    res.write('\n')
  }

  res.end()
}

export default [
  {
    url: '/ai-search/create_session',
    method: 'post',
    timeout: 500,
    statusCode: 200,
    response: {
      session_id: 'abcdef1234567890',
      status: 'success',
      message: 'Session created successfully',
    },
  },
  {
    url: '/ai-search/get_sessions/',
    method: 'get',
    response: () => ({
      sessions: [
        {
          session_id: 'demo',
          session_name: 'Ceph 研究',
          created_at: now(),
          updated_at: now(),
        },
      ],
    }),
  },
  {
    url: '/ai-search/ai_search/',
    method: 'post',
    rawResponse: async (req, res) => {
      await streamChatResponse(res)
    },
  },
  {
    url: '/ai-search/deep_research/',
    method: 'post',
    rawResponse: async (req, res) => {
      await streamChatResponse(res)
    },
  },
  {
    url: '/ai-search/upload_files/',
    method: 'post',
    rawResponse: async (req, res) => {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      res.end()
    },
  },
  {
    url: '/ai-search/get_messages/',
    method: 'get',
    response: () => [
      {
        created_at: now(),
        message_id: 'msg-1',
        session_id: 'demo',
        user_question: 'Ceph 是什么？',
        model_answer: 'Ceph 是分布式存储系统。',
        think: 'searching sources',
        documents: '[{"title":"文档","url":"https://example.com","content":"摘要"}]',
        recommended_questions: ['继续'],
      },
    ],
  },
] as MockMethod[]
