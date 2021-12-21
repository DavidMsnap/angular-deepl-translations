/**
 * JSON format for the request body of the translate endpoint.
 */
export interface TranslateRequestBody {
    inputText: Record<string, unknown>,
    inputLang: string,
    outputLangs: Array<string>
}