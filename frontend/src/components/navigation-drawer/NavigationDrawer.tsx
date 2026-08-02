import { Drawer } from 'antd'
import { Link } from 'react-router-dom'
import styles from './NavigationDrawer.module.scss'

export default function NavigationDrawer(props: {
  open: boolean
  onClose: () => void
  sessions: API.Session[]
}) {
  return (
    <Drawer
      title="导航"
      placement="left"
      width={300}
      open={props.open}
      onClose={props.onClose}
    >
      <nav className={styles.nav}>
        <Link to="/" onClick={props.onClose}>
          <span aria-hidden="true">＋ </span>
          <span>新对话</span>
        </Link>
        <Link to="/repository" onClick={props.onClose}>
          知识库
        </Link>
        <Link to="/pricing" onClick={props.onClose}>
          充值
        </Link>
        <span className={styles.label}>最近</span>
        {props.sessions.length === 0 ? (
          <span className={styles.empty}>暂无历史对话</span>
        ) : (
          props.sessions.map((session) => (
            <Link
              key={session.session_id}
              to={`/chat/${session.session_id}`}
              onClick={props.onClose}
            >
              {session.session_name}
            </Link>
          ))
        )}
      </nav>
    </Drawer>
  )
}
