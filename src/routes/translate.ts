
import type { EndpointOutput, Request } from '@sveltejs/kit';
import dotenv from 'dotenv'
import translate from 'deepl';
import promiseAllProperties from 'promise-all-properties';

import type { TranslateRequestBody } from 'src/types/requestBody';

dotenv.config()

const deeplApiKey = process.env.DEEPL_API_KEY;

// TODO maybe smarter and safer?
async function translateEveryValueInObj(sourceLang: string, destLang: string, obj: Record<string, any>): Promise<Record<string, any>> {
    const keys = Object.keys(obj);
    const translatedObj = {};

    for (const key of keys) {
        if (typeof obj[key] === 'string') {
            // translate
            const translateResult = await translate({
                auth_key: deeplApiKey,
                free_api: true,
                text: obj[key],
                target_lang: destLang.toUpperCase() as any,
                source_lang: sourceLang.toUpperCase() as any
            });
            // console.log("Got: ", translateResult.data);
            translatedObj[key] = translateResult.data.translations[0].text;
        } else if (typeof obj[key] === 'object') {
            // recurse translate
            translatedObj[key] = await translateEveryValueInObj(sourceLang, destLang, obj[key]);
        }
    }

    return translatedObj;
}

export async function post(request: Request): Promise<EndpointOutput> {
    // TODO better typing?
    const body: TranslateRequestBody = request.body as unknown as TranslateRequestBody;
    // console.log("Translate request body:", body);

    const sourceLang = body.inputLang;
    const text = body.inputText;

    const result = {};
    for (const lang of body.outputLangs) {
        result[lang] = translateEveryValueInObj(sourceLang, lang, text);
    }

    const translated = await promiseAllProperties(result);
    // console.log("Got:", translated);
    return {
        body: JSON.stringify(translated)
    };
}