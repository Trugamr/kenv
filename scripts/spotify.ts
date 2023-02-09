// Name: Spotify
// Description: Search music on spotify

import '@johnlindquist/kit'

type SpotifyCredentials = {
  access_token: string
  expires_in: number
  refresh_token: string
  token_type: 'bearer'
}

const SPOTIFY_CLIENT_ID = await env('SPOTIFY_CLIENT_ID')
const SPOTIFY_CLIENT_SECRET = await env('SPOTIFY_CLIENT_SECRET')

const SPOTIFY_AUTHORIZATION = Buffer.from(
  `${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`,
).toString('base64')

const axios: typeof import('axios').default = await npm('axios')

const database = await db<{ credentials?: SpotifyCredentials }>(
  'spotify.private',
  { credentials: undefined },
)

if (!database.credentials) {
  const { chromium }: typeof import('playwright') = await npm('playwright')
  const SPOTIFY_REDIRECT_URI = 'http://localhost'

  const browser = await chromium.launch({
    headless: false,
  })

  const authUrl = new URL('https://accounts.spotify.com/authorize')
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('client_id', SPOTIFY_CLIENT_ID)
  authUrl.searchParams.set('redirect_uri', SPOTIFY_REDIRECT_URI)
  authUrl.searchParams.set('scope', 'user-modify-playback-state')

  const page = await browser.newPage()
  await page.goto(authUrl.toString())

  const request = await page.waitForRequest(/^https?:\/\/localhost(\/\S*)?$/, {
    timeout: 0,
  })
  const url = new URL(request.url())
  const code = url.searchParams.get('code')

  const response = await post<SpotifyCredentials>(
    'https://accounts.spotify.com/api/token',
    undefined,
    {
      params: {
        code,
        grant_type: 'authorization_code',
        redirect_uri: SPOTIFY_REDIRECT_URI,
      },
      headers: {
        Authorization: `Basic ${SPOTIFY_AUTHORIZATION}`,
      },
    },
  )

  database.credentials = response.data
  await database.write()

  await browser.close()
}

const api = axios.create({
  baseURL: 'https://api.spotify.com',
})

api.interceptors.request.use(config => {
  if (!config.headers) {
    config.headers = {}
  }
  config.headers[
    'Authorization'
  ] = `Bearer ${database.credentials.access_token}`
  return config
})

api.interceptors.response.use(undefined, async error => {
  if (axios.isAxiosError(error) && error.response.status === 401) {
    const body = new URLSearchParams({
      refresh_token: database.credentials.refresh_token,
      grant_type: 'refresh_token',
    })
    const { data: credentials } = await post<SpotifyCredentials>(
      'https://accounts.spotify.com/api/token',
      body,
      {
        headers: {
          Authorization: `Basic ${SPOTIFY_AUTHORIZATION}`,
        },
      },
    )

    database.credentials = { ...database.credentials, ...credentials }
    await database.write()

    error.response.config.headers[
      'Authorization'
    ] = `Bearer ${database.credentials.access_token}`

    return Promise.resolve(axios(error.response.config))
  }

  return Promise.reject(error)
})

type SearchResponse = {
  tracks: { items: Array<{ name: string; uri: string }> }
}

const uri = await arg({
  placeholder: 'Search music',
  choices: async input => {
    if (input.trim() === '') {
      return []
    }

    const { data } = await api.get<SearchResponse>('/v1/search', {
      params: {
        q: input,
        type: 'track',
      },
    })

    return data.tracks.items.map(item => {
      return {
        name: item.name,
        value: item.uri,
      }
    })
  },
})

await api.put('/v1/me/player/play', {
  uris: [uri],
})
