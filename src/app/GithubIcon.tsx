import { siGithub } from 'simple-icons';

export function GithubIcon({ size = 18 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      <path fill="currentColor" d={siGithub.path} />
    </svg>
  );
}
