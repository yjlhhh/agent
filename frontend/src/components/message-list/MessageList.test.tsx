import { fireEvent, render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { initialStreamState } from '@/lib/stream/stream-reducer'
import MessageList from './MessageList'

it('shows a jump button when the reader leaves the bottom', () => {
  render(
    <MessageList
      question="Ceph"
      state={{ ...initialStreamState, status: 'streaming', content: '回答' }}
    />,
  )

  const region = screen.getByRole('log')

  Object.defineProperties(region, {
    scrollHeight: { value: 1000 },
    clientHeight: { value: 400 },
    scrollTop: { value: 100, writable: true },
  })

  fireEvent.scroll(region)

  expect(
    screen.getByRole('button', { name: '滚动到底部' }),
  ).toBeInTheDocument()
})
