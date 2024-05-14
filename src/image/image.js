/**
 * @type {HTMLImageElement}
 */
let currentImage

/**@type {Array<Encoding>} */

export const imageConversions = [
    {
        nameHTML: 'image',
        key: 'image',
        matcherPrio: 10,
        matcher: str => str.startsWith("/9j/") || str.startsWith("iVBORw"),
        fnc: (str, el, out) => {
            const currentOptions = out.currentParameter.options.operation || "preview"
            currentImage?.remove()
            if(currentOptions === "preview") {
                if(str.startsWith("/9j/")) {
                    str = `data:image/jpeg;base64,${str}`
                } else if(str.startsWith("iVBORw")) {
                    str = `data:image/png;base64,${str}`
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