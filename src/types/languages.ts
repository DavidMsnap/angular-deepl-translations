export enum Language {
    German = 'de',
    English = 'en',
    Spanish = 'es',
    French = 'fr',
    Italian = 'it',
}

/**
 * Emoji codes for national flag of each language
 */
export const languageFlags = {
    'de': String.fromCodePoint(0x1F1E9, 0x1F1EA),
    'en': String.fromCodePoint(0x1F1EC, 0x1F1E7),
    'es': String.fromCodePoint(0x1F1EA, 0x1F1F8),
    'fr': String.fromCodePoint(0x1F1EB, 0x1F1F7),
    'it': String.fromCodePoint(0x1F1EE, 0x1F1F9),
}