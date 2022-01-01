import { ErrorCode } from './'
import { getErrorDescriptionForCode } from './vanellusError'


export class UnexpectedError extends Error {
  public readonly code: ErrorCode

  constructor(code: ErrorCode) {
    super(getErrorDescriptionForCode(code))
    this.code = code
  }
}
