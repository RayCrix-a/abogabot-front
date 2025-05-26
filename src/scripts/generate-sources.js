import * as path from "node:path";
import * as process from "node:process";
import { generateApi } from "swagger-typescript-api";

async function main() {
    const specUrl = process.env.NEXT_PUBLIC_ABOGABOT_API_URL ?? (() => { throw new Error("Environment variable NEXT_PUBLIC_ABOGABOT_API_URL is not defined"); })();

    await generateApi({
        url: specUrl + "/docs/openapi.json",
        output: path.resolve(process.cwd(), "src/generated/api"),
        cleanOutput: true,
        moduleNameFirstTag: true,
        modular: true,
        toJS: true
    });
}

main().catch(console.error);