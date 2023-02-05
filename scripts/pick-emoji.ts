// Name: Pick Emoji
// Description: Search and insert an emoji

import '@johnlindquist/kit'

type Emoji = {
  emoji: string
  description: string
  category: string
  aliases: string[]
  tags: string[]
}

const { emojis, write } = await db<{ emojis: Emoji[] }>('pick-emoji.private', {
  emojis: [],
})

// Fetch emojis data and save it locally
if (!emojis.length) {
  const { data } = await get<Emoji[]>(
    'https://raw.githubusercontent.com/github/gemoji/master/db/emoji.json',
  )
  emojis.push(...data)
  await write()
}

const chosen = await arg({
  choices: emojis.map(({ emoji, description, category, tags }) => {
    return {
      name: [emoji, description].join(' '),
      description: [category, tags.join(', ')].filter(Boolean).join(' · '),
      value: emoji,
    }
  }),
})

await setSelectedText(chosen)
