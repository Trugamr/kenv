import { PromptConfig, Shortcut } from '@johnlindquist/kit'

function uniq<T>(value: T[]) {
  return [...new Set(value)]
}

/**
 * Remove duplicate and kit's path entries
 * Kit's path entries override installed npm and node
 */
export function pathfix() {
  if (process.env.PATH) {
    process.env.PATH = uniq(process.env.PATH.split(path.delimiter))
      .filter(
        entry => !['.knode', '.kit', '.kenv'].some(k => entry.includes(k)),
      )
      .join(path.delimiter)
  }
}

/**
 * Create function to show choices which can be called multiple times and all the choices are stored
 * Previous choices are shown if avaiable on "back" else script is exited
 */
export function createArgWithHistory() {
  const history: PromptConfig[] = []
  function choose<T = string>(config: PromptConfig, push: boolean = true) {
    if (push) {
      history.push(config)
    }

    const shortcuts: Shortcut[] = [
      {
        name: 'Back',
        key: 'escape',
        bar: 'left',
        onPress: async () => {
          if (history.length > 1) {
            history.pop()
            await choose(history.at(-1), false)
          } else {
            exit(0)
          }
        },
      },
    ]

    if (config.shortcuts) {
      shortcuts.push(...config.shortcuts)
    }

    return arg<T>({ ...config, shortcuts })
  }

  return choose
}
