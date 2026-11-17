import { Editor } from '@/app/Editor';
import { GithubIcon } from '@/app/GithubIcon';
import styles from '@/app/App.module.css';
import { ThemeToggle } from '@/app/ThemeToggle';
import { ToastProvider } from '@/components/feedback';
import { QrBuddy } from '@/components/illustrations';
import { Button } from '@/components/ui';
import { REPO_URL } from '@/config';
import { PreviewPanel } from '@/features/preview/PreviewPanel';
import { cx } from '@/lib/cx';
import type { Tone } from '@/lib/tone';
import { ConfigProvider } from '@/state';

const PROMISES: ReadonlyArray<{ tone: Tone; label: string }> = [
  { tone: 'mint', label: 'No sign-up' },
  { tone: 'butter', label: 'No tracking' },
  { tone: 'lavender', label: 'Never expires' },
  { tone: 'peach', label: 'Free & open source' },
];

export function App() {
  return (
    <ConfigProvider>
      <ToastProvider>
        <div className={styles.backdrop} aria-hidden="true">
          <span className={styles.blob} />
          <span className={styles.blob} />
          <span className={styles.blob} />
        </div>

        <div className={styles.app}>
          <header className={cx('glass', styles.header)}>
            <a className={styles.brand} href="/" aria-label="Custom QR home">
              <img src="/favicon.svg" alt="" width={40} height={40} />
              <span className={styles.brandName}>Custom QR</span>
            </a>

            <div className={styles.intro}>
              <QrBuddy className={styles.mascot} size={56} />
              <div className={styles.introText}>
                <span className={styles.greeting}>Hi there! 👋</span>
                <h1 className={styles.title}>
                  Make QR codes that look <span className={styles.gradientText}>like you</span>
                </h1>
              </div>
            </div>

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

          <main className={styles.layout}>
            <Editor />
            <div className={styles.previewColumn}>
              <PreviewPanel />
            </div>
          </main>

          <footer className={cx('glass', styles.footer)}>
            <ul className={styles.chips}>
              {PROMISES.map(({ tone, label }) => (
                <li key={label} data-tone={tone} className={styles.chip}>
                  <span className={styles.chipDot} aria-hidden="true" />
                  {label}
                </li>
              ))}
            </ul>
            <p className={styles.footnote}>
              Runs in your browser · MIT
              {REPO_URL && (
                <>
                  {' · '}
                  <a href={REPO_URL}>GitHub</a>
                </>
              )}
            </p>
          </footer>
        </div>
      </ToastProvider>
    </ConfigProvider>
  );
}
