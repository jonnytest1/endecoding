/**
 * @type {HTMLImageElement}
 */
let currentImage

/**@type {Array<Encoding>} */

export const imageConversions = [
    {
        nameHTML: 'image',
        key: 'image',
        fnc: (str, el, out) => {
            const currentOptions = out.currentParameter.options.operation || "preview"
            currentImage?.remove()
            if(currentOptions === "preview") {
                currentImage = new Image()
                currentImage.src = str
                document.body.appendChild(currentImage)
            }
            return str
        },
        options: {
            operation: {
                type: "select",
                options: [{
                    text: "preview",
                    value: "preview"
                }]
            }
        }
    }
];