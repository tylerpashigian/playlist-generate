export function StatusPanel({ message }: { message: string }) {
  return (
    <div className="mx-auto max-w-md rounded-2xl border border-border bg-card p-5 text-sm text-muted-foreground shadow-sm">
      {message}
    </div>
  )
}
