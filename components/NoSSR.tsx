"use client";

import { useEffect, useState } from "react";

/**
 * A wrapper component that prevents children from being rendered on the server.
 * This is useful for components that rely on browser-only APIs (like localStorage or window)
 * and cause hydration mismatches.
 */
const NoSSR = ({ children, fallback = null }: { children: React.ReactNode, fallback?: React.ReactNode }) => {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
};

export default NoSSR;
