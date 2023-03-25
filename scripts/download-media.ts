// Name: Download Media
// Description: Download media and copy to clipboard

import '@johnlindquist/kit'
import * as fs from 'fs'
import { bytesToHumanReadable } from '../utils/helpers'
const { execa }: typeof import('execa') = await npm('execa')
const { z }: typeof import('zod') = await npm('zod')

const MAX_SIZE = 20 * 1024 * 1024 // 20MB

const input = await arg({ placeholder: 'Enter media url' })

const timestamp = Date.now().toString()

const base = (...args: string[]) => home('Downloads', 'Kit', 'Media', ...args)

// Dump info json
console.log('Dumping info json')
await execa('yt-dlp', [
  '--write-info-json',
  '--skip-download',
  input,
  '--output',
  base(timestamp),
])

// Read info json
const info = await fs.promises.readFile(base(`${timestamp}.info.json`), 'utf-8')
const json = JSON.parse(info)
const parsed = await z
  .object({
    id: z.string(),
    extractor: z.string(),
    filesize_approx: z.number().optional(),
  })
  .parseAsync(json)

// Confirm large files
if (parsed.filesize_approx && parsed.filesize_approx > MAX_SIZE) {
  const download = await arg<boolean>({
    placeholder: `File is ${bytesToHumanReadable(
      parsed.filesize_approx,
    )}. Continue?`,
    choices: [
      { name: 'Yes', value: true },
      { name: 'No', value: false },
    ],
  })

  if (!download) {
    process.exit(0)
  }
}

console.log('Getting destination')
const { stdout: destination } = await execa('yt-dlp', [
  '--get-filename',
  '--skip-download',
  input,
  '--output',
  base(`${parsed.extractor} - ${parsed.id} - ${timestamp}.%(ext)s`),
])

console.log('Starting download')
const { stdout } = execa('yt-dlp', [input, '-o', destination])
if (!stdout) {
  throw new Error('stdout is null')
}

// Log progress
stdout.on('data', (data: Buffer) => {
  const output = data.toString()
  const result = output.match(/(?<progress>\d+\.?\d*)%/)
  if (result?.groups?.progress) {
    console.log(`Download progress: ${result.groups.progress}%`)
  }
})

stdout.on('end', async () => {
  if (process.platform !== 'win32') {
    process.exit(0)
  }
  // Copy destination to clipboard
  await execa('clipcopy', [destination])
})
