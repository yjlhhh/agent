# DeepSearch Core Chat UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将首页与核心聊天体验重构为 OpenAI 风格的 DeepSearch 界面，并提供安全、可停止、可追溯的 SSE 研究回答。

**Architecture:** 保留 React、Vite、React Router、Valtio 与现有后端 API。新增独立的 SSE parser、stream reducer 和 `useChatStream`，UI 只消费标准化状态；首页、聊天页共享 `PromptComposer`，回答由小型专用组件组合。

**Tech Stack:** React 18、TypeScript、Vite、Ant Design 5、Valtio、Axios fetch adapter、Vitest、Testing Library、DOMPurify、CSS Modules

## Global Constraints

- 产品名称统一为 `DeepSearch`。
- 所有用户界面文案使用简体中文。
- 首版仅支持浅色主题，桌面优先，小屏保持基本可用。
- 首页不常驻侧栏，输入框是唯一高对比视觉焦点。
- 回答内容最大宽度为 `760px`，正文为 `15px / 1.7`。
- 不展示模型原始 chain-of-thought；仅显示可公开的研究里程碑和工具活动。
- 有图片或来源时才渲染对应区域，不保留空占位。
- 所有 Markdown HTML 必须经过 DOMPurify 清理。
- 每个任务遵循 TDD：先红、再绿、最后提交。
- 每次提交前运行该任务测试、TypeScript 检查和生产构建。

---

## File Map

### Create

- `frontend/vitest.config.ts`：Vitest 的 jsdom、alias 与 setup 配置。
- `frontend/src/test/setup.ts`：jest-dom、浏览器 API mock。
- `frontend/src/test/test-utils.tsx`：带 Router 和 Ant Design 的测试 render。
- `frontend/src/styles/tokens.css`：颜色、间距、圆角、阴影和动效 token。
- `frontend/src/styles/typography.css`：全局字体与 Markdown 排版基础。
- `frontend/src/components/app-shell/AppShell.tsx`：顶栏和导航抽屉容器。
- `frontend/src/components/app-shell/AppShell.module.scss`：App Shell 样式。
- `frontend/src/components/navigation-drawer/NavigationDrawer.tsx`：历史与应用导航。
- `frontend/src/components/navigation-drawer/NavigationDrawer.module.scss`：抽屉样式。
- `frontend/src/components/prompt-composer/PromptComposer.tsx`：共享输入与停止控制。
- `frontend/src/components/prompt-composer/PromptComposer.module.scss`：胶囊输入框样式。
- `frontend/src/lib/stream/types.ts`：标准化流状态和领域类型。
- `frontend/src/lib/stream/sse-parser.ts`：支持跨 chunk 的 SSE parser。
- `frontend/src/lib/stream/thinking-mapper.ts`：公开研究里程碑映射。
- `frontend/src/lib/stream/stream-reducer.ts`：纯函数流状态 reducer。
- `frontend/src/hooks/useChatStream.ts`：请求、取消和错误生命周期。
- `frontend/src/components/message-list/MessageList.tsx`：容器滚动与消息序列。
- `frontend/src/components/research-activity/ResearchActivity.tsx`：可收合研究摘要。
- `frontend/src/components/media-gallery/MediaGallery.tsx`：0–3+ 图片布局。
- `frontend/src/components/markdown-content/MarkdownContent.tsx`：安全 Markdown。
- `frontend/src/components/source-drawer/SourceDrawer.tsx`：来源详情抽屉。
- `frontend/src/components/assistant-response/AssistantResponse.tsx`：回答组合。
- `frontend/src/components/response-actions/ResponseActions.tsx`：复制、重试和反馈。

### Modify

- `frontend/package.json`：测试脚本与依赖。
- `frontend/src/main.tsx`：加载全局 token。
- `frontend/src/App.tsx`：对齐 Ant Design token。
- `frontend/src/router/routes.tsx`：使用 AppShell。
- `frontend/src/pages/index/index.tsx`：OpenAI 风格首页。
- `frontend/src/pages/index/index.module.scss`：首页布局。
- `frontend/src/utils/useSendMessage.ts`：创建真实 session。
- `frontend/src/api/session.ts`：允许传入 AbortSignal。
- `frontend/src/api/session.type.d.ts`：聊天状态类型。
- `frontend/src/pages/chat/index.tsx`：改用流 hook 与 MessageList。
- `frontend/src/pages/chat/index.module.scss`：聊天视口。

### Retire after migration

- `frontend/src/components/sender/index.tsx`
- `frontend/src/components/home-banner/index.tsx`
- `frontend/src/components/hot-questions/index.tsx`
- `frontend/src/pages/chat/component/chat-message.tsx`
- `frontend/src/pages/chat/component/result.tsx`
- `frontend/src/pages/chat/component/drawer.tsx`

---

### Task 1: Test Harness and Design Tokens

**Files:**
- Modify: `frontend/package.json`
- Create: `frontend/vitest.config.ts`
- Create: `frontend/src/test/setup.ts`
- Create: `frontend/src/test/test-utils.tsx`
- Create: `frontend/src/test/smoke.test.ts`
- Create: `frontend/src/styles/tokens.css`
- Create: `frontend/src/styles/typography.css`
- Modify: `frontend/src/main.tsx`
- Modify: `frontend/src/App.tsx`

**Interfaces:**
- Produces: `renderWithApp(ui: ReactElement, initialEntries?: string[])`
- Produces: 全局 `--ds-*` CSS variables。

- [ ] **Step 1: Install the minimum test and sanitization dependencies**

Run:

```bash
cd frontend
npm install dompurify
npm install -D vitest @vitest/coverage-v8 jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
npm pkg set scripts.test="vitest run" scripts.test:watch="vitest" scripts.test:coverage="vitest run --coverage"
```

Expected: `package.json` and `package-lock.json` update without peer dependency errors.

- [ ] **Step 2: Write the failing smoke test**

Create `frontend/src/test/smoke.test.ts`:

```ts
import { describe, expect, it } from 'vitest'

describe('test harness', () => {
  it('loads DOM matchers', () => {
    const element = document.createElement('div')
    element.textContent = 'DeepSearch'
    document.body.appendChild(element)
    expect(element).toBeInTheDocument()
  })
})
```

Run: `cd frontend && npx vitest run src/test/smoke.test.ts`

Expected: FAIL because Vitest has no jsdom/setup configuration.

- [ ] **Step 3: Add Vitest configuration and shared render helper**

Create `frontend/vitest.config.ts`:

