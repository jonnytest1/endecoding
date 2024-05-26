import jsdoc from "eslint-plugin-jsdoc";
/**
 * @type {import("eslint").ESLint.ConfigData}
 */
const cfg = {
    languageOptions: {
        "ecmaVersion": 2024,
        "sourceType": "module",
        "globals": {
            "Atomics": "readonly",
            "SharedArrayBuffer": "readonly"
        },
    },
    "settings": {},
    plugins: {
        jsdoc
    },
    "rules": {
        "no-unused-vars": 1,
        "semi": 2,
        "no-debugger": "error",
        "no-console": 0,
        "no-global-assign": 0,
        "function-paren-newline": "off"
    }
};


export default cfg;