# 🚀 Guide de démarrage rapide

## ⚠️ Résolution de l'erreur 404

L'erreur **"Failed to load resource: the server responded with a status of 404"** signifie que le backend Django n'est pas démarré.

## 📋 Étapes pour démarrer l'application

### 1. Démarrer le Backend Django (OBLIGATOIRE)

Ouvrez un terminal dans le dossier `backend` :

```bash
cd buildflow-dashboards-86838-main/backend

# Activer l'environnement virtuel (si vous en avez un)
# Windows PowerShell:
.venv\Scripts\Activate.ps1

# Installer les dépendances (si pas déjà fait)
pip install -r requirements.txt

# Créer les migrations si nécessaire
python manage.py makemigrations

# Appliquer les migrations
python manage.py migrate

# Démarrer le serveur Django
python manage.py runserver 0.0.0.0:8000
```

**✅ Vous devriez voir :**
```
Starting development server at http://0.0.0.0:8000/
Quit the server with CTRL-BREAK.
```

**🌐 Vérifiez que l'API fonctionne :**
Ouvrez votre navigateur et allez sur : `http://localhost:8000/api/`

Vous devriez voir la page d'API Django REST Framework.

### 2. Démarrer le Frontend React

Ouvrez un **nouveau terminal** dans le dossier `frontend` :

```bash
cd buildflow-dashboards-86838-main/frontend

# Installer les dépendances (si pas déjà fait)
npm install

# Démarrer le serveur de développement
npm run dev
```

**✅ Vous devriez voir :**
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:8080/
  ➜  Network: use --host to expose
```

### 3. Accéder à l'application

Ouvrez votre navigateur sur : **http://localhost:8080**

## ✅ Vérification

1. **Backend accessible ?** → `http://localhost:8000/api/` doit afficher la page API
2. **Frontend accessible ?** → `http://localhost:8080` doit afficher l'application
3. **Plus d'erreur 404 ?** → Les erreurs 404 sont maintenant gérées silencieusement

## 🔧 Dépannage

### Erreur 404 persiste ?

1. Vérifiez que le backend est bien démarré sur le port 8000
2. Vérifiez dans la console du navigateur (F12) les logs `[API]`
3. Assurez-vous qu'aucun autre service n'utilise le port 8000

### Le backend ne démarre pas ?

- Vérifiez que Python 3.11+ est installé
- Vérifiez que toutes les dépendances sont installées : `pip install -r requirements.txt`
- Vérifiez les erreurs dans le terminal où vous avez lancé le backend

### Le frontend ne se connecte pas au backend ?

- Vérifiez que `VITE_API_BASE_URL` n'est pas définie dans un fichier `.env` avec une mauvaise URL
- Vérifiez la console du navigateur pour voir l'URL API utilisée
- En développement, l'URL par défaut est : `http://localhost:8000/api`

## 📝 Note importante

**Les erreurs 404 dans la console du navigateur sont normales** si le backend n'est pas démarré. 
L'application continue de fonctionner car ces erreurs sont maintenant gérées automatiquement.
Elles retournent simplement un tableau vide au lieu de planter l'application.


