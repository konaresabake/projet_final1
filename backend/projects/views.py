from rest_framework import viewsets, status
from rest_framework.decorators import api_view, action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.db.models import Q
from django.conf import settings
import logging
from django.contrib.auth import authenticate, get_user_model

logger = logging.getLogger(__name__)
DEBUG = getattr(settings, 'DEBUG', False)
from .models import (
    Projet,
    Chantier,
    Lot,
    Tache,
    Utilisateur,
    IA,
    Alerte,
    Budget,
    Rapport,
    Ressource,
    RessourceHumaine,
    RessourceMaterielle,
    Fournisseur,
    ContactMessage,
)
from .serializers import (
    ProjetSerializer,
    ChantierSerializer,
    LotSerializer,
    TacheSerializer,
    UtilisateurSerializer,
    RegisterSerializer,
    LoginSerializer,
    UtilisateurListSerializer,
    IASerializer,
    AlerteSerializer,
    BudgetSerializer,
    RapportSerializer,
    RessourceSerializer,
    RessourceHumaineSerializer,
    RessourceMaterielleSerializer,
    FournisseurSerializer,
    ContactMessageSerializer,
)


class BaseViewSet(viewsets.ModelViewSet):
    permission_classes = [AllowAny]


def get_user_from_request(request):
    """Extrait l'utilisateur depuis le token JWT"""
    try:
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        if not auth_header.startswith('Bearer '):
            return None
        
        from rest_framework_simplejwt.tokens import UntypedToken
        from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
        from django.conf import settings
        
        token = auth_header.split(' ')[1]
        try:
            validated_token = UntypedToken(token)
            user_id = validated_token.get('user_id')
            if user_id:
                return Utilisateur.objects.get(id=user_id)
        except (InvalidToken, TokenError, Utilisateur.DoesNotExist):
            pass
    except Exception:
        pass
    return None


class ProjetViewSet(BaseViewSet):
    serializer_class = ProjetSerializer
    
    def get_queryset(self):
        # Utiliser select_related et prefetch_related avec précaution
        # Ne pas utiliser prefetch_related avec SerializerMethodField qui peut causer des problèmes
        try:
            # Retourner un queryset simple sans prefetch pour éviter les erreurs
            return Projet.objects.all().order_by('-created_at')
        except Exception as e:
            logger.error(f'Error in ProjetViewSet.get_queryset: {str(e)}')
            import traceback
            logger.error(traceback.format_exc())
            return Projet.objects.none()
    
    def list(self, request, *args, **kwargs):
        """Override list to add error handling"""
        from django.conf import settings as django_settings
        try:
            # Utiliser la méthode parente standard qui gère déjà la pagination et la sérialisation
            return super().list(request, *args, **kwargs)
        except Exception as e:
            import traceback
            logger.error(f'Error in ProjetViewSet.list: {str(e)}')
            logger.error(traceback.format_exc())
            
            # Essayer de retourner les projets individuellement en cas d'erreur
            try:
                queryset = self.get_queryset()
                # Filtrer les erreurs de sérialisation - sérialiser individuellement
                data = []
                try:
                    # Convertir le queryset en liste pour éviter les problèmes de lazy evaluation
                    projets_list = list(queryset[:100])  # Limiter à 100 pour éviter les problèmes de mémoire
                    for projet in projets_list:
                        try:
                            projet_data = self.get_serializer(projet).data
                            data.append(projet_data)
                        except Exception as ser_error:
                            logger.warning(f"Erreur lors de la sérialisation du projet {getattr(projet, 'id', 'unknown')}: {str(ser_error)}")
                            continue
                except Exception as queryset_error:
                    logger.error(f"Erreur lors de l'itération du queryset: {str(queryset_error)}")
                
                # Toujours retourner un tableau, même s'il est vide
                return Response(data, status=status.HTTP_200_OK)
            except Exception as e2:
                # Si même ça échoue, retourner un tableau vide plutôt qu'une erreur 500
                logger.error(f'Error creating fallback response: {str(e2)}')
                # Retourner un tableau vide pour éviter les crashes frontend
                return Response([], status=status.HTTP_200_OK)

    def perform_create(self, serializer):
        projet = serializer.save()
        # Synchronise le statut initial lors de la création
        if not projet.chantiers.exists():
            # Si pas de chantiers, statut par défaut selon l'état initial
            if not projet.status or projet.status == 'En cours':
                projet.status = 'Planifié'
                projet.save()

    def perform_update(self, serializer):
        projet = serializer.save()
        # Synchronise le statut lors de la mise à jour
        projet.status = projet.synchroniser_statut()
        projet.save()


