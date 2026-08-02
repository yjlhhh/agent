import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'
import { renderWithApp } from '@/test/test-utils'
import styles from './PromptComposer.module.scss'
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

it('shows both modes as active by default', () => {
  renderWithApp(<PromptComposer />)

  expect(screen.getByText('深度研究')).toHaveClass(styles.modeActive)
  expect(screen.getByText('联网')).toHaveClass(styles.modeActive)
})

it('does not submit Enter while IME composition is active', () => {
  const onSend = vi.fn()

  renderWithApp(<PromptComposer onSend={onSend} />)

  const textbox = screen.getByRole('textbox')
  fireEvent.change(textbox, {
    target: {
      value: '中文输入',
    },
  })
  fireEvent.keyDown(textbox, {
    key: 'Enter',
    isComposing: true,
  })

  expect(onSend).not.toHaveBeenCalled()
})

it('adds a verifiable focus state to the composer', async () => {
  renderWithApp(<PromptComposer />)

  const textbox = screen.getByRole('textbox')
  const composer = screen.getByTestId('prompt-composer')

  await userEvent.click(textbox)

  expect(composer).toHaveClass(styles.composerFocused)
})

it('disables attachments until chat upload is available', () => {
  renderWithApp(<PromptComposer />)

  const button = screen.getByRole('button', { name: '添加附件' })

  expect(button).toBeDisabled()
  expect(button).toHaveAttribute('title', '附件上传将在聊天中提供')
})

it('keeps the input value when send fails', async () => {
  const onSend = vi.fn().mockRejectedValueOnce(new Error('send failed'))

  renderWithApp(<PromptComposer onSend={onSend} />)

  const textbox = screen.getByRole('textbox')

  await userEvent.type(textbox, '失败时保留{enter}')

  await waitFor(() => {
    expect(onSend).toHaveBeenCalledWith('失败时保留', [])
  })
  expect(textbox).toHaveValue('失败时保留')
})
