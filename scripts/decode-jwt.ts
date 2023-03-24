// Name: Decode JWT
// Description: Decode json web token

import '@johnlindquist/kit'

const token = await arg({ placeholder: 'Enter JWT' })

const [header, payload] = token.split('.')

const result = {
  header: JSON.parse(Buffer.from(header, 'base64').toString()),
  payload: JSON.parse(Buffer.from(payload, 'base64').toString()),
}

await editor(JSON.stringify(result, null, 2))
await dev(result)