class ChantierViewSet(BaseViewSet):
    serializer_class = ChantierSerializer

    def get_queryset(self):
        try:
            # Utiliser select_related pour éviter les requêtes N+1
            # Ne pas utiliser prefetch_related avec SerializerMethodField qui appelle calculer_avancement
            # car cela peut causer des problèmes de performance et d'erreurs
            qs = Chantier.objects.select_related('projet').all().order_by('-created_at')
            projet_id = self.request.query_params.get('projet_id')
            if projet_id:
                try:
                    qs = qs.filter(projet_id=projet_id)
                except ValueError:
                    return Chantier.objects.none()
            return qs
        except Exception as e:
            logger.error(f'Error in ChantierViewSet.get_queryset: {str(e)}')
            import traceback
            logger.error(traceback.format_exc())
            return Chantier.objects.none()
    
    def list(self, request, *args, **kwargs):
        """Override list to add error handling"""
        try:
            return super().list(request, *args, **kwargs)
        except Exception as e:
            import traceback
            logger.error(f'Error in ChantierViewSet.list: {str(e)}')
            logger.error(traceback.format_exc())
            
            # Essayer de retourner les chantiers individuellement en cas d'erreur
            try:
                queryset = self.get_queryset()
                data = []
                try:
                    # Convertir le queryset en liste pour éviter les problèmes de lazy evaluation
                    chantiers_list = list(queryset[:100])  # Limiter à 100
                    for chantier in chantiers_list:
                        try:
                            chantier_data = self.get_serializer(chantier).data
                            data.append(chantier_data)
                        except Exception as ser_error:
                            logger.warning(f"Erreur lors de la sérialisation du chantier {getattr(chantier, 'id', 'unknown')}: {str(ser_error)}")
                            continue
                except Exception as queryset_error:
                    logger.error(f"Erreur lors de l'itération du queryset: {str(queryset_error)}")
                
                # Toujours retourner un tableau, même s'il est vide
                return Response(data, status=status.HTTP_200_OK)
            except Exception:
                # En cas d'erreur totale, retourner un tableau vide plutôt qu'une erreur 500
                logger.error(f'Error in ChantierViewSet.list fallback: {str(e)}')
                return Response([], status=status.HTTP_200_OK)

    def perform_create(self, serializer):
        try:
            chantier = serializer.save()
            # Recalculer l'avancement du chantier après création
            try:
                chantier.progress = chantier.calculer_avancement()
                chantier.save()
            except Exception:
                # Si le calcul échoue, garder le progress par défaut
                pass
            
            # Synchronise le statut du projet après création d'un chantier
            if chantier.projet:
                try:
                    projet = chantier.projet
                    projet.status = projet.synchroniser_statut()
                    projet.save()
                except Exception:
                    # Si la synchronisation échoue, continuer quand même
                    pass
        except Exception as e:
            logger.error(f'Error in ChantierViewSet.perform_create: {str(e)}')
            import traceback
            logger.error(traceback.format_exc())
            raise

    def perform_update(self, serializer):
        chantier = serializer.save()
        # Synchronise le statut du projet après mise à jour
        if chantier.projet:
            projet = chantier.projet
            projet.status = projet.synchroniser_statut()
            projet.save()

    def perform_destroy(self, instance):
        projet = instance.projet
        instance.delete()
        # Synchronise le statut du projet après suppression
        if projet:
            projet.status = projet.synchroniser_statut()
            projet.save()


