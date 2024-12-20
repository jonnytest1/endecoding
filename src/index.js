
/// <reference path="./textOutput.js" />
/// <reference path="./parameter.js" />
/// <reference path="./tesseract.d.ts" />
/// <reference path="./qrscanner.d.ts" />
/// <reference path="./polyfill.d.ts" />
/// <reference path="./zxing.d.ts" />

import { encodings } from './codings';
import { Parameter } from './parameter';
import { TextOutput } from './textOutput';

/**
 * @type {Context}
 */
let context = {};


/**
 *
 * @param {string} text
 * @param {number} amount
 */
async function recreate(text, amount, initial = false) {

    if(!amount) {
        return;
    }

    if(!text) {
        text = '';
    }

    [...document.querySelectorAll('tr')]
        // @ts-ignore
        .flatMap(tr => [...tr.querySelectorAll('td')])
        .filter(td => td.className !== 'default')
        .forEach(node => node.remove());

    let previousText = text;

    /**@type {Array<TextOutput>} */
    let outputs = [];
    for(let i = 0; i < amount; i++) {
        const encodingRef = queryPicked[i]?.valueOf() ?? 0;
        /**
         * @type {Encoding}
         */
        let pickedConverter;
        if(isNaN(+encodingRef)) {
            const matchedConverter = encodings.find(encoding => encoding.key === encodingRef);
            if(matchedConverter) {
                pickedConverter = matchedConverter;
            } else {
                pickedConverter = encodings[+encodingRef];
            }
        } else {
            pickedConverter = encodings[+encodingRef];
        }


        let output = new TextOutput(pickedConverter, i, queryPicked, initial, context);

        if(outputs.length > 0) {
            previousText = outputs[outputs.length - 1].convertedText;
            outputs[outputs.length - 1].next = output;
        } else {
            previousText = text;
        }
        output.setPrevious(previousText, outputs[outputs.length - 1]);
        await output.addElements(updateUrl);

        outputs.push(output);

    }
    // outputs[0].recalculate();
}
function updateUrl() {
    let amountValue = amountInput.value;
    const textValue = textInput.value;
    const matcherValue = matcherInput.value;

    let url = new URL(location.origin + location.pathname);

    if(amountValue) {
        url.searchParams.append('amount', amountValue);
    }
    if(textValue) {
        url.searchParams.append('text', textValue);
    }
    if(matcherValue) {
        url.searchParams.append('matcher', matcherValue);

    }
    for(let t in queryPicked) {
        if(!amountValue || +t < +amountValue) {
            url.searchParams.append(`${[t]}`, `${queryPicked[t]}`);

            for(const option in queryPicked[t].options) {
                url.searchParams.append(`${[t]}_${option}`, `${queryPicked[t].options[option]}`);
            }
        }
    }
    if(url.href.length < 4000) {
        window.history.pushState(undefined, '', url.href);
        sessionStorage.setItem("str", url.href);
    } else {
        sessionStorage.setItem("str", url.href);
    }
}




const urlString = sessionStorage.getItem("str") ?? location.href;
let currentUrl = new URL(urlString);

/**@type {Array<Parameter>} */
let queryPicked = [];
for(let i = 0; i < 50; i++) {
    const key = `${i}`;
    if(currentUrl.searchParams.has(key)) {
        const iVal = currentUrl.searchParams.get(key);

        queryPicked[i] = new Parameter(i, iVal ?? undefined);

        [...currentUrl.searchParams.keys()].forEach(optionKey => {
            if(optionKey.startsWith(`${i}_`)) {
                const optionsKeyWithoutParam = optionKey.replace(`${i}_`, "");
                const paramOption = currentUrl.searchParams.get(optionKey);
                if(paramOption) {
                    queryPicked[i].options[optionsKeyWithoutParam] = paramOption;
                }
            }
        });

    }
}
/**@type {HTMLTextAreaElement} */
// @ts-ignore
let textInput = document.querySelector('#textInput');
textInput.addEventListener('dragover', event => {
    event.preventDefault();
});
/**@type {HTMLInputElement} */
// @ts-ignore
const amountInput = document.querySelector('#amount');
/**@type {HTMLInputElement} */
// @ts-ignore
const matcherInput = document.querySelector('#matcher');
/**@type {HTMLImageElement} */
// @ts-ignore
let loadingImage = document.querySelector('#loadingImage');

