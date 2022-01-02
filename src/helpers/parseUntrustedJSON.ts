import { Optional } from './optional'


export function parseUntrustedJSON(untrusted: string): Optional<any> {
  try {
    return JSON.parse(untrusted)
  } catch(e) {
    console.error(e)
    return null
  }
}

