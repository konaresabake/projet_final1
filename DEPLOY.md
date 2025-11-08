# Guide de déploiement sur Render

Ce guide vous explique comment déployer le backend Django et le frontend React sur Render.

## Prérequis

1. Un compte Render (https://render.com)
2. Un dépôt Git (GitHub, GitLab, ou Bitbucket)
3. Le code poussé sur votre dépôt

## Structure du projet

```
buildflow-dashboards-86838-main/
├── backend/          # Application Django
├── frontend/         # Application React/Vite
└── render.yaml       # Configuration Render
```

## Étape 1: Préparer le dépôt Git

1. Initialisez un dépôt Git si ce n'est pas déjà fait :
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <votre-repo-url>
git push -u origin main
```

## Étape 2: Déployer sur Render

### Option A: Utiliser render.yaml (Recommandé)

1. Connectez votre dépôt GitHub/GitLab à Render
2. Dans le dashboard Render, cliquez sur "New" → "Blueprint"
3. Sélectionnez votre dépôt et le fichier `render.yaml`
4. Render créera automatiquement :
   - Le service backend Django
   - Le service frontend React
   - La base de données PostgreSQL

### Option B: Déploiement manuel

#### 2.1 Déployer la base de données PostgreSQL

1. Dans Render Dashboard → "New" → "PostgreSQL"
2. Configurez :
   - **Name**: `yoonu-tabax-db`
   - **Database**: `yoonu_tabax`
   - **User**: `yoonu_tabax_user`
   - **Region**: Frankfurt (ou votre choix)
   - **Plan**: Starter (gratuit)
3. Créez la base de données
4. Copiez la **Internal Database URL** (sera utilisée comme `DATABASE_URL`)

#### 2.2 Déployer le Backend Django

1. Dans Render Dashboard → "New" → "Web Service"
2. Connectez votre dépôt Git
3. Configurez :
   - **Name**: `yoonu-tabax-backend`
   - **Region**: Frankfurt
   - **Branch**: `main` (ou votre branche)
   - **Root Directory**: `backend`
   - **Environment**: `Python 3`
   - **Build Command**: `./build.sh` (ou `chmod +x build.sh && ./build.sh`)
   - **Start Command**: `gunicorn buildflow_api.wsgi:application --bind 0.0.0.0:$PORT`
4. Variables d'environnement :
   ```
   PYTHON_VERSION=3.11.0
   DJANGO_SECRET_KEY=<généré-automatiquement-ou-votre-clé>
   DJANGO_DEBUG=0
   DJANGO_ALLOWED_HOSTS=yoonu-tabax-backend.onrender.com
   DATABASE_URL=<url-de-la-base-de-données-postgresql>
   FRONTEND_ORIGIN=https://yoonu-tabax-frontend.onrender.com
   DJANGO_SETTINGS_MODULE=buildflow_api.settings
   ```
5. Créez le service

#### 2.3 Déployer le Frontend React (Site Statique)

1. Dans Render Dashboard → "New" → "Static Site"
2. Connectez votre dépôt Git
3. Configurez :
   - **Name**: `yoonu-tabax-frontend`
   - **Region**: Frankfurt
   - **Branch**: `main` (ou votre branche)
   - **Root Directory**: `frontend` (optionnel)
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist` (ou `frontend/dist` si Root Directory est défini)
4. Variables d'environnement :
   ```
   NODE_VERSION=18.18.0
   VITE_API_BASE_URL=https://yoonu-tabax-backend.onrender.com/api
   ```
5. Créez le service

## Étape 3: Configurer les variables d'environnement

### Backend

Dans Render Dashboard → Votre service backend → "Environment" :

```
DJANGO_SECRET_KEY=<générez-une-clé-secrète>
DJANGO_DEBUG=0
DJANGO_ALLOWED_HOSTS=yoonu-tabax-backend.onrender.com
DATABASE_URL=<url-de-postgresql-depuis-render>
FRONTEND_ORIGIN=https://yoonu-tabax-frontend.onrender.com
```

**Pour générer une clé secrète Django** :
```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

### Frontend

Dans Render Dashboard → Votre service frontend → "Environment" :

```
VITE_API_BASE_URL=https://yoonu-tabax-backend.onrender.com/api
```

**Important**: Remplacez `yoonu-tabax-backend.onrender.com` par l'URL réelle de votre service backend Render.

## Étape 4: Migrations de base de données

Les migrations s'exécutent automatiquement lors du build grâce au script `build.sh`.

Si vous devez les exécuter manuellement :

1. Dans Render Dashboard → Backend service → "Shell"
2. Exécutez :
```bash
cd backend
python manage.py migrate
python manage.py createsuperuser  # Pour créer un admin Django
```

## Étape 5: Vérifier le déploiement

1. **Backend** : Visitez `https://yoonu-tabax-backend.onrender.com/api/`
   - Vous devriez voir la page d'API Django REST Framework
   
2. **Frontend** : Visitez `https://yoonu-tabax-frontend.onrender.com`
   - L'application React devrait se charger (site statique)
   - Les fichiers sont servis directement depuis le dossier `dist/`

3. **Test API** : Visitez `https://yoonu-tabax-backend.onrender.com/api/projets/`
   - Devrait retourner une liste de projets (vide si aucune donnée)

**Note** : Le frontend est déployé en tant que **site statique**, ce qui est plus économique et performant qu'un service web. Les fichiers sont générés lors du build et servis directement par Render.

## Dépannage

### Backend ne démarre pas

1. Vérifiez les logs dans Render Dashboard
2. Vérifiez que `DJANGO_SECRET_KEY` est défini
3. Vérifiez que `DATABASE_URL` est correct
4. Vérifiez que les migrations sont appliquées

### Frontend ne peut pas se connecter au backend

1. Vérifiez que `VITE_API_BASE_URL` est correct
2. Vérifiez les CORS dans `settings.py`
3. Vérifiez que le backend est démarré

### Erreurs de build

1. Vérifiez que tous les fichiers sont committés dans Git
2. Vérifiez les logs de build dans Render
3. Vérifiez que `build.sh` a les permissions d'exécution

## Notes importantes

- **Fichiers statiques** : Les fichiers statiques sont servis via WhiteNoise
- **Base de données** : SQLite est utilisé en développement, PostgreSQL en production
- **CORS** : Configuré automatiquement pour accepter le frontend Render
- **Build** : Les scripts `build.sh` s'occupent des migrations et collecte des fichiers statiques

## Commandes utiles

### Générer une nouvelle clé secrète Django
```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

### Créer un superutilisateur
```bash
cd backend
python manage.py createsuperuser
```

### Vérifier les migrations
```bash
cd backend
python manage.py showmigrations
```

## Support

Pour plus d'aide :
- Documentation Render : https://render.com/docs
- Logs : Render Dashboard → Votre service → "Logs"

