import { pathfix } from './helpers'

export default async function script(location: string, placeholder: string) {
  const dirs = await readdir(location)

  const selected = await arg(
    placeholder,
    dirs.map(dir => {
      const value = path.join(location, dir)
      return {
        name: dir,
        description: value,
        value,
      }
    }),
  )

  pathfix()
  await edit('', selected)
}
