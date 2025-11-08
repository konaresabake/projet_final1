# 📝 Notes sur le déploiement en site statique

## Avantages du site statique

✅ **Plus économique** : Les sites statiques sont gratuits sur Render (plan Starter)  
✅ **Plus rapide** : Pas de serveur Node.js à démarrer, fichiers servis directement  
✅ **Plus simple** : Pas besoin de gérer un processus de serveur  
✅ **CDN intégré** : Les fichiers sont servis via le CDN de Render

## Configuration actuelle

Le frontend React est configuré comme un **site statique** dans `render.yaml` :

```yaml
- type: static
  name: yoonu-tabax-frontend
  buildCommand: cd frontend && npm install && npm run build
  staticPublishPath: ./frontend/dist
```

## Processus de déploiement

1. **Build** : Render exécute `npm install && npm run build`
2. **Génération** : Vite génère les fichiers optimisés dans `frontend/dist/`
3. **Publication** : Render sert les fichiers depuis `frontend/dist/`
4. **CDN** : Les fichiers sont distribués via le CDN de Render

## Variables d'environnement

Les variables d'environnement définies dans Render sont injectées lors du build via Vite :

```bash
VITE_API_BASE_URL=https://yoonu-tabax-backend.onrender.com/api
```

⚠️ **Important** : Les variables doivent être préfixées par `VITE_` pour être accessibles dans le code frontend.

## Routage React Router

Pour que React Router fonctionne correctement avec un site statique, assurez-vous que :

1. Toutes les routes sont servies par `index.html` (fallback)
2. Vite est configuré pour gérer le routing côté client

Render gère automatiquement le fallback vers `index.html` pour les sites statiques, donc le routing devrait fonctionner sans configuration supplémentaire.

## Build et déploiement

- **Build automatique** : À chaque push sur la branche configurée
- **Build manuel** : Disponible depuis le dashboard Render
- **Logs de build** : Accessibles dans Render Dashboard → Service → Logs

## Mise à jour

Pour mettre à jour le frontend :
1. Faites vos modifications
2. Commitez et poussez sur Git
3. Render détecte automatiquement le changement
4. Un nouveau build est déclenché
5. Les nouveaux fichiers sont déployés

## Dépannage

### Le site ne se charge pas
- Vérifiez que le build s'est terminé avec succès
- Vérifiez que `dist/` contient `index.html`
- Vérifiez les logs de build dans Render

### Les routes ne fonctionnent pas
- Render gère automatiquement le fallback vers `index.html`
- Vérifiez que React Router est correctement configuré

### L'API ne se connecte pas
- Vérifiez que `VITE_API_BASE_URL` est correctement défini
- Vérifiez que le backend est accessible
- Vérifiez les CORS dans les paramètres Django

