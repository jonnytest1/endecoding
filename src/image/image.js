/**
 * @type {HTMLImageElement}
 */
let currentImage;

/**@type {Array<Encoding>} */

export const imageConversions = [
    {
        nameHTML: 'image',
        key: 'image',
        matcherPrio: 10,
        matcher: str => str.startsWith("/9j/") || str.startsWith("iVBORw") || str.startsWith("data:image/"),
        fnc: (str, el, out, opts) => {
            const currentOperation = opts.parameters.operation || "preview";
            currentImage?.remove();
            if(currentOperation === "preview") {
                if(str.startsWith("/9j/")) {
                    str = `data:image/jpeg;base64,${str}`;
                } else if(str.startsWith("iVBORw")) {
                    str = `data:image/png;base64,${str}`;
                }


                currentImage = new Image();
                currentImage.src = str;
                currentImage.classList.add("re-invert-image");
                document.body.appendChild(currentImage);
            } else if(currentOperation == "dataurl") {
                const canvas = document.createElement("canvas");

                let image = out?.context?.image;
                if(!image) {
                    return str;
                }
                canvas.width = image.width;
                canvas.height = image.height;

                const context = canvas.getContext("2d");
                if(!context) {
                    return str;
                }
                context.drawImage(image, 0, 0);

                return canvas.toDataURL();
            }
            return str;
        },
        options: {
            operation: {
                type: "select",
                options: [{
                    text: "preview",
                    value: "preview"
                }, {
                    text: "dataurl",
                    value: "dataurl"
                }]
            }
        }
    }
];