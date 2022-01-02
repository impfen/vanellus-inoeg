import { ErrorCode } from '.';



export function getErrorDescriptionForCode(code: ErrorCode): string {
  switch(code) {
    case ErrorCode.KeysMissing:
      return "Keys are missing"
    case ErrorCode.BackendError:
      return "Backend Error"
    case ErrorCode.DataMissing:
      return "Data missing"
    case ErrorCode.Crypto:
      return "Cryptographic method failed"
  }
  return "";
}

export class VanellusError {
  public readonly code: ErrorCode;
  public readonly description: string;

  constructor(code: ErrorCode, description?: string) {
    this.code = code;

    if (!description) {
      description = getErrorDescriptionForCode(code)
    }
    this.description = description;
  }
}




