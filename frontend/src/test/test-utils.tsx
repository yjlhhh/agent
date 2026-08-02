import type { ReactElement } from 'react'
import { render } from '@testing-library/react'
import { App, ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
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
