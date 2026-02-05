import { redirect } from 'next/navigation'

export const runtime = 'nodejs'

export default function AgentDashboardRedirect() {
  redirect('/agent')
}
