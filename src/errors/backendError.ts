import { ErrorCode, VanellusError } from '.'


export class BackendError extends VanellusError {
  public readonly data: {
    error: string,
    data?: string
  }

  constructor(data: {error: string, data?: string}) {
    super(ErrorCode.BackendError)
    this.name = "BackendError";
    this.data = data
  }
}
