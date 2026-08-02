import * as api from '@/api'
import IconUpload from '@/assets/repository/upload.svg'
import { Upload, UploadFile, UploadProps } from 'antd'
import { forwardRef, useImperativeHandle, useState } from 'react'
import styles from './upload.module.scss'

export type RepositoryUploadRef = {
  submit: () => Promise<void>
}

export default forwardRef(function RepositoryUpload(
  props: UploadProps,
  ref?: React.Ref<RepositoryUploadRef>,
) {
  const { ...otherProps } = props

  const [fileList, setFileList] = useState<UploadFile[]>([])

  useImperativeHandle(ref, () => {
    return {
      submit: async () => {
        let hasError = false

        for (const file of fileList) {
          if (file.status === 'done') continue

          setFileList((prev) =>
            prev.map((item) => {
              if (item.uid === file.uid) {
                return {
                  ...item,
                  status: 'uploading',
                }
              }
              return item
            }),
          )
          try {
            // 检查文件大小
            if ((file.size ?? 0) > 5 * 1024 * 1024) {
              throw new Error('文件大小不能超过5M')
            }

            await api.session.upload({ files: file.originFileObj as File })

            setFileList((prev) =>
              prev.map((item) => {
                if (item.uid === file.uid) {
                  return {
                    ...item,
                    status: 'done',
                    url: '#',
                  }
                }
                return item
              }),
            )
          } catch (error: unknown) {
            const message = getErrorMessage(error)
            window.$app.message.error(message)
            hasError = true
            setFileList((prev) =>
              prev.map((item) => {
                if (item.uid === file.uid) {
                  return {
                    ...item,
                    status: 'error',
                    response: message,
                  }
                }
                return item
              }),
            )
          }
        }

        if (hasError) {
          throw new Error('Upload failed')
        } else {
          window.$app.message.success('上传已完成')
        }
      },
    }
  })

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
})

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message
  }
  return '上传失败'
}
