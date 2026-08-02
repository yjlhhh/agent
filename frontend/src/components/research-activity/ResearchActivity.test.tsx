import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it } from 'vitest'
import { renderWithApp } from '@/test/test-utils'
import ResearchActivity from './ResearchActivity'

const activities = [
  {
    kind: 'analysis' as const,
    title: '理解问题',
    detail: '识别问题目标、上下文与回答约束',
  },
  {
    kind: 'search' as const,
    title: '搜索网络信息',
    detail: '最新 AI 新闻',
  },
]

it('shows a collapsible public thought-process timeline', async () => {
  renderWithApp(
    <ResearchActivity status="completed" activities={activities} />,
  )

  expect(screen.getByText('思考过程')).toBeInTheDocument()
  expect(screen.getByText('已完成 · 2 个步骤')).toBeInTheDocument()

  await userEvent.click(screen.getByText('思考过程'))

  expect(screen.getByText('理解问题')).toBeInTheDocument()
  expect(screen.getByText('最新 AI 新闻')).toBeInTheDocument()
  expect(
    screen.getByText('展示的是可公开的过程摘要，不包含模型内部思维链。'),
  ).toBeInTheDocument()
})

