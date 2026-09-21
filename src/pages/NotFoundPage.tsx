import { Link } from 'react-router-dom';
import page from '../styles/page.module.css';
import ui from '../styles/ui.module.css';

export function NotFoundPage() {
  return (
    <>
      <header className={page.header}>
        <h1 className={page.title}>Page not found</h1>
        <p className={page.lede}>That address does not match any part of the library.</p>
      </header>
      <Link className={ui.btn} to="/">
        Back to home
      </Link>
    </>
  );
}
