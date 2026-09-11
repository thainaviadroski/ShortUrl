import geoip from "geoip-lite";

export function lookupGeoByIp(ipAddress: string | null | undefined) {
    const geo = ipAddress ? geoip.lookup(ipAddress) : null;

    return {
        country: geo?.country ?? null,
        city: geo?.city ?? null,
    };
}
