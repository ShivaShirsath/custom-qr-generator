import { Editor } from '@/app/Editor';
import { HistoryButtons } from '@/app/HistoryButtons';
import { MobileActionBar } from '@/app/MobileActionBar';
import { useShortcuts } from '@/app/useShortcuts';
import { GithubIcon } from '@/app/GithubIcon';
import styles from '@/app/App.module.css';
import { ThemeToggle } from '@/app/ThemeToggle';
import { ToastProvider, TooltipLayer } from '@/components/feedback';
import { QrBuddy } from '@/components/illustrations';
import { Button } from '@/components/ui';
import { FORK_URL, REPO_URL } from '@/config';
import { PreviewPanel } from '@/features/preview/PreviewPanel';
import { PreviewProvider } from '@/features/preview/PreviewProvider';
import { useSmartStyle } from '@/features/smart/useSmartStyle';
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
        <PreviewProvider>
          <Shell />
        </PreviewProvider>
      </ToastProvider>
    </ConfigProvider>
  );
}

function Shell() {
  useShortcuts();
  useSmartStyle();
  return (
    <>
      <TooltipLayer />
      <div className={styles.backdrop} aria-hidden="true" />

      <div className={styles.app}>
        <header className={cx('glass', styles.header)}>
          <div className={styles.intro}>
            <QrBuddy className={styles.mascot} size={56} />
            <div className={styles.introText}>
              <h1 className={styles.title}>Hi there, QR!</h1>
              <span className={styles.greeting}>
                Make QR codes that look <span className={styles.gradientText}>like you</span>
              </span>
            </div>
          </div>

          <div className={styles.headerActions}>
            <HistoryButtons />
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
          <MobileActionBar />
          <ul className={styles.chips}>
            {PROMISES.map(({ tone, label }) => (
              <li key={label} data-tone={tone} className={styles.chip}>
                <span className={styles.chipDot} aria-hidden="true" />
                {label}
              </li>
            ))}
          </ul>
          <a
            className={styles.fork}
            href={FORK_URL}
            target="_blank"
            rel="noreferrer noopener"
            data-tip="Fork on GitHub: it's free and open source"
          >
            <GithubIcon size={16} />
            Fork
          </a>
        </footer>
      </div>
    </>
  );
}
