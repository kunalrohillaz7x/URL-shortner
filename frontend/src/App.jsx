import { useState, useEffect } from 'react';
import './App.css';

const API_BASE = 'http://localhost:8000';

function App() {
  const [url, setUrl] = useState('');
  const [shortUrl, setShortUrl] = useState(null);
  const [urls, setUrls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingUrls, setFetchingUrls] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(''), 2000);
  };

  const fetchUrls = async () => {
    setFetchingUrls(true);
    try {
      const res = await fetch(`${API_BASE}/all`);
      if (!res.ok) throw new Error('Failed to fetch URLs');
      const data = await res.json();
      setUrls(data);
    } catch {
      console.error('Failed to fetch URLs');
    } finally {
      setFetchingUrls(false);
    }
  };

  useEffect(() => {
    fetchUrls();
  }, []);

  const handleShorten = async (e) => {
    e.preventDefault();
    setError('');
    setShortUrl(null);

    if (!url.trim()) {
      setError('Please enter a URL');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/shorten`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ original_url: url.trim() }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail?.[0]?.msg || errData.detail || 'Failed to shorten URL');
      }

      const data = await res.json();
      setShortUrl(data.short_url);
      setUrl('');
      fetchUrls();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast('Copied to clipboard!');
    } catch {
      showToast('Failed to copy');
    }
  };

  const handleDelete = async (shortCode) => {
    try {
      const res = await fetch(`${API_BASE}/delete/${shortCode}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete');
      showToast('URL deleted');
      fetchUrls();
    } catch {
      showToast('Failed to delete URL');
    }
  };

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <span className="header__icon">🔗</span>
        <h1 className="header__title">URL Shortener</h1>
        <p className="header__subtitle">Paste a long URL and get a short, shareable link</p>
      </header>

      {/* Shorten Form */}
      <section className="shorten-form">
        <form onSubmit={handleShorten}>
          <div className="shorten-form__card">
            <div className="shorten-form__input-group">
              <input
                id="url-input"
                type="url"
                className="shorten-form__input"
                placeholder="Paste your long URL here..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                autoComplete="off"
              />
              <button
                id="shorten-btn"
                type="submit"
                className="shorten-form__btn"
                disabled={loading}
              >
                {loading ? 'Shortening...' : 'Shorten'}
              </button>
            </div>

            {/* Result */}
            {shortUrl && (
              <div className="result">
                <div className="result__card">
                  <a
                    href={shortUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="result__link"
                  >
                    {shortUrl}
                  </a>
                  <button
                    className="result__copy-btn"
                    onClick={() => handleCopy(shortUrl)}
                    type="button"
                  >
                    📋 Copy
                  </button>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="error">
                <div className="error__card">{error}</div>
              </div>
            )}
          </div>
        </form>
      </section>

      {/* URLs List */}
      <section className="urls-section">
        <div className="urls-section__header">
          <h2 className="urls-section__title">
            Your Links
            <span className="urls-section__count">{urls.length}</span>
          </h2>
          <button className="urls-section__refresh-btn" onClick={fetchUrls} type="button">
            ↻ Refresh
          </button>
        </div>

        <div className="url-list">
          {fetchingUrls ? (
            <div className="loading">Loading URLs...</div>
          ) : urls.length === 0 ? (
            <div className="url-list__empty">
              <span className="url-list__empty-icon">✨</span>
              No shortened URLs yet. Create your first one!
            </div>
          ) : (
            urls.map((item) => (
              <div
                className="url-item"
                key={item.short_code}
                style={{ animationDelay: `${urls.indexOf(item) * 50}ms` }}
              >
                <div className="url-item__short">
                  <a
                    href={item.short_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="url-item__short-link"
                  >
                    {item.short_url}
                  </a>
                  <div className="url-item__actions">
                    <button
                      className="url-item__action-btn"
                      onClick={() => handleCopy(item.short_url)}
                      title="Copy short URL"
                      type="button"
                    >
                      📋
                    </button>
                    <button
                      className="url-item__action-btn url-item__action-btn--delete"
                      onClick={() => handleDelete(item.short_code)}
                      title="Delete URL"
                      type="button"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
                <div className="url-item__original" title={item.original_url}>
                  {item.original_url}
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Toast */}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

export default App;
