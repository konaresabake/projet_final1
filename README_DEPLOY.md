# 🚀 Guide de déploiement sur Render - Yoonu-Tabax

## 📋 Vue d'ensemble

Ce projet comprend :
- **Backend** : Django REST Framework (Python)
- **Frontend** : React + Vite + TypeScript
- **Base de données** : PostgreSQL (production) / SQLite (développement)

## ⚡ Déploiement rapide avec render.yaml

### Étape 1 : Préparer le dépôt

```bash
# Assurez-vous que tous les fichiers sont commités
git add .
git commit -m "Prepare for Render deployment"
git push origin main
```

### Étape 2 : Déployer sur Render

1. Connectez-vous à [Render Dashboard](https://dashboard.render.com)
2. Cliquez sur **"New"** → **"Blueprint"**
3. Connectez votre dépôt GitHub/GitLab
4. Render détectera automatiquement `render.yaml`
5. Cliquez sur **"Apply"** pour créer les services

Render créera automatiquement :
- ✅ Base de données PostgreSQL
- ✅ Service backend Django
- ✅ Service frontend React
- ✅ Variables d'environnement configurées

## 🔧 Configuration manuelle (si nécessaire)

### Backend Django

**Variables d'environnement requises :**
```
DJANGO_SECRET_KEY=<généré-automatiquement>
DJANGO_DEBUG=0
DJANGO_ALLOWED_HOSTS=yoonu-tabax-backend.onrender.com
DATABASE_URL=<fourni-par-render>
FRONTEND_ORIGIN=https://yoonu-tabax-frontend.onrender.com
```

**Build Command :**
```bash
chmod +x build.sh && ./build.sh
```

**Start Command :**
```bash
gunicorn buildflow_api.wsgi:application --bind 0.0.0.0:$PORT
```

### Frontend React (Site Statique)

**Variables d'environnement requises :**
```
VITE_API_BASE_URL=https://yoonu-tabax-backend.onrender.com/api
```

**Build Command :**
```bash
npm install && npm run build
```

**Publish Directory :**
```
dist
```

**Note** : Le frontend est déployé en tant que **site statique**, ce qui signifie que Render sert directement les fichiers générés dans le dossier `dist/` après le build. Aucune commande de démarrage n'est nécessaire.

## 📝 Notes importantes

1. **Premier déploiement** : Le script `build.sh` crée automatiquement un utilisateur admin par défaut :
   - Email : `admin@yoonu-tabax.com`
   - Mot de passe : `admin123`
   - ⚠️ **Changez ce mot de passe après le premier login !**

2. **Base de données** : Les migrations s'exécutent automatiquement lors du build

3. **CORS** : Configuré automatiquement pour accepter le frontend Render

4. **Fichiers statiques** : Servis via WhiteNoise

## 🐛 Dépannage

### Backend ne démarre pas
- Vérifiez les logs dans Render Dashboard
- Vérifiez que `DJANGO_SECRET_KEY` est défini
- Vérifiez que `DATABASE_URL` est correct

### Frontend ne se connecte pas au backend
- Vérifiez que `VITE_API_BASE_URL` pointe vers l'URL backend
- Vérifiez les logs du backend pour les erreurs CORS

### Erreurs de build
- Vérifiez que tous les fichiers sont dans Git
- Vérifiez les permissions du script `build.sh`
- Consultez les logs de build dans Render

## 📚 Ressources

- [Documentation Render](https://render.com/docs)
- [Guide détaillé](./DEPLOY.md)

