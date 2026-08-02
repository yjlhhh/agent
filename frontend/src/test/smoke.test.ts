import { describe, expect, it } from 'vitest'

describe('test harness', () => {
  it('loads DOM matchers', () => {
    const element = document.createElement('div')
    element.textContent = 'DeepSearch'
    document.body.appendChild(element)
    expect(element).toBeInTheDocument()
  })
})
