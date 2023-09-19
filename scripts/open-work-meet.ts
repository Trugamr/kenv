// Name: Open Work Meet
// Description: Open new google meet in browser

import '@johnlindquist/kit'

const id = await env('GOOGLE_MEET_AUTH_USER_ID')
const url = `https://meet.google.com/new?authuser=${id}`

console.log('Opening in browser...')
open(url)
