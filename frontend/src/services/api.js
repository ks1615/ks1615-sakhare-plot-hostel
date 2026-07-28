const API_BASE_URL = '/api';

export async function fetchApi(endpoint, options = {}) {
  const token = localStorage.getItem('sph_token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const contentType = response.headers.get('content-type') || '';

    let data = null;
    let isJson = false;

    if (contentType.includes('application/json')) {
      try {
        data = await response.json();
        isJson = true;
      } catch (e) {
        isJson = false;
      }
    }

    if (!response.ok) {
      let errorMsg;
      if (isJson && data && (data.error || data.message)) {
        errorMsg = data.error || data.message;
      } else {
        const text = await response.text().catch(() => '');
        const cleanText = text.replace(/<[^>]*>?/gm, '').trim();
        errorMsg = cleanText
          ? (cleanText.length > 120 ? `${cleanText.slice(0, 120)}...` : cleanText)
          : `Server HTTP error (${response.status}: ${response.statusText || 'Bad Response'})`;
      }
      throw new Error(errorMsg);
    }

    if (!isJson) {
      const text = await response.text().catch(() => '');
      if (text) {
        try {
          return JSON.parse(text);
        } catch (e) {
          // Fallback if plain string
        }
      }
      throw new Error('Server returned non-JSON response.');
    }

    return data;
  } catch (err) {
    console.error(`API Fetch Error [${endpoint}]:`, err);
    throw err;
  }
}

