export type Token = {
  type: string
  raw: string
  tokens?: Token[]
  [key: string]: unknown
}

export interface TokenizerThis {
  lexer: {
    inlineTokens(src: string): Token[]
  }
}

export interface RendererThis {
  parser: {
    parseInline(tokens: unknown): string
  }
}

export interface TokenizerExtension {
  name: string
  level: 'block' | 'inline'
  start?: (src: string) => number | void
  tokenizer?: (this: TokenizerThis, src: string) => Token | undefined
}

export interface RendererExtension {
  name: string
  renderer?: (this: RendererThis, token: Token) => string | false | undefined
}

export type TokenizerAndRendererExtension =
  | TokenizerExtension
  | RendererExtension
  | (TokenizerExtension & RendererExtension)

export interface MarkedExtension {
  async?: boolean
  extensions?: TokenizerAndRendererExtension[] | null
  gfm?: boolean
  renderer?: Renderer | null
}

export interface MarkedOptions extends MarkedExtension {}

export class Renderer {
  parser: RendererThis['parser']
}

export class Marked {
  constructor(...args: MarkedExtension[])
  parse(src: string, options?: MarkedOptions | null): string
}
