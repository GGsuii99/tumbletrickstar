 const API_KEY = 'e01e2483d3f1206f0ac286e39a8b6188';
  const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w92';

  const resultsDiv = document.getElementById('results');
  let debounceTimeout;
  let query = '';

  document.addEventListener('keydown', (event) => {
    if (event.key.length === 1) { // Only detect single character keys
      query += event.key;

      if (query === '123') {
        resultsDiv.style.display = 'block'; // Show results on typing "123"
        query = ''; // Reset query after unlocking search
      } else if (query.length > 3) {
        debounceTimeout = setTimeout(() => {
          searchAll(query);
        }, 300);
      }
    } else if (event.key === 'Backspace') {
      query = query.slice(0, -1); // Remove last character
    }
  });

  async function searchAll(query) {
    resultsDiv.innerHTML = '<div class="no-results">Searching...</div>';

    try {
      const movieUrl = `https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(query)}&page=1`;
      const tvUrl = `https://api.themoviedb.org/3/search/tv?api_key=${API_KEY}&query=${encodeURIComponent(query)}&page=1`;

      const [movieRes, tvRes] = await Promise.all([fetch(movieUrl), fetch(tvUrl)]);
      if (!movieRes.ok) throw new Error('Movie API error');
      if (!tvRes.ok) throw new Error('TV API error');

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
        img.alt = item.name || item.title;

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
          let name = (item.title || item.name).toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .trim()
            .replace(/\s+/g, '-');

          const redirectUrl = type === 'movie'
            ? `https://iframe.pstream.org/media/tmdb-movie-${tmdbId}-${name}`
            : `https://iframe.pstream.org/media/tmdb-tv-${tmdbId}-${name}`;

          window.location.href = redirectUrl;
        });

        return div;
      }

      movies.forEach(m => resultsDiv.appendChild(createItem(m, 'movie')));
      tvShows.forEach(t => resultsDiv.appendChild(createItem(t, 'tv')));
    } catch (err) {
      resultsDiv.innerHTML = `<div class="no-results">Error: ${err.message}</div>`;
    }
  }