```ts
import path from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
    globals: true,
  },
})
```

Create `frontend/src/test/setup.ts`:

```ts
import '@testing-library/jest-dom/vitest'
import { afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

afterEach(() => cleanup())

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})
```

Create `frontend/src/test/test-utils.tsx`:

```tsx
import type { ReactElement } from 'react'
import { App, ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

export function renderWithApp(ui: ReactElement, initialEntries = ['/']) {
  return render(
    <ConfigProvider locale={zhCN}>
      <App>
        <MemoryRouter initialEntries={initialEntries}>{ui}</MemoryRouter>
      </App>
    </ConfigProvider>,
  )
}
```

- [ ] **Step 4: Add exact design tokens**

Create `frontend/src/styles/tokens.css`:

```css
:root {
  --ds-bg: #ffffff;
  --ds-bg-subtle: #f7f7f5;
  --ds-bg-hover: #f1f1ef;
  --ds-text: #202020;
  --ds-text-secondary: #73736f;
  --ds-border: #e2e2df;
  --ds-action: #111111;
  --ds-content-width: 760px;
  --ds-radius-control: 8px;
  --ds-radius-content: 16px;
  --ds-radius-composer: 24px;
  --ds-shadow-composer: 0 9px 28px rgb(0 0 0 / 8%);
  --ds-motion-fast: 150ms;
  --ds-motion-normal: 220ms;
}

* { box-sizing: border-box; }
html, body, #root { min-height: 100%; }
body { margin: 0; background: var(--ds-bg); color: var(--ds-text); }
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { scroll-behavior: auto !important; transition: none !important; }
}
```

Create `frontend/src/styles/typography.css`:

```css
body {
  font-family: Inter, "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif;
  font-size: 15px;
  line-height: 1.7;
  -webkit-font-smoothing: antialiased;
}
button, input, textarea { font: inherit; }
```

Import both files at the top of `frontend/src/main.tsx`:

```ts
import '@/styles/tokens.css'
import '@/styles/typography.css'
```

Set `ConfigProvider.theme.token` in `frontend/src/App.tsx` to:

```ts
{
  colorPrimary: '#111111',
  colorText: '#202020',
  colorTextSecondary: '#73736f',
  colorBorder: '#e2e2df',
  colorBgLayout: '#ffffff',
  borderRadius: 8,
  fontSize: 14,
}
```

- [ ] **Step 5: Verify and commit**

Run:

```bash
cd frontend
npx vitest run src/test/smoke.test.ts
npx tsc -b --noEmit
npm run build
```

Expected: all commands exit `0`.

Commit:

```bash
git add frontend/package.json frontend/package-lock.json frontend/vitest.config.ts frontend/src/test frontend/src/styles frontend/src/main.tsx frontend/src/App.tsx
git commit -m "test: establish frontend UI test harness"
```

---

### Task 2: App Shell and Navigation Drawer

**Files:**
- Create: `frontend/src/components/app-shell/AppShell.tsx`
- Create: `frontend/src/components/app-shell/AppShell.module.scss`
- Create: `frontend/src/components/navigation-drawer/NavigationDrawer.tsx`
- Create: `frontend/src/components/navigation-drawer/NavigationDrawer.module.scss`
- Create: `frontend/src/components/app-shell/AppShell.test.tsx`
- Modify: `frontend/src/router/routes.tsx`

**Interfaces:**
- Produces: `AppShell({ children }: PropsWithChildren)`
- Produces: `NavigationDrawer({ open, onClose, sessions })`
- Consumes: `sessionState.list: API.Session[]`.

- [ ] **Step 1: Write failing shell behavior tests**

Create `frontend/src/components/app-shell/AppShell.test.tsx`:

```tsx
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithApp } from '@/test/test-utils'
import AppShell from './AppShell'

it('keeps navigation hidden until the menu button is pressed', async () => {
  renderWithApp(<AppShell><div>页面内容</div></AppShell>)
  expect(screen.queryByRole('dialog', { name: '导航' })).not.toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: '打开导航' }))
  expect(screen.getByRole('dialog', { name: '导航' })).toBeInTheDocument()
})

it('uses simplified Chinese navigation labels', async () => {
  renderWithApp(<AppShell><div /></AppShell>)
  await userEvent.click(screen.getByRole('button', { name: '打开导航' }))
  expect(screen.getByText('新对话')).toBeInTheDocument()
  expect(screen.getByText('知识库')).toBeInTheDocument()
})
```

Run: `cd frontend && npx vitest run src/components/app-shell/AppShell.test.tsx`

Expected: FAIL because `AppShell` does not exist.

- [ ] **Step 2: Implement the drawer and shell**

Create `frontend/src/components/navigation-drawer/NavigationDrawer.tsx`:

```tsx
import { Drawer } from 'antd'
import { Link } from 'react-router-dom'
import styles from './NavigationDrawer.module.scss'

export default function NavigationDrawer(props: {
  open: boolean
  onClose: () => void
  sessions: API.Session[]
}) {
  return (
    <Drawer title="导航" placement="left" width={300} open={props.open} onClose={props.onClose}>
      <nav className={styles.nav}>
        <Link to="/" onClick={props.onClose}>＋ 新对话</Link>
        <Link to="/repository" onClick={props.onClose}>知识库</Link>
        <Link to="/pricing" onClick={props.onClose}>充值</Link>
        <span className={styles.label}>最近</span>
        {props.sessions.length === 0
          ? <span className={styles.empty}>暂无历史对话</span>
          : props.sessions.map((session) => (
              <Link key={session.session_id} to={`/chat/${session.session_id}`} onClick={props.onClose}>
                {session.session_name}
              </Link>
            ))}
      </nav>
    </Drawer>
  )
}
```

Create `frontend/src/components/navigation-drawer/NavigationDrawer.module.scss`:

```scss
.nav { display: grid; gap: 4px; }
.nav a { color: var(--ds-text); padding: 9px 10px; border-radius: 8px; text-decoration: none; }
.nav a:hover { background: var(--ds-bg-hover); }
.label { margin: 20px 10px 6px; color: var(--ds-text-secondary); font-size: 12px; }
.empty { padding: 8px 10px; color: var(--ds-text-secondary); }
```

Create `frontend/src/components/app-shell/AppShell.tsx`:

