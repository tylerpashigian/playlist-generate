import { Link } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { AccountDrawer } from '@/components/product/account-drawer'
import { Text } from '@/components/ui/typography'
import { useHasScrolled } from '@/hooks/use-has-scrolled'
import { cn } from '@/lib/utils'

const navItems = [
  { label: 'Home', to: '/' },
  { label: 'App', to: '/app' },
  { label: 'Profile', to: '/profile' },
] as const

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      to="/"
      className="inline-flex items-center gap-2 text-foreground no-underline"
    >
      <span className="grid size-8 place-items-center rounded-lg bg-foreground text-background">
        <Text as="span" size="xs" weight="semibold">
          E
        </Text>
      </span>
      {!compact ? (
        <Text as="span" size="sm" weight="semibold">
          Encore
        </Text>
      ) : null}
    </Link>
  )
}

export function ProductNavbar() {
  const hasScrolled = useHasScrolled()

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 h-(--app-navbar-height) bg-transparent transition-[padding] duration-200',
        hasScrolled && 'p-2 sm:px-4',
      )}
    >
      <div
        className={cn(
          'mx-auto flex h-full items-center justify-between gap-4 transition-[background-color,border-color,box-shadow,backdrop-filter,border-radius] duration-200',
          hasScrolled
            ? 'rounded-lg border border-border/70 bg-background/80 px-4 shadow-xs backdrop-blur-md supports-backdrop-filter:bg-background/70 sm:px-8'
            : 'w-full border border-transparent px-4 sm:px-8',
        )}
      >
        <BrandMark />

        <nav className="hidden items-center gap-8 md:flex">
          {navItems.map((item) => (
            <Text key={item.to} as="span" size="sm" weight="medium">
              <Link
                to={item.to}
                className="text-muted-foreground no-underline transition hover:text-foreground"
                activeProps={{ className: 'text-foreground' }}
              >
                {item.label}
              </Link>
            </Text>
          ))}
        </nav>

        <AccountDrawer />
      </div>
    </header>
  )
}

export function WithNavbar({ children }: { children: ReactNode }) {
  return (
    <>
      <ProductNavbar />
      {children}
    </>
  )
}

export function NavbarOffset({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className="pt-(--app-navbar-height)">
      <div className={cn(className)}>{children}</div>
    </div>
  )
}
