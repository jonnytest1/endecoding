///<reference path="index.js"/>

import { encodings } from './codings';
//import { queryPicked, updateUrl } from './index';
import { Parameter } from './parameter';

/**
 * @typedef {HTMLElement &{
 *  converter?:Encoding
 *  onclick?:(e:Event)=>any
 *  converterRef?:string;
 *  val?:any
 * }} HTMLConvElement
 *
 * @callback Click
 *
 */
export class TextOutput {

    /**
     *
     * @param {Encoding} converter
     * @param {Array<Parameter>} pickedParameters
     * @param {number} index
     * @param {Context} context
     * @param {boolean} initial
     */
    constructor(converter, index, pickedParameters, initial, context) {
        this.initialRun = initial;
        this.next = null;
        this.converter = converter;
        this.encodings = encodings;
        /**
         * @type {Array<HTMLConvElement>}
         */
        this.conversionElements = [];
        this.index = index;
        this.pickedParameters = pickedParameters;
        this.context = context;
        this.optionsElement = null
        /**
         * @type {Parameter|undefined}
         */
        this.currentParameter = this.pickedParameters[this.index] || new Parameter(this.index)
    }

    /**
     *
     * @param {string} previousText
     * @param {TextOutput} previous
     */
    setPrevious(previousText, previous) {
        this.previousText = previousText;
        this.previous = previous;
    }
    /**
     * @param {string} str 
     */
    async convert(str) {
        if(str === 'ERROR') {
            return 'ERROR';
        }
        this.convertedText = await this.converter.fnc.call(this.converter, str, this.conversionElement, this);
        return this.convertedText;

    }
    async recalculate() {
        const value = await this.convertInputElement();
        if(this.next) {
            this.next.previousText = value;
            await this.next.recalculate(this.next);
        }
    }

