from rest_framework.routers import DefaultRouter
from django.urls import path, include
from .views import (
    ProjetViewSet,
    ChantierViewSet,
    LotViewSet,
    TacheViewSet,
    UtilisateurViewSet,
    IAViewSet,
    AlerteViewSet,
    BudgetViewSet,
    RapportViewSet,
    RessourceViewSet,
    RessourceHumaineViewSet,
    RessourceMaterielleViewSet,
    FournisseurViewSet,
    ContactMessageViewSet,
    register,
    login,
)
from .views_acteurs import (
    # Administrateur
    admin_creer_compte,
    admin_valider_etape,
    # Maître d'Ouvrage
    maitre_ouvrage_creer_projet,
    maitre_ouvrage_definir_budget,
    maitre_ouvrage_consulter_rapport,
    maitre_ouvrage_definir_delais,
    maitre_ouvrage_controler_projets,
    # Chef de Projet
    chef_projet_ajouter_chantier,
    chef_projet_ajouter_lot,
    chef_projet_ajouter_taches,
    chef_projet_suivre_avancement,
    chef_projet_generer_rapport,
    # Membre Technique
    membre_technique_executer_tache,
    membre_technique_declarer_alerte,
    membre_technique_declarer_probleme,
    membre_technique_mettre_a_jour_statut,
)

router = DefaultRouter()
router.register(r'projets', ProjetViewSet, basename='projet')
router.register(r'chantiers', ChantierViewSet, basename='chantier')
router.register(r'lots', LotViewSet, basename='lot')
router.register(r'taches', TacheViewSet, basename='tache')
router.register(r'utilisateurs', UtilisateurViewSet, basename='utilisateur')
router.register(r'ia', IAViewSet, basename='ia')
router.register(r'alertes', AlerteViewSet, basename='alerte')
router.register(r'budgets', BudgetViewSet, basename='budget')
router.register(r'rapports', RapportViewSet, basename='rapport')
router.register(r'ressources', RessourceViewSet, basename='ressource')
router.register(r'ressources-humaines', RessourceHumaineViewSet, basename='ressourcehumaine')
router.register(r'ressources-materielles', RessourceMaterielleViewSet, basename='ressourcematerielle')
router.register(r'fournisseurs', FournisseurViewSet, basename='fournisseur')
router.register(r'contact-messages', ContactMessageViewSet, basename='contactmessage')

urlpatterns = [
    path('', include(router.urls)),
    path('auth/register/', register, name='register'),
    path('auth/login/', login, name='login'),
    # Endpoints Administrateur
    path('acteurs/admin/creer-compte/', admin_creer_compte, name='admin_creer_compte'),
    path('acteurs/admin/valider-etape/<uuid:projet_id>/', admin_valider_etape, name='admin_valider_etape'),
    # Endpoints Maître d'Ouvrage
    path('acteurs/maitre-ouvrage/creer-projet/', maitre_ouvrage_creer_projet, name='maitre_ouvrage_creer_projet'),
    path('acteurs/maitre-ouvrage/definir-budget/<uuid:projet_id>/', maitre_ouvrage_definir_budget, name='maitre_ouvrage_definir_budget'),
    path('acteurs/maitre-ouvrage/consulter-rapport/<uuid:projet_id>/', maitre_ouvrage_consulter_rapport, name='maitre_ouvrage_consulter_rapport'),
    path('acteurs/maitre-ouvrage/definir-delais/<uuid:projet_id>/', maitre_ouvrage_definir_delais, name='maitre_ouvrage_definir_delais'),
    path('acteurs/maitre-ouvrage/controler-projets/', maitre_ouvrage_controler_projets, name='maitre_ouvrage_controler_projets'),
    # Endpoints Chef de Projet
    path('acteurs/chef-projet/ajouter-chantier/<uuid:projet_id>/', chef_projet_ajouter_chantier, name='chef_projet_ajouter_chantier'),
    path('acteurs/chef-projet/ajouter-lot/<uuid:chantier_id>/', chef_projet_ajouter_lot, name='chef_projet_ajouter_lot'),
    path('acteurs/chef-projet/ajouter-taches/<uuid:lot_id>/', chef_projet_ajouter_taches, name='chef_projet_ajouter_taches'),
    path('acteurs/chef-projet/suivre-avancement/<uuid:projet_id>/', chef_projet_suivre_avancement, name='chef_projet_suivre_avancement'),
    path('acteurs/chef-projet/generer-rapport/<uuid:projet_id>/', chef_projet_generer_rapport, name='chef_projet_generer_rapport'),
    # Endpoints Membre Technique
    path('acteurs/membre-technique/executer-tache/<uuid:tache_id>/', membre_technique_executer_tache, name='membre_technique_executer_tache'),
    path('acteurs/membre-technique/declarer-alerte/<uuid:projet_id>/', membre_technique_declarer_alerte, name='membre_technique_declarer_alerte'),
    path('acteurs/membre-technique/declarer-probleme/<uuid:tache_id>/', membre_technique_declarer_probleme, name='membre_technique_declarer_probleme'),
    path('acteurs/membre-technique/mettre-a-jour-statut/<uuid:tache_id>/', membre_technique_mettre_a_jour_statut, name='membre_technique_mettre_a_jour_statut'),
]
