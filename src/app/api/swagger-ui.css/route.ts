import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

/**
 * Serves swagger-ui-react's stylesheet straight from node_modules instead of a
 * copy in /public. A copy silently goes stale on the next dependency update;
 * reading it at request time never can. It's also served as a plain response
 * (not a bundler CSS import) because Turbopack's Lightning CSS parser rejects
 * a legacy `*zoom:1` IE hack in this file as invalid syntax — the browser
 * parses it natively via a <link> tag instead.
 */
export async function GET() {
    const cssPath = path.join(process.cwd(), "node_modules/swagger-ui-react/swagger-ui.css");
    const css = await readFile(cssPath, "utf-8");

    return new NextResponse(css, {
        headers: { "Content-Type": "text/css; charset=utf-8" },
    });
}