```tsx
import { useState, type PropsWithChildren } from 'react'
import { useSnapshot } from 'valtio'
import { sessionState } from '@/store/session'
import NavigationDrawer from '@/components/navigation-drawer/NavigationDrawer'
import styles from './AppShell.module.scss'

export default function AppShell({ children }: PropsWithChildren) {
  const [open, setOpen] = useState(false)
  const session = useSnapshot(sessionState)
  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <button aria-label="打开导航" onClick={() => setOpen(true)}>☰</button>
        <strong>DeepSearch</strong>
      </header>
      <main className={styles.main}>{children}</main>
      <NavigationDrawer open={open} onClose={() => setOpen(false)} sessions={[...session.list]} />
    </div>
  )
}
```

Create `frontend/src/components/app-shell/AppShell.module.scss`:

```scss
.shell { min-height: 100vh; background: var(--ds-bg); }
.header { height: 54px; display: flex; align-items: center; gap: 10px; padding: 0 18px; }
.header button { width: 32px; height: 32px; border: 0; border-radius: 8px; background: transparent; cursor: pointer; }
.header button:hover { background: var(--ds-bg-hover); }
.main { min-height: calc(100vh - 54px); }
```

- [ ] **Step 3: Route every core page through AppShell**

Replace the old `BaseLayout` wrapper in `frontend/src/router/routes.tsx` with:

```tsx
function Layout() {
  const location = useLocation()
  return (
    <AppShell>
      <Outlet key={location.pathname} />
    </AppShell>
  )
}
```

Import `AppShell` and remove the `BaseLayout` import.

- [ ] **Step 4: Verify and commit**

Run:

```bash
cd frontend
npx vitest run src/components/app-shell/AppShell.test.tsx
npx tsc -b --noEmit
npm run build
```

Expected: all commands exit `0`.

Commit:

```bash
git add frontend/src/components/app-shell frontend/src/components/navigation-drawer frontend/src/router/routes.tsx
git commit -m "feat: add on-demand DeepSearch navigation"
```

---

### Task 3: Prompt Composer and Focused Home

**Files:**
- Create: `frontend/src/components/prompt-composer/PromptComposer.tsx`
- Create: `frontend/src/components/prompt-composer/PromptComposer.module.scss`
- Create: `frontend/src/components/prompt-composer/PromptComposer.test.tsx`
- Modify: `frontend/src/pages/index/index.tsx`
- Modify: `frontend/src/pages/index/index.module.scss`
- Modify: `frontend/src/utils/useSendMessage.ts`

**Interfaces:**
- Produces: `PromptComposer({ loading, onSend, onStop })`
- `onSend(value: string, files: string[]): void | Promise<void>`
- `onStop(): void`

- [ ] **Step 1: Write failing composer tests**

Create `frontend/src/components/prompt-composer/PromptComposer.test.tsx`:

```tsx
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { renderWithApp } from '@/test/test-utils'
import PromptComposer from './PromptComposer'

it('submits trimmed text with Enter', async () => {
  const onSend = vi.fn()
  renderWithApp(<PromptComposer onSend={onSend} />)
  await userEvent.type(screen.getByRole('textbox'), '  研究 Ceph  {enter}')
  expect(onSend).toHaveBeenCalledWith('研究 Ceph', [])
})

it('shows stop while loading', async () => {
  const onStop = vi.fn()
  renderWithApp(<PromptComposer loading onStop={onStop} />)
  await userEvent.click(screen.getByRole('button', { name: '停止生成' }))
  expect(onStop).toHaveBeenCalledOnce()
})
```

Run: `cd frontend && npx vitest run src/components/prompt-composer/PromptComposer.test.tsx`

Expected: FAIL because `PromptComposer` does not exist.

- [ ] **Step 2: Implement the composer**

Create `frontend/src/components/prompt-composer/PromptComposer.tsx`:

```tsx
import { useState } from 'react'
import styles from './PromptComposer.module.scss'

export default function PromptComposer(props: {
  loading?: boolean
  onSend?: (value: string, files: string[]) => void | Promise<void>
  onStop?: () => void
}) {
  const [value, setValue] = useState('')
  async function submit() {
    const message = value.trim()
    if (!message || props.loading) return
    await props.onSend?.(message, [])
    setValue('')
  }
  return (
    <div className={styles.composer}>
      <textarea
        aria-label="消息"
        value={value}
        placeholder="向 DeepSearch 提问"
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault()
            void submit()
          }
        }}
      />
      <div className={styles.toolbar}>
        <button aria-label="添加附件">＋</button>
        <span>深度研究</span>
        <span>联网</span>
        {props.loading
          ? <button aria-label="停止生成" onClick={props.onStop}>■</button>
          : <button aria-label="发送" onClick={() => void submit()}>↑</button>}
      </div>
    </div>
  )
}
```

Create `frontend/src/components/prompt-composer/PromptComposer.module.scss`:

```scss
.composer { border: 1px solid var(--ds-border); border-radius: var(--ds-radius-composer); padding: 12px; background: #fff; box-shadow: var(--ds-shadow-composer); }
.composer textarea { width: 100%; min-height: 42px; resize: none; border: 0; outline: 0; color: var(--ds-text); }
.toolbar { display: flex; align-items: center; gap: 10px; color: var(--ds-text-secondary); }
.toolbar button { width: 32px; height: 32px; border: 0; border-radius: 50%; cursor: pointer; }
.toolbar button:last-child { margin-left: auto; background: var(--ds-action); color: #fff; }
```

- [ ] **Step 3: Replace the home page**

Set `frontend/src/pages/index/index.tsx` to:

```tsx
import PromptComposer from '@/components/prompt-composer/PromptComposer'
import useSendMessage from '@/utils/useSendMessage'
import styles from './index.module.scss'

export default function Index() {
  const send = useSendMessage()
  return (
    <section className={styles.home}>
      <div className={styles.center}>
        <h1>准备好了，随时开始</h1>
        <p>搜索、研究并综合可信来源</p>
        <PromptComposer onSend={(message) => send(message)} />
        <div className={styles.quick}>
          <span>深入研究</span><span>撰写或编辑</span><span>搜索网页</span>
        </div>
      </div>
      <small>DeepSearch 可能会出错，请核查重要信息。</small>
    </section>
  )
}
```

Set `frontend/src/pages/index/index.module.scss` to:

