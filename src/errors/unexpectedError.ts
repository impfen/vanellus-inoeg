import { Optional } from '../helpers/optional'
import { ErrorCode } from './'
import { getErrorDescriptionForCode } from './vanellusError'


export class UnexpectedError extends Error {
  public readonly code: ErrorCode
  public readonly baseError: Optional<unknown>

  constructor(code: ErrorCode, baseError: Optional<unknown> = null) {
    super(getErrorDescriptionForCode(code))
    this.code = code
    this.baseError = baseError
  }
}
