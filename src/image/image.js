
/**
 * @type {Record<number,HTMLImageElement>}
 */
const currentImages = {};


/**@type {Array<Encoding>} */

export const imageConversions = [
    {
        nameHTML: 'image',
        key: 'image',
        matcherPrio: 10,
        matcher: str => str.startsWith("/9j/") || str.startsWith("iVBORw") || str.startsWith("data:image/"),
        fnc: (str, el, out, opts) => {
            const currentOperation = opts.parameters.operation || "preview";


            currentImages[out?.index ?? -1]?.remove?.();

            if(currentOperation === "preview") {
                if(str.startsWith("/9j/")) {
                    str = `data:image/jpeg;base64,${str}`;
                } else if(str.startsWith("iVBORw")) {
                    str = `data:image/png;base64,${str}`;
                }


                currentImages[out?.index ?? -1] = new Image();

                currentImages[out?.index ?? -1].src = str;
                currentImages[out?.index ?? -1].classList.add("re-invert-image");
                document.body.appendChild(currentImages[out?.index ?? -1]);
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
            } else if(currentOperation == "scale") {
                const svgDoc = new DOMParser().parseFromString(str, "image/svg+xml");

                const width = + (svgDoc.documentElement?.getAttribute("width") || 300);
                const height = + (svgDoc.documentElement?.getAttribute("height") || 150);
                const scle = +opts.parameters.scale;

                const newWdith = width * scle;
                const newHeight = height * scle;

                const ct = newWdith * newHeight;

                // ct
                // 257112273 works
                // 284158929.5999999 breaks
                // 2^28 = 268435456
                if(ct > 268435455) {
                    return "this is too big for a canvas";
                }

                svgDoc.documentElement?.setAttribute("width", `${newWdith}`);
                svgDoc.documentElement?.setAttribute("height", `${newHeight}`);

                const currentImage = currentImages[out?.index ?? -1] = new Image();
                currentImage.id = `image_scaled_${out?.index ?? -1}`;
                currentImage.style.maxHeight = "90%";

                return new Promise((res, err) => {
                    currentImage.onload = () => {
                        const canvas = document.createElement("canvas");
                        canvas.width = newWdith;
                        canvas.height = newHeight;
                        canvas.style.maxWidth = "100%";
                        canvas.style.maxHeight = "98%";
                        canvas.style.position = "absolute";
                        canvas.style.zIndex = "-1";
                        document.body.appendChild(canvas);

                        const context = canvas.getContext("2d");
                        if(!context) {
                            return err("no conext");
                        }
                        context.drawImage(currentImage, 0, 0);
                        res(canvas.toDataURL());
                    };
                    const newXMLSvg = new XMLSerializer().serializeToString(svgDoc);
                    currentImage.src = `data:image/svg+xml;base64,${btoa(newXMLSvg)}`;
                    document.body.appendChild(currentImage);
                });
            }
            return str;
        },
        customizedTextField: (opts) => {
            const downloadButton = document.createElement("button");
            downloadButton.textContent = "⬇️";
            opts.textField.parentElement?.appendChild(downloadButton);
            downloadButton.style.right = "0px";
            downloadButton.style.position = "absolute";
            downloadButton.title = "download";
            downloadButton.onclick = () => {
                let content = opts.text;
                if(content.startsWith("data:image/png;base64,")) {
                    content = atob(content.split("data:image/png;base64,")[1]);
                }

                const byteNumbers = new Array(content.length);
                for(let i = 0; i < content.length; i++) {
                    byteNumbers[i] = content.charCodeAt(i);
                }

                const byteArray = new Uint8Array(byteNumbers);
                const blob = new Blob([byteArray], { type: 'image/png' });
                const link = document.createElement('a');
                link.href = window.URL.createObjectURL(blob);
                link.download = opts.context.fileName ? `${opts.context.fileName}.png` : 'yourimage.png';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

            };
        },
        options: {
            operation: {
                type: "select",
                options: [{
                    text: "preview",
                    value: "preview",
                    disableOptions: new Set(["scale"])
                }, {
                    text: "dataurl",
                    value: "dataurl",
                    disableOptions: new Set(["scale"])
                }, {
                    text: "scale",
                    value: "scale"
                }]
            },
            scale: {
                type: "range",
                min: 0,
                max: 128,
                step: 0.1,
                defaultV: "4"
            }
        }
    }
];