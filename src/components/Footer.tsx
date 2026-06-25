export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="mt-20 border-t border-border px-4 pb-14 pt-10 text-muted-foreground">
      <div className="page-wrap flex flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
        <p className="m-0 text-sm">
          &copy; {year} Your name here. All rights reserved.
        </p>
        <p className="m-0 text-sm font-bold">Built with TanStack Start</p>
      </div>
    </footer>
  )
}
