// Name: Download Media
// Description: Download media and copy to clipboard

import '@johnlindquist/kit'
import { group } from 'console'
const { execa }: typeof import('execa') = await npm('execa')

const input = await arg({ placeholder: 'Enter media url' })

// TODO: Confirm before downloading large files

const { stdout } = await execa('yt-dlp', [
  input,
  '-o',
  home('Downloads', 'Kit', 'Media', `${Date.now()}.%(ext)s`),
])

if (process.platform !== 'win32') {
  process.exit(0)
}

let matched = stdout.match(/Destination:(\s+)?(?<destination>.*)\n/)
if (!matched) {
  matched = stdout.match(
    /\[download\](\s+)?(?<destination>.*) has already been downloaded\n/,
  )
}

if (matched && matched.groups.destination) {
  await execa('clipcopy', [matched.groups.destination])
}
