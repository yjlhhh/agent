# DeepSearch Supporting Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将知识库、充值和 404 页面统一到已完成的 DeepSearch 设计系统中，并补齐清晰的加载、空白和错误状态。

**Architecture:** 复用核心计划产出的 `AppShell`、CSS tokens 和测试工具，不修改后端协议。知识库保留现有 CRUD API，仅替换视觉层与状态呈现；充值页移除 iframe，404 提供明确恢复路径。

**Tech Stack:** React 18、TypeScript、Ant Design 5、Vitest、Testing Library、CSS Modules

## Global Constraints

- 必须先完成 `2026-08-02-deepsearch-core-chat-ui.md`。
- 所有界面文案使用简体中文。
- 仅支持浅色主题，桌面优先。
- 使用 `--ds-*` tokens，不新增页面级硬编码品牌色。
- 错误必须在发生位置附近显示，不跳转到全局错误页。
- 每个任务先写失败测试，再实现，再提交。

---

### Task 1: Knowledge Base Visual and State Model

**Files:**
- Create: `frontend/src/pages/repository/repository-state.ts`
- Create: `frontend/src/pages/repository/repository-state.test.ts`
- Modify: `frontend/src/pages/repository/index.tsx`
- Modify: `frontend/src/pages/repository/index.module.scss`
- Modify: `frontend/src/pages/repository/components/upload.tsx`

**Interfaces:**
- Produces: `getRepositoryStatus(file): 'parsing' | 'ready' | 'failed'`
- Preserves: existing repository list, upload and delete API calls.

- [ ] **Step 1: Write failing status tests**

Create `frontend/src/pages/repository/repository-state.test.ts`:

```ts
import { expect, it } from 'vitest'
import { getRepositoryStatus } from './repository-state'

it.each([
  [{ status: 'success' }, 'ready'],
  [{ status: 'processing' }, 'parsing'],
  [{ status: 'error' }, 'failed'],
])('maps %o to %s', (input, expected) => {
  expect(getRepositoryStatus(input)).toBe(expected)
})
```

Run: `cd frontend && npx vitest run src/pages/repository/repository-state.test.ts`

Expected: FAIL because the helper does not exist.

- [ ] **Step 2: Implement the status helper**

Create `frontend/src/pages/repository/repository-state.ts`:

```ts
export type RepositoryStatus = 'parsing' | 'ready' | 'failed'

export function getRepositoryStatus(file: { status?: string }): RepositoryStatus {
  if (file.status === 'success') return 'ready'
  if (file.status === 'error') return 'failed'
  return 'parsing'
}
```

- [ ] **Step 3: Restructure the page without changing API behavior**

Extend the Ant Design import in `frontend/src/pages/repository/index.tsx`:

```tsx
import { Button, Empty, Input, Modal, Select, Skeleton, Space, Table } from 'antd'
```

Add these states after `uploading`:

```tsx
const [keyword, setKeyword] = useState('')
const [fileType, setFileType] = useState('all')
const filteredData = useMemo(() => (data ?? []).filter((file) => {
  const matchesKeyword = file.file_name.toLowerCase().includes(keyword.toLowerCase())
  const matchesType = fileType === 'all' || file.$suffix.toLowerCase() === fileType
  return matchesKeyword && matchesType
}), [data, fileType, keyword])
```

Replace the current top-level return content with:

```tsx
<section className={styles.page}>
  <header className={styles.header}>
    <div>
      <h1>资料与来源</h1>
      <p>让 DeepSearch 优先参考你的可信内容</p>
    </div>
    <Button type="primary" onClick={() => setUploadOpen(true)}>＋ 上传文件</Button>
  </header>
  <div className={styles.toolbar}>
    <Input.Search aria-label="搜索文件" placeholder="搜索文件" onChange={(event) => setKeyword(event.target.value)} />
    <Select aria-label="文件类型" value={fileType} onChange={setFileType} options={[
      { value: 'all', label: '全部类型' },
      { value: 'pdf', label: 'PDF' },
      { value: 'doc', label: 'DOC' },
      { value: 'docx', label: 'DOCX' },
    ]} />
  </div>
  {!data ? <Skeleton active /> : filteredData.length === 0 ? (
    <Empty description="还没有资料，上传文件后即可在回答中引用。" />
  ) : (
    <Table rowKey="id" columns={columns} dataSource={filteredData} rowSelection={rowSelection} scroll={scroll} pagination={false} />
  )}
  <Modal
    title="上传文件"
    open={openUpload}
    okText="开始上传"
    width={420}
    destroyOnClose
    confirmLoading={uploading}
    onCancel={() => { if (!uploading) setOpenUpload(false) }}
    onOk={async () => {
      setUploading(true)
      try {
        await uploadRef.current?.submit()
        setOpenUpload(false)
        refresh()
      } finally {
        setUploading(false)
      }
    }}
  >
    <RepositoryUpload beforeUpload={() => false} ref={uploadRef} />
  </Modal>
</section>
```

