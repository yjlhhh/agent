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

    return document.body.innerHTML
  }, [value])

  return <div dangerouslySetInnerHTML={{ __html: html }} />
}
