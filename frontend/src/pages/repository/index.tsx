import * as api from '@/api'
import IconDelete from '@/assets/repository/action/delete.svg'
import { useRequest } from 'ahooks'
import { Button, Empty, Input, Modal, Select, Skeleton, Space, Table } from 'antd'
import { ColumnsType } from 'antd/es/table'
import { TableRowSelection } from 'antd/es/table/interface'
import dayjs from 'dayjs'
import { useCallback, useMemo, useRef, useState } from 'react'
import { FileIcon } from './components/file-icon'
import { Status } from './components/status'
import RepositoryUpload, { RepositoryUploadRef } from './components/upload'
import styles from './index.module.scss'
import { getRepositoryStatus, RepositoryStatus } from './repository-state'

type IRepository = API.Repository & {
  id: number
  $suffix: FileIcon
  method: string
  enable: boolean
  status: RepositoryStatus
}

function getStatusTag(status: RepositoryStatus): 'failed' | 'success' | 'unparsed' {
  if (status === 'ready') return 'success'
  if (status === 'failed') return 'failed'
  return 'unparsed'
}

export default function Index() {
  const { data, refresh } = useRequest(async () => {
    const { data } = await api.repository.list()
    return data?.map(
      (item, index) =>
        ({
          ...item,
          $suffix: item.file_name.split('.').pop() as FileIcon,
          id: index + 1,
          method: '优化分块',
          enable: true,
          status: getRepositoryStatus(item as API.Repository & { status?: string }),
        }) satisfies IRepository,
    )
  })

  const deleteFile = useCallback(async (file: IRepository) => {
    const {
      data: { message = '删除成功' },
    } =
      (await api.repository.deleteFile({
        file_name: file.file_name,
      })) || {}
    // 提示成功
    window.$app.message.success(message)
    refresh()
  }, [refresh])

  const columns = useMemo<ColumnsType<IRepository>>(
    () => [
      {
        title: '名称',
        dataIndex: 'file_name',
        width: 200,
        render(value, row) {
          return (
            <div className={styles.fileName} title={value}>
              <FileIcon className={styles.icon} suffix={row.$suffix} />
              {value}
            </div>
          )
        },
      },
      {
        title: '更新时间',
        dataIndex: 'updated_at',
        width: 200,
        render(value) {
          return dayjs(value).format('MM/DD/YYYY HH:mm:ss')
        },
      },
      {
        title: '分块方法',
        dataIndex: 'method',
        width: 100,
        render(value) {
          return value ?? '优化分块'
        },
      },
      {
        title: '状态',
        dataIndex: 'status',
        width: 100,
        render(value) {
          return <Status status={getStatusTag(value)} />
        },
      },
      {
        title: '操作',
        dataIndex: 'action',
        width: 100,
        render(_, row) {
          return (
            <Space>
              <Button
                color="default"
                variant="text"
                shape="circle"
                size="small"
                onClick={() => deleteFile(row)}
              >
                <img src={IconDelete} />
              </Button>
            </Space>
          )
        },
      },
    ],
    [deleteFile],
  )
  const scroll = useMemo(() => {
    return {
      x: columns?.reduce((prev, current) => {
        return prev + parseInt(String(current.width ?? 0))
      }, 0),
    }
  }, [columns])

  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])

  const onSelectChange = (newSelectedRowKeys: React.Key[]) => {
    setSelectedRowKeys(newSelectedRowKeys)
  }
  const rowSelection: TableRowSelection<IRepository> = {
    selectedRowKeys,
    onChange: onSelectChange,
  }

  /* 上传 */
  const [openUpload, setOpenUpload] = useState(false)
  const uploadRef = useRef<RepositoryUploadRef>(null)
  const [uploading, setUploading] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [fileType, setFileType] = useState('all')
  const filteredData = useMemo(() => (data ?? []).filter((file) => {
    const matchesKeyword = file.file_name.toLowerCase().includes(keyword.toLowerCase())
    const matchesType = fileType === 'all' || file.$suffix.toLowerCase() === fileType
    return matchesKeyword && matchesType
  }), [data, fileType, keyword])

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1>资料与来源</h1>
          <p>让 DeepSearch 优先参考你的可信内容</p>
        </div>
        <Button type="primary" onClick={() => setOpenUpload(true)}>＋ 上传文件</Button>
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
        onCancel={() => {
          if (!uploading) setOpenUpload(false)
        }}
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
  )
}