Set `frontend/src/pages/repository/index.module.scss` to:

```scss
.page { width: min(1040px, calc(100% - 64px)); margin: 0 auto; padding: 40px 0 72px; }
.header { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 24px; }
.header h1 { margin: 0; font-size: 28px; letter-spacing: -0.03em; }
.header p { margin: 4px 0 0; color: var(--ds-text-secondary); }
.toolbar { display: grid; grid-template-columns: minmax(260px, 1fr) 160px; gap: 10px; margin-bottom: 14px; }
:global(.ant-table-wrapper) { border: 1px solid var(--ds-border); border-radius: 12px; overflow: hidden; }
:global(.ant-table-thead > tr > th) { background: var(--ds-bg-subtle); color: var(--ds-text-secondary); }
```

- [ ] **Step 4: Localize upload feedback and preserve failed files**

Replace lines 85–115 of `frontend/src/pages/repository/components/upload.tsx` with:

```tsx
return (
  <div className={styles['repository-upload']}>
    <Upload.Dragger
      {...otherProps}
      showUploadList={false}
      maxCount={10}
      fileList={fileList}
      onChange={(info) => setFileList(info.fileList)}
    >
      <img src={IconUpload} alt="" />
      <p className="ant-upload-text">
        拖放文件到这里，或 <span>点击选择文件</span>
      </p>
    </Upload.Dragger>
    <p className={styles['repository-upload__desc']}>
      支持 PDF、DOC 和 DOCX；单个文件不超过 5 MB，最多选择 10 个文件。
    </p>
    <Upload fileList={fileList} onChange={(info) => setFileList(info.fileList)} />
  </div>
)
```

The existing submit loop already skips only `done` files and keeps `error` files in `fileList`, so pressing `开始上传` again retries failed files without adding a second retry state.

- [ ] **Step 5: Verify and commit**

Run:

```bash
cd frontend
npx vitest run src/pages/repository/repository-state.test.ts
npx tsc -b --noEmit
npm run build
```

Commit:

```bash
git add frontend/src/pages/repository
git commit -m "feat: unify DeepSearch knowledge base"
```

---

### Task 2: Native Pricing Page

**Files:**
- Create: `frontend/src/pages/pricing/Pricing.test.tsx`
- Modify: `frontend/src/pages/pricing/index.tsx`
- Modify: `frontend/src/pages/pricing/index.scss`

**Interfaces:**
- Produces: a native plan page with no iframe.
- Does not change payment backend behavior.

- [ ] **Step 1: Write the failing iframe-removal test**

Create `frontend/src/pages/pricing/Pricing.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import Pricing from './index'

it('renders native plans without an iframe', () => {
  const { container } = render(<Pricing />)
  expect(container.querySelector('iframe')).toBeNull()
  expect(screen.getByRole('heading', { name: '选择适合你的方案' })).toBeInTheDocument()
})
```

Run: `cd frontend && npx vitest run src/pages/pricing/Pricing.test.tsx`

Expected: FAIL because the current page renders an iframe.

- [ ] **Step 2: Replace the iframe with native plan cards**

Set `frontend/src/pages/pricing/index.tsx` to:

```tsx
import { Button } from 'antd'
import './index.scss'

const plans = [
  { name: '免费版', price: '¥0', description: '适合日常快速搜索', features: ['基础搜索', '有限深度研究', '知识库试用'] },
  { name: '专业版', price: '¥99 / 月', description: '适合高频研究工作', features: ['更多深度研究', '完整来源追踪', '更大知识库'] },
]

export default function Pricing() {
  return (
    <section className="pricing-page">
      <header><h1>选择适合你的方案</h1><p>按需升级，不影响已有对话和资料。</p></header>
      <div className="pricing-grid">
        {plans.map((plan) => (
          <article key={plan.name} className="pricing-card">
            <h2>{plan.name}</h2><strong>{plan.price}</strong><p>{plan.description}</p>
            <ul>{plan.features.map((feature) => <li key={feature}>✓ {feature}</li>)}</ul>
            <Button type={plan.name === '专业版' ? 'primary' : 'default'} block>{plan.name === '专业版' ? '升级专业版' : '当前方案'}</Button>
          </article>
        ))}
      </div>
    </section>
  )
}
```

