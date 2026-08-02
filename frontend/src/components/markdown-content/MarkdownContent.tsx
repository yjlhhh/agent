import DOMPurify from 'dompurify'
import { marked } from 'marked'
import { useMemo } from 'react'

type MarkdownContentProps = {
  value: string
}

export default function MarkdownContent({ value }: MarkdownContentProps) {
  const html = useMemo(() => {
    const sanitizedMarkdown = DOMPurify.sanitize(value)
    const parsedHtml = marked.parse(sanitizedMarkdown) as string
    const sanitizedHtml = DOMPurify.sanitize(parsedHtml)
    const document = new DOMParser().parseFromString(sanitizedHtml, 'text/html')

    document.querySelectorAll('a').forEach((link) => {
      link.target = '_blank'
      link.rel = 'noopener noreferrer'
    })

    document.querySelectorAll('pre').forEach((pre) => {
      const code = pre.querySelector('code')
      if (!code) return

      const wrapper = document.createElement('div')
      wrapper.setAttribute('data-ds-codeblock', 'true')
      pre.parentNode?.insertBefore(wrapper, pre)
      wrapper.appendChild(pre)

      const language = [...code.classList]
        .find((className) => className.startsWith('language-'))
        ?.replace('language-', '')

      if (language) {
        const label = document.createElement('span')
        label.textContent = language
        label.setAttribute('data-ds-code-language', 'true')
        wrapper.insertBefore(label, pre)
      }

      const button = document.createElement('button')
      button.type = 'button'
      button.textContent = '复制代码'
      button.setAttribute('data-ds-copy-code', 'true')
      wrapper.insertBefore(button, pre)
    })

    document.querySelectorAll('table').forEach((table) => {
      const wrapper = document.createElement('div')
      wrapper.setAttribute('data-ds-table', 'true')
      table.parentNode?.insertBefore(wrapper, table)
      wrapper.appendChild(table)
    })

    return document.body.innerHTML
  }, [value])

  return (
    <div
      onClick={async (event) => {
        const target = event.target as HTMLElement | null
        const button = target?.closest?.('button[data-ds-copy-code="true"]') as
          | HTMLButtonElement
          | null
        if (!button) return

        const wrapper = button.closest?.('div[data-ds-codeblock="true"]')
        const code = wrapper?.querySelector?.('pre code')
        const text = code?.textContent ?? ''
        if (!text.trim()) return

        try {
          await navigator.clipboard.writeText(text)
          window.$app?.message.success('已复制代码')
        } catch {
          window.$app?.message.error('复制失败')
        }
      }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
