import { Optional } from "../helpers/optional"
import { ErrorCode } from "./"
import { getErrorMessageForCode } from "./vanellusError"

export class UnexpectedError extends Error {
    public readonly code: ErrorCode
    public readonly baseError: Optional<unknown>

    constructor(code: ErrorCode, baseError: Optional<unknown> = null) {
        super(getErrorMessageForCode(code))
        this.name = "UnexpectedError"
        this.code = code
        this.baseError = baseError
    }
}
