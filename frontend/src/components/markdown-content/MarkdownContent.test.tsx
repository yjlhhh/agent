import { fireEvent, render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import MarkdownContent from './MarkdownContent'

it('removes scripts and secures external links', () => {
  const { container } = render(<MarkdownContent value={'<script>alert(1)</script>[来源](https://example.com)'} />)

  expect(container.querySelector('script')).toBeNull()
  expect(screen.getByRole('link')).toHaveAttribute('target', '_blank')
  expect(screen.getByRole('link')).toHaveAttribute('rel', 'noopener noreferrer')
})

it('adds a copy button for code blocks', async () => {
  Object.assign(navigator, {
    clipboard: {
      writeText: vi.fn().mockResolvedValueOnce(undefined),
    },
  })

  const { container } = render(<MarkdownContent value={'```js\nconsole.log(1)\n```'} />)

  const button = screen.getByRole('button', { name: '复制代码' })
  expect(container.querySelector('pre code')?.textContent).toContain('console.log(1)')

  await fireEvent.click(button)
  expect(navigator.clipboard.writeText).toHaveBeenCalledWith(expect.stringContaining('console.log(1)'))
  expect(container.querySelector('[data-ds-code-language="true"]')).toHaveTextContent('js')
})

it('wraps markdown tables for responsive scrolling', () => {
  const { container } = render(
    <MarkdownContent value={'| 项目 | 内容 |\n| --- | --- |\n| 名称 | DeepSearch |'} />,
  )

  const wrapper = container.querySelector('[data-ds-table="true"]')
  expect(wrapper).toBeInTheDocument()
  expect(wrapper?.querySelector('table')).toBeInTheDocument()
  expect(screen.getByRole('columnheader', { name: '项目' })).toBeInTheDocument()
})
