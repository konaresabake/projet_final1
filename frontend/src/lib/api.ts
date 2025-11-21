// API Configuration
// Default to localhost for development, use environment variable or remote URL for production
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
  (import.meta.env.DEV 
    ? 'http://localhost:8000/api' 
    : 'https://yoonu-tabax-backend.onrender.com/api');

// Log de l'URL API utilisée en mode développement
if (import.meta.env.DEV) {
  console.log('[API] Configuration:', {
    API_BASE_URL,
    mode: import.meta.env.MODE,
    envVar: import.meta.env.VITE_API_BASE_URL || 'non défini'
  });
  
  // Vérifier si le backend est accessible au démarrage (ne pas bloquer si échec)
  setTimeout(() => {
    fetch(`${API_BASE_URL.replace('/api', '')}/api/`, { 
      method: 'HEAD',
      signal: AbortSignal.timeout(3000) // Timeout après 3 secondes
    }).then(response => {
      if (response.ok || response.status === 404) {
        console.log('[API] ✅ Backend accessible sur', API_BASE_URL);
      }
    }).catch((err) => {
      if (err.name !== 'AbortError') {
        console.warn('[API] ⚠️ Backend non accessible. Pour démarrer le backend:', '\n',
          '  cd backend\n',
          '  python manage.py runserver 0.0.0.0:8000\n',
          'URL attendue:', API_BASE_URL);
      }
    });
  }, 1000); // Attendre 1 seconde avant de vérifier
}

// Types pour les erreurs API
interface ApiErrorResponse {
  error?: string;
  detail?: string;
  [key: string]: unknown;
}

interface ApiError extends Error {
  response?: {
    data: ApiErrorResponse;
    status: number;
  };
}

