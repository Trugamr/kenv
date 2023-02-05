// Name: TV
// Description: Control TV

import '@johnlindquist/kit'
import { createArgWithHistory } from '../utils/helpers'

const { SonyTvApi }: typeof import('sony-tv-api') = await npm('sony-tv-api')

const host = await env('TV_HOST')
const psk = await env('TV_PRE_SHARED_KEY')

const api = new SonyTvApi({ host, psk })

const choose = createArgWithHistory()

await choose({
  placeholder: 'Choose command',
  choices: [
    {
      name: 'Power On',
      description: 'Turn on TV screen',
      onSubmit: async () => {
        await api.setPowerStatus(true)
      },
    },
    {
      name: 'Power Off',
      description: 'Put TV in standby mode',
      onSubmit: async () => {
        await api.setPowerStatus(false)
      },
    },
    {
      name: 'Launch Application',
      description: 'Open an installed app',
      onSubmit: async () => {
        const {
          result: [apps],
        } = await api.getApplicationList()

        const uri = await choose({
          placeholder: 'Choose application to launch',
          choices: apps.map(app => {
            return {
              name: app.title,
              img: app.icon,
              description: app.uri,
              value: app.uri,
            }
          }),
        })

        await api.setActiveApp({ uri })
      },
    },
  ],
})