    async printAll() {
        console.log(`------ starting print for ${this.previousText} ------`);
        for(let element of this.encodings) {
            try {
                if(element.onchoose && !this.conversionElement.val) {
                    continue;
                }
                let converted = await element.fnc(this.previousText, this.conversionElement, this);
                console.log(converted);
            } catch(e) {
                console.log('ERROR', e, this.previousText, this.converter);
            }
        }
        console.log(`------ finished print for ${this.previousText} ------`);
    }
    /**
     * 
     * @param {Function} updateurl 
     */
    setOptions(updateurl) {
        [...this.optionsElement.children].forEach(c => c.remove())

        if(this.converter.options) {

            const form = document.createElement("form")
            /**
             * @type {Set<string>}
             */
            let disableOptinos

            for(const optionKey in this.converter.options) {
                const optObj = this.converter.options[optionKey]
                const optionsrow = document.createElement("div");
                optionsrow.innerText = `${optObj.displayText ?? optionKey}: `
                optionsrow.id = `option_${optionKey}`
                if(optObj.title) {
                    optionsrow.title = optObj.title
                }
                /**
                 * @type {HTMLInputElement|HTMLSelectElement}
                 */
                let valInput = document.createElement("input")
                valInput.name = optionKey
                valInput.type = optObj.type

                let currentValue = this.currentParameter?.options?.[optionKey]
                if(optObj.type == "checkbox") {
                    if(optObj.defaultV == "true") {
                        valInput.checked = true
                    } else {
                        valInput.checked = false
                    }
                    if(currentValue) {
                        valInput.value = currentValue
                    }
                    valInput.checked = valInput.value === "on"
                } else if(optObj.type === "select") {
                    valInput = document.createElement("select")
                    valInput.name = optionKey
                    if(!currentValue) {
                        currentValue = optObj.options[0].value
                        this.currentParameter.options[optionKey] = currentValue
                    }
                    const currentOption = optObj.options.find(o => currentValue && o.value === currentValue)
                    if(currentOption) {
                        disableOptinos = currentOption.disableOptions
                    }
                    for(const option of optObj.options) {
                        const optEl = document.createElement("option")
                        optEl.value = option.value
                        optEl.text = option.text
                        if(optObj.defaultV && option.value === optObj.defaultV) {
                            optEl.selected = true
                        }
                        if(currentValue && option.value === currentValue) {
                            optEl.selected = true
                        }
                        valInput.appendChild(optEl)
                    }
                } else if(optObj.type === "text") {
                    valInput.value = currentValue ?? ""
                    valInput.defaultValue = optObj.defaultV
                    /**
                     * @type {number}
                     */
                    let timeout
                    valInput.addEventListener("input", e => {
                        if(timeout) {
                            clearTimeout(timeout)
                        }
                        timeout = setTimeout(() => {
                            form.dispatchEvent(new Event("change"))
                        }, 500)

                    })

                } else {
                    valInput.defaultValue = optObj.defaultV
                }



                optionsrow.appendChild(valInput)
                form.appendChild(optionsrow)
                this.optionsElement.style.height = "unset"
            }

            if(disableOptinos) {
                for(const opt of disableOptinos) {
                    form.querySelector(`#option_${opt}`)?.remove()
                }
            }

            this.optionsElement.appendChild(form)

            form.addEventListener("change", async e => {
                const form = this.optionsElement.querySelector("form");
                /**
                 * @type {Record<string,string>}
                 */
                let options = {}
                if(form) {
                    options = Object.fromEntries([...new FormData(form).entries()].map(([key, value]) => {
                        if(value instanceof File) {
                            throw "nto supported file"
                        }
                        return [key, value]
                    }))
                }
                Parameter.setIndex(this.index, this.converter.key, this.pickedParameters, options);
                this.currentParameter = this.pickedParameters[this.index]
                updateurl()
                await this.recalculate();
                this.setOptions(updateurl)
            })
        }
    }
    /**
     * 
     * @param {()=>void} updateUrl 
     */
    async addElements(updateUrl) {
        const convRow = document.querySelector('#encodingSelectors');
        const newConvList = getDefault(convRow);
        this.conversionElements = [];
        for(let j = 0; j < this.encodings.length; j++) {
            const converter = this.encodings[j];
            const convList = newConvList.querySelector('.converterList');
            /**@type {HTMLConvElement} */
            const newConvElement = getDefault(convList);
            newConvElement.innerHTML = converter.nameHTML;
            newConvElement.converter = converter;
            if(converter.title) {
                newConvElement.title = converter.title
            }
            newConvElement.converterRef = converter.key || `${j}`;
            newConvElement.onclick = async (e) => {
                /**@type {HTMLConvElement} */
                let element = newConvElement;
                this.conversionElements.forEach(el => el.style.backgroundColor = '');
                element.style.backgroundColor = 'lightBlue';

                this.converter = element.converter;
                this.conversionElement = element;

                Parameter.setIndex(this.index, element.converterRef, this.pickedParameters, {});
                if(element.converter.onchoose) {
                    const chooseParam = this.pickedParameters[this.index] ? this.pickedParameters[this.index].value : undefined;
                    const cutomValue = element.converter.onchoose(chooseParam);
                    newConvElement.val = cutomValue;
                    Parameter.setIndex(this.index, element.converterRef, this.pickedParameters, cutomValue);
                } else {
                    newConvElement.innerHTML = converter.nameHTML;
                }
                this.setOptions(updateUrl)
                await this.recalculate();
                updateUrl();
            };

            const pickedConverter = this.pickedParameters[this.index];
            if(j === 0 && !pickedConverter) {
                newConvElement.style.backgroundColor = 'lightBlue';
                this.conversionElement = newConvElement;
                this.converter = converter;
                //tslint:disable-next-line
            } else if(pickedConverter && (pickedConverter.valueOf() == newConvElement.converterRef || pickedConverter.valueOf() === `${j}`)) {
                this.converter = converter;
                this.conversionElement = newConvElement;
                newConvElement.val = this.pickedParameters[this.index].value;
                newConvElement.style.backgroundColor = 'lightBlue';
            }
            this.conversionElements.push(newConvElement);
            convList.appendChild(newConvElement);
        }
        convRow.appendChild(newConvList);

        const textRow = document.querySelector('#textFields');
        const newRow = getDefault(textRow);
        /**@type {HTMLInputElement} */
        this.textField = newRow.querySelector('.textDisplay');
        this.textField.addEventListener("input", () => {

            if(this.next) {
                this.next.previousText = this.textField.value;
                this.next.recalculate(this.next);
            }
        })
        textRow.appendChild(newRow);

        const printRow = document.querySelector('#printButtons');
        const newPrintElement = getDefault(printRow);
        /**@type {HTMLButtonElement} */
        const button = newPrintElement.querySelector('.printAll');
        button.onclick = () => {
            this.printAll();
        };
        printRow.appendChild(newPrintElement);

        const optionsRow = document.querySelector('#options');
        this.optionsElement = getDefault(optionsRow);

        this.setOptions(updateUrl)
        await this.convertInputElement();


        optionsRow.appendChild(this.optionsElement)
    }

    async convertInputElement() {
        try {
            this.textField.style.backgroundColor = 'initial';
            if(!this.previousText) {
                this.textField.value = '';
                return null;
            }

            const converted = await this.convert(this.previousText);
            try {
                if(typeof converted === 'object') {
                    this.textField.value = JSON.stringify(converted, undefined, '  ');
                } else {
                    this.textField.value = JSON.stringify(JSON.parse(converted), undefined, '  ');
                }
            } catch(error) {
                this.textField.value = converted;
            }
            return converted;
        } catch(error) {
            console.log(error);
            let errorMsg = error;
            if(error.getMessage) {
                errorMsg = error.getMessage();
            }
            this.textField.value = errorMsg;
            this.textField.style.backgroundColor = '#ffab003b';
        }
    }

}
/**
 * @param {Element} node
 * @returns {HTMLElement}
 **/
function getDefault(node) {

    /**@type {HTMLElement} */
    // @ts-ignore
    const newNode = node.querySelector('.default')
        .cloneNode(true);
    newNode.classList.remove('default');
    return newNode;
}