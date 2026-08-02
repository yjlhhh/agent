import { expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithApp } from '@/test/test-utils'
import NotFound from './404'

it('offers a path back to DeepSearch', () => {
  renderWithApp(<NotFound />, ['/missing'])
  expect(screen.getByRole('heading', { name: '页面不存在' })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: '返回首页' })).toHaveAttribute('href', '/')
})
