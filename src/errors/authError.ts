import { ErrorCode, VanellusError } from '.'

export class AuthError extends VanellusError {
  constructor() {
    super(ErrorCode.KeysMissing)
    this.name = "AuthError";
  }
}
