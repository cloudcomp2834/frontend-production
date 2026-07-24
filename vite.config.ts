import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { sentryVitePlugin } from '@sentry/vite-plugin'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Uploads source maps so Sentry can show real file/line info instead of minified
    // gibberish. Runs during `vite build` (Node context) - SENTRY_AUTH_TOKEN never reaches
    // the browser bundle. No-ops (via `disable`) when the token isn't set, so local builds
    // and PRs without the secret configured still work.
    sentryVitePlugin({
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      disable: !process.env.SENTRY_AUTH_TOKEN,
      sourcemaps: {
        // Upload for readable stack traces in Sentry, then remove from the deployed
        // output so real source isn't sitting there for anyone to open in devtools.
        filesToDeleteAfterUpload: ['./dist/**/*.map'],
      },
    }),
  ],
  build: {
    sourcemap: true,
  },
})
