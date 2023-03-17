// Name: Open Work Project
// Description: Open work project in editor

import '@johnlindquist/kit'
import script from '../utils/open-project'

const base = await env('WORK_PROJECTS_PATH')

await script(base, 'Select work project to open')
