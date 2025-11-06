# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/13b22912-705f-470f-9120-847ee24488be

## Démarrage rapide (Backend Django + Frontend Vite)

### Backend (Django REST API)

1. Prérequis: Python 3.11+ recommandé.
2. Installation des dépendances:

```sh
cd backend
python -m venv .venv
. .venv/Scripts/activate  # Windows PowerShell
pip install -r requirements.txt
```

3. Initialisation de la base et lancement du serveur:

```sh
python manage.py makemigrations
python manage.py migrate
python manage.py runserver 0.0.0.0:8000
```

- API disponible sur `http://localhost:8000/api`
- Endpoints principaux:
  - `GET/POST /api/projets/`
  - `GET/POST /api/chantiers/?projet_id=<uuid>` (créer/mettre à jour: utiliser `projet: <uuid>`)
  - `GET/POST /api/lots/?chantier_id=<uuid>` (créer/mettre à jour: `chantier: <uuid>`)
  - `GET/POST /api/taches/?lot_id=<uuid>` (créer/mettre à jour: `lot: <uuid>`)
- Auth JWT (optionnel déjà configuré):
  - `POST /api/auth/token/` et `/api/auth/refresh/`
- CORS autorise par défaut `http://localhost:5173`

### Frontend (Vite + React)

1. Installation:
```sh
npm i
```
2. Lancement:
```sh
npm run dev
```
3. Le frontend consomme l’API Django via `src/lib/api.ts` (base: `http://localhost:8000/api`).

### Notes de compatibilité
- Les hooks (`useProjets`, `useChantiers`, `useLots`, `useTaches`) appellent désormais l’API Django.
- Pour les entités liées, les filtres se font via `?projet_id=`, `?chantier_id=`, `?lot_id=`.
- Lors des créations/mises à jour:
  - `Chantier` attend `projet` (UUID) en écriture, mais expose `projet_id` en lecture.
  - `Lot` attend `chantier` (UUID), expose `chantier_id`.
  - `Tache` attend `lot` (UUID), expose `lot_id`.

---

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/13b22912-705f-470f-9120-847ee24488be) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/13b22912-705f-470f-9120-847ee24488be) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