```scss
.home { min-height: calc(100vh - 54px); position: relative; display: grid; place-items: center; padding: 40px; }
.center { width: min(680px, 100%); transform: translateY(-8vh); text-align: center; }
.center h1 { margin: 0 0 6px; font-size: 26px; font-weight: 520; letter-spacing: -0.7px; }
.center p { margin: 0 0 26px; color: var(--ds-text-secondary); }
.quick { display: flex; justify-content: center; gap: 36px; margin-top: 20px; color: var(--ds-text-secondary); font-size: 13px; }
.home > small { position: absolute; bottom: 16px; color: #aaa; }
```

- [ ] **Step 4: Create real sessions before navigation**

Replace the hard-coded session in `frontend/src/utils/useSendMessage.ts` with:

```ts
const result = await api.session.create()
const sessionId = result.data.session_id
sessionActions.add({
  session_id: sessionId,
  session_name: message,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
})
setPageTransport(transportToChatEnter, { data: { message } })
navigate(`/chat/${sessionId}`)
```

Add the missing `api` import from `@/api`.

- [ ] **Step 5: Verify and commit**

Run:

```bash
cd frontend
npx vitest run src/components/prompt-composer/PromptComposer.test.tsx
npx tsc -b --noEmit
npm run build
```

Commit:

```bash
git add frontend/src/components/prompt-composer frontend/src/pages/index frontend/src/utils/useSendMessage.ts
git commit -m "feat: create focused DeepSearch start page"
```

---

### Task 4: SSE Parser and Public Stream Model

**Files:**
- Create: `frontend/src/lib/stream/types.ts`
- Create: `frontend/src/lib/stream/sse-parser.ts`
- Create: `frontend/src/lib/stream/sse-parser.test.ts`

**Interfaces:**
- Produces: `createSseParser(onEvent): { push(chunk: string): void; finish(): void }`
- Produces: `StreamEvent`, `StreamState`, `SourceItem`, `MediaItem`.

- [ ] **Step 1: Write failing parser tests**

Create `frontend/src/lib/stream/sse-parser.test.ts`:

```ts
import { describe, expect, it, vi } from 'vitest'
import { createSseParser } from './sse-parser'

describe('createSseParser', () => {
  it('joins chunks and ignores event metadata', () => {
    const onEvent = vi.fn()
    const parser = createSseParser(onEvent)
    parser.push('event: message\ndata: {"content":"Ce')
    parser.push('ph","thinking":false}\n\n')
    expect(onEvent).toHaveBeenCalledWith({ type: 'content', content: 'Ceph' })
  })

  it('reports malformed JSON without throwing', () => {
    const onEvent = vi.fn()
    const parser = createSseParser(onEvent)
    parser.push('data: {bad}\n\n')
    expect(onEvent).toHaveBeenCalledWith({ type: 'protocol-error', message: '无法解析流数据' })
  })
})
```

Run: `cd frontend && npx vitest run src/lib/stream/sse-parser.test.ts`

Expected: FAIL because parser does not exist.

- [ ] **Step 2: Define the stream types**

Create `frontend/src/lib/stream/types.ts`:

```ts
export type StreamStatus = 'idle' | 'submitting' | 'researching' | 'streaming' | 'completed' | 'stopped' | 'failed'
export type ResearchMilestone = '理解问题' | '搜索资料' | '交叉验证' | '组织结论'
export type SourceItem = { title: string; url: string; content: string }
export type MediaItem = { title: string; imageUrl: string; link: string; source?: string }
export type StreamEvent =
  | { type: 'thinking'; content: string }
  | { type: 'content'; content: string }
  | { type: 'sources'; sources: SourceItem[] }
  | { type: 'images'; images: MediaItem[] }
  | { type: 'recommendations'; questions: string[] }
  | { type: 'done' }
  | { type: 'protocol-error'; message: string }

export type StreamState = {
  status: StreamStatus
  content: string
  milestones: ResearchMilestone[]
  sources: SourceItem[]
  images: MediaItem[]
  recommendations: string[]
  error?: string
}
```

- [ ] **Step 3: Implement the parser**

Create `frontend/src/lib/stream/sse-parser.ts`:

```ts
import type { StreamEvent } from './types'

export function createSseParser(onEvent: (event: StreamEvent) => void) {
  let buffer = ''
  function parseBlock(block: string) {
    const data = block.split('\n').filter((line) => line.startsWith('data:')).map((line) => line.slice(5).trimStart()).join('\n')
    if (!data) return
    if (data === '[DONE]') return onEvent({ type: 'done' })
    try {
      const value = JSON.parse(data)
      if (value.content) onEvent({ type: value.thinking ? 'thinking' : 'content', content: value.content })
      if (Array.isArray(value.documents)) onEvent({ type: 'sources', sources: value.documents })
      if (value.image_results?.images) onEvent({ type: 'images', images: value.image_results.images })
      if (Array.isArray(value.recommended_questions)) onEvent({ type: 'recommendations', questions: value.recommended_questions })
    } catch {
      onEvent({ type: 'protocol-error', message: '无法解析流数据' })
    }
  }
  return {
    push(chunk: string) {
      buffer += chunk.replace(/\r\n/g, '\n')
      const blocks = buffer.split('\n\n')
      buffer = blocks.pop() ?? ''
      blocks.forEach(parseBlock)
    },
    finish() {
      if (buffer.trim()) parseBlock(buffer)
      buffer = ''
    },
  }
}
```

- [ ] **Step 4: Verify and commit**

Run:

```bash
cd frontend
npx vitest run src/lib/stream/sse-parser.test.ts
npx tsc -b --noEmit
```

Commit:

```bash
git add frontend/src/lib/stream
git commit -m "feat: parse DeepSearch SSE responses safely"
```

---

### Task 5: Stream Reducer Without Raw Reasoning

**Files:**
- Create: `frontend/src/lib/stream/thinking-mapper.ts`
- Create: `frontend/src/lib/stream/stream-reducer.ts`
- Create: `frontend/src/lib/stream/stream-reducer.test.ts`

**Interfaces:**
- Produces: `initialStreamState`
- Produces: `streamReducer(state, action): StreamState`
- Produces: `mapThinkingToMilestone(content): ResearchMilestone`.

- [ ] **Step 1: Write failing privacy and state tests**

Create `frontend/src/lib/stream/stream-reducer.test.ts`:

```ts
import { expect, it } from 'vitest'
import { initialStreamState, streamReducer } from './stream-reducer'

it('maps raw thinking to a public milestone and never stores raw text', () => {
  const state = streamReducer(initialStreamState, { type: 'thinking', content: 'searching multiple sources' })
  expect(state.milestones).toEqual(['搜索资料'])
  expect(JSON.stringify(state)).not.toContain('searching multiple sources')
})

it('preserves partial content when stopped', () => {
  const streaming = streamReducer(initialStreamState, { type: 'content', content: '部分回答' })
  const stopped = streamReducer(streaming, { type: 'stop' })
  expect(stopped).toMatchObject({ status: 'stopped', content: '部分回答' })
})
```

