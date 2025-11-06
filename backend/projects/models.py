import uuid
from django.db import models
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.contrib.auth.hashers import make_password, check_password


class TimeStampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class Projet(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=50, default='En cours')
    priority = models.CharField(max_length=50, default='Moyenne')
    budget = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    location = models.CharField(max_length=255, blank=True)
    manager = models.CharField(max_length=255, blank=True)

    def __str__(self) -> str:
        return self.name

    @property
    def avancement_calcule(self):
        """Calculate project advancement based on chantiers"""
        try:
            chantiers = self.chantiers.all()
            if not chantiers:
                return 0
            total_avancement = 0
            count = 0
            for chantier in chantiers:
                try:
                    avancement = chantier.calculer_avancement()
                    if avancement is not None:
                        total_avancement += float(avancement)
                        count += 1
                except Exception:
                    # Si le calcul échoue pour un chantier, continuer avec les autres
                    continue
            if count > 0:
                return round(total_avancement / count, 2)
            return 0
        except Exception:
            # En cas d'erreur, retourner 0 pour éviter les erreurs 500
            return 0
    
    def synchroniser_statut(self):
        """Synchronise le statut du projet en fonction de l'état des chantiers"""
        try:
            chantiers = self.chantiers.all()
            
            if not chantiers.exists():
                return 'Planifié'
            
            # Vérifier les statuts de tous les chantiers
            try:
                tous_termines = all(chantier.status == 'Terminé' for chantier in chantiers)
                tous_annules = all(chantier.status == 'Annulé' for chantier in chantiers)
                en_cours = any(chantier.status in ['En cours', 'En attente'] for chantier in chantiers)
                
                if tous_termines:
                    return 'Terminé'
                elif tous_annules:
                    return 'Annulé'
                elif en_cours:
                    return 'En cours'
                else:
                    return 'Planifié'
            except Exception:
                # En cas d'erreur, retourner le statut actuel
                return self.status if self.status else 'Planifié'
        except Exception:
            # En cas d'erreur, retourner le statut actuel ou un statut par défaut
            return self.status if self.status else 'Planifié'


