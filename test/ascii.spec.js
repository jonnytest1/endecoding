import ascii from "../src/transformations/ascii.js";
import { runWithParam } from "./util.js";
describe("ascii test", () => {


    it("decodes numbers to ascii", () => {
        const asciiTransform = ascii.find(t => t.key === "asciitostr");

        expect(runWithParam(asciiTransform, "")).toBe("");
        expect(runWithParam(asciiTransform, "116 101 115 116")).toBe("test");

    });


});