Run: `cd frontend && npx vitest run src/lib/stream/stream-reducer.test.ts`

Expected: FAIL because reducer does not exist.

- [ ] **Step 2: Implement milestone mapping and reducer**

Create `frontend/src/lib/stream/thinking-mapper.ts`:

```ts
import type { ResearchMilestone } from './types'

export function mapThinkingToMilestone(content: string): ResearchMilestone {
  const value = content.toLowerCase()
  if (/search|检索|搜索/.test(value)) return '搜索资料'
  if (/verify|cross|验证/.test(value)) return '交叉验证'
  if (/organize|summary|总结|组织/.test(value)) return '组织结论'
  return '理解问题'
}
```

Create `frontend/src/lib/stream/stream-reducer.ts`:

```ts
import { mapThinkingToMilestone } from './thinking-mapper'
import type { StreamEvent, StreamState } from './types'

export const initialStreamState: StreamState = {
  status: 'idle',
  content: '',
  milestones: [],
  sources: [],
  images: [],
  recommendations: [],
}

export type StreamAction = StreamEvent | { type: 'submit' | 'stop' } | { type: 'fail'; message: string }

export function streamReducer(state: StreamState, action: StreamAction): StreamState {
  if (action.type === 'submit') return { ...initialStreamState, status: 'submitting' }
  if (action.type === 'thinking') {
    const milestone = mapThinkingToMilestone(action.content)
    return { ...state, status: 'researching', milestones: state.milestones.includes(milestone) ? state.milestones : [...state.milestones, milestone] }
  }
  if (action.type === 'content') return { ...state, status: 'streaming', content: state.content + action.content }
  if (action.type === 'sources') return { ...state, sources: action.sources }
  if (action.type === 'images') return { ...state, images: action.images }
  if (action.type === 'recommendations') return { ...state, recommendations: action.questions }
  if (action.type === 'done') return { ...state, status: 'completed' }
  if (action.type === 'stop') return { ...state, status: 'stopped' }
  if (action.type === 'protocol-error' || action.type === 'fail') return { ...state, status: 'failed', error: action.message }
  return state
}
```

- [ ] **Step 3: Verify and commit**

Run:

```bash
cd frontend
npx vitest run src/lib/stream/stream-reducer.test.ts
npx tsc -b --noEmit
```

Commit:

```bash
git add frontend/src/lib/stream
git commit -m "feat: expose safe research milestones"
```

---

### Task 6: Cancellable Chat Stream Hook

**Files:**
- Create: `frontend/src/hooks/useChatStream.ts`
- Create: `frontend/src/hooks/useChatStream.test.ts`
- Modify: `frontend/src/api/session.ts`

**Interfaces:**
- Produces: `useChatStream(): { state; send(input); stop(); reset() }`
- `send({ id, message, webSearch, deepResearch, attachments }): Promise<void>`.

- [ ] **Step 1: Write the failing cancellation test**

Create `frontend/src/hooks/useChatStream.test.ts`:

```ts
import { act, renderHook } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import * as sessionApi from '@/api/session'
import { useChatStream } from './useChatStream'

it('stops an active request and preserves partial content', async () => {
  vi.spyOn(sessionApi, 'chat').mockImplementation(() => new Promise(() => {}) as never)
  const { result } = renderHook(() => useChatStream())
  act(() => { void result.current.send({ id: '1', message: 'Ceph', webSearch: true, deepResearch: true, attachments: [] }) })
  act(() => result.current.stop())
  expect(result.current.state.status).toBe('stopped')
})
```

Run: `cd frontend && npx vitest run src/hooks/useChatStream.test.ts`

Expected: FAIL because hook does not exist.

- [ ] **Step 2: Pass AbortSignal through the API**

Add `signal?: AbortSignal` to the `chat` options path in `frontend/src/api/session.ts` and pass it into both request configurations:

```ts
export function chat(
  params: { id: string; message: string; web_search?: boolean; deep_research?: boolean; attachments?: string[] },
  options?: AxiosRequestConfig,
) {
  const { id, deep_research, ...body } = params
  const config: AxiosRequestConfig = {
    headers: { Accept: 'text/event-stream' },
    responseType: 'stream',
    adapter: 'fetch',
    loading: false,
    params: { session_id: id },
    ...options,
  }
  return request.post<ReadableStream>(
    deep_research ? '/deep_research/' : '/ai_search/',
    body,
    config,
  )
}
```

- [ ] **Step 3: Implement the hook**

Create `frontend/src/hooks/useChatStream.ts`:

```ts
import { useCallback, useReducer, useRef } from 'react'
import { chat } from '@/api/session'
import { createSseParser } from '@/lib/stream/sse-parser'
import { initialStreamState, streamReducer } from '@/lib/stream/stream-reducer'

export function useChatStream() {
  const [state, dispatch] = useReducer(streamReducer, initialStreamState)
  const controllerRef = useRef<AbortController | null>(null)

  const stop = useCallback(() => {
    controllerRef.current?.abort()
    dispatch({ type: 'stop' })
  }, [])

  const send = useCallback(async (input: {
    id: string
    message: string
    webSearch: boolean
    deepResearch: boolean
    attachments: string[]
  }) => {
    controllerRef.current?.abort()
    const controller = new AbortController()
    controllerRef.current = controller
    dispatch({ type: 'submit' })
    try {
      const response = await chat({
        id: input.id,
        message: input.message,
        web_search: input.webSearch,
        deep_research: input.deepResearch,
        attachments: input.attachments,
      }, { signal: controller.signal })
      const reader = response.data.getReader()
      const decoder = new TextDecoder()
      const parser = createSseParser((event) => dispatch(event))
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        parser.push(decoder.decode(value, { stream: true }))
      }
      parser.finish()
      dispatch({ type: 'done' })
    } catch (error) {
      if (!controller.signal.aborted) dispatch({ type: 'fail', message: error instanceof Error ? error.message : '生成失败' })
    }
  }, [])

  return { state, send, stop, reset: () => dispatch({ type: 'submit' }) }
}
```

- [ ] **Step 4: Verify and commit**

Run:

```bash
cd frontend
npx vitest run src/hooks/useChatStream.test.ts
npx tsc -b --noEmit
```

