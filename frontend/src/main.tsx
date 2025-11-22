import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Intercepter les erreurs 404 dans la console pour les masquer
if (typeof window !== 'undefined') {
  // Intercepter console.error pour filtrer les messages 404
  const originalError = console.error;
  console.error = function(...args: unknown[]) {
    const message = String(args[0] || '');
    // Filtrer les messages d'erreur 404 pour les ressources
    if (message.includes('Failed to load resource') && message.includes('404')) {
      // Ne pas afficher ces erreurs - elles sont gérées silencieusement
      return;
    }
    originalError.apply(console, args);
  };

  // Intercepter les erreurs réseau non capturées
  window.addEventListener('unhandledrejection', (event) => {
    const message = String(event.reason || '');
    if (message.includes('404') || message.includes('Failed to fetch')) {
      // Empêcher l'affichage des erreurs 404 non gérées
      event.preventDefault();
    }
  });
}

createRoot(document.getElementById("root")!).render(<App />);
