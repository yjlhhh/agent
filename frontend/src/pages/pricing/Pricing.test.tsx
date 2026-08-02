import { render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import Pricing from './index'

it('renders native plans without an iframe', () => {
  const { container } = render(<Pricing />)
  expect(container.querySelector('iframe')).toBeNull()
  expect(screen.getByRole('heading', { name: '选择适合你的方案' })).toBeInTheDocument()
})
