// Name: OCR
// Description: Image to text

import '@johnlindquist/kit'

const Tesseract: typeof import('tesseract.js') = await npm('tesseract.js')

// Try to get read image from clipboard
let image: Buffer | string = await clipboard.readImage()

// If clipload doesn't have an image ask for image to be selected
if (!image.length) {
  image = await selectFile('Select image')
}

const {
  data: { text },
} = await Tesseract.recognize(image, 'eng', {
  logger: console.log,
  cachePath: tempdir(),
})

if (text.trim() === '') {
  say('Failed to find any text in image')
} else {
  await clipboard.writeText(text)
}
