# External Integrations

**Analysis Date:** 2025-02-12

## APIs & External Services

**None detected.** The library is a pure Vue component library with no external API SDKs or cloud services.

## Data Storage

**Databases:**
- None

**File Storage:**
- Local filesystem only

**Caching:**
- None

## Authentication & Identity

**Auth Provider:**
- None

The library exposes a `PropsWithServerQuery` type in `ui/types/component-common.ts` for components that may query an API:

```typescript
interface PropsWithServerQuery {
  api?: string
  query?: Record<string, any>
}
```

This is a contract for consumers; the library itself does not perform HTTP requests.

## Monitoring & Observability

**Error Tracking:**
- None

**Logs:**
- Console logging only (e.g., in build scripts)

## CI/CD & Deployment

**Hosting:**
- Not specified

**CI Pipeline:**
- `.github/` contains issue templates only
- No CI workflow files detected

**Publishing:**
- `build/release.ts` - Publishes to npm via `npm publish --registry http://192.168.31.250:6005`
- Registry configured in `.npmrc` as `http://192.168.31.250:6005`

## Environment Configuration

**Required env vars:**
- None for the library

**Secrets location:**
- `.env` and `.env.test` ignored

## Webhooks & Callbacks

**Incoming:**
- None

**Outgoing:**
- None

## HTTP / Network Usage

**Single fetch usage:**
- `ui/components/watermark/base64.ts` - Uses `fetch` to convert remote image URLs to base64 for watermark display. Accepts URLs passed by consumers; no external API.

## External Registries

**Package registry:**
- `.npmrc` points to `http://192.168.31.250:6005` (private npm registry)

## Peer Dependencies (Consumers)

- `vue` ^3.5.27 - Required
- `cat-kit` ^3.7.15 - Required
- `@ultra/icon` ^1.0.1 - Required

---

*Integration audit: 2025-02-12*
