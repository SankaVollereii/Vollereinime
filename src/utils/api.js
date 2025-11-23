const API_BASE_URL = "https://www.sankavollerei.com/anime/kura";

/**
 * Fetch search results based on a query.
 * Endpoint: /search/:keyword
 * @param {string} query - The search query.
 * @returns {Promise<object>} - Fetched JSON data.
 */
export async function fetchSearchData(query) {
  try {
    if (!query) {
      console.warn("Search query is empty.");
      return { results: [] };
    }
    const url = `${API_BASE_URL}/search/${encodeURIComponent(query)}`;
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`API search failed with status: ${response.status}`);
    }
    const data = await response.json();
    return data; 
  } catch (error) {
    console.error("Error fetching search data:", error);
    return { results: [] };
  }
}

/**
 * Fetch anime schedule data.
 * Endpoint: /schedule
 * @param {string} [day] - Optional day (e.g., 'monday').
 * @returns {Promise<object>} - Fetched JSON data.
 */
export async function fetchScheduleData(day = 'all', page = 1) {
  try {
    const params = new URLSearchParams();
    if (day) params.append("scheduled_day", day.toLowerCase()); 
    if (page) params.append("page", page.toString());
    const url = `${API_BASE_URL}/schedule?${params.toString()}`;
    const response = await fetch(url);
    if (!response.ok) {
        console.error(`API schedule failed: ${response.status}`);
        return { results: [], pagination: {} };
    }
    return await response.json(); 
  } catch (error) {
    console.error("Error fetching schedule data:", error);
    return { results: [], pagination: {} };
  }
}

/**
 * Fetch data from the given endpoint
 * Handles automatic mapping for 'quick' endpoints (ongoing, finished, movie, donghua).
 * * @param {string} endpoint - API endpoint (e.g., "home", "ongoing", "quick/movie")
 * @param {number} [page] - Optional page number for pagination
 * @returns {Promise<object>} - Fetched JSON data
 */
export async function fetchData(endpoint, page = null) {
  try {
    let finalEndpoint = endpoint;
    const quickEndpoints = ['ongoing', 'finished', 'movie', 'donghua', 'completed'];
    if (quickEndpoints.includes(endpoint)) {
      finalEndpoint = `quick/${endpoint}`;
    }

    const url = page
      ? `${API_BASE_URL}/${finalEndpoint}?page=${page}`
      : `${API_BASE_URL}/${finalEndpoint}`;

    const response = await fetch(url);
    
    if (!response.ok) {
        throw new Error(`Failed to fetch ${finalEndpoint}: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error fetching data for ${endpoint}:`, error);
    return null;
  }
}

/**
 * Fetch anime data by ID and slug.
 * Endpoint: /anime/:id/:slug
 * @param {string} id - Anime ID.
 * @param {string} slug - Anime slug.
 * @returns {Promise<object|null>}
 */
export async function fetchAnimeData(id, slug) {
  try {
    const url = `${API_BASE_URL}/anime/${id}/${slug}`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error("Anime not found");
    return await response.json();
  } catch (error) {
    console.error("Error fetching anime data:", error);
    return null;
  }
}

/**
 * Fetch watch data (video dan navigasi) untuk episode tertentu.
 * Endpoint: /watch/:id/:slug/:episode
 * @param {string} id - Anime ID.
 * @param {string} slug - Anime slug.
 * @param {number|string} episode - Episode number.
 * @returns {Promise<object|null>}
 */
export async function fetchWatchData(id, slug, episode) {
  try {
    const url = `${API_BASE_URL}/watch/${id}/${slug}/${episode}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error("Video not found");
    return await response.json();
  } catch (error) {
    console.error("Error fetching watch data:", error);
    return null;
  }
}

/**
 * BONUS: Helper untuk Properties (Genre, Season, Studio, dll)
 * Endpoint: /properties/:type/:slug (optional)
 */
export async function fetchProperties(type, slug = null) {
    try {
      const url = slug 
        ? `${API_BASE_URL}/properties/${type}/${slug}`
        : `${API_BASE_URL}/properties/${type}`;
        
      const response = await fetch(url);
      return await response.json();
    } catch (error) {
      console.error(`Error fetching properties ${type}:`, error);
      return null;
    }
}
