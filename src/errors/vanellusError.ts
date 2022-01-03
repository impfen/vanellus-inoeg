import { ErrorCode } from '.';



export function getErrorMessageForCode(code: ErrorCode): string {
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

export class VanellusError extends Error {
  public readonly code: ErrorCode;

  constructor(code: ErrorCode, message?: string) {
    super(message ? message : getErrorMessageForCode(code));
    this.name = "VanellusError";
    this.code = code;
  }
}




