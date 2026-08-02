import type { ResearchMilestone, StreamStatus } from '@/lib/stream/types'

type ResearchActivityProps = {
  status: StreamStatus
  milestones: ResearchMilestone[]
}

export default function ResearchActivity({ status, milestones }: ResearchActivityProps) {
  if (milestones.length === 0) return null

  return (
    <details open={status === 'researching' || status === 'streaming'}>
      <summary>已完成研究 · {milestones.length} 个步骤</summary>
      <ol>
        {milestones.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ol>
    </details>
  )
}
