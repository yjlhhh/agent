import { renderWithApp } from '@/test/test-utils'
import { screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { initialStreamState } from '@/lib/stream/stream-reducer'
import AssistantResponse from './AssistantResponse'

it('does not render empty media or source controls', () => {
  renderWithApp(<AssistantResponse state={{ ...initialStreamState, status: 'completed', content: '# Ceph' }} />)

  expect(screen.queryByRole('button', { name: /查看 .*来源/ })).not.toBeInTheDocument()
  expect(screen.queryByRole('img')).not.toBeInTheDocument()
})
