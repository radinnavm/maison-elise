import { Link } from 'react-router';

import { footerColumns, socialLinks } from '@/data/navigation';

import styles from './Footer.module.css';

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className="container">
        <div className={styles.grid}>
          <div className={styles.brand}>
            <p className={styles.wordmark}>Maison Élise</p>
            <p className={styles.tagline}>
              Quiet luxury, made to last. Considered pieces designed in small ateliers.
            </p>
          </div>

          {footerColumns.map((column) => (
            <nav key={column.title} className={styles.column} aria-label={column.title}>
              <h2 className={styles.columnTitle}>{column.title}</h2>
              <ul className={styles.list}>
                {column.links.map((link) => (
                  <li key={link.to}>
                    <Link to={link.to} className={styles.link}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          <nav className={styles.column} aria-label="Social">
            <h2 className={styles.columnTitle}>Social</h2>
            <ul className={styles.list}>
              {socialLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className={styles.link}
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className={styles.bottom}>
          <p className={styles.copyright}>© {year} Maison Élise. All rights reserved.</p>
          <ul className={styles.legal}>
            <li>
              <Link to="/privacy" className={styles.link}>
                Privacy
              </Link>
            </li>
            <li>
              <Link to="/terms" className={styles.link}>
                Terms
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
