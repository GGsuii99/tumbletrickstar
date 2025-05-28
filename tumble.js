const API_KEY = 'e01e2483d3f1206f0ac286e39a8b6188';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w92';
const searchContainer = document.getElementById('searchContainer');
const searchBox = document.getElementById('searchBox');
const resultsDiv = document.getElementById('results');
const body = document.body;

let debounceTimeout;
let specialUnlock = false;
let unlockBuffer = '';

document.addEventListener('keydown', function (e) {
  if (specialUnlock) return;

  if (e.key === 'Enter' && unlockBuffer === '123') {
    specialUnlock = true;
    unlockBuffer = '';
    body.style.background = '#121212';
    searchContainer.style.display = 'flex';
    searchBox.focus();
  } else if (e.key.length === 1) {
    unlockBuffer += e.key;
    if (unlockBuffer.length > 3) unlockBuffer = unlockBuffer.slice(-3);
  }
});

searchBox.addEventListener('input', function () {
  if (!specialUnlock) return;

  const query = this.value.trim();
  if (debounceTimeout) clearTimeout(debounceTimeout);

  if (query.length < 2) {
    resultsDiv.innerHTML = '';
    return;
  }

  debounceTimeout = setTimeout(() => {
    searchAll(query);
  }, 300);
});

async function searchAll(query) {
  resultsDiv.innerHTML = '<div class="no-results">Searching...</div>';

  try {
    const movieUrl = `https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(query)}`;
    const tvUrl = `https://api.themoviedb.org/3/search/tv?api_key=${API_KEY}&query=${encodeURIComponent(query)}`;

    const [movieRes, tvRes] = await Promise.all([fetch(movieUrl), fetch(tvUrl)]);
    const [movieData, tvData] = await Promise.all([movieRes.json(), tvRes.json()]);

    const movies = movieData.results || [];
    const tvShows = tvData.results || [];

    if (movies.length === 0 && tvShows.length === 0) {
      resultsDiv.innerHTML = '<div class="no-results">No results found.</div>';
      return;
    }

    resultsDiv.innerHTML = '';

    function createItem(item, type) {
      const div = document.createElement('div');
      div.className = 'result-item';

      const posterPath = item.poster_path ? IMAGE_BASE_URL + item.poster_path : '';
      const img = document.createElement('img');
      img.src = posterPath || 'https://via.placeholder.com/50x75?text=No+Image';
      img.alt = item.title || item.name;

      const info = document.createElement('div');
      info.className = 'result-info';

      const title = document.createElement('div');
      title.className = 'result-title';
      title.textContent = item.title || item.name;

      const typeLabel = document.createElement('div');
      typeLabel.className = 'result-type';
      typeLabel.textContent = type === 'movie' ? 'Movie' : 'TV Show';

      info.appendChild(title);
      info.appendChild(typeLabel);
      div.appendChild(img);
      div.appendChild(info);

      div.addEventListener('click', () => {
        const tmdbId = item.id;
        const name = (item.title || item.name).toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .trim()
          .replace(/\s+/g, '-');

        const url = `https://iframe.pstream.org/media/tmdb-${type}-${tmdbId}-${name}`;
        window.location.href = url;
      });

      return div;
    }

    movies.forEach(m => resultsDiv.appendChild(createItem(m, 'movie')));
    tvShows.forEach(t => resultsDiv.appendChild(createItem(t, 'tv')));

  } catch (err) {
    resultsDiv.innerHTML = `<div class="no-results">Error: ${err.message}</div>`;
  }
}
