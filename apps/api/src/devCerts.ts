/**
 * Local HTTPS for the API in development. The task pane is served over HTTPS
 * (Office requires it) and browsers/WebView2 block a mixed HTTPS-page ->
 * HTTP-API fetch, so the API needs the same trusted localhost cert the add-in
 * uses. Production terminates TLS at the platform (Container Apps / Render),
 * so this is dev-only and fails soft to plain HTTP if certs aren't installed.
 */
export interface DevHttpsOptions {
  key: Buffer;
  cert: Buffer;
  ca?: Buffer;
}

export async function getDevHttpsOptions(): Promise<DevHttpsOptions | undefined> {
  try {
    // office-addin-dev-certs is CJS; tolerate either export shape.
    const mod = (await import('office-addin-dev-certs')) as Record<string, unknown> & {
      default?: Record<string, unknown>;
    };
    const getOptions = (mod['getHttpsServerOptions'] ?? mod.default?.['getHttpsServerOptions']) as
      | (() => Promise<{ key: Buffer; cert: Buffer; ca: Buffer }>)
      | undefined;
    if (!getOptions) return undefined;
    const options = await getOptions();
    return { key: options.key, cert: options.cert, ca: options.ca };
  } catch {
    return undefined;
  }
}
