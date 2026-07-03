import { Text } from '@/components/ui/typography'

export function StatusPanel({ message }: { message: string }) {
  return (
    <Text
      as="div"
      size="sm"
      className="mx-auto max-w-md rounded-2xl border border-border bg-card p-5 text-muted-foreground shadow-sm"
    >
      {message}
    </Text>
  )
}
