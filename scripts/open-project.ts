// Name: Open Project
// Description: Open personal project in editor

import '@johnlindquist/kit'
import { pathfix } from '../utils/helpers'

const base = await env('PROJECTS_PATH')
const dirs = await readdir(base)

const selected = await arg(
  'Select project to open',
  dirs.map(dir => {
    const value = path.join(base, dir)
    return {
      name: dir,
      description: value,
      value,
    }
  }),
)

pathfix()
await edit('', selected)
