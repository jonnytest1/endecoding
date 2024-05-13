
/// <reference path="./textOutput.js" />
/// <reference path="./parameter.js" />
/// <reference path="./tesseract.d.ts" />
/// <reference path="./qrscanner.d.ts" />

import { encodings } from './codings';
import { Parameter } from './parameter';
import { TextOutput } from './textOutput';

/**
 * @type {Context}
 */
let context = {}


/**
 *
 * @param {string} text
 * @param {number} amount
 */
function recreate(text, amount, initial = false) {

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
        const encodingRef = queryPicked[i] ? queryPicked[i].valueOf() : 0;
        /**
         * @type {Encoding}
         */
        let pickedConverter;
        if(isNaN(+encodingRef)) {
            pickedConverter = encodings.find(encoding => encoding.key === encodingRef);
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
        output.addElements(updateUrl);

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
    if(url.href.length < 2000) {
        window.history.pushState(undefined, '', url.href);
    }
}

const currentUrl = new URL(location.href);

/**@type {Array<Parameter>} */
let queryPicked = [];
for(let i = 0; i < 50; i++) {
    const key = `${i}`;
    if(currentUrl.searchParams.has(key)) {
        const iVal = currentUrl.searchParams.get(key);
        queryPicked[i] = new Parameter(i, iVal);

        [...currentUrl.searchParams.keys()].forEach(optionKey => {
            if(optionKey.startsWith(`${i}_`)) {
                queryPicked[i].options[optionKey.replace(`${i}_`, "")] = currentUrl.searchParams.get(optionKey)
            }
        })

    }
}
/**@type {HTMLTextAreaElement} */
let textInput = document.querySelector('#textInput');
textInput.addEventListener('dragover', event => {
    event.preventDefault();
});
/**@type {HTMLInputElement} */
const amountInput = document.querySelector('#amount');
/**@type {HTMLInputElement} */
const matcherInput = document.querySelector('#matcher');
/**@type {HTMLImageElement} */
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

(function setInitVariables() {
    let amountValue = currentUrl.searchParams.has('amount') ? +currentUrl.searchParams.get('amount') : 1;
    let textValue = currentUrl.searchParams.has('text') ? currentUrl.searchParams.get('text') : undefined;
    let matcherValue = currentUrl.searchParams.has('matcher') ? currentUrl.searchParams.get('matcher') : undefined;

    /**
     * @type {HTMLImageElement}
     */
    let txtImage;

    amountInput.value = '' + amountValue || '1';

    if(textInput.value) {
        textValue = textInput.value
    } else if(textValue) {
        textInput.value = textValue;
    }

    amountInput.oninput = (e) => {
        amountValue = +amountInput.value;
        recreate(textValue, amountValue);
        updateUrl();
    };
    let inputTimeout;


    const qrEngine = QrScanner.createQrEngine()
    textInput.addEventListener('drop', event => {
        event.preventDefault();
        loadingImage.style.visibility = 'visible';
        const file = event.dataTransfer.files[0];
        file.arrayBuffer()
            .then(buffer => {
                const dataArray = [...new Uint8Array(buffer)];
                textInput.value = textValue = dataArray.join(' ');
                recreate(textValue, amountValue);
                updateUrl();
                loadingImage.style.visibility = 'hidden';
            });
    });


    async function recordText() {
        const preview = document.createElement("video")
        preview.style.position = "fixed"
        preview.style.left = preview.style.right = preview.style.top = preview.style.bottom = "10px"

        document.body.appendChild(preview)


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

                const rect = preview.getBoundingClientRect()

                canvas.width = rect.width;
                canvas.height = rect.height;
                context.drawImage(preview, 0, 0, rect.width, rect.height);
                stream.getTracks().forEach(function(track) {
                    track.stop();
                });

                preview.remove();


                const data = canvas.toBlob(async blob => {
                    try {

                        let done = false
                        const [result, qrcode] = await Promise.all([
                            Tesseract.recognize(URL.createObjectURL(blob), "eng", {
                                logger: (m) => {
                                    if(!done) {
                                        textInput.placeholder = ` -- analyzing image -- ${Math.round(m.progress * 100)}/100`
                                    }
                                }
                            }),
                            new Promise(async res => {
                                QrScanner.scanImage(canvas, { qrEngine: await qrEngine }).then(result => {
                                    textValue = textInput.value = result.data
                                    recreate(textInput.value, amountValue);
                                    updateUrl();
                                    res(result.data)
                                }).catch(e => {
                                    res(null)
                                })
                            })
                        ])
                        done = true
                        if(qrcode != null) {

                        } else {
                            textValue = textInput.value = result.data.words
                                .filter(w => w.confidence > 70)
                                .map(w => w.text)
                                .join(" ")
                            try {
                                recreate(textInput.value, amountValue);
                            } catch(e) {
                                //
                            }
                            updateUrl();
                        }

                    } catch(e) {
                        debugger;
                    }
                });


            })

        })
    }


    document.querySelector("#cam")
        .addEventListener("click", recordText)



    textInput.onpaste = (e) => {
        e.preventDefault();
        if(e.clipboardData.types.includes('text/plain')) {
            textValue = e.clipboardData.getData('text/plain');

            const codingsCopy = encodings.map((e, i) => {
                e.__index = i
                return e;
            })
            codingsCopy.sort((a, b) => { return (b.matcherPrio ?? 0) - (a.matcherPrio ?? 0) })
            for(let coding of codingsCopy) {
                if(coding.matcher?.(textValue, (columnIndex, rowIndex) => {
                    amountValue = Math.max(amountValue, columnIndex + 1)
                    Parameter.setIndex(columnIndex, rowIndex, queryPicked)
                })) {
                    Parameter.setIndex(0, coding.key ?? coding.__index, queryPicked);
                    break;
                }
            }
            textInput.value = textValue;
            try {
                recreate(textValue, amountValue);
            } catch(e) {

            }
            updateUrl();
        } else if(e.clipboardData.types.includes("Files")) {

            const imageFile = [...e.clipboardData.items].find(item => item.kind === "file").getAsFile()
            textInput.value = ""
            textInput.placeholder = " -- analyzing image --"
            txtImage = document.createElement("img")

            txtImage.src = URL.createObjectURL(imageFile)

            txtImage.onload = async () => {
                try {
                    const [result, qrcode] = await Promise.all([
                        Tesseract.recognize(txtImage.src, "eng", {
                            logger: (m) => {
                                textInput.placeholder = ` -- analyzing image -- ${Math.round(m.progress * 100)}/100`
                            }
                        }),
                        new Promise(async res => {
                            QrScanner.scanImage(txtImage, { qrEngine: await qrEngine }).then(result => {
                                textValue = textInput.value = result.data
                                recreate(textInput.value, amountValue);
                                updateUrl();
                                res(result.data)
                            }).catch(e => {
                                res(null)
                            })
                        })
                    ])
                    if(qrcode != null) {

                    } else {
                        textValue = textInput.value = result.data.words
                            .filter(w => w.confidence > 70)
                            .map(w => w.text)
                            .join(" ")
                        try {
                            recreate(textInput.value, amountValue);
                        } catch(e) {
                            //
                        }
                        updateUrl();
                    }

                } catch(e) {
                    debugger;
                }
                textInput.placeholder = ""
            }
            txtImage.style.opacity = "0.2"
            txtImage.style.position = "absolute"
            txtImage.style.right = "0px"
            document.body.appendChild(txtImage)

            context.image = txtImage
            /*then(async data => {
                const canvas = document.createElement("canvas")
                const context = canvas.getContext("2d")




                //context.drawImage(image, 0, 0)

               
            })*/
        }

    };
    textInput.oninput = (e) => {
        if(queryPicked.some(q => q.yIndex.includes('aes'))) {
            if(inputTimeout) {
                clearTimeout(inputTimeout);
            }
            inputTimeout = setTimeout(() => {
                loadingImage.style.visibility = 'visible';
                setTimeout(() => {
                    inputTimeout = undefined;
                    textValue = textInput.value;
                    recreate(textValue, amountValue);
                    updateUrl();
                    loadingImage.style.visibility = 'hidden';
                }, 10);
            }, 500);
        } else {
            textValue = textInput.value;
            recreate(textValue, amountValue);
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