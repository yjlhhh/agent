import type { StreamState } from './types'

export function historyToStreamState(item: {
  model_answer: string
  documents?: string
  recommended_questions?: string[]
}): StreamState {
  let sources: StreamState['sources'] = []

  try {
    sources = item.documents ? JSON.parse(item.documents) : []
  } catch {
    sources = []
  }

  return {
    status: 'completed',
    content: item.model_answer,
    milestones: [],
    activities: [],
    sources,
    images: [],
    recommendations: item.recommended_questions ?? [],
  }
}
