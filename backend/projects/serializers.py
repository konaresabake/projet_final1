from rest_framework import serializers
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


class ProjetSerializer(serializers.ModelSerializer):
    avancement_calcule = serializers.SerializerMethodField()
    budget = serializers.DecimalField(max_digits=15, decimal_places=2, coerce_to_string=True, required=False)
    
    def get_avancement_calcule(self, obj):
        """Retourne l'avancement réel du projet (0-100) basé sur les chantiers."""
        try:
            if obj is None:
                return 0
            avancement = getattr(obj, 'avancement_calcule', 0)
            if avancement is None:
                return 0
            try:
                # Normaliser et borner
                value = float(avancement)
                if value < 0:
                    return 0
                if value > 100:
                    return 100
                return round(value, 0)
            except (TypeError, ValueError):
                return 0
        except Exception:
            return 0
    
    def to_representation(self, instance):
        """Override pour gérer toutes les erreurs possibles lors de la sérialisation"""
        try:
            data = super().to_representation(instance)
            # S'assurer que tous les champs sont présents
            if 'avancement_calcule' not in data or data['avancement_calcule'] is None:
                try:
                    data['avancement_calcule'] = self.get_avancement_calcule(instance)
                except Exception:
                    data['avancement_calcule'] = 0
            return data
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Erreur lors de la sérialisation d'un Projet: {str(e)}")
            # Retourner une représentation minimale mais complète en cas d'erreur
            try:
                return {
                    'id': str(instance.id) if hasattr(instance, 'id') else None,
                    'name': getattr(instance, 'name', ''),
                    'description': getattr(instance, 'description', ''),
                    'status': getattr(instance, 'status', 'En cours'),
                    'priority': getattr(instance, 'priority', 'Moyenne'),
                    'budget': str(getattr(instance, 'budget', '0')),
                    'start_date': str(getattr(instance, 'start_date', '')) if getattr(instance, 'start_date', None) else None,
                    'end_date': str(getattr(instance, 'end_date', '')) if getattr(instance, 'end_date', None) else None,
                    'location': getattr(instance, 'location', ''),
                    'manager': getattr(instance, 'manager', ''),
                    'avancement_calcule': 0,
                    'created_at': str(getattr(instance, 'created_at', '')),
                    'updated_at': str(getattr(instance, 'updated_at', '')),
                }
            except Exception:
                return {'error': 'Impossible de sérialiser le projet', 'id': str(getattr(instance, 'id', ''))}
    
    class Meta:
        model = Projet
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at', 'id')


