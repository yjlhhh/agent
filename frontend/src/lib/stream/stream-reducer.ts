import { mapThinkingToMilestone } from './thinking-mapper'
import type { StreamEvent, StreamState } from './types'

export const initialStreamState: StreamState = {
  status: 'idle',
  content: '',
  milestones: [],
  sources: [],
  images: [],
  recommendations: [],
}

export type StreamAction = StreamEvent | { type: 'submit' | 'stop' } | { type: 'fail'; message: string }

export function streamReducer(state: StreamState, action: StreamAction): StreamState {
  if (action.type === 'submit') return { ...initialStreamState, status: 'submitting' }

  if (action.type === 'thinking') {
    const milestone = mapThinkingToMilestone(action.content)

    return {
      ...state,
      status: 'researching',
      milestones: state.milestones.includes(milestone) ? state.milestones : [...state.milestones, milestone],
    }
  }

  if (action.type === 'content') return { ...state, status: 'streaming', content: state.content + action.content }
  if (action.type === 'sources') return { ...state, sources: action.sources }
  if (action.type === 'images') return { ...state, images: action.images }
  if (action.type === 'recommendations') return { ...state, recommendations: action.questions }
  if (action.type === 'done') return { ...state, status: 'completed' }
  if (action.type === 'stop') return { ...state, status: 'stopped' }
  if (action.type === 'protocol-error' || action.type === 'fail') return { ...state, status: 'failed', error: action.message }

  return state
}
