// Name: Emotes
// Description: Search for emotes on 7tv and copy them to clipboard

// Note: Requires imagemagick and clipcopy to be installed on system

import '@johnlindquist/kit'
const { z }: typeof import('zod') = await npm('zod')
const { isAxiosError }: typeof import('axios') = await npm('axios')
const { execa }: typeof import('execa') = await npm('execa')
import * as crypto from 'node:crypto'

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
          host?.files
            .filter(file => file.format === 'WEBP')
            .sort((prev, next) => next.width - prev.width) ?? []
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
      if (isAxiosError(error)) {
        console.log(error.response?.data)
      } else {
        console.log(error)
      }
    }

    return []
  },
})

// TODO: Try to achive in memory instead of writing to disk
// TODO: Optimize output size

const extension = path.extname(url)
const hash = crypto.createHash('sha256').update(url).digest('hex')
const filename = `${hash}${extension}`

await download(url, tempdir(), {
  filename,
})

const filepath = path.join(tempdir(), filename)
const output = path.join(tempdir(), `${hash}.gif`)

await execa('magick', [filepath, output])
await execa('clipcopy', [output])