//finc encoding with criteria
//just brute forces all the combinations
/*matcherInput.onkeypress = (e) => {
    if(e.charCode === 13) {
        let evaluater = eval(e.target.value);
        matcherValue = encodeURIComponent(evaluater);
        updateUrl();
        let startText = textValue;

        let possibleCombinations = [];

        e.target.backgroundColor = 'orange';
        function iterateEncodings(text, index, combinations) {
            let found = false;

            if(index == 0) {
                if(evaluater(text)) {
                    found = true;
                    //alert(combinations+"\n"+text);
                    if(!possibleCombinations.includes(text)) {
                        possibleCombinations.push(text);
                        console.log(combinations + '\n' + text);
                    }
                }
            } else {
                for(let l = 0; l < encodings.length; l++) {
                    try {
                        if(iterateEncodings(encodings[l].fnc(text), index - 1, combinations + ' ' + l)) {
                            found = true;
                        }
                    } catch(e) {
                    }
                }
            }
            return found;
        }

        let found = false;
        for(let i = 0; i < amountValue; i++) {
            console.log('iterating ' + i + '/' + amountValue);
            if(iterateEncodings(startText, i, '')) {
                found = true;
            }
        }
        if(found) {
            alert(possibleCombinations.length + ' combinations found details in console');
        }
        e.target.backgroundColor = 'white';
    }

};*/

const qrEngine = QrScanner.createQrEngine();


let workerLog = false;
const tesseractWorker = Tesseract.createWorker(['eng', 'chi_tra'], 1, {
    logger: function(e) {
        if(workerLog) {
            if(e.progress) {
                textInput.placeholder = ` -- analyzing image -- ${Math.round(e.progress * 100)}/100`;
            } else {
                textInput.placeholder = `${e.status}`;
            }
        }
    }
});
/**
 * 
 * @param {HTMLImageElement|HTMLCanvasElement} file 
 */
async function analyzeFile(file) {
    /**
     * @type {string}
     */
    let analyzable = "";
    const reader = new ZXingBrowser.BrowserMultiFormatReader();


    /*  const hints = new Map();
      hints.set(ZXing.DecodeHintType.POSSIBLE_FORMATS, [
          ZXing.BarcodeFormat.CODABAR,
          ZXing.BarcodeFormat.CODE_39,
  
          ZXing.BarcodeFormat.CODE_93, ZXing.BarcodeFormat.CODE_128,
  
          ZXing.BarcodeFormat.EAN_8, ZXing.BarcodeFormat.EAN_13, ZXing.BarcodeFormat.ITF, ZXing.BarcodeFormat.MAXICODE,
  
          ZXing.BarcodeFormat.RSS_14, ZXing.BarcodeFormat.RSS_EXPANDED, ZXing.BarcodeFormat.UPC_A
  
          , ZXing.BarcodeFormat.UPC_E, ZXing.BarcodeFormat.UPC_EAN_EXTENSION]);*/
    /**
     * @type {Promise<string|null>}
     */
    let barCodePr = Promise.resolve(null);
    if(file instanceof HTMLCanvasElement) {
        analyzable = await new Promise((res, err) => {
            file.toBlob(blob => {
                if(blob) {
                    res(URL.createObjectURL(blob));
                } else {
                    err("no blob");
                }
            });
        });
        barCodePr = reader.decodeFromImageUrl(analyzable);

    } else if(file instanceof HTMLImageElement) {
        if(!file.complete) {
            throw new Error("image not loaded");
        }
        analyzable = file.src;
        //hints.set(3, true);
        // reader.hints = hints;
        barCodePr = reader.decodeFromImageElement(file).then(res => {
            return res.text;
        });
    }

    workerLog = true;
    /**
     * @type {[Result,string,string|null]}
     */
    const [result, qrcode, barcode] = await Promise.all([
        new Promise(async (res, err) => {
            const worker = await tesseractWorker;
            worker.recognize(analyzable).then(result => {
                res(result);
            }).catch(e => {
                console.error(e);
                res(null);
            });
        }),
        new Promise(async res => {
            QrScanner.scanImage(file, { qrEngine: await qrEngine }).then(async result => {

                res(result.data);
            }).catch(e => {
                res(null);
            });
        }),
        barCodePr.catch(e => {
            return null;
        })
    ]);
    workerLog = false;



    if(qrcode) {
        return qrcode;
    } else if(barcode) {
        return barcode;
    } else if(result?.data) {
        let words = result.data.words
            .filter(w => w.confidence > 70);
        if(!words.length) {
            words = result.data.words
                .filter(w => w.confidence >= 50);
        }
        if(!words.length) {
            words = result.data.words
                .filter(w => w.confidence >= 20);
        }
        if(!words.length) {
            words = result.data.words;
        }

        return words
            .map(w => w.text)
            .join(" ");
    }
}



