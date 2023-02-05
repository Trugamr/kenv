import path from 'path'

function uniq<T>(value: T[]) {
  return [...new Set(value)]
}

/**
 * Remove duplicate and kit's path entries
 * Kit's path entries override installed npm and node
 */
export function pathfix() {
  if(process.env.PATH) {
    process.env.PATH = uniq(process.env.PATH.split(path.delimiter))
    .filter(entry => !['.knode', '.kit', '.kenv'].some(k => entry.includes(k)))
    .join(path.delimiter)
  }
}
