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
    {
      name: 'Remote',
      description: 'Sent remote control commands',
      onSubmit: async () => {
        const {
          result: [, commands],
        } = await api.getRemoteControllerInfo()

        let push = true
        let defaultValue = ''
        while (true) {
          const command = await choose<(typeof commands)[number]>(
            {
              placeholder: 'Select command to send',
              defaultValue,
              choices: commands.map(command => {
                return {
                  name: command.name,
                  description: command.value,
                  value: command,
                }
              }),
            },
            push,
          )
          // As this is in a while loop only push to history stack once
          push = false
          // Preserve selection when showing choices again
          defaultValue = command.name

          try {
            await api.sendIrccCommand(command.value)
          } catch (error) {
            // Supress known error even if ircc command is sent
          }
        }
      },
    },
    {
      name: 'Set Volume',
      description: 'Set TV volume to a specified amount',
      onSubmit: async () => {
        const {
          result: [[info]],
        } = await api.getVolumeInformation()

        await choose({
          placeholder: `Set value from ${info.minVolume} to ${info.maxVolume}`,
          choices: async input => {
            if (input.trim() === '') {
              return []
            }

            const parsed = Number(input)
            if (!isNaN(parsed)) {
              const volume = _.clamp(parsed, info.minVolume, info.maxVolume)
              return [
                {
                  name: `Set volume to ${volume}`,
                  onSubmit: async () => {
                    await api.setAudioVolume({
                      target: info.target,
                      volume: volume.toString(),
                    })
                  },
                },
              ]
            } else {
              return [{ name: 'Invalid volume' }]
            }
          },
        })
      },
    },
    {
      name: 'Set Source',
      description: 'Set input source',
      onSubmit: async () => {
        const {
          result: [inputs],
        } = await api.getCurrentExternalInputsStatus()

        const uri = await choose({
          choices: inputs.map(input => {
            return {
              name: input.label === '' ? input.title : input.label,
              description: input.label === '' ? undefined : input.title,
              value: input.uri,
            }
          }),
        })

        await api.setPlayContent({ uri })
      },
    },
  ],
})
