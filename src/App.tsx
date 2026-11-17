import { Infinity as InfinityIcon, ShieldCheck, Sparkles, UserX } from 'lucide-react';

import { Editor } from '@/app/Editor';
import { GithubIcon } from '@/app/GithubIcon';
import styles from '@/app/App.module.css';
import { ThemeToggle } from '@/app/ThemeToggle';
import { Button } from '@/components/ui';
import { REPO_URL } from '@/config';
import { PreviewPanel } from '@/features/preview/PreviewPanel';
import { cx } from '@/lib/cx';
import { ConfigProvider } from '@/state';

const PROMISES = [
  { icon: UserX, label: 'No sign-up' },
  { icon: ShieldCheck, label: 'No tracking or redirects' },
  { icon: InfinityIcon, label: 'Codes never expire' },
  { icon: Sparkles, label: 'Free & open source' },
];

export function App() {
  return (
    <ConfigProvider>
      <div className={styles.backdrop} aria-hidden="true">
        <span className={styles.blob} />
        <span className={styles.blob} />
        <span className={styles.blob} />
      </div>

      <div className={styles.shell}>
        <header className={cx('glass', styles.header)}>
          <a className={styles.brand} href="/">
            <img src="/favicon.svg" alt="" width={36} height={36} />
            <span className={styles.brandName}>Custom QR</span>
          </a>
          <div className={styles.headerActions}>
            <ThemeToggle />
            {REPO_URL && (
              <a
                href={REPO_URL}
                target="_blank"
                rel="noreferrer noopener"
                aria-label="Source code on GitHub"
              >
                <Button tabIndex={-1} icon={<GithubIcon />} aria-hidden="true" />
              </a>
            )}
          </div>
        </header>

        <section className={styles.hero}>
          <h1>
            QR codes that look <span className={styles.gradientText}>like your brand</span>
          </h1>
          <p>
            Shape the dots and eyes, add gradients, logos and frames, then download as SVG, PNG, JPG
            or WebP.
          </p>
          <ul className={styles.chips}>
            {PROMISES.map(({ icon: Icon, label }) => (
              <li key={label} className={cx('glass', styles.chip)}>
                <Icon size={14} aria-hidden="true" />
                {label}
              </li>
            ))}
          </ul>
        </section>

        <main className={styles.layout}>
          <Editor />
          <div className={styles.previewColumn}>
            <PreviewPanel />
          </div>
        </main>

        <footer className={styles.footer}>
          <span>Everything runs in your browser. Nothing you type is uploaded.</span>
          <span>
            MIT licensed
            {REPO_URL && (
              <>
                {' '}
                · <a href={REPO_URL}>Contribute on GitHub</a>
              </>
            )}
          </span>
        </footer>
      </div>
    </ConfigProvider>
  );
}
