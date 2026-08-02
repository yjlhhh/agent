import { expect, it } from 'vitest'
import { initialStreamState, streamReducer } from './stream-reducer'

it('maps raw thinking to a public milestone and never stores raw text', () => {
  const state = streamReducer(initialStreamState, { type: 'thinking', content: 'searching multiple sources' })

  expect(state.milestones).toEqual(['搜索资料'])
  expect(JSON.stringify(state)).not.toContain('searching multiple sources')
})

it('preserves partial content when stopped', () => {
  const streaming = streamReducer(initialStreamState, { type: 'content', content: '部分回答' })
  const stopped = streamReducer(streaming, { type: 'stop' })

  expect(stopped).toMatchObject({ status: 'stopped', content: '部分回答' })
})
