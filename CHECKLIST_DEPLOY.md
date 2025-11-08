# ✅ Checklist de déploiement Render

## Fichiers créés/configurés

### Backend Django
- ✅ `backend/build.sh` - Script de build pour Render
- ✅ `backend/runtime.txt` - Version Python (3.11.0)
- ✅ `backend/Procfile` - Commande de démarrage
- ✅ `backend/requirements.txt` - Ajout de gunicorn, whitenoise, dj-database-url, psycopg2-binary
- ✅ `backend/buildflow_api/settings.py` - Configuration PostgreSQL, CORS, WhiteNoise, sécurité

### Frontend React (Site Statique)
- ✅ `frontend/build.sh` - Script de build (optionnel, commande dans render.yaml)
- ✅ `frontend/package.json` - Script build configuré
- ✅ `frontend/src/lib/api.ts` - Utilisation de VITE_API_BASE_URL
- ✅ `src/lib/api.ts` - Utilisation de VITE_API_BASE_URL
- ✅ `render.yaml` - Type `static` avec `staticPublishPath: ./frontend/dist`

### Configuration Render
- ✅ `render.yaml` - Configuration complète des 3 services (backend, frontend, database)
- ✅ `.env.example` - Exemples de variables d'environnement
- ✅ `.gitignore` - Fichiers à ignorer

### Documentation
- ✅ `DEPLOY.md` - Guide détaillé de déploiement
- ✅ `README_DEPLOY.md` - Guide rapide

## Prochaines étapes

1. **Pousser le code sur Git**
   ```bash
   git add .
   git commit -m "Configure Render deployment"
   git push origin main
   ```

2. **Déployer sur Render**
   - Connectez votre repo à Render
   - Utilisez "Blueprint" avec `render.yaml`
   - Ou créez manuellement les 3 services

3. **Vérifier les variables d'environnement**
   - Backend : DJANGO_SECRET_KEY, DATABASE_URL, FRONTEND_ORIGIN
   - Frontend : VITE_API_BASE_URL

4. **Premier login**
   - Email : admin@yoonu-tabax.com
   - Mot de passe : admin123
   - ⚠️ Changez le mot de passe après le premier login !

## Notes importantes

- Les migrations s'exécutent automatiquement lors du build
- Un utilisateur admin est créé automatiquement si aucun n'existe
- Les fichiers statiques du backend sont servis via WhiteNoise
- Le frontend est déployé en tant que **site statique** (gratuit sur Render)
- CORS est configuré pour accepter le frontend Render
- Le build du frontend génère les fichiers dans `frontend/dist/` qui sont servis directement

