// Name: Emotes
// Description: Search for emotes on 7tv and copy them to clipboard

import '@johnlindquist/kit'
import axios from 'axios'
import { setTimeout as sleep } from 'node:timers/promises'
const { z }: typeof import('zod') = await npm('zod')

const query = (search: string) => `query {
  emotes(query: "${search}", limit: 24) {
      items {
          id
          name
          versions {
              host {
                  url
                  files {
                      format
                      frame_count
                      height
                      width
                      size
                      name
                  }
              }
          }
      }
  }
}`

const schema = z.object({
  data: z.object({
    emotes: z.object({
      items: z.array(
        z.object({
          id: z.string(),
          name: z.string(),
          versions: z.array(
            z.object({
              host: z.object({
                url: z.string(),
                files: z.array(
                  z.object({
                    format: z.string(),
                    frame_count: z.number(),
                    height: z.number(),
                    width: z.number(),
                    size: z.number(),
                    name: z.string(),
                  }),
                ),
              }),
            }),
          ),
        }),
      ),
    }),
  }),
})

const url = await arg({
  placeholder: 'Select an emote',
  choices: async input => {
    if (!input.trim()) {
      return []
    }

    try {
      const body = { query: query(input), variables: {} }
      const { data } = await post('https://7tv.io/v3/gql', body)
      const parsed = await schema.parseAsync(data)
      const emotes: Array<{ name: string; url: string }> = []

      for (const emote of parsed.data.emotes.items) {
        const host = emote.versions[0]?.host
        const [file] =
          host?.files.sort((prev, next) => next.width - prev.width) ?? []
        if (!file) {
          continue
        }
        emotes.push({
          name: emote.name,
          url: `https:${host.url}/${file.name}`,
        })
      }

      return emotes.map(emote => {
        return { img: emote.url, name: emote.name, value: emote.url }
      })
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.log(error.response?.data)
      } else {
        console.log(error)
      }
    }

    return []
  },
})

// TODO: Convert to GIF
// TODO: Write converted image to clipboard

await clipboard.writeText(url)
