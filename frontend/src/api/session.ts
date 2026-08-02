import { AxiosRequestConfig } from 'axios'
import { request } from './request'

export function list(
  params?: Record<string, unknown>,
  options?: AxiosRequestConfig,
) {
  return request.get<{
    sessions: API.Session[]
  }>(`/get_sessions/`, {
    ...options,
    params,
  })
}

export function detail(
  params: {
    session_id: string
  },
  options?: AxiosRequestConfig,
) {
  return request.get<
    {
      created_at: string
      message_id: string
      session_id: string
      user_question: string
      model_answer: string
      think?: string
      documents?: string
      recommended_questions?: string[]
    }[]
  >(`/get_messages/`, {
    ...options,
    params,
  })
}

export function create(
  params?: Record<string, unknown>,
  options?: AxiosRequestConfig,
) {
  return request.post<
    API.Result<{
      session_id: string
    }>
  >(`/create_session`, params, options)
}

export function chat(
  params: {
    id: string
    message: string
    web_search?: boolean
    deep_research?: boolean
    attachments?: string[]
  },
  options?: AxiosRequestConfig,
) {
  const { id, deep_research, ...body } = params
  const config: AxiosRequestConfig = {
    headers: {
      Accept: 'text/event-stream',
    },
    responseType: 'stream',
    adapter: 'fetch',
    loading: false,
    params: {
      session_id: id,
    },
    ...options,
  }

  return request.post<ReadableStream>(
    deep_research ? '/deep_research/' : '/ai_search/',
    body,
    config,
  )
}

export function upload(params: { files: File }, options?: AxiosRequestConfig) {
  const form = new FormData()
  form.append('files', params.files)
  return request.post<API.Result<{ file_id: string; url: string }>>(
    `/upload_files/`,
    form,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      ...options,
    },
  )
}
