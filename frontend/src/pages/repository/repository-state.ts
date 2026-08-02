export type RepositoryStatus = 'parsing' | 'ready' | 'failed'

export function getRepositoryStatus(file: { status?: string }): RepositoryStatus {
  if (file.status === 'success') return 'ready'
  if (file.status === 'error') return 'failed'
  return 'parsing'
}
