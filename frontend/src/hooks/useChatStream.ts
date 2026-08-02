import { useCallback, useReducer, useRef } from 'react'
import { chat } from '@/api/session'
import { initialStreamState, streamReducer } from '@/lib/stream/stream-reducer'
import { createSseParser } from '@/lib/stream/sse-parser'

type SendInput = {
  id: string
  message: string
  webSearch: boolean
  deepResearch: boolean
  attachments: string[]
}

export function useChatStream() {
  const [state, dispatch] = useReducer(streamReducer, initialStreamState)
  const controllerRef = useRef<AbortController | null>(null)

  const stop = useCallback(() => {
    controllerRef.current?.abort()
    dispatch({ type: 'stop' })
  }, [])

  const reset = useCallback(() => {
    dispatch({ type: 'submit' })
  }, [])

  const send = useCallback(async (input: SendInput) => {
    controllerRef.current?.abort()
    const controller = new AbortController()
    controllerRef.current = controller
    dispatch({ type: 'submit' })

    try {
      const response = await chat(
        {
          id: input.id,
          message: input.message,
          web_search: input.webSearch,
          deep_research: input.deepResearch,
          attachments: input.attachments,
        },
        { signal: controller.signal },
      )

      const reader = response.data.getReader()
      const decoder = new TextDecoder()
      const parser = createSseParser((event) => dispatch(event))

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        parser.push(decoder.decode(value, { stream: true }))
      }

      parser.finish()
      dispatch({ type: 'done' })
    } catch (error) {
      if (!controller.signal.aborted) {
        dispatch({
          type: 'fail',
          message: error instanceof Error ? error.message : '生成失败',
        })
      }
    }
  }, [])

  return { state, send, stop, reset }
}