Set `frontend/src/pages/pricing/index.scss` to:

```scss
.pricing-page { width: min(880px, calc(100% - 64px)); margin: 0 auto; padding: 64px 0; }
.pricing-page > header { text-align: center; margin-bottom: 34px; }
.pricing-page h1 { margin: 0; font-size: 32px; letter-spacing: -0.04em; }
.pricing-page header p { color: var(--ds-text-secondary); }
.pricing-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
.pricing-card { padding: 28px; border: 1px solid var(--ds-border); border-radius: var(--ds-radius-content); }
.pricing-card > strong { display: block; margin: 14px 0; font-size: 24px; }
.pricing-card ul { min-height: 120px; padding: 0; list-style: none; color: var(--ds-text-secondary); }
```

- [ ] **Step 3: Verify and commit**

Run:

```bash
cd frontend
npx vitest run src/pages/pricing/Pricing.test.tsx
npx tsc -b --noEmit
npm run build
```

Commit:

```bash
git add frontend/src/pages/pricing
git commit -m "feat: replace pricing iframe with native page"
```

---

### Task 3: Recoverable 404 Page

**Files:**
- Create: `frontend/src/pages/404.test.tsx`
- Modify: `frontend/src/pages/404.tsx`

**Interfaces:**
- Produces: links to `/` and a new conversation recovery action.

- [ ] **Step 1: Write the failing recovery test**

Create `frontend/src/pages/404.test.tsx`:

```tsx
import { screen } from '@testing-library/react'
import { renderWithApp } from '@/test/test-utils'
import NotFound from './404'

it('offers a path back to DeepSearch', () => {
  renderWithApp(<NotFound />, ['/missing'])
  expect(screen.getByRole('heading', { name: '页面不存在' })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: '返回首页' })).toHaveAttribute('href', '/')
})
```

Run: `cd frontend && npx vitest run src/pages/404.test.tsx`

Expected: FAIL because the current page only renders `404`.

- [ ] **Step 2: Implement the recovery page**

Set `frontend/src/pages/404.tsx` to:

```tsx
import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <main style={{ minHeight: 'calc(100vh - 54px)', display: 'grid', placeItems: 'center', textAlign: 'center' }}>
      <div>
        <p style={{ color: 'var(--ds-text-secondary)' }}>404</p>
        <h1>页面不存在</h1>
        <p style={{ color: 'var(--ds-text-secondary)' }}>链接可能已失效，或者页面已被移动。</p>
        <Link to="/">返回首页</Link>
      </div>
    </main>
  )
}
```

- [ ] **Step 3: Verify and commit**

Run:

```bash
cd frontend
npx vitest run src/pages/404.test.tsx
npx tsc -b --noEmit
npm run build
```

Commit:

```bash
git add frontend/src/pages/404.tsx frontend/src/pages/404.test.tsx
git commit -m "feat: add recoverable not-found page"
```

---

### Task 4: Supporting Pages Regression Gate

**Files:**
- Modify only files that fail the checks below.

- [ ] **Step 1: Run all automated checks**

```bash
cd frontend
npx vitest run
npx tsc -b --noEmit
npm run lint
npm run build
```

Expected: every command exits `0`.

- [ ] **Step 2: Perform desktop acceptance at 1440px**

Run: `cd frontend && npm run dev`

Verify:

- `/repository` uses the shared shell and has loading, empty, ready and failed states.
- Upload failure preserves selected files and exposes `重试`.
- `/pricing` contains no iframe and does not cover the application header.
- An unknown route shows `页面不存在` and `返回首页`.
- Every visible label is simplified Chinese.
- Keyboard focus is visible on search, filter, upload, pricing and recovery actions.

- [ ] **Step 3: Commit only if verification required fixes**

```bash
git add frontend/src/pages
git commit -m "fix: complete supporting page acceptance"
```

Skip this commit when verification makes no file changes.