// Generic API request handler
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  // Nettoyer l'endpoint pour éviter les doubles slashes
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${API_BASE_URL}${cleanEndpoint}`;
  
  // Récupérer le token depuis localStorage
  const token = localStorage.getItem('token');
  
  const config: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  };

  try {
    // Log pour le débogage (uniquement pour les requêtes non-GET ou en mode verbose)
    if (import.meta.env.DEV && (options.method && options.method !== 'GET')) {
      console.log(`[API] ${options.method || 'GET'} ${url}`);
    }
    
    const response = await fetch(url, config);
    
    // Gérer les erreurs 404 pour les requêtes GET AVANT de lire le body
    // Cela évite que le navigateur affiche l'erreur dans la console
    if (response.status === 404 && (options.method === 'GET' || !options.method)) {
      // Ne pas lire le body pour les 404 GET, retourner directement un tableau vide
      if (import.meta.env.DEV) {
        console.debug(`[API] 404 ignoré pour GET: ${url} - Retour d'un tableau vide`);
      }
      return [] as T;
    }
    
    // Lire le texte de la réponse une seule fois (on ne peut le faire qu'une fois)
    let responseText: string | null = null;
    try {
      responseText = await response.text();
    } catch (e) {
      responseText = '';
    }
    
    // Si le token est expiré (401), essayer de le rafraîchir
    if (response.status === 401) {
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh: refreshToken }),
          });
          
          if (refreshResponse.ok) {
            const { access } = await refreshResponse.json();
            localStorage.setItem('token', access);
            
            // Réessayer la requête originale avec le nouveau token
            config.headers = {
              ...config.headers,
              Authorization: `Bearer ${access}`,
            };
            const retryResponse = await fetch(url, config);
            if (!retryResponse.ok) {
              const retryText = await retryResponse.text();
              let errorData: ApiErrorResponse = {};
              try {
                errorData = retryText ? JSON.parse(retryText) : {};
              } catch {
                errorData = { error: `HTTP error! status: ${retryResponse.status}` };
              }
              const error = new Error(errorData.error || errorData.detail || `HTTP error! status: ${retryResponse.status}`) as ApiError;
              error.response = { data: errorData, status: retryResponse.status };
              throw error;
            }
            const retryText = await retryResponse.text();
            return retryText ? JSON.parse(retryText) : ([] as T);
          }
        } catch (refreshError) {
          // Si le refresh échoue, supprimer les tokens et rediriger vers login
          localStorage.removeItem('token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user');
          window.location.href = '/login';
          throw new Error('Session expirée. Veuillez vous reconnecter.');
        }
      }
    }
    
    if (!response.ok) {
      // Pour les 404 sur GET, on a déjà géré le cas ci-dessus avant la lecture du body
      if (response.status === 404 && (options.method === 'GET' || !options.method)) {
        return [] as T;
      }
      
      // Pour les autres erreurs, logger seulement si ce n'est pas un 404 GET
      let errorData: ApiErrorResponse = {};
      try {
        errorData = responseText ? JSON.parse(responseText) : {};
      } catch (e) {
        errorData = { error: `HTTP error! status: ${response.status}` };
      }
      
      const error = new Error(errorData.error || errorData.detail || `HTTP error! status: ${response.status}`) as ApiError;
      error.response = { data: errorData, status: response.status };
      
      // Ne logger les erreurs que si ce n'est pas un 404 GET (déjà géré silencieusement)
      if (!(response.status === 404 && (options.method === 'GET' || !options.method))) {
        console.error('[API Error]:', {
          url,
          method: options.method || 'GET',
          status: response.status,
          statusText: response.statusText,
          error: errorData,
          responseText: responseText?.substring(0, 200)
        });
      }
      
      throw error;
    }
    
    // Parser la réponse JSON de manière sécurisée
    try {
      if (!responseText || responseText.trim() === '') {
        // Pour les requêtes GET, retourner un tableau vide au lieu de null
        if (options.method === 'GET' || !options.method) {
          return [] as T;
        }
        return null as T;
      }
      const parsed = JSON.parse(responseText);
      
      // Pour les endpoints de liste (GET), s'assurer qu'on retourne un tableau
      // Vérifier si c'est une liste (pas un détail avec UUID ou ID numérique)
      const isListEndpoint = (options.method === 'GET' || !options.method) && 
        (endpoint.endsWith('/projets/') || endpoint.endsWith('/chantiers/') || endpoint.endsWith('/budgets/')) &&
        !endpoint.match(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\//) && // Pas d'UUID
        !endpoint.match(/\/\d+\//); // Pas d'ID numérique
      
      if (isListEndpoint) {
        if (!Array.isArray(parsed)) {
          // Si DRF retourne un objet paginé, extraire les résultats
          if (parsed && typeof parsed === 'object' && 'results' in parsed && Array.isArray(parsed.results)) {
            return parsed.results as T;
          }
          // Si c'est un objet avec une erreur, retourner un tableau vide
          if (parsed && typeof parsed === 'object' && 'error' in parsed) {
            console.warn('Backend retourne une erreur au lieu d\'un tableau:', parsed);
            return [] as T;
          }
          // Si c'est un objet unique, le convertir en tableau
          return [parsed] as T;
        }
      }
      
      return parsed as T;
    } catch (e) {
      // Si la réponse n'est pas du JSON valide
      if (options.method === 'GET' || !options.method) {
        console.warn('Réponse non-JSON reçue, retour d\'un tableau vide');
        return [] as T;
      }
      throw new Error('Réponse invalide du serveur');
    }
  } catch (error) {
    // Détecter les erreurs de connexion réseau
    const isNetworkError = error instanceof TypeError && 
      (error.message === 'Failed to fetch' || 
       error.message.includes('ERR_CONNECTION_CLOSED') ||
       error.message.includes('NetworkError'));
    
    if (isNetworkError) {
      const backendUrl = API_BASE_URL.replace('/api', '');
      console.warn('[API] Erreur de connexion réseau:', {
        url,
        backendBase: backendUrl,
        message: 'Le backend n\'est peut-être pas accessible. Vérifiez qu\'il est démarré sur',
        expectedUrl: backendUrl
      });
      
      // Pour les requêtes GET, retourner un tableau vide au lieu de lancer une erreur
      if (!options.method || options.method === 'GET') {
        console.warn('[API] Retour d\'un tableau vide pour la requête GET échouée');
        return [] as T;
      }
      
      // Pour les autres méthodes, créer une erreur avec un message clair
      const networkError = new Error(`Impossible de se connecter au serveur (${backendUrl}). Vérifiez que le backend est démarré.`) as ApiError;
      networkError.response = { 
        data: { error: 'Erreur de connexion réseau' }, 
        status: 0 
      };
      throw networkError;
    }
    
    console.error('API request failed:', error);
    throw error;
  }
}

// API Service
export const api = {
  // GET request
  get: <T>(endpoint: string, options?: RequestInit) =>
    apiRequest<T>(endpoint, { ...options, method: 'GET' }),

  // POST request
  post: <T>(endpoint: string, data?: unknown, options?: RequestInit) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // PUT request
  put: <T>(endpoint: string, data?: unknown, options?: RequestInit) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // PATCH request
  patch: <T>(endpoint: string, data?: unknown, options?: RequestInit) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  // DELETE request
  delete: <T>(endpoint: string, options?: RequestInit) =>
    apiRequest<T>(endpoint, { ...options, method: 'DELETE' }),
};

export default api;