class LotViewSet(BaseViewSet):
    serializer_class = LotSerializer

    def get_queryset(self):
        qs = Lot.objects.select_related('chantier', 'chantier__projet').prefetch_related('taches').all().order_by('-created_at')
        chantier_id = self.request.query_params.get('chantier_id')
        if chantier_id:
            qs = qs.filter(chantier_id=chantier_id)
        return qs

    def perform_create(self, serializer):
        lot = serializer.save()
        # Recalcule l'avancement et synchronise le statut du chantier
        if lot.chantier:
            chantier = lot.chantier
            chantier.progress = chantier.calculer_avancement()
            chantier.status = chantier.synchroniser_statut()
            chantier.save()
            # Synchronise le statut du projet
            if chantier.projet:
                projet = chantier.projet
                projet.status = projet.synchroniser_statut()
                projet.save()

    def perform_update(self, serializer):
        lot = serializer.save()
        # Recalcule l'avancement et synchronise le statut du chantier
        if lot.chantier:
            chantier = lot.chantier
            chantier.progress = chantier.calculer_avancement()
            chantier.status = chantier.synchroniser_statut()
            chantier.save()
            # Synchronise le statut du projet
            if chantier.projet:
                projet = chantier.projet
                projet.status = projet.synchroniser_statut()
                projet.save()

    def perform_destroy(self, instance):
        chantier = instance.chantier
        projet = chantier.projet if chantier else None
        instance.delete()
        # Recalcule l'avancement et synchronise le statut après suppression
        if chantier:
            chantier.progress = chantier.calculer_avancement()
            chantier.status = chantier.synchroniser_statut()
            chantier.save()
            if projet:
                projet.status = projet.synchroniser_statut()
                projet.save()


class TacheViewSet(BaseViewSet):
    serializer_class = TacheSerializer

    def get_queryset(self):
        qs = Tache.objects.all().order_by('-created_at')
        lot_id = self.request.query_params.get('lot_id')
        if lot_id:
            qs = qs.filter(lot_id=lot_id)
        return qs

    def perform_create(self, serializer):
        tache = serializer.save()
        # Recalcule l'avancement et synchronise le statut du lot
        if tache.lot:
            lot = tache.lot
            lot.progress = lot.calculer_avancement()
            lot.status = lot.synchroniser_statut()
            lot.save()
            # Recalcule l'avancement et synchronise le statut du chantier parent
            if lot.chantier:
                chantier = lot.chantier
                chantier.progress = chantier.calculer_avancement()
                chantier.status = chantier.synchroniser_statut()
                chantier.save()
                # Synchronise le statut du projet
                if chantier.projet:
                    projet = chantier.projet
                    projet.status = projet.synchroniser_statut()
                    projet.save()

    def perform_update(self, serializer):
        tache = serializer.save()
        # Recalcule l'avancement et synchronise le statut du lot
        if tache.lot:
            lot = tache.lot
            lot.progress = lot.calculer_avancement()
            lot.status = lot.synchroniser_statut()
            lot.save()
            # Recalcule l'avancement et synchronise le statut du chantier parent
            if lot.chantier:
                chantier = lot.chantier
                chantier.progress = chantier.calculer_avancement()
                chantier.status = chantier.synchroniser_statut()
                chantier.save()
                # Synchronise le statut du projet
                if chantier.projet:
                    projet = chantier.projet
                    projet.status = projet.synchroniser_statut()
                    projet.save()

    def perform_destroy(self, instance):
        lot = instance.lot
        chantier = lot.chantier if lot else None
        projet = chantier.projet if chantier else None
        instance.delete()
        # Recalcule l'avancement et synchronise le statut après suppression
        if lot:
            lot.progress = lot.calculer_avancement()
            lot.status = lot.synchroniser_statut()
            lot.save()
            if chantier:
                chantier.progress = chantier.calculer_avancement()
                chantier.status = chantier.synchroniser_statut()
                chantier.save()
                if projet:
                    projet.status = projet.synchroniser_statut()
                    projet.save()