class ChantierSerializer(serializers.ModelSerializer):
    projet_id = serializers.SerializerMethodField()
    projet = serializers.UUIDField(write_only=True, required=False)
    avancement_calcule = serializers.SerializerMethodField()
    budget = serializers.DecimalField(max_digits=15, decimal_places=2, coerce_to_string=True, required=False)
    budget_used = serializers.DecimalField(max_digits=15, decimal_places=2, coerce_to_string=True, required=False)

    def get_projet_id(self, obj):
        """Récupère l'ID du projet de manière sécurisée"""
        try:
            if obj is None:
                return None
            if hasattr(obj, 'projet_id'):
                projet_id = getattr(obj, 'projet_id', None)
                if projet_id is not None:
                    return str(projet_id)
            if hasattr(obj, 'projet'):
                try:
                    projet = getattr(obj, 'projet', None)
                    if projet is not None:
                        return str(getattr(projet, 'id', None))
                except Exception:
                    pass
            return None
        except (AttributeError, Exception):
            return None

    def get_avancement_calcule(self, obj):
        """Calcule l'avancement réel du chantier (0-100) à partir des lots/tâches."""
        try:
            if obj is None:
                return 0
            # Utiliser la méthode du modèle qui gère déjà les erreurs et agrégations
            try:
                value = obj.calculer_avancement()
            except Exception:
                value = getattr(obj, 'progress', 0)
            try:
                v = float(value or 0)
                if v < 0:
                    return 0
                if v > 100:
                    return 100
                return round(v, 0)
            except (TypeError, ValueError):
                return 0
        except Exception:
            return 0
    
    def to_representation(self, instance):
        """Override pour gérer toutes les erreurs possibles lors de la sérialisation"""
        try:
            data = super().to_representation(instance)
            # S'assurer que projet_id et avancement_calcule sont présents
            if 'projet_id' not in data or data['projet_id'] is None:
                try:
                    data['projet_id'] = self.get_projet_id(instance)
                except Exception:
                    data['projet_id'] = None
            if 'avancement_calcule' not in data or data['avancement_calcule'] is None:
                try:
                    data['avancement_calcule'] = self.get_avancement_calcule(instance)
                except Exception:
                    data['avancement_calcule'] = 0
            return data
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Erreur lors de la sérialisation d'un Chantier: {str(e)}")
            # Retourner une représentation minimale mais complète en cas d'erreur
            try:
                return {
                    'id': str(instance.id) if hasattr(instance, 'id') else None,
                    'name': getattr(instance, 'name', ''),
                    'description': getattr(instance, 'description', ''),
                    'projet_id': str(getattr(instance, 'projet_id', '')) if hasattr(instance, 'projet_id') and getattr(instance, 'projet_id', None) else None,
                    'status': getattr(instance, 'status', ''),
                    'priority': getattr(instance, 'priority', ''),
                    'progress': getattr(instance, 'progress', 0),
                    'avancement_calcule': getattr(instance, 'progress', 0),
                    'budget': str(getattr(instance, 'budget', '0')),
                    'budget_used': str(getattr(instance, 'budget_used', '0')),
                    'start_date': str(getattr(instance, 'start_date', '')) if getattr(instance, 'start_date', None) else None,
                    'end_date': str(getattr(instance, 'end_date', '')) if getattr(instance, 'end_date', None) else None,
                    'location': getattr(instance, 'location', ''),
                    'manager': getattr(instance, 'manager', ''),
                    'created_at': str(getattr(instance, 'created_at', '')),
                    'updated_at': str(getattr(instance, 'updated_at', '')),
                }
            except Exception:
                return {'error': 'Impossible de sérialiser le chantier', 'id': str(getattr(instance, 'id', ''))}
    
    def create(self, validated_data):
        projet_uuid = validated_data.pop('projet', None)
        if not projet_uuid:
            raise serializers.ValidationError({'projet': 'Le champ projet est requis pour la création.'})
        try:
            projet = Projet.objects.get(id=projet_uuid)
        except Projet.DoesNotExist:
            raise serializers.ValidationError({'projet': 'Le projet spécifié n\'existe pas.'})
        except ValueError as e:
            raise serializers.ValidationError({'projet': f'UUID invalide: {str(e)}'})
        validated_data['projet'] = projet
        try:
            return super().create(validated_data)
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f'Error in ChantierSerializer.create: {str(e)}')
            import traceback
            logger.error(traceback.format_exc())
            raise serializers.ValidationError({'non_field_errors': [f'Erreur lors de la création: {str(e)}']})
    
    def update(self, instance, validated_data):
        if 'projet' in validated_data:
            projet_uuid = validated_data.pop('projet')
            try:
                projet = Projet.objects.get(id=projet_uuid)
                validated_data['projet'] = projet
            except Projet.DoesNotExist:
                raise serializers.ValidationError({'projet': 'Le projet spécifié n\'existe pas.'})
        return super().update(instance, validated_data)

    class Meta:
        model = Chantier
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at', 'id')
        extra_kwargs = {
            'status': {'required': True},
            'priority': {'required': True},
            'start_date': {'required': True},
            'end_date': {'required': True},
            'location': {'required': True},
            'manager': {'required': True},
        }


