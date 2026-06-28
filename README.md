# Playlist Builder

A TanStack Start app for generating playlists from recent Setlist.fm data,
scoring songs by confidence, and exporting saved playlists to linked streaming
providers. Spotify is the first supported provider.

## Routes

- `/` - public landing page
- `/auth` - app account sign-in and sign-up
- `/app` - core artist search, playlist generation, save, match, and export flow
- `/profile` - account summary, streaming connections, and saved playlists
- `/playlists/$playlistId` - saved playlist detail and Spotify export actions

API routes remain under `/api/trpc/$` and `/api/auth/$`.

## Development

```bash
pnpm install
pnpm dev
```

## Validation

```bash
pnpm test
pnpm run build
pnpm run lint
pnpm run check
```

## Database

Prisma commands are run through `.env.local`:

```bash
pnpm db:generate
pnpm db:migrate
pnpm db:studio
```

Migration files should be generated only through Prisma commands.

## Storybook

Storybook is retained for future component work:

```bash
pnpm storybook
```