Commit:

```bash
git add frontend/src/hooks frontend/src/api/session.ts
git commit -m "feat: add cancellable chat streaming"
```

---

### Task 7: Safe Answer Components

**Files:**
- Create: `frontend/src/components/markdown-content/MarkdownContent.tsx`
- Create: `frontend/src/components/markdown-content/MarkdownContent.test.tsx`
- Create: `frontend/src/components/research-activity/ResearchActivity.tsx`
- Create: `frontend/src/components/media-gallery/MediaGallery.tsx`
- Create: `frontend/src/components/source-drawer/SourceDrawer.tsx`
- Create: `frontend/src/components/response-actions/ResponseActions.tsx`
- Create: `frontend/src/components/assistant-response/AssistantResponse.tsx`
- Create: `frontend/src/components/assistant-response/AssistantResponse.module.scss`

**Interfaces:**
- Produces: `AssistantResponse({ state, onRetry })`
- Produces: sanitized `MarkdownContent({ value })`.

- [ ] **Step 1: Write failing sanitization and conditional rendering tests**

Create `frontend/src/components/markdown-content/MarkdownContent.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import MarkdownContent from './MarkdownContent'

it('removes scripts and secures external links', () => {
  const { container } = render(<MarkdownContent value={'<script>alert(1)</script>[来源](https://example.com)'} />)
  expect(container.querySelector('script')).toBeNull()
  expect(screen.getByRole('link')).toHaveAttribute('rel', 'noopener noreferrer')
})
```

Create `frontend/src/components/assistant-response/AssistantResponse.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { initialStreamState } from '@/lib/stream/stream-reducer'
import AssistantResponse from './AssistantResponse'

it('does not render empty media or source controls', () => {
  render(<AssistantResponse state={{ ...initialStreamState, status: 'completed', content: '# Ceph' }} />)
  expect(screen.queryByText('来源')).not.toBeInTheDocument()
  expect(screen.queryByRole('img')).not.toBeInTheDocument()
})
```

Run:

```bash
cd frontend
npx vitest run src/components/markdown-content/MarkdownContent.test.tsx src/components/assistant-response/AssistantResponse.test.tsx
```

Expected: FAIL because components do not exist.

- [ ] **Step 2: Implement safe Markdown and lightweight content components**

Create `frontend/src/components/markdown-content/MarkdownContent.tsx`:

```tsx
import { useMemo } from 'react'
import DOMPurify from 'dompurify'
import { marked } from 'marked'

export default function MarkdownContent({ value }: { value: string }) {
  const html = useMemo(() => {
    const sanitized = DOMPurify.sanitize(marked.parse(value) as string)
    const document = new DOMParser().parseFromString(sanitized, 'text/html')
    document.querySelectorAll('a').forEach((link) => {
      link.target = '_blank'
      link.rel = 'noopener noreferrer'
    })
    return document.body.innerHTML
  }, [value])
  return <div dangerouslySetInnerHTML={{ __html: html }} />
}
```

Create `frontend/src/components/research-activity/ResearchActivity.tsx`:

```tsx
import type { ResearchMilestone, StreamStatus } from '@/lib/stream/types'

export default function ResearchActivity(props: { status: StreamStatus; milestones: ResearchMilestone[] }) {
  if (props.milestones.length === 0) return null
  return (
    <details>
      <summary>已完成研究 · {props.milestones.length} 个步骤</summary>
      <ol>{props.milestones.map((item) => <li key={item}>{item}</li>)}</ol>
    </details>
  )
}
```

Create `frontend/src/components/media-gallery/MediaGallery.tsx`:

```tsx
import type { MediaItem } from '@/lib/stream/types'

export default function MediaGallery({ images }: { images: MediaItem[] }) {
  if (images.length === 0) return null
  return <div data-count={Math.min(images.length, 3)}>{images.slice(0, 3).map((image) => <a key={image.link} href={image.link} target="_blank" rel="noopener noreferrer"><img src={image.imageUrl} alt={image.title} /></a>)}</div>
}
```

Create `frontend/src/components/source-drawer/SourceDrawer.tsx`:

```tsx
import { Drawer } from 'antd'
import type { SourceItem } from '@/lib/stream/types'

export default function SourceDrawer(props: { open: boolean; onClose: () => void; sources: SourceItem[] }) {
  return <Drawer title="来源" open={props.open} onClose={props.onClose}>{props.sources.map((source) => <article key={source.url}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.title}</a><p>{source.content}</p></article>)}</Drawer>
}
```

Create `frontend/src/components/response-actions/ResponseActions.tsx`:

```tsx
export default function ResponseActions(props: { content: string; onRetry?: () => void }) {
  return <div><button onClick={() => navigator.clipboard.writeText(props.content)}>复制</button><button onClick={props.onRetry}>重试</button></div>
}
```

- [ ] **Step 3: Compose the final response**

Create `frontend/src/components/assistant-response/AssistantResponse.tsx`:

```tsx
import { useState } from 'react'
import type { StreamState } from '@/lib/stream/types'
import MarkdownContent from '@/components/markdown-content/MarkdownContent'
import MediaGallery from '@/components/media-gallery/MediaGallery'
import ResearchActivity from '@/components/research-activity/ResearchActivity'
import ResponseActions from '@/components/response-actions/ResponseActions'
import SourceDrawer from '@/components/source-drawer/SourceDrawer'
import styles from './AssistantResponse.module.scss'

export default function AssistantResponse({ state, onRetry }: { state: StreamState; onRetry?: () => void }) {
  const [sourcesOpen, setSourcesOpen] = useState(false)
  return (
    <article className={styles.response}>
      <ResearchActivity status={state.status} milestones={state.milestones} />
      <MediaGallery images={state.images} />
      <MarkdownContent value={state.content} />
      {state.error && <p role="alert">{state.error}</p>}
      {state.sources.length > 0 && <button onClick={() => setSourcesOpen(true)}>查看 {state.sources.length} 个来源</button>}
      {state.content && <ResponseActions content={state.content} onRetry={onRetry} />}
      <SourceDrawer open={sourcesOpen} onClose={() => setSourcesOpen(false)} sources={state.sources} />
    </article>
  )
}
```

Create `frontend/src/components/assistant-response/AssistantResponse.module.scss`:

```scss
.response { width: min(var(--ds-content-width), 100%); margin: 0 auto; font-size: 15px; line-height: 1.7; }
.response h1, .response h2, .response h3 { line-height: 1.3; letter-spacing: -0.02em; }
.response pre { overflow: auto; padding: 16px; border-radius: 16px; background: #f4f4f2; }
.response img { display: block; width: 100%; aspect-ratio: 16 / 10; object-fit: cover; border-radius: 10px; }
```

- [ ] **Step 4: Verify and commit**

Run:

```bash
cd frontend
npx vitest run src/components/markdown-content/MarkdownContent.test.tsx src/components/assistant-response/AssistantResponse.test.tsx
npx tsc -b --noEmit
npm run build
```

Commit:

```bash
git add frontend/src/components/markdown-content frontend/src/components/research-activity frontend/src/components/media-gallery frontend/src/components/source-drawer frontend/src/components/response-actions frontend/src/components/assistant-response
git commit -m "feat: render safe research answers"
```

---

### Task 8: Message List, Container Scrolling, and Chat Integration

**Files:**
- Create: `frontend/src/components/message-list/MessageList.tsx`
- Create: `frontend/src/components/message-list/MessageList.module.scss`
- Create: `frontend/src/components/message-list/MessageList.test.tsx`
- Modify: `frontend/src/pages/chat/index.tsx`
- Modify: `frontend/src/pages/chat/index.module.scss`

**Interfaces:**
- Produces: `MessageList({ question, state, onRetry })`
- Consumes: `useChatStream`.

- [ ] **Step 1: Write the failing scroll test**

Create `frontend/src/components/message-list/MessageList.test.tsx`:

```tsx
import { fireEvent, render, screen } from '@testing-library/react'
import { initialStreamState } from '@/lib/stream/stream-reducer'
import MessageList from './MessageList'

it('shows a jump button when the reader leaves the bottom', () => {
  render(<MessageList question="Ceph" state={{ ...initialStreamState, status: 'streaming', content: '回答' }} />)
  const region = screen.getByRole('log')
  Object.defineProperties(region, { scrollHeight: { value: 1000 }, clientHeight: { value: 400 }, scrollTop: { value: 100, writable: true } })
  fireEvent.scroll(region)
  expect(screen.getByRole('button', { name: '滚动到底部' })).toBeInTheDocument()
})
```

Run: `cd frontend && npx vitest run src/components/message-list/MessageList.test.tsx`

Expected: FAIL because MessageList does not exist.

- [ ] **Step 2: Implement container scrolling**

Create `frontend/src/components/message-list/MessageList.tsx`:

```tsx
import { useEffect, useRef, useState } from 'react'
import type { StreamState } from '@/lib/stream/types'
import AssistantResponse from '@/components/assistant-response/AssistantResponse'
import styles from './MessageList.module.scss'

export default function MessageList(props: { question: string; state: StreamState; onRetry?: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const [away, setAway] = useState(false)
  useEffect(() => {
    if (!away) ref.current?.scrollTo({ top: ref.current.scrollHeight, behavior: 'smooth' })
  }, [props.state.content, away])
  return (
    <div
      ref={ref}
      role="log"
      className={styles.viewport}
      onScroll={(event) => {
        const node = event.currentTarget
        setAway(node.scrollHeight - node.scrollTop - node.clientHeight > 160)
      }}
    >
      <div className={styles.content}>
        <div className={styles.question}>{props.question}</div>
        <AssistantResponse state={props.state} onRetry={props.onRetry} />
      </div>
      {away && <button className={styles.jump} aria-label="滚动到底部" onClick={() => ref.current?.scrollTo({ top: ref.current.scrollHeight, behavior: 'smooth' })}>↓</button>}
    </div>
  )
}
```

Create `frontend/src/components/message-list/MessageList.module.scss`:

```scss
.viewport { height: 100%; overflow-y: auto; position: relative; }
.content { width: min(var(--ds-content-width), calc(100% - 48px)); margin: 0 auto; padding: 32px 0 150px; }
.question { width: fit-content; max-width: 72%; margin: 0 0 28px auto; padding: 10px 14px; border-radius: 18px 18px 5px 18px; background: #f3f3f1; }
.jump { position: sticky; left: 50%; bottom: 100px; width: 34px; height: 34px; border: 1px solid var(--ds-border); border-radius: 50%; background: #fff; }
```

- [ ] **Step 3: Replace the chat page orchestration**

Refactor `frontend/src/pages/chat/index.tsx` so its top-level component follows this structure and removes the old inline `read`, `parseData`, and document scroll functions:

```tsx
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useSnapshot } from 'valtio'
import MessageList from '@/components/message-list/MessageList'
import PromptComposer from '@/components/prompt-composer/PromptComposer'
import { useChatStream } from '@/hooks/useChatStream'
import { sessionState } from '@/store/session'
import { usePageTransport } from '@/utils/usePageTransport'
import { transportToChatEnter } from './shared'
import styles from './index.module.scss'

export default function Chat() {
  const { id = '' } = useParams()
  const session = useSnapshot(sessionState)
  const stream = useChatStream()
  const transport = usePageTransport(transportToChatEnter)
  const [question, setQuestion] = useState('')

  async function send(message: string, attachments: string[]) {
    setQuestion(message)
    await stream.send({ id, message, attachments, webSearch: session.useWeb, deepResearch: session.useDeep })
  }

  useEffect(() => {
    const message = transport.data?.data.message
    if (message) void send(message, [])
  }, [transport.data])

  useEffect(() => () => stream.stop(), [stream.stop])

  return (
    <section className={styles.chat}>
      <MessageList question={question} state={stream.state} onRetry={() => question && void send(question, [])} />
      <div className={styles.composer}>
        <PromptComposer loading={['submitting', 'researching', 'streaming'].includes(stream.state.status)} onSend={send} onStop={stream.stop} />
      </div>
    </section>
  )
}
```

Set `frontend/src/pages/chat/index.module.scss` to:

```scss
.chat { height: calc(100vh - 54px); position: relative; overflow: hidden; }
.composer { position: absolute; z-index: 2; left: 50%; bottom: 16px; width: min(720px, calc(100% - 48px)); transform: translateX(-50%); }
```

This task handles newly created conversations. Task 9 adds history loading before the old chat implementation is deleted; do not delete the existing `api.session.detail` mapping until Task 9's history test passes.

- [ ] **Step 4: Verify core integration and commit**

Run:

```bash
cd frontend
npx vitest run src/components/message-list/MessageList.test.tsx
npx vitest run
npx tsc -b --noEmit
npm run build
```

Expected: all commands exit `0`; no test renders raw `think` content.