class LotSerializer(serializers.ModelSerializer):
    chantier_id = serializers.SerializerMethodField()
    chantier = serializers.UUIDField(write_only=True, required=False)
    avancement_calcule = serializers.SerializerMethodField()

    def get_chantier_id(self, obj):
        """Récupère l'ID du chantier de manière sécurisée"""
        try:
            if hasattr(obj, 'chantier') and obj.chantier:
                return str(obj.chantier.id)
            return None
        except (AttributeError, Exception):
            return None

    def get_avancement_calcule(self, obj):
        """Calcule l'avancement de manière sécurisée"""
        try:
            if hasattr(obj, 'calculer_avancement'):
                try:
                    result = obj.calculer_avancement()
                    if result is None:
                        return int(getattr(obj, 'progress', 0))
                    try:
                        return int(float(result))
                    except (ValueError, TypeError):
                        return int(getattr(obj, 'progress', 0))
                except Exception:
                    return int(getattr(obj, 'progress', 0))
            return int(getattr(obj, 'progress', 0))
        except (AttributeError, Exception):
            # En cas d'erreur, retourner le progress manuel
            try:
                return int(getattr(obj, 'progress', 0))
            except (ValueError, TypeError):
                return 0
    
    def create(self, validated_data):
        chantier_uuid = validated_data.pop('chantier', None)
        if not chantier_uuid:
            raise serializers.ValidationError({'chantier': 'Le champ chantier est requis pour la création.'})
        try:
            chantier = Chantier.objects.get(id=chantier_uuid)
        except Chantier.DoesNotExist:
            raise serializers.ValidationError({'chantier': 'Le chantier spécifié n\'existe pas.'})
        validated_data['chantier'] = chantier
        return super().create(validated_data)
    
    def update(self, instance, validated_data):
        if 'chantier' in validated_data:
            chantier_uuid = validated_data.pop('chantier')
            try:
                chantier = Chantier.objects.get(id=chantier_uuid)
                validated_data['chantier'] = chantier
            except Chantier.DoesNotExist:
                raise serializers.ValidationError({'chantier': 'Le chantier spécifié n\'existe pas.'})
        return super().update(instance, validated_data)

    class Meta:
        model = Lot
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at', 'id')


class TacheSerializer(serializers.ModelSerializer):
    lot_id = serializers.SerializerMethodField()
    lot = serializers.UUIDField(write_only=True, required=False)
    ressources = serializers.PrimaryKeyRelatedField(many=True, queryset=Ressource.objects.all(), required=False)
    cost = serializers.DecimalField(max_digits=15, decimal_places=2, coerce_to_string=True, required=False)

    def get_lot_id(self, obj):
        """Récupère l'ID du lot de manière sécurisée"""
        try:
            if hasattr(obj, 'lot') and obj.lot:
                return str(obj.lot.id)
            return None
        except (AttributeError, Exception):
            return None

    def create(self, validated_data):
        lot_uuid = validated_data.pop('lot', None)
        if not lot_uuid:
            raise serializers.ValidationError({'lot': 'Le champ lot est requis pour la création.'})
        try:
            lot = Lot.objects.get(id=lot_uuid)
        except Lot.DoesNotExist:
            raise serializers.ValidationError({'lot': 'Le lot spécifié n\'existe pas.'})
        validated_data['lot'] = lot
        return super().create(validated_data)
    
    def update(self, instance, validated_data):
        if 'lot' in validated_data:
            lot_uuid = validated_data.pop('lot')
            try:
                lot = Lot.objects.get(id=lot_uuid)
                validated_data['lot'] = lot
            except Lot.DoesNotExist:
                raise serializers.ValidationError({'lot': 'Le lot spécifié n\'existe pas.'})
        return super().update(instance, validated_data)

    class Meta:
        model = Tache
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at', 'id')


class UtilisateurSerializer(serializers.ModelSerializer):
    mot_de_passe = serializers.CharField(write_only=True, required=False)
    
    class Meta:
        model = Utilisateur
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at', 'id')
        extra_kwargs = {
            'mot_de_passe': {'write_only': True},
        }


