import { createFileRoute } from '@tanstack/react-router'
import { PlaylistWorkflow } from '@/components/product/playlist-workflow'

export const Route = createFileRoute('/_authenticated/app')({
  component: AppRoute,
})

function AppRoute() {
  return (
    <main className="page-wrap px-4 py-10">
      <PlaylistWorkflow />
    </main>
  )
}
