// Read at request time on the server. A NEXT_PUBLIC_ variable would be inlined
// during `next build`, so the Docker image would be stuck with the build-time
// value instead of the domain it is deployed to.
export function getBaseUrl() {
  if (process.env.BASE_URL) {
    return process.env.BASE_URL.replace(/\/+$/, "");
  }

  // Set automatically by Railway once the service has a public domain.
  if (process.env.RAILWAY_PUBLIC_DOMAIN) {
    return `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`;
  }

  return `http://localhost:${process.env.PORT ?? 3000}`;
}

export function buildShortUrl(linkShort: string) {
  return `${getBaseUrl()}/${linkShort}`;
}
