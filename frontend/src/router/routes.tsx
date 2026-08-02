import AppShell from '@/components/app-shell/AppShell'
import NotFound from '@/pages/404'
import Chat from '@/pages/chat'
import Index from '@/pages/index'
import Pricing from '@/pages/pricing'
import Repository from '@/pages/repository'
import {
  Outlet,
  RouteObject,
  createBrowserRouter,
  useLocation,
} from 'react-router-dom'

export type IRouteObject = {
  children?: IRouteObject[]
  name?: string
  auth?: boolean
  pure?: boolean
  meta?: unknown
} & Omit<RouteObject, 'children'>

export const routes: IRouteObject[] = [
  {
    path: '/',
    Component: Index,
  },
  {
    path: '/chat/:id',
    Component: Chat,
  },
  {
    path: '/repository',
    Component: Repository,
  },
  {
    path: '/pricing',
    Component: Pricing,
  },
]

// eslint-disable-next-line react-refresh/only-export-components
function Layout() {
  const location = useLocation()
  return (
    <AppShell>
      <Outlet key={location.pathname} />
    </AppShell>
  )
}

export const router = createBrowserRouter(
  [
    helper({
      path: '/',
      Component: Layout,
      children: routes,
    }),
    helper({
      path: '404',
      Component: NotFound,
      pure: true,
    }),
    helper({
      path: '*',
      Component: NotFound,
    }),
  ],
  {
    basename: import.meta.env.BASE_URL,
  },
)

function helper(route: IRouteObject) {
  const _route = {
    ...route,
  }

  if (_route.children) {
    _route.children = _route.children.map((child: IRouteObject) =>
      helper(child),
    )
  }

  if (_route.auth === undefined) {
    _route.auth = true
  }

  return _route as RouteObject
}
