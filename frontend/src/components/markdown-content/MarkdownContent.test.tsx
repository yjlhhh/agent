import { render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import MarkdownContent from './MarkdownContent'

it('removes scripts and secures external links', () => {
  const { container } = render(<MarkdownContent value={'<script>alert(1)</script>[来源](https://example.com)'} />)

  expect(container.querySelector('script')).toBeNull()
  expect(screen.getByRole('link')).toHaveAttribute('target', '_blank')
  expect(screen.getByRole('link')).toHaveAttribute('rel', 'noopener noreferrer')
})
