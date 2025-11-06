from rest_framework import status
from rest_framework.decorators import api_view, action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Utilisateur, Projet, Chantier, Lot, Tache, Rapport, Alerte
from .serializers import (
    ProjetSerializer, ChantierSerializer, LotSerializer, TacheSerializer,
    RapportSerializer, AlerteSerializer, UtilisateurListSerializer
)


def get_current_user(request):
    """Récupérer l'utilisateur actuel depuis le token JWT"""
    # Note: Dans un vrai système, on utiliserait request.user depuis JWT
    # Pour l'instant, on récupère via email depuis le token
    email = getattr(request, 'email', None) or request.data.get('email')
    if not email:
        return None
    try:
        return Utilisateur.objects.get(email=email)
    except Utilisateur.DoesNotExist:
        return None


# ===== ENDPOINTS ADMINISTRATEUR =====

@api_view(['POST'])
def admin_creer_compte(request):
    """Créer un compte utilisateur (Administrateur uniquement)"""
    user = get_current_user(request)
    if not user or user.role != 'ADMINISTRATEUR':
        return Response({'error': 'Accès refusé. Seuls les administrateurs peuvent créer des comptes.'}, 
                       status=status.HTTP_403_FORBIDDEN)
    
    nom = request.data.get('nom')
    email = request.data.get('email')
    mot_de_passe = request.data.get('mot_de_passe')
    role = request.data.get('role')
    
    if not all([nom, email, mot_de_passe, role]):
        return Response({'error': 'Tous les champs sont requis'}, status=status.HTTP_400_BAD_REQUEST)
    
    if role == 'ADMINISTRATEUR':
        return Response({'error': 'Les administrateurs doivent être créés manuellement'}, 
                       status=status.HTTP_400_BAD_REQUEST)
    
    try:
        nouvel_utilisateur = user.creer_compte(nom, email, mot_de_passe, role)
        return Response({
            'message': 'Compte créé avec succès',
            'user': UtilisateurListSerializer(nouvel_utilisateur).data
        }, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
def admin_valider_etape(request, projet_id):
    """Valider une étape du projet (Administrateur)"""
    user = get_current_user(request)
    if not user or user.role != 'ADMINISTRATEUR':
        return Response({'error': 'Accès refusé'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        projet = Projet.objects.get(id=projet_id)
        user.valider_etape(projet)
        return Response({'message': 'Étape validée avec succès'}, status=status.HTTP_200_OK)
    except Projet.DoesNotExist:
        return Response({'error': 'Projet non trouvé'}, status=status.HTTP_404_NOT_FOUND)


# ===== ENDPOINTS MAÎTRE D'OUVRAGE =====

@api_view(['POST'])
def maitre_ouvrage_creer_projet(request):
    """Créer un nouveau projet (Maître d'Ouvrage)"""
    user = get_current_user(request)
    if not user or user.role != 'MAITRE_OUVRAGE':
        return Response({'error': 'Accès refusé. Seuls les maîtres d\'ouvrage peuvent créer des projets.'}, 
                       status=status.HTTP_403_FORBIDDEN)
    
    try:
        projet = user.creer_projet(
            nom=request.data.get('nom'),
            budget_total=request.data.get('budget_total', 0),
            date_debut=request.data.get('date_debut'),
            date_fin=request.data.get('date_fin'),
            location=request.data.get('location', ''),
            manager=request.data.get('manager', '')
        )
        return Response(ProjetSerializer(projet).data, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PATCH'])
def maitre_ouvrage_definir_budget(request, projet_id):
    """Définir le budget d'un projet (Maître d'Ouvrage)"""
    user = get_current_user(request)
    if not user or user.role != 'MAITRE_OUVRAGE':
        return Response({'error': 'Accès refusé'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        projet = Projet.objects.get(id=projet_id)
        montant = request.data.get('montant')
        if montant is None:
            return Response({'error': 'Le montant est requis'}, status=status.HTTP_400_BAD_REQUEST)
        user.definir_budget(projet, montant)
        return Response(ProjetSerializer(projet).data, status=status.HTTP_200_OK)
    except Projet.DoesNotExist:
        return Response({'error': 'Projet non trouvé'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
def maitre_ouvrage_consulter_rapport(request, projet_id):
    """Consulter les rapports d'un projet (Maître d'Ouvrage)"""
    user = get_current_user(request)
    if not user or user.role != 'MAITRE_OUVRAGE':
        return Response({'error': 'Accès refusé'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        projet = Projet.objects.get(id=projet_id)
        rapports = user.consulter_rapport(projet)
        return Response(RapportSerializer(rapports, many=True).data, status=status.HTTP_200_OK)
    except Projet.DoesNotExist:
        return Response({'error': 'Projet non trouvé'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['PATCH'])
def maitre_ouvrage_definir_delais(request, projet_id):
    """Définir les délais d'un projet (Maître d'Ouvrage)"""
    user = get_current_user(request)
    if not user or user.role != 'MAITRE_OUVRAGE':
        return Response({'error': 'Accès refusé'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        projet = Projet.objects.get(id=projet_id)
        date_debut = request.data.get('date_debut')
        date_fin = request.data.get('date_fin')
        if not date_debut or not date_fin:
            return Response({'error': 'Les dates de début et fin sont requises'}, status=status.HTTP_400_BAD_REQUEST)
        user.definir_delais(projet, date_debut, date_fin)
        return Response(ProjetSerializer(projet).data, status=status.HTTP_200_OK)
    except Projet.DoesNotExist:
        return Response({'error': 'Projet non trouvé'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
def maitre_ouvrage_controler_projets(request):
    """Contrôler tous les projets (Maître d'Ouvrage)"""
    user = get_current_user(request)
    if not user or user.role != 'MAITRE_OUVRAGE':
        return Response({'error': 'Accès refusé'}, status=status.HTTP_403_FORBIDDEN)
    
    projets = user.controler_projets()
    return Response(ProjetSerializer(projets, many=True).data, status=status.HTTP_200_OK)


# ===== ENDPOINTS CHEF DE PROJET =====

@api_view(['POST'])
def chef_projet_ajouter_chantier(request, projet_id):
    """Ajouter un chantier à un projet (Chef de Projet)"""
    user = get_current_user(request)
    if not user or user.role != 'CHEF_DE_PROJET':
        return Response({'error': 'Accès refusé'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        projet = Projet.objects.get(id=projet_id)
        chantier = user.ajouter_chantier(
            projet=projet,
            nom=request.data.get('name'),
            description=request.data.get('description', ''),
            status=request.data.get('status', 'En cours'),
            priority=request.data.get('priority', 'Moyenne'),
            budget=request.data.get('budget', 0),
            budget_used=request.data.get('budget_used', 0),
            start_date=request.data.get('start_date'),
            end_date=request.data.get('end_date'),
            location=request.data.get('location', ''),
            manager=request.data.get('manager', '')
        )
        return Response(ChantierSerializer(chantier).data, status=status.HTTP_201_CREATED)
    except Projet.DoesNotExist:
        return Response({'error': 'Projet non trouvé'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
def chef_projet_ajouter_lot(request, chantier_id):
    """Ajouter un lot à un chantier (Chef de Projet)"""
    user = get_current_user(request)
    if not user or user.role != 'CHEF_DE_PROJET':
        return Response({'error': 'Accès refusé'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        chantier = Chantier.objects.get(id=chantier_id)
        lot = user.ajouter_lot(
            chantier=chantier,
            nom=request.data.get('name'),
            description=request.data.get('description', ''),
            status=request.data.get('status', 'En cours'),
            start_date=request.data.get('start_date'),
            end_date=request.data.get('end_date')
        )
        return Response(LotSerializer(lot).data, status=status.HTTP_201_CREATED)
    except Chantier.DoesNotExist:
        return Response({'error': 'Chantier non trouvé'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
def chef_projet_ajouter_taches(request, lot_id):
    """Ajouter des tâches à un lot (Chef de Projet)"""
    user = get_current_user(request)
    if not user or user.role != 'CHEF_DE_PROJET':
        return Response({'error': 'Accès refusé'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        lot = Lot.objects.get(id=lot_id)
        taches_data = request.data.get('taches', [])
        if not taches_data:
            return Response({'error': 'Les données des tâches sont requises'}, status=status.HTTP_400_BAD_REQUEST)
        taches = user.ajouter_taches(lot, taches_data)
        return Response(TacheSerializer(taches, many=True).data, status=status.HTTP_201_CREATED)
    except Lot.DoesNotExist:
        return Response({'error': 'Lot non trouvé'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
def chef_projet_suivre_avancement(request, projet_id):
    """Suivre l'avancement d'un projet (Chef de Projet)"""
    user = get_current_user(request)
    if not user or user.role != 'CHEF_DE_PROJET':
        return Response({'error': 'Accès refusé'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        projet = Projet.objects.get(id=projet_id)
        avancement = user.suivre_avancement(projet)
        return Response(avancement, status=status.HTTP_200_OK)
    except Projet.DoesNotExist:
        return Response({'error': 'Projet non trouvé'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
def chef_projet_generer_rapport(request, projet_id):
    """Générer un rapport pour un projet (Chef de Projet)"""
    user = get_current_user(request)
    if not user or user.role != 'CHEF_DE_PROJET':
        return Response({'error': 'Accès refusé'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        projet = Projet.objects.get(id=projet_id)
        rapport = user.generer_rapport(projet)
        return Response(RapportSerializer(rapport).data, status=status.HTTP_201_CREATED)
    except Projet.DoesNotExist:
        return Response({'error': 'Projet non trouvé'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


# ===== ENDPOINTS MEMBRE TECHNIQUE =====

@api_view(['POST'])
def membre_technique_executer_tache(request, tache_id):
    """Exécuter une tâche (Membre Technique)"""
    user = get_current_user(request)
    if not user or user.role != 'MEMBRE_TECHNIQUE':
        return Response({'error': 'Accès refusé'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        tache = Tache.objects.get(id=tache_id)
        tache = user.executer_tache(tache)
        return Response(TacheSerializer(tache).data, status=status.HTTP_200_OK)
    except Tache.DoesNotExist:
        return Response({'error': 'Tâche non trouvée'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
def membre_technique_declarer_alerte(request, projet_id):
    """Déclarer une alerte (Membre Technique)"""
    user = get_current_user(request)
    if not user or user.role != 'MEMBRE_TECHNIQUE':
        return Response({'error': 'Accès refusé'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        projet = Projet.objects.get(id=projet_id)
        type_alerte = request.data.get('type_alerte', 'INFO')
        description = request.data.get('description')
        if not description:
            return Response({'error': 'La description est requise'}, status=status.HTTP_400_BAD_REQUEST)
        alerte = user.declarer_alerte(projet, type_alerte, description)
        return Response(AlerteSerializer(alerte).data, status=status.HTTP_201_CREATED)
    except Projet.DoesNotExist:
        return Response({'error': 'Projet non trouvé'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
def membre_technique_declarer_probleme(request, tache_id):
    """Déclarer un problème sur une tâche (Membre Technique)"""
    user = get_current_user(request)
    if not user or user.role != 'MEMBRE_TECHNIQUE':
        return Response({'error': 'Accès refusé'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        tache = Tache.objects.get(id=tache_id)
        description = request.data.get('description')
        if not description:
            return Response({'error': 'La description est requise'}, status=status.HTTP_400_BAD_REQUEST)
        alerte = user.declarer_probleme(tache, description)
        return Response(AlerteSerializer(alerte).data, status=status.HTTP_201_CREATED)
    except Tache.DoesNotExist:
        return Response({'error': 'Tâche non trouvée'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PATCH'])
def membre_technique_mettre_a_jour_statut(request, tache_id):
    """Mettre à jour le statut d'une tâche (Membre Technique)"""
    user = get_current_user(request)
    if not user or user.role != 'MEMBRE_TECHNIQUE':
        return Response({'error': 'Accès refusé'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        tache = Tache.objects.get(id=tache_id)
        statut = request.data.get('statut')
        progress = request.data.get('progress')
        if not statut:
            return Response({'error': 'Le statut est requis'}, status=status.HTTP_400_BAD_REQUEST)
        tache = user.mettre_a_jour_statut(tache, statut, progress)
        return Response(TacheSerializer(tache).data, status=status.HTTP_200_OK)
    except Tache.DoesNotExist:
        return Response({'error': 'Tâche non trouvée'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

