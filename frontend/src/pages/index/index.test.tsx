import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, it } from 'vitest'
import { sessionActions } from '@/store/session'
import { renderWithApp } from '@/test/test-utils'
import composerStyles from '@/components/prompt-composer/PromptComposer.module.scss'
import Index from './index'

beforeEach(() => {
  sessionActions.setUseDeep(true)
  sessionActions.setUseWeb(true)
})

it('fills the composer when a quick action is clicked', async () => {
  renderWithApp(<Index />, ['/'])

  await userEvent.click(screen.getByRole('button', { name: /深入研究/ }))

  expect((screen.getByRole('textbox') as HTMLTextAreaElement).value).toContain(
    '请帮我深入研究这个问题',
  )
})

it('toggles modes when switching quick actions', async () => {
  renderWithApp(<Index />, ['/'])

  await userEvent.click(screen.getByRole('button', { name: /撰写或编辑/ }))

  expect(screen.getByText('深度研究')).not.toHaveClass(composerStyles.modeActive)
  expect(screen.getByText('联网')).not.toHaveClass(composerStyles.modeActive)

  await userEvent.click(screen.getByRole('button', { name: /搜索网页/ }))

  expect(screen.getByText('深度研究')).not.toHaveClass(composerStyles.modeActive)
  expect(screen.getByText('联网')).toHaveClass(composerStyles.modeActive)
})