Commit:

```bash
git add frontend/src/components/message-list frontend/src/pages/chat
git commit -m "feat: integrate focused streaming chat"
```

---

### Task 9: Session History and Core Regression Coverage

**Files:**
- Create: `frontend/src/components/navigation-drawer/NavigationDrawer.test.tsx`
- Create: `frontend/src/pages/chat/chat.integration.test.tsx`
- Create: `frontend/src/lib/stream/history.ts`
- Modify: `frontend/src/components/app-shell/AppShell.tsx`
- Modify: `frontend/src/store/session.ts`
- Modify: `frontend/src/pages/chat/index.tsx`
- Modify: `frontend/mock/session.ts`

**Interfaces:**
- Produces: `sessionActions.refresh(): Promise<void>`.
- Produces: `historyToStreamState(item): StreamState`.
- Verifies standard and deep research SSE paths.

- [ ] **Step 1: Write failing history and integration tests**

Create `frontend/src/components/navigation-drawer/NavigationDrawer.test.tsx`:

```tsx
import { screen } from '@testing-library/react'
import { renderWithApp } from '@/test/test-utils'
import NavigationDrawer from './NavigationDrawer'

it('renders session history as chat links', () => {
  renderWithApp(<NavigationDrawer open onClose={() => {}} sessions={[{ session_id: 'abc', session_name: 'Ceph 研究', created_at: '', updated_at: '' }]} />)
  expect(screen.getByRole('link', { name: 'Ceph 研究' })).toHaveAttribute('href', '/chat/abc')
})
```

Create `frontend/src/pages/chat/chat.integration.test.tsx`:

```tsx
import { expect, it } from 'vitest'
import { createSseParser } from '@/lib/stream/sse-parser'
import { initialStreamState, streamReducer } from '@/lib/stream/stream-reducer'

it('turns backend SSE into a completed public answer', () => {
  let state = initialStreamState
  const parser = createSseParser((event) => { state = streamReducer(state, event) })
  parser.push('data: {"content":"searching sources","thinking":true}\n\ndata: {"content":"Ceph 是分布式存储","thinking":false}\n\ndata: [DONE]\n\n')
  expect(state.content).toBe('Ceph 是分布式存储')
  expect(state.milestones).toEqual(['搜索资料'])
  expect(JSON.stringify(state)).not.toContain('searching sources')
})
```

- [ ] **Step 2: Normalize history without exposing stored raw thinking**

Create `frontend/src/lib/stream/history.ts`:

```ts
import type { StreamState } from './types'

export function historyToStreamState(item: {
  model_answer: string
  documents?: string
  recommended_questions?: string[]
}): StreamState {
  let sources: StreamState['sources'] = []
  try {
    sources = item.documents ? JSON.parse(item.documents) : []
  } catch {
    sources = []
  }
  return {
    status: 'completed',
    content: item.model_answer,
    milestones: [],
    sources,
    images: [],
    recommendations: item.recommended_questions ?? [],
  }
}
```

Add this test to `frontend/src/pages/chat/chat.integration.test.tsx`:

```ts
import { historyToStreamState } from '@/lib/stream/history'

it('loads history without copying the think field', () => {
  const state = historyToStreamState({
    model_answer: '历史回答',
    documents: '[{"title":"文档","url":"https://example.com","content":"摘要"}]',
    recommended_questions: ['继续'],
  })
  expect(state.content).toBe('历史回答')
  expect(JSON.stringify(state)).not.toContain('think')
})
```

In `frontend/src/pages/chat/index.tsx`, add a separate `historyState` and load it only when no transport message exists:

```ts
const [historyState, setHistoryState] = useState<StreamState | null>(null)

useEffect(() => {
  const message = transport.data?.data.message
  if (message) {
    void send(message, [])
    return
  }
  void api.session.detail({ session_id: id }).then(({ data }) => {
    const last = data.at(-1)
    if (last) {
      setQuestion(last.user_question)
      setHistoryState(historyToStreamState(last))
    }
  })
}, [id, transport.data])
```

Pass `historyState ?? stream.state` to `MessageList`. Import `StreamState`, `historyToStreamState`, and `api`.

- [ ] **Step 3: Add an asynchronous history refresh action**

Update `frontend/src/store/session.ts`:

```ts
import { list } from '@/api/session'

async function refresh() {
  const result = await list()
  state.list = result.data.sessions
}
```

Expose `refresh` on `sessionActions`, then call it once from `AppShell` in an effect:

```ts
useEffect(() => { void sessionActions.refresh() }, [])
```

- [ ] **Step 4: Add deterministic mock responses**

In `frontend/mock/session.ts`, add handlers for:

```ts
{
  url: '/ai-search/get_sessions/',
  method: 'get',
  response: () => ({ sessions: [{ session_id: 'demo', session_name: 'Ceph 研究', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }] }),
}
```

Ensure the existing SSE mock includes:

```text
event: message
data: {"content":"searching sources","thinking":true}

event: message
data: {"content":"Ceph 是分布式存储系统。","thinking":false}

data: [DONE]
```

- [ ] **Step 5: Run the full core quality gate**

Run:

```bash
cd frontend
npx vitest run
npx tsc -b --noEmit
npm run lint
npm run build
```

Expected:

- Vitest: all tests pass.
- TypeScript: exit `0`.
- ESLint: exit `0`; fix touched-file violations before committing.
- Vite build: exit `0`.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/components/navigation-drawer frontend/src/components/app-shell/AppShell.tsx frontend/src/store/session.ts frontend/src/lib/stream/history.ts frontend/src/pages/chat frontend/mock/session.ts
git commit -m "test: cover DeepSearch chat journey"
```

---

## Final Manual Acceptance

- [ ] Run `cd frontend && npm run dev`.
- [ ] At `http://localhost:5181/`, confirm the home page has no persistent sidebar.
- [ ] Confirm all visible UI copy is simplified Chinese.
- [ ] Create a session and verify navigation uses the backend-provided session ID.
- [ ] Start a deep research response and confirm only public milestones appear.
- [ ] Stop generation and confirm partial content remains.
- [ ] Scroll upward during streaming and confirm auto-scroll pauses.
- [ ] Confirm images occupy no space when absent and form a three-image row when present.
- [ ] Inject `<script>alert(1)</script>` in mock Markdown and confirm no script executes.
- [ ] Open sources and confirm external links use a new tab safely.
- [ ] At 1440px width, compare home and answer pages with the approved mockups.
