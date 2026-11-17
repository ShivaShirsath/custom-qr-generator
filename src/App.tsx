import { Editor } from '@/app/Editor';
import { GithubIcon } from '@/app/GithubIcon';
import styles from '@/app/App.module.css';
import { ThemeToggle } from '@/app/ThemeToggle';
import { QrBuddy } from '@/components/illustrations';
import { Button } from '@/components/ui';
import { REPO_URL } from '@/config';
import { PreviewPanel } from '@/features/preview/PreviewPanel';
import { cx } from '@/lib/cx';
import type { Tone } from '@/lib/tone';
import { ConfigProvider } from '@/state';

const PROMISES: ReadonlyArray<{ tone: Tone; label: string }> = [
  { tone: 'mint', label: 'No sign-up' },
  { tone: 'butter', label: 'No tracking or redirects' },
  { tone: 'lavender', label: 'Never expires' },
  { tone: 'peach', label: 'Free & open source' },
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

        <section className={cx('glass', styles.hero)}>
          <div className={styles.heroText}>
            <p className={styles.greeting}>Hi there! 👋</p>
            <h1>
              Make QR codes that look <span className={styles.gradientText}>like you</span>
            </h1>
            <p className={styles.lede}>
              Shape the dots and eyes, add colours, logos and frames, then download as SVG, PNG, JPG
              or WebP.
            </p>
            <ul className={styles.chips}>
              {PROMISES.map(({ tone, label }) => (
                <li key={label} data-tone={tone} className={styles.chip}>
                  <span className={styles.chipDot} aria-hidden="true" />
                  {label}
                </li>
              ))}
            </ul>
          </div>
          <QrBuddy className={styles.mascot} size={230} />
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
