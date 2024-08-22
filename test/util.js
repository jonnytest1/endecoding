

/**
 * 
 * @param {Encoding} encoding 
 * @param {string} str 
 * @param {Record<string,string>} [options] 
 */
export function runWithParam(encoding, str, options = {}) {

    const mockElement = {};
    const mockOutput = {
        currentParameter: {
            options: options
        }
    };

    return encoding.fnc(str, mockElement, mockOutput);
}