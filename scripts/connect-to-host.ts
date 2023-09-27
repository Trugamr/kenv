// Name: Connect to Host
// Description: Remote SSH using Visual Studio Code

import type { Choices } from '@johnlindquist/kit'

const database = await db<{
  hosts: Record<string, { path?: string; connectedAt?: string } | undefined>
}>('connect-to-host.private', { hosts: {} })

const choices: Choices<{ uri: string; path: string }> = Object.entries(
  database.hosts,
).map(([uri, details]) => {
  return {
    name: uri,
    description: details?.path,
    value: {
      uri,
      path: details?.path,
    },
  }
})

const { uri, path } = await arg<{ uri: string; path: string }>({
  placeholder: 'Enter user@host',
  description: 'Connect to a remote host using Visual Studio Code',
  hint: 'user@host /path/to/remote/folder',
  choices: input => {
    const [uri, path] = input.split(/\s+/)

    if (path) {
      return [
        { name: `Open ${path} on ${uri}`, value: { uri, path } },
        ...choices,
      ]
    } else if (uri) {
      return [{ name: `Open ${uri}`, value: { uri, path } }, ...choices]
    }

    return choices
  },
})

const now = new Date()
// Check if host already exists
if (uri in database.hosts) {
  // Update path and connection time
  database.hosts[uri] = { path, connectedAt: now.toISOString() }
} else {
  database.hosts[uri] = { path, connectedAt: now.toISOString() }
}

const args = ['--remote', `ssh-remote+${uri}`]
if (path) {
  args.push(path)
}

await execa('code', args)

// Persist host to database
await database.write()
