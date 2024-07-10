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
        fnc: (str, el, out) => {
            const currentOperation = out.currentParameter.options.operation || "preview";
            currentImage?.remove();
            if(currentOperation === "preview") {
                if(str.startsWith("/9j/")) {
                    str = `data:image/jpeg;base64,${str}`;
                } else if(str.startsWith("iVBORw")) {
                    str = `data:image/png;base64,${str}`;
                }


                currentImage = new Image();
                currentImage.src = str;
                document.body.appendChild(currentImage);
            } else if(currentOperation == "dataurl") {
                const canvas = document.createElement("canvas");

                let image = out.context.image;

                canvas.width = image.width;
                canvas.height = image.height;

                const context = canvas.getContext("2d");
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