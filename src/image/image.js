/**
 * @type {HTMLImageElement}
 */
let currentImage

/**@type {Array<Encoding>} */

export const imageConversions = [
    {
        nameHTML: 'image',
        key: 'image',
        matcher: str => str.startsWith("/9j/"),
        fnc: (str, el, out) => {
            const currentOptions = out.currentParameter.options.operation || "preview"
            currentImage?.remove()
            if(currentOptions === "preview") {
                if(str.startsWith("/9j/")) {
                    str = `data:image/jpeg;base64,${str}`
                }


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