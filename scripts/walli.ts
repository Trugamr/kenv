// Name: Walli
// Description: Browse art posted on walli

import '@johnlindquist/kit'

const axios: typeof import('axios').default = await npm('axios')
const filenamify: typeof import('filenamify').default = await npm('filenamify')

type ArtistPost = {
  id: string
  title: string
  description: string
  thumb: string
  tags: string[]
  image_square_screen: string
  first_name: string
  last_name: string
  nickname: string
  artist_id: string
}

type PreviewArtistWorkResponse = ArtistPost[]

const WALLI_X_SIFTER_TOKEN = await env('WALLI_X_SIFTER_TOKEN')
const api = axios.create({
  baseURL: 'https://walli.quosmos.com/api',
  headers: {
    'Accept-Encoding': 'gzip,deflate,compress',
    'X-SIFTER-TOKEN': WALLI_X_SIFTER_TOKEN,
  },
})

function getDownloadUrl(post: ArtistPost) {
  return `https://walli.quosmos.com/files/thumbs/${post.image_square_screen}`
}

onTab('Gallery', async () => {
  const { data: posts } = await api.get<PreviewArtistWorkResponse>(
    '/v2/images/previewArtistWork',
    {
      params: {
        id: 12208778,
      },
    },
  )

  const post = await arg<ArtistPost>({
    placeholder: 'Search post',
    choices: posts.map(post => {
      const url = getDownloadUrl(post)
      return {
        name: post.title,
        description: post.description,
        img: post.thumb,
        preview: md(`![${post.title}](${url})`),
        value: post,
      }
    }),
  })

  const folder =
    [post.first_name, post.last_name].filter(Boolean).join(' ') ||
    post.nickname ||
    post.artist_id
  const url = getDownloadUrl(post)
  const ext = path.extname(url)

  const buffer = await download(
    url,
    home('Downloads', 'Kit', 'Walli', filenamify(folder)),
    {
      filename: filenamify(`${post.title} - ${post.id}${ext}`),
    },
  )

  await clipboard.writeImage(buffer)
})
