import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { Heading2, Text } from '@/components/ui/typography'

export function NotFoundPage() {
  return (
    <main className="page-wrap flex min-h-[60vh] items-center px-4 py-16">
      <Empty className="mx-auto max-w-2xl border border-border bg-card text-card-foreground shadow-sm">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Text as="span" size="sm" weight="semibold">
              404
            </Text>
          </EmptyMedia>
          <EmptyTitle>
            <Heading2 className="text-foreground">Page not found</Heading2>
          </EmptyTitle>
          <EmptyDescription>
            This page does not exist or may have moved. You can return home or
            open the playlist builder.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent className="flex-row justify-center gap-3">
          <Button asChild>
            <Link to="/app">Open app</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/">Go home</Link>
          </Button>
        </EmptyContent>
      </Empty>
    </main>
  )
}
