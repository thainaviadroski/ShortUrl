"use client";

import { useEffect, useRef } from "react";
import { createRoot, type Root } from "react-dom/client";

/**
 * swagger-ui-react is incompatible with React Strict Mode's dev-only
 * double-mount-and-cleanup cycle: its internal plugin system mounts some UI
 * imperatively (e.g. the copy-to-clipboard buttons) without symmetric
 * teardown, so the simulated remount leaves duplicate elements behind, and
 * its legacy class lifecycles trigger Strict Mode's deprecation warnings.
 *
 * Rendering it into a root created here — instead of as a normal descendant
 * of the app's tree — sidesteps both: this root is never wrapped in
 * <StrictMode>, so React neither double-invokes nor dev-warns inside it,
 * while the rest of the app stays fully strict. The dynamic import is done
 * inside the effect (which never runs during SSR) so it's never evaluated in
 * Node, where it would fail on missing browser globals.
 */
function useIsolatedSwaggerUI(containerRef: React.RefObject<HTMLDivElement | null>, url: string) {
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        let root: Root | undefined;
        let cancelled = false;

        import("swagger-ui-react").then(({ default: SwaggerUI }) => {
            if (cancelled) return;
            root = createRoot(container);
            root.render(<SwaggerUI url={url} />);
        });

        return () => {
            cancelled = true;
            // Deferred: React (in Strict Mode dev) runs this cleanup synchronously
            // as part of its own passive-effect flush. Calling root.unmount()
            // in-line reenters React's render machinery mid-flush and triggers
            // "Attempted to synchronously unmount a root while React was already
            // rendering." Pushing it to the next tick lets that flush finish first.
            const rootToUnmount = root;
            if (rootToUnmount) {
                setTimeout(() => rootToUnmount.unmount(), 0);
            }
        };
    }, [containerRef, url]);
}

export default function ApiDocPage() {
    const containerRef = useRef<HTMLDivElement>(null);
    useIsolatedSwaggerUI(containerRef, "/api/docs");

    return (
        <>
            {/* eslint-disable-next-line @next/next/no-css-tags -- served via route handler, not a bundler import: see src/app/api/swagger-ui.css/route.ts */}
            <link rel="stylesheet" href="/api/swagger-ui.css" precedence="default" />
            <div ref={containerRef} />
        </>
    );
}
