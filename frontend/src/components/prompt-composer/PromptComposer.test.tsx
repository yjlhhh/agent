import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, it, vi } from 'vitest'
import { sessionActions } from '@/store/session'
import { renderWithApp } from '@/test/test-utils'
import styles from './PromptComposer.module.scss'
import PromptComposer from './PromptComposer'

beforeEach(() => {
  sessionActions.setUseDeep(true)
  sessionActions.setUseWeb(true)
})

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

  expect(screen.getByRole('button', { name: '深度研究' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  expect(screen.getByRole('button', { name: '联网' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
})

it('allows deep research and web search to be toggled independently', async () => {
  renderWithApp(<PromptComposer />)

  const deep = screen.getByRole('button', { name: '深度研究' })
  const web = screen.getByRole('button', { name: '联网' })

  await userEvent.click(deep)

  expect(deep).toHaveAttribute('aria-pressed', 'false')
  expect(deep).not.toHaveClass(styles.modeActive)
  expect(web).toHaveAttribute('aria-pressed', 'true')
  expect(web).toHaveClass(styles.modeActive)

  await userEvent.click(web)

  expect(deep).toHaveAttribute('aria-pressed', 'false')
  expect(web).toHaveAttribute('aria-pressed', 'false')
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