@api_view(['POST'])
def register(request):
    """Endpoint pour l'inscription"""
    try:
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            utilisateur = serializer.save()
            return Response({
                'message': 'Inscription réussie. Votre compte est en attente de validation par un administrateur.',
                'user': UtilisateurListSerializer(utilisateur).data
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        import traceback
        logger.error(f'Error in register: {str(e)}')
        logger.error(traceback.format_exc())
        return Response({
            'error': 'Erreur lors de l\'inscription',
            'detail': str(e) if DEBUG else None
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
def login(request):
    """Endpoint pour la connexion"""
    try:
        # Valider les données entrantes
        serializer = LoginSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        email = serializer.validated_data['email']
        mot_de_passe = serializer.validated_data['mot_de_passe']
        
        utilisateur = None
        # 1) Tentative avec notre modèle Utilisateur
        try:
            utilisateur = Utilisateur.objects.get(email=email)
            if not utilisateur.check_password(mot_de_passe):
                utilisateur = None  # mot de passe invalide -> fallback django auth
        except Utilisateur.DoesNotExist:
            utilisateur = None
        
        # 2) Fallback: accepter les identifiants du superuser/staff Django (auth.User)
        if utilisateur is None:
            django_user = authenticate(request, username=email, password=mot_de_passe) or authenticate(request, username=email.split('@')[0], password=mot_de_passe)
            if django_user and (getattr(django_user, 'is_staff', False) or getattr(django_user, 'is_superuser', False)):
                # Auto-provisionner un Utilisateur correspondant s'il n'existe pas
                try:
                    utilisateur = Utilisateur.objects.get(email=django_user.email or email)
                except Utilisateur.DoesNotExist:
                    utilisateur = Utilisateur(
                        nom=getattr(django_user, 'username', 'Admin'),
                        email=django_user.email or email,
                        mot_de_passe=mot_de_passe,
                        role='ADMINISTRATEUR',
                        is_active=True,
                        is_approved=True,
                    )
                    utilisateur.save()
            else:
                return Response({'error': 'Email ou mot de passe incorrect'}, status=status.HTTP_401_UNAUTHORIZED)
        
        # Vérifier si le compte est actif/validé côté app
        if not utilisateur.is_active:
            return Response({'error': 'Votre compte est désactivé'}, status=status.HTTP_403_FORBIDDEN)
        if utilisateur.role != 'ADMINISTRATEUR' and not utilisateur.is_approved:
            return Response({'error': 'Votre compte est en attente de validation par un administrateur'}, status=status.HTTP_403_FORBIDDEN)
        
        # Générer les tokens JWT
        try:
            # Essayer d'abord avec RefreshToken.for_user() (UUID compatible via SIMPLE_JWT)
            refresh = None
            access_token = None
            try:
                refresh = RefreshToken.for_user(utilisateur)
                refresh['email'] = str(utilisateur.email)
                refresh['role'] = str(utilisateur.role)
                refresh['user_id'] = str(utilisateur.id)
                access_token = refresh.access_token
                access_token['email'] = str(utilisateur.email)
                access_token['role'] = str(utilisateur.role)
                access_token['user_id'] = str(utilisateur.id)
            except Exception as token_error:
                logger.warning(f"RefreshToken.for_user() a échoué, création manuelle: {str(token_error)}")
                from rest_framework_simplejwt.tokens import RefreshToken as RT
                refresh = RT()
                user_id = str(utilisateur.id)
                refresh['user_id'] = user_id
                refresh['email'] = str(utilisateur.email)
                refresh['role'] = str(utilisateur.role)
                access_token = refresh.access_token
                access_token['user_id'] = user_id
                access_token['email'] = str(utilisateur.email)
                access_token['role'] = str(utilisateur.role)
        
            # Sérialiser l'utilisateur
            user_data = UtilisateurListSerializer(utilisateur).data
            return Response({
                'refresh': str(refresh),
                'access': str(access_token),
                'user': user_data
            }, status=status.HTTP_200_OK)
        except Exception as e:
            import traceback
            logger.error(f'Error generating JWT token: {str(e)}')
            logger.error(traceback.format_exc())
            return Response({
                'error': 'Erreur lors de la génération du token. Veuillez réessayer.',
                'detail': str(e) if DEBUG else None
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    except Exception as e:
        import traceback
        logger.error(f'Unexpected error in login: {str(e)}')
        logger.error(traceback.format_exc())
        return Response({
            'error': 'Erreur lors de la connexion. Veuillez réessayer.',
            'detail': str(e) if DEBUG else None
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class UtilisateurViewSet(BaseViewSet):
    queryset = Utilisateur.objects.all().order_by('-created_at')
    serializer_class = UtilisateurSerializer
    
    def get_serializer_class(self):
        # action peut ne pas être défini lors d'appels directs (tests, etc.)
        action = getattr(self, 'action', None)
        if action == 'list':
            return UtilisateurListSerializer
        return UtilisateurSerializer
    
    def list(self, request, *args, **kwargs):
        """Override list to add error handling"""
        try:
            return super().list(request, *args, **kwargs)
        except Exception as e:
            import traceback
            logger.error(f'Error in UtilisateurViewSet.list: {str(e)}')
            logger.error(traceback.format_exc())
            
            # Essayer de retourner les utilisateurs individuellement en cas d'erreur
            try:
                queryset = self.get_queryset()
                data = []
                try:
                    utilisateurs_list = list(queryset[:100])  # Limiter à 100
                    for utilisateur in utilisateurs_list:
                        try:
                            serializer = self.get_serializer(utilisateur)
                            utilisateur_data = serializer.data
                            data.append(utilisateur_data)
                        except Exception as ser_error:
                            logger.warning(f"Erreur lors de la sérialisation de l'utilisateur {getattr(utilisateur, 'id', 'unknown')}: {str(ser_error)}")
                            continue
                except Exception as queryset_error:
                    logger.error(f"Erreur lors de l'itération du queryset: {str(queryset_error)}")
                
                # Toujours retourner un tableau, même s'il est vide
                return Response(data, status=status.HTTP_200_OK)
            except Exception:
                # En cas d'erreur totale, retourner un tableau vide plutôt qu'une erreur 500
                logger.error(f'Error in UtilisateurViewSet.list fallback: {str(e)}')
                return Response([], status=status.HTTP_200_OK)
    
    def create(self, request, *args, **kwargs):
        """Override create to add error handling"""
        try:
            return super().create(request, *args, **kwargs)
        except Exception as e:
            import traceback
            logger.error(f'Error in UtilisateurViewSet.create: {str(e)}')
            logger.error(traceback.format_exc())
            return Response(
                {'error': 'Erreur lors de la création de l\'utilisateur', 'detail': str(e) if DEBUG else None},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['patch'], permission_classes=[AllowAny])
    def approve(self, request, pk=None):
        """Approuver un utilisateur (seulement pour les admins)"""
        current_user = get_user_from_request(request)
        if not current_user or current_user.role != 'ADMINISTRATEUR':
            return Response({'error': 'Accès refusé. Seuls les administrateurs peuvent approuver des utilisateurs.'}, 
                          status=status.HTTP_403_FORBIDDEN)
        
        utilisateur = self.get_object()
        utilisateur.is_approved = True
        utilisateur.save()
        return Response({
            'message': f'L\'utilisateur {utilisateur.nom} a été approuvé avec succès.',
            'user': UtilisateurListSerializer(utilisateur).data
        }, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['patch'], permission_classes=[AllowAny])
    def reject(self, request, pk=None):
        """Rejeter un utilisateur (seulement pour les admins)"""
        current_user = get_user_from_request(request)
        if not current_user or current_user.role != 'ADMINISTRATEUR':
            return Response({'error': 'Accès refusé. Seuls les administrateurs peuvent rejeter des utilisateurs.'}, 
                          status=status.HTTP_403_FORBIDDEN)
        
        utilisateur = self.get_object()
        utilisateur.is_approved = False
        utilisateur.save()
        return Response({
            'message': f'L\'utilisateur {utilisateur.nom} a été rejeté.',
            'user': UtilisateurListSerializer(utilisateur).data
        }, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['get'], permission_classes=[AllowAny])
    def pending(self, request):
        """Récupérer la liste des utilisateurs en attente de validation"""
        current_user = get_user_from_request(request)
        if not current_user or current_user.role != 'ADMINISTRATEUR':
            return Response({'error': 'Accès refusé'}, status=status.HTTP_403_FORBIDDEN)
        
        pending_users = Utilisateur.objects.filter(is_approved=False).exclude(role='ADMINISTRATEUR').order_by('-created_at')
        serializer = UtilisateurListSerializer(pending_users, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class IAViewSet(BaseViewSet):
    serializer_class = IASerializer
    
    def get_queryset(self):
        try:
            return IA.objects.all().order_by('-created_at')
        except Exception as e:
            logger.error(f'Error in IAViewSet.get_queryset: {str(e)}')
            return IA.objects.none()
    
    def list(self, request, *args, **kwargs):
        """Override list to add error handling"""
        try:
            return super().list(request, *args, **kwargs)
        except Exception as e:
            import traceback
            logger.error(f'Error in IAViewSet.list: {str(e)}')
            logger.error(traceback.format_exc())
            
            # Essayer de retourner les IAs individuellement en cas d'erreur
            try:
                queryset = self.get_queryset()
                data = []
                try:
                    ias_list = list(queryset[:100])  # Limiter à 100
                    for ia in ias_list:
                        try:
                            ia_data = self.get_serializer(ia).data
                            data.append(ia_data)
                        except Exception as ser_error:
                            logger.warning(f"Erreur lors de la sérialisation de l'IA {getattr(ia, 'id', 'unknown')}: {str(ser_error)}")
                            continue
                except Exception as queryset_error:
                    logger.error(f"Erreur lors de l'itération du queryset: {str(queryset_error)}")
                
                # Toujours retourner un tableau, même s'il est vide
                return Response(data, status=status.HTTP_200_OK)
            except Exception:
                # En cas d'erreur totale, retourner un tableau vide plutôt qu'une erreur 500
                logger.error(f'Error in IAViewSet.list fallback: {str(e)}')
                return Response([], status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['post'], permission_classes=[AllowAny])
    def predict_delay(self, request, pk=None):
        """Prédire le risque de retard pour un projet"""
        try:
            ia = self.get_object()
            projet_id = request.data.get('projet_id')
            
            if not projet_id:
                return Response(
                    {'error': 'projet_id est requis'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            try:
                projet = Projet.objects.get(id=projet_id)
            except Projet.DoesNotExist:
                return Response(
                    {'error': 'Projet non trouvé'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
            
            prediction = ia.predict_delay_risk(projet)
            return Response(prediction, status=status.HTTP_200_OK)
            
        except Exception as e:
            import traceback
            logger.error(f'Error in predict_delay: {str(e)}')
            logger.error(traceback.format_exc())
            return Response(
                {'error': 'Erreur lors de la prédiction', 'detail': str(e) if DEBUG else None},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'], permission_classes=[AllowAny])
    def predict_budget(self, request, pk=None):
        """Prédire le dépassement budgétaire pour un projet"""
        try:
            ia = self.get_object()
            projet_id = request.data.get('projet_id')
            
            if not projet_id:
                return Response(
                    {'error': 'projet_id est requis'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            try:
                projet = Projet.objects.get(id=projet_id)
            except Projet.DoesNotExist:
                return Response(
                    {'error': 'Projet non trouvé'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
            
            prediction = ia.predict_budget_overrun(projet)
            return Response(prediction, status=status.HTTP_200_OK)
            
        except Exception as e:
            import traceback
            logger.error(f'Error in predict_budget: {str(e)}')
            logger.error(traceback.format_exc())
            return Response(
                {'error': 'Erreur lors de la prédiction', 'detail': str(e) if DEBUG else None},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'], permission_classes=[AllowAny])
    def get_recommendations(self, request, pk=None):
        """Obtenir des recommandations automatiques pour un projet"""
        try:
            ia = self.get_object()
            projet_id = request.data.get('projet_id')
            
            if not projet_id:
                return Response(
                    {'error': 'projet_id est requis'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            try:
                projet = Projet.objects.get(id=projet_id)
            except Projet.DoesNotExist:
                return Response(
                    {'error': 'Projet non trouvé'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
            
            delay_prediction = None
            budget_prediction = None
            
            if request.data.get('include_predictions', False):
                delay_prediction = ia.predict_delay_risk(projet)
                budget_prediction = ia.predict_budget_overrun(projet)
            
            recommendations = ia.generate_recommendations(
                projet, 
                delay_prediction=delay_prediction,
                budget_prediction=budget_prediction
            )
            
            return Response({
                'recommendations': recommendations,
                'count': len(recommendations)
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            import traceback
            logger.error(f'Error in get_recommendations: {str(e)}')
            logger.error(traceback.format_exc())
            return Response(
                {'error': 'Erreur lors de la génération de recommandations', 'detail': str(e) if DEBUG else None},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'], permission_classes=[AllowAny])
    def full_analysis(self, request, pk=None):
        """Analyse complète d'un projet avec toutes les prédictions et recommandations"""
        try:
            ia = self.get_object()
            projet_id = request.data.get('projet_id')
            
            if not projet_id:
                return Response(
                    {'error': 'projet_id est requis'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            try:
                projet = Projet.objects.get(id=projet_id)
            except Projet.DoesNotExist:
                return Response(
                    {'error': 'Projet non trouvé'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Calculer toutes les prédictions
            delay_prediction = ia.predict_delay_risk(projet)
            budget_prediction = ia.predict_budget_overrun(projet)
            recommendations = ia.generate_recommendations(
                projet,
                delay_prediction=delay_prediction,
                budget_prediction=budget_prediction
            )
            
            return Response({
                'projet_id': str(projet.id),
                'projet_name': projet.name,
                'delay_prediction': delay_prediction,
                'budget_prediction': budget_prediction,
                'recommendations': recommendations,
                'summary': {
                    'delay_risk_level': delay_prediction.get('risk_level', 'moyen'),
                    'budget_risk_level': budget_prediction.get('risk_level', 'moyen'),
                    'total_recommendations': len(recommendations),
                    'high_priority_recommendations': len([r for r in recommendations if r.get('priority') == 'high'])
                }
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            import traceback
            logger.error(f'Error in full_analysis: {str(e)}')
            logger.error(traceback.format_exc())
            return Response(
                {'error': 'Erreur lors de l\'analyse complète', 'detail': str(e) if DEBUG else None},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class AlerteViewSet(BaseViewSet):
    serializer_class = AlerteSerializer

    def get_queryset(self):
        try:
            qs = Alerte.objects.select_related('projet', 'ia').all().order_by('-created_at')
            projet_id = self.request.query_params.get('projet_id')
            if projet_id:
                try:
                    qs = qs.filter(projet_id=projet_id)
                except ValueError:
                    return Alerte.objects.none()
            return qs
        except Exception as e:
            logger.error(f'Error in AlerteViewSet.get_queryset: {str(e)}')
            return Alerte.objects.none()
    
    def list(self, request, *args, **kwargs):
        """Override list to add error handling"""
        try:
            return super().list(request, *args, **kwargs)
        except Exception as e:
            import traceback
            logger.error(f'Error in AlerteViewSet.list: {str(e)}')
            logger.error(traceback.format_exc())
            
            # Essayer de retourner les alertes individuellement en cas d'erreur
            try:
                queryset = self.get_queryset()
                data = []
                try:
                    alertes_list = list(queryset[:100])  # Limiter à 100
                    for alerte in alertes_list:
                        try:
                            alerte_data = self.get_serializer(alerte).data
                            data.append(alerte_data)
                        except Exception as ser_error:
                            logger.warning(f"Erreur lors de la sérialisation de l'alerte {getattr(alerte, 'id', 'unknown')}: {str(ser_error)}")
                            continue
                except Exception as queryset_error:
                    logger.error(f"Erreur lors de l'itération du queryset: {str(queryset_error)}")
                
                # Toujours retourner un tableau, même s'il est vide
                return Response(data, status=status.HTTP_200_OK)
            except Exception:
                # En cas d'erreur totale, retourner un tableau vide plutôt qu'une erreur 500
                logger.error(f'Error in AlerteViewSet.list fallback: {str(e)}')
                return Response([], status=status.HTTP_200_OK)


class BudgetViewSet(BaseViewSet):
    serializer_class = BudgetSerializer

    def get_queryset(self):
        try:
            # Note: Budget a une relation OneToOneField avec Projet
            # Utiliser un queryset simple pour éviter les problèmes avec select_related sur OneToOneField
            qs = Budget.objects.all().order_by('-created_at')
            
            projet_id = self.request.query_params.get('projet_id')
            if projet_id:
                try:
                    # Filtrer par projet_id (qui est la clé étrangère)
                    qs = qs.filter(projet_id=projet_id)
                except ValueError as e:
                    # Si projet_id n'est pas un UUID valide, retourner queryset vide
                    logger.warning(f'Invalid UUID for projet_id: {projet_id}')
                    return Budget.objects.none()
            return qs
        except Exception as e:
            logger.error(f'Error in BudgetViewSet.get_queryset: {str(e)}')
            import traceback
            logger.error(traceback.format_exc())
            return Budget.objects.none()
    
    def list(self, request, *args, **kwargs):
        """Override list to add error handling"""
        try:
            return super().list(request, *args, **kwargs)
        except Exception as e:
            import traceback
            logger.error(f'Error in BudgetViewSet.list: {str(e)}')
            logger.error(traceback.format_exc())
            
            # Essayer de retourner les budgets individuellement en cas d'erreur
            try:
                queryset = self.get_queryset()
                data = []
                try:
                    # Convertir le queryset en liste pour éviter les problèmes de lazy evaluation
                    budgets_list = list(queryset[:100])  # Limiter à 100
                    for budget in budgets_list:
                        try:
                            budget_data = self.get_serializer(budget).data
                            data.append(budget_data)
                        except Exception as ser_error:
                            logger.warning(f"Erreur lors de la sérialisation du budget {getattr(budget, 'id', 'unknown')}: {str(ser_error)}")
                            continue
                except Exception as queryset_error:
                    logger.error(f"Erreur lors de l'itération du queryset: {str(queryset_error)}")
                
                # Toujours retourner un tableau, même s'il est vide
                return Response(data, status=status.HTTP_200_OK)
            except Exception:
                # En cas d'erreur totale, retourner un tableau vide plutôt qu'une erreur 500
                logger.error(f'Error in BudgetViewSet.list fallback: {str(e)}')
                return Response([], status=status.HTTP_200_OK)


class RapportViewSet(BaseViewSet):
    serializer_class = RapportSerializer

    def get_queryset(self):
        try:
            qs = Rapport.objects.all().order_by('-created_at')
            projet_id = self.request.query_params.get('projet_id')
            if projet_id:
                try:
                    qs = qs.filter(projet_id=projet_id)
                except ValueError:
                    return Rapport.objects.none()
            return qs
        except Exception as e:
            logger.error(f'Error in RapportViewSet.get_queryset: {str(e)}')
            return Rapport.objects.none()
    
    def list(self, request, *args, **kwargs):
        """Override list to add error handling"""
        try:
            return super().list(request, *args, **kwargs)
        except Exception as e:
            import traceback
            logger.error(f'Error in RapportViewSet.list: {str(e)}')
            logger.error(traceback.format_exc())
            
            # Essayer de retourner les rapports individuellement en cas d'erreur
            try:
                queryset = self.get_queryset()
                data = []
                try:
                    rapports_list = list(queryset[:100])  # Limiter à 100
                    for rapport in rapports_list:
                        try:
                            rapport_data = self.get_serializer(rapport).data
                            data.append(rapport_data)
                        except Exception as ser_error:
                            logger.warning(f"Erreur lors de la sérialisation du rapport {getattr(rapport, 'id', 'unknown')}: {str(ser_error)}")
                            continue
                except Exception as queryset_error:
                    logger.error(f"Erreur lors de l'itération du queryset: {str(queryset_error)}")
                
                # Toujours retourner un tableau, même s'il est vide
                return Response(data, status=status.HTTP_200_OK)
            except Exception:
                # En cas d'erreur totale, retourner un tableau vide plutôt qu'une erreur 500
                logger.error(f'Error in RapportViewSet.list fallback: {str(e)}')
                return Response([], status=status.HTTP_200_OK)


class FournisseurViewSet(BaseViewSet):
    queryset = Fournisseur.objects.all().order_by('-created_at')
    serializer_class = FournisseurSerializer


class RessourceViewSet(BaseViewSet):
    serializer_class = RessourceSerializer

    def get_queryset(self):
        qs = Ressource.objects.all().order_by('-created_at')
        fournisseur_id = self.request.query_params.get('fournisseur_id')
        if fournisseur_id:
            qs = qs.filter(fournisseur_id=fournisseur_id)
        return qs


class RessourceHumaineViewSet(BaseViewSet):
    queryset = RessourceHumaine.objects.all().order_by('-created_at')
    serializer_class = RessourceHumaineSerializer


class RessourceMaterielleViewSet(BaseViewSet):
    queryset = RessourceMaterielle.objects.all().order_by('-created_at')
    serializer_class = RessourceMaterielleSerializer


class ContactMessageViewSet(BaseViewSet):
    queryset = ContactMessage.objects.all().order_by('-created_at')
    serializer_class = ContactMessageSerializer
    
    def get_queryset(self):
        """Retourne tous les messages, triés par date de création (plus récents en premier)"""
        try:
            return ContactMessage.objects.all().order_by('-created_at')
        except Exception as e:
            logger.error(f'Error in ContactMessageViewSet.get_queryset: {str(e)}')
            return ContactMessage.objects.none()
    
    def list(self, request, *args, **kwargs):
        """Override list pour gérer les erreurs et assurer un retour correct"""
        try:
            queryset = self.get_queryset()
            # Logger pour debug
            logger.info(f'ContactMessageViewSet.list: Found {queryset.count()} messages')
            
            serializer = self.get_serializer(queryset, many=True)
            data = serializer.data
            
            # Logger pour vérifier les données sérialisées
            logger.info(f'ContactMessageViewSet.list: Serialized {len(data)} messages')
            
            # Retourner directement un tableau (pas de pagination)
            return Response(data, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f'Error in ContactMessageViewSet.list: {str(e)}')
            import traceback
            logger.error(traceback.format_exc())
            # Retourner une liste vide plutôt qu'une erreur 500
            return Response([], status=status.HTTP_200_OK)
    
    def perform_create(self, serializer):
        """Sauvegarde le message avec is_read=False par défaut"""
        try:
            serializer.save(is_read=False)
            logger.info(f'Contact message created: {serializer.instance.id}')
        except Exception as e:
            logger.error(f'Error in ContactMessageViewSet.perform_create: {str(e)}')
            raise