(function setInitVariables() {
    let amountValue = +(currentUrl.searchParams.get('amount') ?? 1);
    let textValue = currentUrl.searchParams.get('text') ?? "";
    let matcherValue = currentUrl.searchParams.get('matcher') ?? "";

    /**
     * @type {HTMLImageElement}
     */
    let txtImage;

    amountInput.value = '' + amountValue || '1';

    if(textInput.value) {
        textValue = textInput.value;
    } else if(textValue) {
        textInput.value = textValue;
    }

    amountInput.oninput = async (e) => {
        amountValue = +amountInput.value;
        await recreate(textValue, amountValue);
        updateUrl();
    };
    /**
     * @type {NodeJS.Timeout|undefined}
     */
    let inputTimeout;

    /**
     * @type {NodeJS.Timeout|undefined}
     */
    let checkInterval = undefined;

    /**
     * 
     * @param {File} imageFile 
     */
    function analyzeContextDAta(imageFile) {
        const stringREpr = imageFile.arrayBuffer()
            .then(async buffer => {
                const dataArray = [...new Uint8Array(buffer)];
                //textInput.value = textValue = dataArray.join(' ');
                return dataArray.map(str => String.fromCharCode(str)).join("");

            });
        textInput.value = "";
        textInput.placeholder = " -- analyzing image --";
        txtImage?.remove();
        txtImage = document.createElement("img");
        txtImage.classList.add("re-invert-image", "txtimage");
        txtImage.src = URL.createObjectURL(imageFile);

        txtImage.onload = async () => {
            try {
                const result = await analyzeFile(txtImage);
                if(result !== undefined) {
                    textInput.value = result;

                } else {
                    textInput.value = await stringREpr;
                }
                try {
                    await recreate(textInput.value, amountValue);
                } catch(e) {
                    console.error(e);
                }
                updateUrl();
            } catch(e) {
                console.error(e);
            }
            textInput.placeholder = "";
        };
        txtImage.style.opacity = "0.2";
        txtImage.style.position = "absolute";
        txtImage.style.right = "0px";
        document.body.appendChild(txtImage);

        context.image = txtImage;
        context.fileName = imageFile.name;
    }




    textInput.addEventListener('drop', async event => {
        event.preventDefault();
        loadingImage.style.visibility = 'visible';
        const file = event.dataTransfer?.items[0];
        if(checkInterval) {
            clearInterval(checkInterval);
            checkInterval = undefined;
        }
        if(!queryPicked[0]?.yIndex) {
            Parameter.setIndex(0, 1, queryPicked);
        }
        if(file?.kind === "file" && "getAsFileSystemHandle" in file && file.getAsFileSystemHandle) {
            const handle = await file.getAsFileSystemHandle();

            const fileData = await handle.getFile();
            const file_read = await fileData.arrayBuffer();
            const dataArray = [...new Uint8Array(file_read)];

            let textCache = dataArray.join(' ');
            textInput.value = textValue = textCache;

            analyzeContextDAta(fileData);

            checkInterval = setInterval(async () => {

                const fileData = await handle.getFile();
                const file_read = await fileData.arrayBuffer();
                const dataArray = [...new Uint8Array(file_read)];

                let newText = dataArray.join(' ');
                if(newText !== textCache) {
                    analyzeContextDAta(fileData);
                    textCache = newText;
                    textInput.value = textValue = textCache;
                }
            });
        } else {
            const fileRef = file?.getAsFile();
            if(fileRef) {
                analyzeContextDAta(fileRef);
            }
        }


    });


    async function recordText() {
        const preview = document.createElement("video");
        preview.style.position = "fixed";
        preview.style.left = preview.style.right = preview.style.top = preview.style.bottom = "10px";

        document.body.appendChild(preview);


        navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: {
                    ideal: "environment"
                }
            }, audio: false
        }).then((stream) => {
            preview.srcObject = stream;
            preview.play();
            preview.addEventListener("click", async () => {
                const canvas = document.createElement("canvas");
                const context = canvas.getContext("2d");

                const rect = preview.getBoundingClientRect();

                canvas.width = rect.width;
                canvas.height = rect.height;
                context?.drawImage(preview, 0, 0, rect.width, rect.height);
                stream.getTracks().forEach(function(track) {
                    track.stop();
                });

                preview.remove();

                const result = await analyzeFile(canvas);
                if(result != undefined) {
                    textInput.value = result;
                    try {
                        await recreate(textInput.value, amountValue);
                    } catch(e) {
                        console.error(e);
                    }
                    updateUrl();
                }

            });

        });
    }


    document.querySelector("#cam")
        ?.addEventListener("click", recordText);



    textInput.onpaste = async (e) => {
        e.preventDefault();
        if(e.clipboardData?.types.includes('text/plain')) {
            textValue = e.clipboardData.getData('text/plain');

            const codingsCopy = encodings.map((e, i) => {
                e.__index = i;
                return e;
            });
            codingsCopy.sort((a, b) => { return (b.matcherPrio ?? 0) - (a.matcherPrio ?? 0); });
            let found = true;
            let index = 0;
            let matchingTextValue = textValue;
            while(found) {
                found = false;
                for(let coding of codingsCopy) {
                    try {
                        const matched = coding.matcher?.(matchingTextValue, (columnIndex, rowIndex) => {
                            amountValue = Math.max(amountValue, columnIndex + 1);
                            Parameter.setIndex(columnIndex, rowIndex, queryPicked);
                        });


                        if(matched) {
                            const prevText = matchingTextValue;
                            matchingTextValue = await coding.fnc(matchingTextValue, undefined, undefined, {
                                parameters: typeof matched === "object" ? matched : {}
                            });
                            found = true;
                            if(prevText === matchingTextValue) {
                                found = false;
                            }

                            amountValue = Math.max(amountValue, index + 1);
                            amountInput.value = `${amountValue}`;
                            /**
                             * @type {Record<string,string>|undefined}
                             */
                            let params = undefined;
                            if(typeof matched === "object") {
                                params = matched;
                            }
                            Parameter.setIndex(index, coding.key ?? coding.__index, queryPicked, params);
                            break;
                        }
                    } catch(e) {
                        // if matcher throws treat as unmatched
                    }
                }

                if(found) {
                    index++;
                }

                if(index > 8) {
                    break;
                }
            }

            textInput.value = textValue;
            try {
                await recreate(textValue, amountValue);
            } catch(e) {

            }
            updateUrl();
        } else if(e.clipboardData?.types.includes("Files")) {

            const imageFile = [...e.clipboardData.items].find(item => item.kind === "file")?.getAsFile();
            if(!imageFile) {
                return;
            }
            analyzeContextDAta(imageFile);
        }

    };
    textInput.oninput = async (e) => {
        if(queryPicked.some(q => q.yIndex ? `${q.yIndex}`.includes('aes') : false)) {
            if(inputTimeout) {
                clearTimeout(inputTimeout);
            }
            inputTimeout = setTimeout(() => {
                loadingImage.style.visibility = 'visible';
                setTimeout(async () => {
                    inputTimeout = undefined;
                    textValue = textInput.value;
                    await recreate(textValue, amountValue);
                    updateUrl();
                    loadingImage.style.visibility = 'hidden';
                }, 10);
            }, 500);
        } else {
            textValue = textInput.value;
            await recreate(textValue, amountValue);
            updateUrl();
        }
        txtImage?.remove();
    };

    if(matcherInput.value) {
        matcherInput.value = matcherValue;
    }
    recreate(textValue, amountValue, true);

})();

export { queryPicked, updateUrl };