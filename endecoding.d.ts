

interface SelectOption {
    type: "select",
    options: Array<{
        text: string,
        value: string
    }>
    defaultV?: string
}



type Option = (SelectOption | {
    type: "checkbox" | "text",
    defaultV?: string
}) & {
    title?: string
}


interface Encoding {
    nameHTML: string

    title?: string
    fnc: (this: Encoding, str: string, output?: import("./textOutput").HTMLConvElement, t?: import("./textOutput").TextOutput) => string
    onchoose?: (queryValue: any) => string | number,
    matcher?: (str: string, add: (x: number, y: number) => void) => boolean
    key?: string

    options?: {
        [name: string]: Option
    }
}


type Context = { image?: HTMLImageElement } 