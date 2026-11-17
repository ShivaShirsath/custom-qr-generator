/**
 * Public repository. Override at build time with VITE_REPO_URL (e.g. in Vercel's
 * environment variables) if the repository lives elsewhere.
 */
export const REPO_URL: string =
  import.meta.env.VITE_REPO_URL || 'https://github.com/ShivaShirsath/custom-qr-generator';

/** GitHub's "create a fork" page for the repository. */
export const FORK_URL = `${REPO_URL.replace(/\/+$/, '')}/fork`;