class RegisterSerializer(serializers.ModelSerializer):
    """Serializer pour l'inscription (sans rôle ADMINISTRATEUR)"""
    mot_de_passe = serializers.CharField(write_only=True, min_length=6)
    password_confirm = serializers.CharField(write_only=True, min_length=6)
    
    class Meta:
        model = Utilisateur
        fields = ('nom', 'email', 'mot_de_passe', 'password_confirm', 'role')
        extra_kwargs = {
            'role': {'required': True},
        }
    
    def validate_role(self, value):
        """Empêcher l'inscription avec le rôle ADMINISTRATEUR"""
        if value == 'ADMINISTRATEUR':
            raise serializers.ValidationError("Le rôle administrateur ne peut pas être créé lors de l'inscription.")
        return value
    
    def validate(self, attrs):
        if attrs['mot_de_passe'] != attrs['password_confirm']:
            raise serializers.ValidationError({"password_confirm": "Les mots de passe ne correspondent pas."})
        return attrs
    
    def create(self, validated_data):
        try:
            validated_data.pop('password_confirm', None)
            mot_de_passe = validated_data.pop('mot_de_passe')
            utilisateur = Utilisateur.objects.create(**validated_data)
            utilisateur.mot_de_passe = mot_de_passe  # Sera hashé dans save()
            utilisateur.save()
            return utilisateur
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f'Error in RegisterSerializer.create: {str(e)}')
            import traceback
            logger.error(traceback.format_exc())
            raise serializers.ValidationError({'non_field_errors': [f'Erreur lors de la création: {str(e)}']})


class LoginSerializer(serializers.Serializer):
    """Serializer pour la connexion"""
    email = serializers.EmailField()
    mot_de_passe = serializers.CharField(write_only=True)


class UtilisateurListSerializer(serializers.ModelSerializer):
    """Serializer pour la liste des utilisateurs (sans mot de passe)"""
    
    def to_representation(self, instance):
        """Override pour gérer toutes les erreurs possibles lors de la sérialisation"""
        try:
            return super().to_representation(instance)
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Erreur lors de la sérialisation d'un Utilisateur: {str(e)}")
            # Retourner une représentation minimale en cas d'erreur
            try:
                return {
                    'id': str(instance.id) if hasattr(instance, 'id') else None,
                    'nom': getattr(instance, 'nom', ''),
                    'email': str(getattr(instance, 'email', '')),
                    'role': str(getattr(instance, 'role', '')),
                    'is_approved': bool(getattr(instance, 'is_approved', False)),
                    'is_active': bool(getattr(instance, 'is_active', True)),
                    'created_at': str(getattr(instance, 'created_at', '')),
                    'updated_at': str(getattr(instance, 'updated_at', '')),
                }
            except Exception:
                return {'error': 'Impossible de sérialiser l\'utilisateur', 'id': str(getattr(instance, 'id', ''))}
    
    class Meta:
        model = Utilisateur
        fields = ('id', 'nom', 'email', 'role', 'is_approved', 'is_active', 'created_at', 'updated_at')
        read_only_fields = ('id', 'created_at', 'updated_at')


class IASerializer(serializers.ModelSerializer):
    seuil_confiance = serializers.FloatField(required=False)
    
    def to_representation(self, instance):
        """Override pour gérer toutes les erreurs possibles lors de la sérialisation"""
        try:
            return super().to_representation(instance)
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Erreur lors de la sérialisation d'une IA: {str(e)}")
            # Retourner une représentation minimale en cas d'erreur
            try:
                return {
                    'id': str(instance.id) if hasattr(instance, 'id') else None,
                    'modele': getattr(instance, 'modele', ''),
                    'seuil_confiance': float(getattr(instance, 'seuil_confiance', 0.5)),
                    'created_at': str(getattr(instance, 'created_at', '')),
                    'updated_at': str(getattr(instance, 'updated_at', '')),
                }
            except Exception:
                return {'error': 'Impossible de sérialiser l\'IA', 'id': str(getattr(instance, 'id', ''))}
    
    class Meta:
        model = IA
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at', 'id')


