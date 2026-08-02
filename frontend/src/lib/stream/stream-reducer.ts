import {
  mapThinkingToActivity,
  mapThinkingToMilestone,
} from './thinking-mapper'
import type {
  ResearchActivityItem,
  StreamEvent,
  StreamState,
} from './types'

export const initialStreamState: StreamState = {
  status: 'idle',
  content: '',
  milestones: [],
  activities: [],
  sources: [],
  images: [],
  recommendations: [],
}

export type StreamAction = StreamEvent | { type: 'submit' | 'stop' } | { type: 'fail'; message: string }

function appendActivity(
  activities: ResearchActivityItem[],
  activity: ResearchActivityItem,
) {
  const exists = activities.some(
    (item) => item.title === activity.title && item.detail === activity.detail,
  )
  return exists ? activities : [...activities, activity]
}

export function streamReducer(state: StreamState, action: StreamAction): StreamState {
  if (action.type === 'submit') return { ...initialStreamState, status: 'submitting' }

  if (action.type === 'thinking') {
    const milestone = mapThinkingToMilestone(action.content)
    const activity = mapThinkingToActivity(action.content)

    return {
      ...state,
      status: 'researching',
      milestones: state.milestones.includes(milestone) ? state.milestones : [...state.milestones, milestone],
      activities: appendActivity(state.activities, activity),
    }
  }

  if (action.type === 'activity') {
    return {
      ...state,
      status: 'researching',
      activities: appendActivity(state.activities, action.activity),
    }
  }
  if (action.type === 'content') {
    return {
      ...state,
      status: 'streaming',
      content: state.content + action.content,
      activities: appendActivity(state.activities, {
        kind: 'writing',
        title: '生成回答',
        detail: '根据已确认的信息组织最终回答',
      }),
    }
  }
  if (action.type === 'sources') {
    return {
      ...state,
      sources: action.sources,
      activities:
        action.sources.length > 0
          ? appendActivity(state.activities, {
              kind: 'verification',
              title: '整理来源',
              detail: `已整理 ${action.sources.length} 个可核查来源`,
            })
          : state.activities,
    }
  }
  if (action.type === 'images') return { ...state, images: action.images }
  if (action.type === 'recommendations') return { ...state, recommendations: action.questions }
  if (action.type === 'done') return { ...state, status: 'completed' }
  if (action.type === 'stop') return { ...state, status: 'stopped' }
  if (action.type === 'protocol-error' || action.type === 'fail') return { ...state, status: 'failed', error: action.message }

  return state
}
