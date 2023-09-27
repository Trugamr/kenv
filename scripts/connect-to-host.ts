// Name: Connect to Host
// Description: Remote SSH using Visual Studio Code

import '@johnlindquist/kit'

const input = await arg({
  placeholder: 'Enter user@host',
  description: 'For example trugamr@milkyway:3523 /home/trugamr/apps',
})

const [host, path] = input.split(/\s+/)

const args = ['--remote', `ssh-remote+${host}`]
if (path) {
  args.push(path)
}

await execa('code', args)
