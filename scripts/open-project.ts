// Name: Open Project
// Description: Open personal project in editor

import '@johnlindquist/kit'
import script from '../utils/open-project'

// TODO: Show nested projects

const base = await env('PROJECTS_PATH')

// Run script
await script(base, 'Select project to open')
