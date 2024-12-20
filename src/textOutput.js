///<reference path="index.js"/>
///<reference path="highlight.d.ts"/>
import { encodings } from './codings';
//import { queryPicked, updateUrl } from './index';
import { Parameter } from './parameter';

/**
 * @typedef {HTMLElement &{
 *  converter?:Encoding
 *  onclick?:(e:Event)=>any
 *  converterRef?:string;
 *  val?:string | number
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
        /**
         * @type {TextOutput|null}
         */
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
        /**
         * @type {HTMLElement|null}
         */
        this.optionsElement = null;
        /**
         * @type {Parameter}
         */
        this.currentParameter = this.pickedParameters[this.index] || new Parameter(this.index);
        /**
         * @type { HTMLElement|undefined}
         */
        this.textFieldContainer = undefined;
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
        /**
         * @type {Parameters<Encoding["fnc"]>}
         */
        const fncArgs = [str, this.conversionElement, this, {
            parameters: this.currentParameter?.options ?? {}
        }];

        this.convertedText = await this.converter.fnc.call(this.converter, ...fncArgs);
        return this.convertedText;

    }
    async recalculate() {
        const value = await this.convertInputElement();
        if(this.next) {
            this.next.previousText = value;
            await this.next.recalculate();
        }
    }

    async printAll() {
        console.log(`------ starting print for ${this.previousText} ------`);
        for(let element of this.encodings) {
            try {
                if(element.onchoose && !this.conversionElement?.val) {
                    continue;
                }
                let converted = await element.fnc(this.previousText ?? "", this.conversionElement, this, {
                    parameters: this.currentParameter?.options ?? {}
                });
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
        if(!this.optionsElement) {
            return;
        }
        [...this.optionsElement?.children ?? []].forEach(c => c.remove());

        if(this.converter.options) {

            const form = document.createElement("form");
            this.optionsElement?.appendChild(form);
            /**
             * @type {Set<string>|undefined}
             */
            let disableOptinos;

            for(const optionKey in this.converter.options) {
                const optObj = this.converter.options[optionKey];
                const optionsrow = document.createElement("div");
                form.appendChild(optionsrow);
                optionsrow.innerText = `${optObj.displayText ?? optionKey}: `;
                optionsrow.id = `option_${optionKey}`;
                if(optObj.title) {
                    optionsrow.title = optObj.title;
                }
                /**
                 * @type {HTMLInputElement|HTMLSelectElement}
                 */
                let valInput = document.createElement("input");
                valInput.name = optionKey;
                valInput.type = optObj.type;
                let currentValue = this.currentParameter?.options?.[optionKey];
                if(optObj.type == "checkbox") {
                    if(optObj.defaultV == "on" || optObj.defaultV == "true") {
                        valInput.checked = true;
                        if(currentValue === undefined && this.currentParameter.options !== undefined) {
                            this.currentParameter.options[optionKey] = optObj.defaultV;
                        }
                    } else {
                        valInput.value = "off";
                        valInput.checked = false;
                    }
                    if(currentValue !== undefined) {
                        valInput.value = currentValue;
                    }
                    valInput.checked = valInput.value === "on";
                } else if(optObj.type === "select") {
                    valInput = document.createElement("select");
                    valInput.name = optionKey;
                    if(!currentValue) {
                        currentValue = optObj.options[0].value;
                        this.currentParameter.options[optionKey] = currentValue;
                    }
                    const currentOption = optObj.options.find(o => currentValue && o.value === currentValue);
                    if(currentOption) {
                        disableOptinos = currentOption.disableOptions;
                    }

                    for(const option of optObj.options) {
                        const optEl = document.createElement("option");
                        optEl.value = option.value;
                        optEl.text = option.text;
                        if(optObj.defaultV && option.value === optObj.defaultV) {
                            optEl.selected = true;
                        }
                        if(currentValue && option.value === currentValue) {
                            optEl.selected = true;
                        }
                        valInput.appendChild(optEl);
                    }
                    valInput.value = currentValue;
                } else if(optObj.type === "text") {
                    valInput.value = currentValue ?? "";
                    if(optObj.defaultV) {
                        valInput.defaultValue = optObj.defaultV;
                    }
                    /**
                     * @type {NodeJS.Timeout}
                     */
                    let timeout;
                    valInput.addEventListener("input", e => {
                        if(timeout) {
                            clearTimeout(timeout);
                        }
                        timeout = setTimeout(() => {
                            form.dispatchEvent(new Event("change"));
                        }, 500);

                    });

                } else if(optObj.type === "range") {
                    if(optObj.defaultV) {
                        valInput.defaultValue = optObj.defaultV;
                    }
                    valInput.step = `${optObj.step || ""}`;
                    valInput.min = `${optObj.min || ""}`;
                    valInput.max = `${optObj.max || ""}`;
                    valInput.value = currentValue ?? "";

                } else {
                    valInput.defaultValue = optObj.defaultV;
                }
                this.optionsElement.style.height = "unset";
                optionsrow.appendChild(valInput);
            }

            if(disableOptinos) {
                for(const opt of disableOptinos) {
                    form.querySelector(`#option_${opt}`)?.remove();
                }
            }


            form.addEventListener("change", async e => {
                this.initialRun = false;
                const form = this.optionsElement?.querySelector("form");
                /**
                 * @type {Record<string,string>}
                 */
                let options = {};
                if(form) {
                    for(const formElement of form) {
                        if(formElement instanceof HTMLInputElement) {
                            if(formElement.type === "checkbox") {
                                options[formElement.name] = formElement.checked ? "on" : "";
                            } else {
                                options[formElement.name] = formElement.value;
                            }
                        } else if(formElement instanceof HTMLSelectElement) {
                            options[formElement.name] = formElement.value;
                        }
                    }
                    /*options = Object.fromEntries([...new FormData(form).entries()].map(([key, value]) => {
                        if(value instanceof File) {
                            throw "nto supported file";
                        }
                        return [key, value];
                    }));*/
                }
                Parameter.setIndex(this.index, this.converter.key, this.pickedParameters, options);
                this.currentParameter = this.pickedParameters[this.index];
                updateurl();
                await this.recalculate();
                this.setOptions(updateurl);
            });
        }
    }


    /**
     * 
     * @param {HTMLConvElement} element 
     * @param {Encoding} converter 
     * 
     * @returns {asserts element is {converter:Encoding}}
     */
    setConverterRow(element, converter) {
        element.innerHTML = converter.nameHTML;
        element.converter = converter;

        const helpHTML = converter.helpHTML;
        if(helpHTML) {
            const helpElement = document.createElement("button");
            element.appendChild(helpElement);
            helpElement.classList.add("help");
            helpElement.textContent = `ℹ️`;
            helpElement.title = "explanation";
            const helpPopover = document.querySelector("#help-popover");
            if(!helpPopover) {
                return;
            }
            helpElement.addEventListener("click", e => {
                e.stopPropagation();
                const popOverContent = helpPopover.querySelector(".content");
                if(!popOverContent) {
                    return;
                }
                popOverContent.innerHTML = helpHTML;

                popOverContent.querySelectorAll("code").forEach(codeEl => {
                    hljs.highlightElement(codeEl);
                });

            });

            helpElement.popoverTargetElement = helpPopover;
        }
    }

    /**
     * 
     * @param {()=>void} updateUrl 
     */
    async addElements(updateUrl) {
        const convRow = document.querySelector('#encodingSelectors');
        if(!convRow) {
            return;
        }
        const newConvList = getDefault(convRow);
        this.conversionElements = [];
        for(let j = 0; j < this.encodings.length; j++) {
            const converter = this.encodings[j];
            const convList = newConvList.querySelector('.converterList');
            if(!convList) {
                continue;
            }
            /**@type {HTMLConvElement} */
            const newConvElement = getDefault(convList);
            this.setConverterRow(newConvElement, converter);
            if(converter.title) {
                newConvElement.title = converter.title;
            }
            newConvElement.converterRef = converter.key || `${j}`;
            newConvElement.onclick = async (e) => {

                const element = newConvElement;
                this.conversionElements.forEach(el => el.style.backgroundColor = '');
                element.style.backgroundColor = 'lightBlue';

                this.converter = element.converter;
                this.conversionElement = element;

                Parameter.setIndex(this.index, element.converterRef, this.pickedParameters, {});
                if(element.converter?.onchoose) {
                    const chooseParam = this.pickedParameters[this.index] ? this.pickedParameters[this.index].value : undefined;
                    const cutomValue = element.converter.onchoose(chooseParam);
                    this.initialRun = false;
                    newConvElement.val = cutomValue;
                    Parameter.setIndex(this.index, element.converterRef, this.pickedParameters, cutomValue);
                } else {
                    this.setConverterRow(newConvElement, converter);
                }
                this.setOptions(updateUrl);
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
        if(!textRow) {
            return;
        }
        this.textFieldContainer = getDefault(textRow);

        if(this.textFieldContainer) {

            /**@type {HTMLInputElement|null} */
            this.textField = this.textFieldContainer?.querySelector('.textDisplay');
            if(!this.textField) {
                return;
            }

            this.textField.addEventListener("input", () => {

                if(this.next) {
                    this.next.previousText = this.textField?.value;
                    this.next.recalculate();
                }
            });
            textRow.appendChild(this.textFieldContainer);
        }

        const printRow = document.querySelector('#printButtons');
        if(!printRow) {
            return;
        }
        const newPrintElement = getDefault(printRow);
        /**@type {HTMLButtonElement|null} */
        const button = newPrintElement.querySelector('.printAll');
        if(!button) {
            return;
        }
        button.onclick = () => {
            this.printAll();
        };
        printRow.appendChild(newPrintElement);

        const optionsRow = document.querySelector('#options');
        if(!optionsRow) {
            return;
        }
        this.optionsElement = getDefault(optionsRow);

        this.setOptions(updateUrl);
        await this.convertInputElement();


        optionsRow.appendChild(this.optionsElement);
    }

    async convertInputElement() {
        if(!this.textField) {
            console.error("no textfield");
            return;
        }
        if(this.textFieldContainer) {
            for(let i = this.textFieldContainer?.children.length - 1; i >= 0; i--) {
                if(this.textFieldContainer?.children[i] !== this.textField) {
                    this.textFieldContainer?.children[i].remove();
                }
            }
        }

        try {


            this.textField.style.backgroundColor = 'initial';
            if(this.previousText === undefined) {
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
            this.converter.customizedTextField?.({
                textField: this.textField,
                converter: this.converter,
                text: this.textField.value,
                textOutput: this,
                context: this.context
            });

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