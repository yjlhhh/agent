import { expect, it } from 'vitest'
import { initialStreamState, streamReducer } from './stream-reducer'

it('maps raw thinking to a public milestone and never stores raw text', () => {
  const state = streamReducer(initialStreamState, { type: 'thinking', content: 'searching multiple sources' })

  expect(state.milestones).toEqual(['搜索资料'])
  expect(state.activities).toEqual([
    {
      kind: 'search',
      title: '搜索资料',
      detail: '查找与问题直接相关的信息',
    },
  ])
  expect(JSON.stringify(state)).not.toContain('searching multiple sources')
})

it('stores public tool activity without mixing it into answer content', () => {
  const state = streamReducer(initialStreamState, {
    type: 'activity',
    activity: {
      kind: 'search',
      title: '搜索网络信息',
      detail: '最新 AI 新闻',
    },
  })

  expect(state.activities).toHaveLength(1)
  expect(state.content).toBe('')
})

it('preserves partial content when stopped', () => {
  const streaming = streamReducer(initialStreamState, { type: 'content', content: '部分回答' })
  const stopped = streamReducer(streaming, { type: 'stop' })

  expect(stopped).toMatchObject({ status: 'stopped', content: '部分回答' })
})
