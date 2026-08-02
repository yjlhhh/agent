import { useEffect, useState, type PropsWithChildren } from 'react'
import { useSnapshot } from 'valtio'
import NavigationDrawer from '@/components/navigation-drawer/NavigationDrawer'
import { sessionActions, sessionState } from '@/store/session'
import styles from './AppShell.module.scss'

export default function AppShell({ children }: PropsWithChildren) {
  const [open, setOpen] = useState(false)
  const session = useSnapshot(sessionState)

  useEffect(() => {
    void sessionActions.refresh()
  }, [])

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <button aria-label="打开导航" onClick={() => setOpen(true)}>
          ☰
        </button>
        <strong>DeepSearch</strong>
      </header>
      <main className={styles.main}>{children}</main>
      <NavigationDrawer
        open={open}
        onClose={() => setOpen(false)}
        sessions={[...session.list]}
      />
    </div>
  )
}
