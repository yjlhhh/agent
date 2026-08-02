import * as api from '@/api'
import { transportToChatEnter } from '@/pages/chat/shared'
import { sessionActions } from '@/store/session'
import { setPageTransport } from '@/utils'
import { useNavigate } from 'react-router-dom'

export default function useSendMessage() {
  const navigate = useNavigate()

  return async (message: string) => {
    const result = await api.session.create()
    const sessionId = result.data.session_id
    const now = new Date().toISOString()

    sessionActions.add({
      session_id: sessionId,
      session_name: message,
      created_at: now,
      updated_at: now,
    })
    setPageTransport(transportToChatEnter, {
      data: {
        message,
      },
    })
    navigate(`/chat/${sessionId}`)
  }
}
