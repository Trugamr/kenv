// Name: Open Work Project
// Description: Open work project in editor

import '@johnlindquist/kit'
import { pathfix } from '../utils/helpers'

const base = await env('WORK_PROJECTS_PATH')
const dirs = await readdir(base)

const selected = await arg(
  'Select work project to open',
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