class Chantier(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    projet = models.ForeignKey(Projet, related_name='chantiers', on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=50)
    priority = models.CharField(max_length=50)
    progress = models.IntegerField(default=0)
    budget = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    budget_used = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    start_date = models.DateField()
    end_date = models.DateField()
    location = models.CharField(max_length=255)
    manager = models.CharField(max_length=255)

    def __str__(self) -> str:
        return self.name

    def calculer_avancement(self):
        """Calculate advancement based on lots"""
        try:
            lots = self.lots.all()
            if not lots:
                return float(self.progress) if self.progress is not None else 0
            total_avancement = 0
            count = 0
            for lot in lots:
                try:
                    avancement = lot.calculer_avancement()
                    if avancement is not None:
                        total_avancement += float(avancement)
                        count += 1
                except Exception:
                    # Si le calcul échoue pour un lot, continuer avec les autres
                    continue
            if count > 0:
                return round(total_avancement / count, 2)
            return float(self.progress) if self.progress is not None else 0
        except Exception:
            # En cas d'erreur, retourner le progress actuel ou 0
            return float(self.progress) if self.progress is not None else 0
    
    def synchroniser_statut(self):
        """Synchronise le statut du chantier en fonction de l'état des lots"""
        try:
            lots = self.lots.all()
            
            if not lots.exists():
                return self.status  # Garder le statut actuel s'il n'y a pas de lots
            
            # Vérifier les statuts de tous les lots
            try:
                tous_termines = all(lot.status == 'Terminé' for lot in lots)
                tous_annules = all(lot.status == 'Annulé' for lot in lots)
                en_cours = any(lot.status in ['En cours', 'En attente'] for lot in lots)
                
                if tous_termines:
                    return 'Terminé'
                elif tous_annules:
                    return 'Annulé'
                elif en_cours:
                    return 'En cours'
                else:
                    return 'Planifié'
            except Exception:
                # En cas d'erreur, retourner le statut actuel
                return self.status if self.status else 'Planifié'
        except Exception:
            # En cas d'erreur, retourner le statut actuel ou un statut par défaut
            return self.status if self.status else 'Planifié'


class Lot(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    chantier = models.ForeignKey(Chantier, related_name='lots', on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    progress = models.IntegerField(default=0)
    status = models.CharField(max_length=50)
    start_date = models.DateField()
    end_date = models.DateField()

    def __str__(self) -> str:
        return self.name

    def calculer_avancement(self):
        """Calcule l'avancement basé sur le nombre de tâches terminées vs total de tâches"""
        try:
            taches = self.taches.all()
            if not taches.exists():
                return float(self.progress) if self.progress is not None else 0
            
            total_taches = taches.count()
            if total_taches == 0:
                return float(self.progress) if self.progress is not None else 0
            
            # Compter les tâches terminées
            taches_terminees = taches.filter(status='Terminé').count()
            
            # Calculer l'avancement en pourcentage : (tâches terminées / total tâches) * 100
            avancement = (taches_terminees / total_taches) * 100
            
            return round(avancement, 2)
        except Exception:
            # En cas d'erreur, retourner le progress actuel ou 0
            return float(self.progress) if self.progress is not None else 0
    
    def synchroniser_statut(self):
        """Synchronise le statut du lot en fonction de l'état des tâches"""
        try:
            taches = self.taches.all()
            
            if not taches.exists():
                return self.status  # Garder le statut actuel s'il n'y a pas de tâches
            
            # Vérifier les statuts de toutes les tâches
            try:
                toutes_terminees = all(tache.status == 'Terminé' for tache in taches)
                toutes_annulees = all(tache.status == 'Annulé' for tache in taches)
                en_cours = any(tache.status in ['En cours', 'En attente'] for tache in taches)
                
                if toutes_terminees:
                    return 'Terminé'
                elif toutes_annulees:
                    return 'Annulé'
                elif en_cours:
                    return 'En cours'
                else:
                    return 'Planifié'
            except Exception:
                # En cas d'erreur, retourner le statut actuel
                return self.status if self.status else 'Planifié'
        except Exception:
            # En cas d'erreur, retourner le statut actuel ou un statut par défaut
            return self.status if self.status else 'Planifié'


class Tache(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    lot = models.ForeignKey(Lot, related_name='taches', on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=50)
    assigned_to = models.CharField(max_length=255, blank=True)
    priority = models.CharField(max_length=50, blank=True)
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    cost = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    progress = models.FloatField(default=0)
    ressources = models.ManyToManyField('Ressource', related_name='taches', blank=True)

    def __str__(self) -> str:
        return self.name


class Utilisateur(TimeStampedModel):
    ROLE_CHOICES = [
        ('ADMINISTRATEUR', 'Administrateur'),
        ('MAITRE_OUVRAGE', 'MaitreOuvrage'),
        ('CHEF_DE_PROJET', 'ChefDeProjet'),
        ('MEMBRE_TECHNIQUE', 'MembreTechnique'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    nom = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    mot_de_passe = models.CharField(max_length=255)
    role = models.CharField(max_length=32, choices=ROLE_CHOICES)
    is_active = models.BooleanField(default=True)
    is_approved = models.BooleanField(default=False)

    def __str__(self) -> str:
        return self.nom
    
    def save(self, *args, **kwargs):
        """Override save pour hasher le mot de passe avant la sauvegarde"""
        # Si le mot de passe est défini et n'est pas déjà hashé
        if self.mot_de_passe and not self.mot_de_passe.startswith('pbkdf2_sha256$'):
            self.mot_de_passe = make_password(self.mot_de_passe)
        super().save(*args, **kwargs)
    
    def check_password(self, raw_password):
        """Vérifie si le mot de passe en clair correspond au hash stocké"""
        try:
            # Vérifier que les mots de passe sont valides
            if not raw_password or not self.mot_de_passe:
                return False
            
            # Si le mot de passe stocké est déjà hashé, utiliser check_password de Django
            if self.mot_de_passe.startswith('pbkdf2_sha256$'):
                return check_password(raw_password, self.mot_de_passe)
            
            # Sinon, pour la migration des anciens mots de passe en clair, comparer directement
            # Après la première connexion réussie, le mot de passe sera hashé au prochain save()
            if raw_password == self.mot_de_passe:
                # Hasher le mot de passe pour la prochaine fois (migration automatique)
                self.mot_de_passe = make_password(raw_password)
                self.save(update_fields=['mot_de_passe'])
                return True
            return False
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Erreur dans check_password: {str(e)}")
            return False


class IA(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    modele = models.CharField(max_length=255)
    seuil_confiance = models.FloatField(default=0.5)

    def __str__(self) -> str:
        return self.modele
    
    def predict_delay_risk(self, projet):
        """Utilise le service ML pour prédire le risque de retard"""
        try:
            from .ml_service import ml_service
            return ml_service.predict_delay_risk(projet)
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Erreur dans predict_delay_risk: {str(e)}")
            return {
                'risk_level': 'moyen',
                'risk_score': 0.5,
                'days_delay': 0,
                'confidence': 0.3,
                'error': str(e)
            }
    
    def predict_budget_overrun(self, projet):
        """Utilise le service ML pour prédire le dépassement budgétaire"""
        try:
            from .ml_service import ml_service
            budget = None
            try:
                budget = projet.budget_detail
            except Exception:
                pass
            return ml_service.predict_budget_overrun(projet, budget=budget)
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Erreur dans predict_budget_overrun: {str(e)}")
            return {
                'risk_level': 'moyen',
                'risk_score': 0.5,
                'estimated_overrun': 0,
                'estimated_total': float(projet.budget) if projet.budget else 0,
                'confidence': 0.3,
                'error': str(e)
            }
    
    def generate_recommendations(self, projet, delay_prediction=None, budget_prediction=None):
        """Génère des recommandations automatiques pour un projet"""
        try:
            from .ml_service import ml_service
            if delay_prediction is None:
                delay_prediction = self.predict_delay_risk(projet)
            if budget_prediction is None:
                budget_prediction = self.predict_budget_overrun(projet)
            return ml_service.generate_recommendations(projet, delay_prediction, budget_prediction)
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Erreur dans generate_recommendations: {str(e)}")
            return [{
                'type': 'general',
                'priority': 'low',
                'message': 'Surveiller régulièrement l\'avancement du projet',
                'action': 'Maintenir une communication régulière avec l\'équipe'
            }]

    # ===== Nouvelles méthodes demandées =====
    def analyserDonnees(self, projet):
        """Analyser les données du projet et retourner un résumé + indicateurs clés."""
        try:
            delay_pred = self.predict_delay_risk(projet)
            budget_pred = self.predict_budget_overrun(projet)
            recommandations = self.generate_recommendations(projet, delay_pred, budget_pred)

            # Résumé simple des données projet
            resume = {
                'projet_id': str(getattr(projet, 'id', '')),
                'projet_name': getattr(projet, 'name', ''),
                'avancement_calcule': getattr(projet, 'avancement_calcule', 0),
                'budget_total': float(getattr(projet, 'budget', 0) or 0),
                'nb_chantiers': getattr(projet, 'chantiers', []).count() if hasattr(projet, 'chantiers') else 0,
            }

            return {
                'resume': resume,
                'predictions': {
                    'retard': delay_pred,
                    'budget': budget_pred,
                },
                'recommandations': recommandations,
            }
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Erreur dans analyserDonnees: {str(e)}")
            return {
                'resume': {},
                'predictions': {},
                'recommandations': [],
                'error': str(e)
            }

    def predireRisques(self, projet):
        """Prédire les risques potentiels (retard et budget) et agréger un score global (0-1)."""
        try:
            delay_pred = self.predict_delay_risk(projet)
            budget_pred = self.predict_budget_overrun(projet)

            # Agrégation simple: moyenne des scores (bornés 0..1)
            delay_score = float(delay_pred.get('risk_score', 0))
            budget_score = float(budget_pred.get('risk_score', 0))
            global_score = max(0.0, min(1.0, (delay_score + budget_score) / 2.0))

            niveau = 'faible'
            if global_score > 0.7:
                niveau = 'élevé'
            elif global_score > 0.4:
                niveau = 'moyen'

            return {
                'global_risk_score': round(global_score, 2),
                'global_risk_level': niveau,
                'delay': delay_pred,
                'budget': budget_pred,
            }
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Erreur dans predireRisques: {str(e)}")
            return {
                'global_risk_score': 0.5,
                'global_risk_level': 'moyen',
                'error': str(e)
            }

    def genererAlertes(self, projet):
        """Génère des alertes automatiquement selon le seuil de confiance (seuil_confiance).
        Crée des objets Alerte si le risque global dépasse le seuil.
        """
        try:
            resultats = self.predireRisques(projet)
            score = float(resultats.get('global_risk_score', 0))
            if score >= float(self.seuil_confiance or 0.5):
                # Déterminer type/severité
                type_alerte = 'WARNING'
                description = f"Risque global {resultats.get('global_risk_level', 'moyen')} (score {score}) détecté par l'IA."
                if score > 0.7:
                    type_alerte = 'CRITICAL'

                # Créer une alerte reliée au projet et à cette IA
                try:
                    alerte = Alerte.objects.create(
                        type=type_alerte,
                        description=description,
                        statut='NOUVELLE',
                        projet=projet,
                        ia=self,
                    )
                except Exception:
                    # Au cas où la FK IA/projet poserait problème, ne pas planter
                    alerte = None

                return {
                    'created': alerte is not None,
                    'alerte_id': getattr(alerte, 'id', None) if alerte else None,
                    'type': type_alerte,
                    'description': description,
                    'risk_score': score,
                }

            # Pas d'alerte si en-dessous du seuil
            return {
                'created': False,
                'reason': 'below_threshold',
                'risk_score': score,
                'threshold': float(self.seuil_confiance or 0.5),
            }
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Erreur dans genererAlertes: {str(e)}")
            return {
                'created': False,
                'error': str(e)
            }


class Fournisseur(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    societe = models.CharField(max_length=255)
    contact = models.CharField(max_length=255)

    def __str__(self) -> str:
        return self.societe


class Ressource(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    nom = models.CharField(max_length=255)
    quantite = models.IntegerField(default=1)
    cout_unitaire = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    fournisseur = models.ForeignKey(
        Fournisseur, 
        related_name='ressources', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True
    )

    def __str__(self) -> str:
        return self.nom


class RessourceHumaine(Ressource):
    role = models.CharField(max_length=255)
    competence = models.CharField(max_length=255)

    def __str__(self) -> str:
        return f"{self.nom} - {self.role}"


class RessourceMaterielle(Ressource):
    type = models.CharField(max_length=255)
    etat = models.CharField(max_length=255)

    def __str__(self) -> str:
        return f"{self.nom} - {self.type}"


# ====== Signals pour synchroniser l'avancement des lots/chantier/projet quand les tâches changent ======

def _mettre_a_jour_lot_et_hierarchie(lot: 'Lot') -> None:
    try:
        # Mettre à jour l'avancement du lot
        try:
            nouveau_progress = lot.calculer_avancement()
        except Exception:
            nouveau_progress = getattr(lot, 'progress', 0)

        if nouveau_progress is not None:
            try:
                lot.progress = float(nouveau_progress)
            except Exception:
                pass

        # Mettre à jour le statut du lot en fonction des tâches
        try:
            taches_qs = lot.taches.all()
            if taches_qs.exists():
                if all((t.status == 'Terminé') for t in taches_qs):
                    lot.status = 'Terminé'
                elif any((t.status == 'En cours') for t in taches_qs):
                    lot.status = 'En cours'
                else:
                    lot.status = 'En attente'
        except Exception:
            pass

        lot.save(update_fields=['progress', 'status', 'updated_at'])

        # Mettre à jour le chantier parent
        try:
            chantier = lot.chantier
            if chantier:
                try:
                    chantier_progress = chantier.calculer_avancement()
                    chantier.progress = float(chantier_progress or 0)
                except Exception:
                    pass
                try:
                    chantier.status = chantier.synchroniser_statut()
                except Exception:
                    pass
                chantier.save(update_fields=['progress', 'status', 'updated_at'])

                # Mettre à jour le projet parent
                try:
                    projet = chantier.projet
                    if projet:
                        try:
                            # avancement_calcule est une propriété, pas stockée; on peut synchroniser le statut
                            projet.status = projet.synchroniser_statut()
                        except Exception:
                            pass
                        projet.save(update_fields=['status', 'updated_at'])
                except Exception:
                    pass
        except Exception:
            pass
    except Exception:
        # Ne pas faire planter un signal
        pass


@receiver(post_save, sender=Tache)
def tache_post_save(sender, instance: 'Tache', **kwargs):
    try:
        if instance and instance.lot:
            _mettre_a_jour_lot_et_hierarchie(instance.lot)
    except Exception:
        pass


@receiver(post_delete, sender=Tache)
def tache_post_delete(sender, instance: 'Tache', **kwargs):
    try:
        if instance and instance.lot:
            _mettre_a_jour_lot_et_hierarchie(instance.lot)
    except Exception:
        pass


class Budget(TimeStampedModel):
    id = models.BigAutoField(primary_key=True)
    montant_prev = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    montant_depense = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    projet = models.OneToOneField(
        Projet, 
        related_name='budget_detail', 
        on_delete=models.CASCADE
    )

    def __str__(self) -> str:
        return f"Budget {self.projet.name}"


class Alerte(TimeStampedModel):
    TYPE_CHOICES = [
        ('INFO', 'Info'),
        ('WARNING', 'Warning'),
        ('CRITICAL', 'Critical'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    type = models.CharField(max_length=16, choices=TYPE_CHOICES)
    description = models.TextField()
    date = models.DateField(auto_now_add=True)
    statut = models.CharField(max_length=50, default='NOUVELLE')
    projet = models.ForeignKey(
        Projet, 
        related_name='alertes', 
        on_delete=models.CASCADE
    )
    ia = models.ForeignKey(
        IA, 
        related_name='alertes', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True
    )

    def __str__(self) -> str:
        return f"{self.type} - {self.projet.name}"


class Rapport(TimeStampedModel):
    id = models.BigAutoField(primary_key=True)
    titre = models.CharField(max_length=255)
    contenu = models.TextField()
    date_generation = models.DateField(auto_now_add=True)
    projet = models.ForeignKey(
        Projet, 
        related_name='rapports', 
        on_delete=models.CASCADE
    )

    def __str__(self) -> str:
        return self.titre


class ContactMessage(TimeStampedModel):
    """Modèle pour stocker les messages de contact"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    first_name = models.CharField(max_length=255)
    last_name = models.CharField(max_length=255)
    email = models.EmailField()
    phone = models.CharField(max_length=20, blank=True)
    organization = models.CharField(max_length=255, blank=True)
    subject = models.CharField(max_length=255)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Message de contact'
        verbose_name_plural = 'Messages de contact'
    
    def __str__(self) -> str:
        return f"Message de {self.first_name} {self.last_name} - {self.subject}"
