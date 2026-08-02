import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'
import { renderWithApp } from '@/test/test-utils'
import PromptComposer from './PromptComposer'

it('submits trimmed text with Enter', async () => {
  const onSend = vi.fn()

  renderWithApp(<PromptComposer onSend={onSend} />)

  await userEvent.type(screen.getByRole('textbox'), '  研究 Ceph  {enter}')

  expect(onSend).toHaveBeenCalledWith('研究 Ceph', [])
})

it('shows stop while loading', async () => {
  const onStop = vi.fn()

  renderWithApp(<PromptComposer loading onStop={onStop} />)

  await userEvent.click(screen.getByRole('button', { name: '停止生成' }))

  expect(onStop).toHaveBeenCalledOnce()
})