class AlerteSerializer(serializers.ModelSerializer):
    projet_id = serializers.SerializerMethodField()
    projet = serializers.UUIDField(write_only=True, required=False)
    ia_id = serializers.SerializerMethodField()
    ia = serializers.PrimaryKeyRelatedField(queryset=IA.objects.all(), allow_null=True, required=False)

    def get_projet_id(self, obj):
        """Récupère l'ID du projet de manière sécurisée"""
        try:
            if hasattr(obj, 'projet') and obj.projet:
                return str(obj.projet.id)
            return None
        except (AttributeError, Exception):
            return None
    
    def get_ia_id(self, obj):
        """Récupère l'ID de l'IA de manière sécurisée"""
        try:
            if hasattr(obj, 'ia') and obj.ia:
                return str(obj.ia.id)
            return None
        except (AttributeError, Exception):
            return None
    
    def create(self, validated_data):
        projet_uuid = validated_data.pop('projet', None)
        if not projet_uuid:
            raise serializers.ValidationError({'projet': 'Le champ projet est requis pour la création.'})
        try:
            projet = Projet.objects.get(id=projet_uuid)
        except Projet.DoesNotExist:
            raise serializers.ValidationError({'projet': 'Le projet spécifié n\'existe pas.'})
        validated_data['projet'] = projet
        return super().create(validated_data)
    
    def update(self, instance, validated_data):
        if 'projet' in validated_data:
            projet_uuid = validated_data.pop('projet')
            try:
                projet = Projet.objects.get(id=projet_uuid)
                validated_data['projet'] = projet
            except Projet.DoesNotExist:
                raise serializers.ValidationError({'projet': 'Le projet spécifié n\'existe pas.'})
        return super().update(instance, validated_data)

    class Meta:
        model = Alerte
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at', 'id')


class BudgetSerializer(serializers.ModelSerializer):
    projet_id = serializers.SerializerMethodField()
    projet = serializers.UUIDField(write_only=True, required=False)
    montant_prev = serializers.DecimalField(max_digits=15, decimal_places=2, coerce_to_string=True, required=False)
    montant_depense = serializers.DecimalField(max_digits=15, decimal_places=2, coerce_to_string=True, required=False)

    def get_projet_id(self, obj):
        """Récupère l'ID du projet de manière sécurisée"""
        try:
            # Vérifier que l'objet est valide
            if obj is None:
                return None
            
            # Essayer d'abord d'accéder à projet_id directement (plus rapide et sûr)
            try:
                if hasattr(obj, 'projet_id'):
                    projet_id = getattr(obj, 'projet_id', None)
                    if projet_id is not None:
                        return str(projet_id)
            except Exception:
                pass
            
            # Si projet_id n'est pas disponible, essayer d'accéder via la relation
            try:
                if hasattr(obj, 'projet'):
                    # Utiliser getattr pour éviter les requêtes DB
                    projet = getattr(obj, 'projet', None)
                    if projet is not None:
                        try:
                            return str(getattr(projet, 'id', None))
                        except Exception:
                            return None
            except Exception:
                pass
            
            return None
        except Exception as e:
            # Si erreur, retourner None pour éviter les erreurs 500
            import logging
            logger = logging.getLogger(__name__)
            logger.debug(f"Erreur dans get_projet_id pour Budget: {str(e)}")
            return None
    
    def to_representation(self, instance):
        """Override pour gérer toutes les erreurs possibles lors de la sérialisation"""
        try:
            data = super().to_representation(instance)
            # S'assurer que projet_id est présent
            if 'projet_id' not in data or data['projet_id'] is None:
                try:
                    data['projet_id'] = self.get_projet_id(instance)
                except Exception:
                    data['projet_id'] = None
            return data
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Erreur lors de la sérialisation d'un Budget: {str(e)}")
            # Retourner une représentation minimale mais complète en cas d'erreur
            try:
                return {
                    'id': str(instance.id) if hasattr(instance, 'id') else None,
                    'projet_id': str(getattr(instance, 'projet_id', '')) if hasattr(instance, 'projet_id') and getattr(instance, 'projet_id', None) else None,
                    'montant_prev': str(getattr(instance, 'montant_prev', '0')),
                    'montant_depense': str(getattr(instance, 'montant_depense', '0')),
                    'created_at': str(getattr(instance, 'created_at', '')),
                    'updated_at': str(getattr(instance, 'updated_at', '')),
                }
            except Exception:
                return {'error': 'Impossible de sérialiser le budget', 'id': str(getattr(instance, 'id', ''))}
    
    def create(self, validated_data):
        projet_uuid = validated_data.pop('projet', None)
        if not projet_uuid:
            raise serializers.ValidationError({'projet': 'Le champ projet est requis pour la création.'})
        try:
            projet = Projet.objects.get(id=projet_uuid)
        except Projet.DoesNotExist:
            raise serializers.ValidationError({'projet': 'Le projet spécifié n\'existe pas.'})
        validated_data['projet'] = projet
        return super().create(validated_data)
    
    def update(self, instance, validated_data):
        if 'projet' in validated_data:
            projet_uuid = validated_data.pop('projet')
            try:
                projet = Projet.objects.get(id=projet_uuid)
                validated_data['projet'] = projet
            except Projet.DoesNotExist:
                raise serializers.ValidationError({'projet': 'Le projet spécifié n\'existe pas.'})
        return super().update(instance, validated_data)

    class Meta:
        model = Budget
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at', 'id')


