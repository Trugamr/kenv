// Name: Twitch
// Description: Browse followed twitch streams

import '@johnlindquist/kit'
import { FastifyRequest } from 'fastify'

type TwitchCredentials = {
  access_token: string
  expires_in: number
  refresh_token: string
  token_type: 'bearer'
  scope: string[] | null
}

const axios: typeof import('axios').default = await npm('axios')
const fastify: typeof import('fastify') = await npm('fastify')

const database = await db<{ credentials?: TwitchCredentials }>(
  'twitch.private',
  { credentials: undefined },
)

const TWITCH_CLIENT_ID = await env('TWITCH_CLIENT_ID')
const TWITCH_CLIENT_SECRET = await env('TWITCH_CLIENT_SECRET')

if (!database.credentials) {
  const app = fastify()

  app.get(
    '/auth/callback',
    async (
      request: FastifyRequest<{ Querystring: { code?: string } }>,
      reply,
    ) => {
      if (!request.query.code) {
        return await reply.send('Missing code')
      }

      // Fetch credentials using code
      try {
        const { data } = await post<TwitchCredentials>(
          'https://id.twitch.tv/oauth2/token',
          undefined,
          {
            params: {
              code: request.query.code,
              client_id: TWITCH_CLIENT_ID,
              client_secret: TWITCH_CLIENT_SECRET,
              grant_type: 'authorization_code',
              redirect_uri: TWITCH_REDIRECT_URI,
            },
          },
        )

        // Perist credentials
        database.credentials = data
        await database.write()

        await reply.send('Success')
      } catch (error) {
        await reply.send('Failed to get credentials using code')
      }

      // Close the server
      await app.close()
    },
  )

  // Start web server to get oauth code
  await app.listen({ port: 1337 })

  // Create and open oauth url
  const TWITCH_REDIRECT_URI = 'http://localhost:1337/auth/callback'

  const url = new URL('https://id.twitch.tv/oauth2/authorize')
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('client_id', TWITCH_CLIENT_ID)
  url.searchParams.set('redirect_uri', TWITCH_REDIRECT_URI)
  url.searchParams.set('scope', 'user:read:follows')

  await browse(url.toString())
}

const api = axios.create({
  baseURL: 'https://api.twitch.tv/helix',
  headers: {
    'Client-Id': TWITCH_CLIENT_ID,
  },
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
    const { data: credentials } = await post<TwitchCredentials>(
      'https://id.twitch.tv/oauth2/token',
      undefined,
      {
        params: {
          client_id: TWITCH_CLIENT_ID,
          client_secret: TWITCH_CLIENT_SECRET,
          refresh_token: database.credentials.refresh_token,
          grant_type: 'refresh_token',
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

const {
  data: {
    data: [me],
  },
} = await api.get<{ data: Array<{ id: string }> }>('/users')

const {
  data: { data: streams },
} = await api.get<{
  data: Array<{
    id: string
    user_login: string
    user_name: string
    title: string
    viewer_count: number
    started_at: string
    thumbnail_url: string
  }>
}>('/streams/followed', {
  params: {
    user_id: me.id,
  },
})

const stream = await arg<(typeof streams)[number]>({
  placeholder: 'Search followed stream',
  choices: streams.map(s => {
    const img = s.thumbnail_url
      .replace('{width}', '160')
      .replace('{height}', '90')

    return {
      name: `${s.user_name} • ${s.title}`,
      description: `${s.viewer_count.toLocaleString()} watching, started ${formatDateToNow(
        new Date(s.started_at),
        { addSuffix: true },
      )}`,
      img,
      value: s,
    }
  }),
})

await browse(`https://twitch.tv/${stream.user_login}`)
