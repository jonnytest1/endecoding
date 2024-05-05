import { imageConversions } from '../image/image';

/**@type {Array<Encoding>} */
var imageTransforms = [
    ...imageConversions,
    {
        nameHTML: 'toBase64SvgDataString',
        title: "if image was pasted , convert to base64Src string",
        fnc: (str, o, textOutput) => {

            const canvas = document.createElement("canvas")
            const image = textOutput.context.image;
            canvas.width = image.width;
            canvas.height = image.height;

            const context = canvas.getContext("2d");
            context.drawImage(image, 0, 0)

            return canvas.toDataURL("image/svg");
        }
    }
];

export const imageTransformList = imageTransforms;