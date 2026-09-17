import * as fs from "node:fs";

fs.rmSync("src/content-mocks", { recursive: true, force: true });
console.log("mocks: removed src/content-mocks");
