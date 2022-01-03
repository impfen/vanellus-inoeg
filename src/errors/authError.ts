import { ErrorCode, VanellusError } from '.'

export class BackendError extends VanellusError {
  constructor() {
    super(ErrorCode.KeysMissing)
    this.name = "AuthError";
  }
}
