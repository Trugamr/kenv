// Name: Change Case
// Description: Change text case to uppercase or lowercase

import '@johnlindquist/kit'

const transformed = await arg({
  placeholder: 'Enter text',
  choices: async input => {
    if (input.trim() === '') {
      return []
    }

    return [
      {
        name: input.toUpperCase(),
        description: 'Copy uppercase text to clipboard',
        value: input.toUpperCase(),
      },
      {
        name: input.toLowerCase(),
        description: 'Copy lowercase text to clipboard',
        value: input.toLowerCase(),
      },
    ]
  },
})

await clipboard.writeText(transformed)