class RapportSerializer(serializers.ModelSerializer):
    projet_id = serializers.SerializerMethodField()
    projet = serializers.UUIDField(write_only=True, required=False)

    def get_projet_id(self, obj):
        """Récupère l'ID du projet de manière sécurisée"""
        try:
            if hasattr(obj, 'projet') and obj.projet:
                return str(obj.projet.id)
            return None
        except (AttributeError, Exception):
            return None
    
    def create(self, validated_data):
        projet_uuid = validated_data.pop('projet', None)
        if not projet_uuid:
            raise serializers.ValidationError({'projet': 'Le champ projet est requis pour la création.'})
        try:
            projet = Projet.objects.get(id=projet_uuid)
        except Projet.DoesNotExist:
            raise serializers.ValidationError({'projet': 'Le projet spécifié n\'existe pas.'})
        validated_data['projet'] = projet
        return super().create(validated_data)
    
    def update(self, instance, validated_data):
        if 'projet' in validated_data:
            projet_uuid = validated_data.pop('projet')
            try:
                projet = Projet.objects.get(id=projet_uuid)
                validated_data['projet'] = projet
            except Projet.DoesNotExist:
                raise serializers.ValidationError({'projet': 'Le projet spécifié n\'existe pas.'})
        return super().update(instance, validated_data)

    class Meta:
        model = Rapport
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at', 'id')


class FournisseurSerializer(serializers.ModelSerializer):
    class Meta:
        model = Fournisseur
        fields = '__all__'


class RessourceSerializer(serializers.ModelSerializer):
    fournisseur_id = serializers.SerializerMethodField()
    fournisseur = serializers.UUIDField(write_only=True, allow_null=True, required=False)
    cout_unitaire = serializers.DecimalField(max_digits=15, decimal_places=2, coerce_to_string=True, required=False)

    def get_fournisseur_id(self, obj):
        """Récupère l'ID du fournisseur de manière sécurisée"""
        try:
            if hasattr(obj, 'fournisseur') and obj.fournisseur:
                return str(obj.fournisseur.id)
            return None
        except (AttributeError, Exception):
            return None
    
    def create(self, validated_data):
        fournisseur_uuid = validated_data.pop('fournisseur', None)
        if fournisseur_uuid:
            try:
                from .models import Fournisseur
                fournisseur = Fournisseur.objects.get(id=fournisseur_uuid)
                validated_data['fournisseur'] = fournisseur
            except Fournisseur.DoesNotExist:
                raise serializers.ValidationError({'fournisseur': 'Le fournisseur spécifié n\'existe pas.'})
        return super().create(validated_data)
    
    def update(self, instance, validated_data):
        if 'fournisseur' in validated_data:
            fournisseur_uuid = validated_data.pop('fournisseur')
            if fournisseur_uuid:
                try:
                    from .models import Fournisseur
                    fournisseur = Fournisseur.objects.get(id=fournisseur_uuid)
                    validated_data['fournisseur'] = fournisseur
                except Fournisseur.DoesNotExist:
                    raise serializers.ValidationError({'fournisseur': 'Le fournisseur spécifié n\'existe pas.'})
            else:
                validated_data['fournisseur'] = None
        return super().update(instance, validated_data)

    class Meta:
        model = Ressource
        fields = '__all__'


class RessourceHumaineSerializer(RessourceSerializer):
    class Meta(RessourceSerializer.Meta):
        model = RessourceHumaine


class RessourceMaterielleSerializer(RessourceSerializer):
    class Meta(RessourceSerializer.Meta):
        model = RessourceMaterielle


class ContactMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactMessage
        fields = ['id', 'first_name', 'last_name', 'email', 'phone', 'organization', 'subject', 'message', 'is_read', 'created_at']
        read_only_fields = ['id', 'is_read', 'created_at']
