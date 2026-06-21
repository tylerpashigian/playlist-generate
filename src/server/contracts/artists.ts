import { z } from 'zod'

export const artistDtoSchema = z.object({
  mbid: z.string().min(1),
  name: z.string().min(1),
  sortName: z.string().nullable(),
  disambiguation: z.string().nullable(),
  setlistfmUrl: z.url().nullable(),
})

export const artistSearchInputSchema = z.object({
  query: z.string().trim().min(2),
})

export type ArtistDto = z.infer<typeof artistDtoSchema>
export type ArtistSearchInput = z.infer<typeof artistSearchInputSchema>
