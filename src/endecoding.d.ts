

interface SelectOption {
    type: "select",
    options: Array<{
        text: string,
        value: string,
        disableOptions?: Set<string>
    }>
    defaultV?: string
}



type Option = (SelectOption | {
    type: "checkbox" | "text",
    defaultV?: string
}) & {
    title?: string,
    displayText?: string
}


interface Encoding {
    /**
     * name of the encoding as shown- can interpret html !! please dont make any xss 👀
     */
    nameHTML: string
    /**
     * title as shown on hover
     */
    title?: string
    /**
     * html for an explanation of how the transformation works
     */
    helpHTML?: string
    /**
     * transformation function
     */
    fnc: (this: Encoding, str: string, output?: import("./textOutput").HTMLConvElement, textOuptut?: import("./textOutput").TextOutput) => string | Promise<string>
    /**
     * fucntion to call when it is selected (try to use options where possible instead ⬇️)
     */
    onchoose?: (queryValue: any) => string | number,
    /**
     * check if this string is a uniquly qualifying string for the Encoding (if so it will be automatically selected on pasting)
     */
    matcher?: (str: string, add: (x: number, y: number) => void) => boolean | Record<string, string>
    /**
     * higher number runs matcher first (more specific matchers should get higher number  (defaults to 0))
     */
    matcherPrio?: number
    /**
    * key to use for sharing in url
    */
    key?: string

    /**
     * options of the current Encoding (can be accessed via textOuptut.currentParameter.options )
     */

    options?: {
        [name: string]: Option
    }

    __index?: number
}


type Context = { image?: HTMLImageElement } 