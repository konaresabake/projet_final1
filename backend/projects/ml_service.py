"""
Service de Machine Learning pour l'analyse prédictive des projets
Inclut : prédiction de retard, dépassement budgétaire, et recommandations
Utilise les modèles ML entraînés depuis buildflow_models.pkl
"""
import logging
import os
import pickle
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Tuple
from decimal import Decimal

logger = logging.getLogger(__name__)


class MLPredictionService:
    """
    Service de prédiction ML pour les projets
    Utilise les modèles ML entraînés depuis buildflow_models.pkl
    Fallback vers des méthodes statistiques si les modèles ne peuvent pas être chargés
    """
    
    def __init__(self):
        self.logger = logger
        self.models = {}
        self.models_loaded = False
        self._load_models()
    
    def _load_models(self):
        """Charge les modèles ML depuis le fichier buildflow_models.pkl"""
        try:
            # Chemin vers le fichier .pkl (dans le répertoire backend)
            # ml_service.py est dans projects/, donc on remonte de 2 niveaux pour aller au backend
            base_dir = Path(__file__).resolve().parent.parent
            model_path = base_dir / 'buildflow_models.pkl'
            
            if not model_path.exists():
                self.logger.warning(f"Fichier modèle non trouvé: {model_path}")
                self.models_loaded = False
                return
            
            with open(model_path, 'rb') as f:
                self.models = pickle.load(f)
            
            # Vérifier que tous les modèles nécessaires sont présents
            required_keys = [
                'budget_model', 'scaler_budget', 'feature_names_budget',
                'retard_model', 'scaler_retard', 'feature_names_retard',
                'risk_model', 'scaler_risk', 'feature_names_risk'
            ]
            
            missing_keys = [key for key in required_keys if key not in self.models]
            if missing_keys:
                self.logger.warning(f"Clés manquantes dans le modèle: {missing_keys}")
                self.models_loaded = False
                return
            
            self.models_loaded = True
            self.logger.info("Modèles ML chargés avec succès depuis buildflow_models.pkl")
            
        except Exception as e:
            self.logger.error(f"Erreur lors du chargement des modèles ML: {str(e)}")
            self.logger.warning("Utilisation des méthodes statistiques en fallback")
            self.models_loaded = False
            self.models = {}
    
    def extract_ml_features(self, projet, chantiers, taches):
        """
        Extrait les caractéristiques d'un projet selon le format attendu par les modèles ML
        
        Features attendues:
        - budget_prevu: Budget prévu du projet
        - duree_prevue: Durée prévue en jours
        - nb_ouvriers: Nombre d'ouvriers (estimé depuis les tâches)
        - incidents_chantier: Nombre d'incidents (estimé depuis les tâches en retard)
        - experience_entreprise: Score d'expérience (basé sur la priorité et l'avancement)
        - retard_prevu: Retard prévu en jours (pour certains modèles)
        """
        try:
            features = {}
            
            # Budget prévu
            budget_total = float(projet.budget) if projet.budget else 0
            features['budget_prevu'] = max(budget_total, 1)
            
            # Durée prévue
            if projet.start_date and projet.end_date:
                duree_prevue = (projet.end_date - projet.start_date).days
                features['duree_prevue'] = max(duree_prevue, 1)
            else:
                features['duree_prevue'] = 365  # Valeur par défaut
            
            # Nombre d'ouvriers (estimé depuis le nombre de tâches actives)
            nb_taches_actives = sum(1 for t in taches if t.status != 'Terminé')
            # Estimation: 1 ouvrier pour 5 tâches actives (minimum 1)
            features['nb_ouvriers'] = max(nb_taches_actives // 5, 1)
            
            # Incidents chantier (estimé depuis les tâches en retard)
            nb_taches_retard = sum(
                1 for t in taches 
                if t.end_date and t.end_date < datetime.now().date() and t.status != 'Terminé'
            )
            features['incidents_chantier'] = nb_taches_retard
            
            # Expérience entreprise (score basé sur la priorité et l'avancement)
            priority_map = {'Haute': 3, 'Moyenne': 2, 'Basse': 1}
            priorite_num = priority_map.get(projet.priority, 2)
            
            avancement = 0
            try:
                if hasattr(projet, 'avancement_calcule'):
                    avancement = float(projet.avancement_calcule) if projet.avancement_calcule else 0
            except Exception:
                avancement = 0
            
            # Score d'expérience: combinaison de priorité et avancement
            # Plus le projet est avancé et prioritaire, plus l'expérience est élevée
            experience_score = (priorite_num * 10) + (avancement / 10)
            features['experience_entreprise'] = max(experience_score, 1)
            
            # Retard prévu (en jours)
            if projet.start_date and projet.end_date:
                jours_ecoules = (datetime.now().date() - projet.start_date).days if projet.start_date else 0
                pourcentage_temps_ecoule = min(jours_ecoules / features['duree_prevue'] if features['duree_prevue'] > 0 else 0, 1.0)
                retard_avancement = pourcentage_temps_ecoule - (avancement / 100)
                
                if retard_avancement > 0:
                    jours_retard = int(retard_avancement * features['duree_prevue'])
                else:
                    # Estimation basée sur la tendance
                    jours_restants = features['duree_prevue'] - jours_ecoules
                    if avancement < 50 and pourcentage_temps_ecoule > 0.5:
                        jours_retard = max(int((0.5 - avancement/100) * jours_restants), 0)
                    else:
                        jours_retard = 0
            else:
                jours_retard = 0
            
            features['retard_prevu'] = max(jours_retard, 0)
            
            return features
        except Exception as e:
            self.logger.error(f"Erreur lors de l'extraction des features ML: {str(e)}")
            return {}
    
    def extract_project_features(self, projet, chantiers, taches):
        """Extrait les caractéristiques d'un projet (méthode de fallback)"""
        try:
            features = {}
            
            # Caractéristiques temporelles
            if projet.start_date and projet.end_date:
                duree_prevue = (projet.end_date - projet.start_date).days
                jours_ecoules = (datetime.now().date() - projet.start_date).days if projet.start_date else 0
                features['duree_prevue'] = max(duree_prevue, 1)
                features['jours_ecoules'] = max(jours_ecoules, 0)
                features['pourcentage_temps_ecoule'] = min(jours_ecoules / duree_prevue if duree_prevue > 0 else 0, 1.0)
            else:
                features['duree_prevue'] = 365
                features['jours_ecoules'] = 0
                features['pourcentage_temps_ecoule'] = 0
            
            # Caractéristiques budgétaires
            budget_total = float(projet.budget) if projet.budget else 0
            budget_utilise = 0
            for chantier in chantiers:
                try:
                    budget_utilise += float(chantier.budget_used) if chantier.budget_used else 0
                except (ValueError, TypeError):
                    continue
            
            features['budget_total'] = max(budget_total, 1)
            features['budget_utilise'] = budget_utilise
            features['ratio_budget'] = budget_utilise / features['budget_total'] if features['budget_total'] > 0 else 0
            
            # Caractéristiques d'avancement
            avancement = 0
            try:
                if hasattr(projet, 'avancement_calcule'):
                    avancement = float(projet.avancement_calcule) if projet.avancement_calcule else 0
            except Exception:
                avancement = 0
            
            features['avancement'] = min(max(avancement, 0), 100)
            features['retard_avancement'] = features['pourcentage_temps_ecoule'] - (features['avancement'] / 100)
            
            # Caractéristiques structurelles
            features['nb_chantiers'] = len(chantiers)
            features['nb_taches'] = len(taches)
            features['nb_taches_terminees'] = sum(1 for t in taches if t.status == 'Terminé')
            features['nb_taches_en_retard'] = sum(1 for t in taches if t.end_date and t.end_date < datetime.now().date() and t.status != 'Terminé')
            
            # Caractéristiques de priorité
            priority_map = {'Haute': 3, 'Moyenne': 2, 'Basse': 1}
            features['priorite_num'] = priority_map.get(projet.priority, 2)
            
            return features
        except Exception as e:
            self.logger.error(f"Erreur lors de l'extraction des features: {str(e)}")
            return {}
    
    def predict_delay_risk(self, projet, chantiers=None, taches=None) -> Dict:
        """
        Prédit le risque de retard de livraison en utilisant le modèle ML si disponible
        
        Returns:
            {
                'risk_level': 'faible' | 'moyen' | 'élevé',
                'risk_score': float (0-1),
                'days_delay': int (jours de retard estimés),
                'confidence': float (0-1)
            }
        """
        try:
            if chantiers is None:
                chantiers = list(projet.chantiers.all())
            if taches is None:
                taches = []
                for chantier in chantiers:
                    try:
                        for lot in chantier.lots.all():
                            taches.extend(list(lot.taches.all()))
                    except Exception:
                        continue
            
            # Essayer d'utiliser le modèle ML
            if self.models_loaded and 'retard_model' in self.models:
                try:
                    ml_features = self.extract_ml_features(projet, chantiers, taches)
                    if ml_features:
                        # Préparer les features selon l'ordre attendu par le modèle
                        feature_names = self.models['feature_names_retard']
                        feature_values = [ml_features.get(name, 0) for name in feature_names]
                        
                        # Normaliser avec le scaler
                        scaler = self.models['scaler_retard']
                        feature_array = scaler.transform([feature_values])
                        
                        # Prédire avec le modèle Ridge
                        model = self.models['retard_model']
                        days_delay_predicted = model.predict(feature_array)[0]
                        days_delay = max(int(days_delay_predicted), 0)
                        
                        # Calculer le score de risque basé sur la prédiction
                        duree_prevue = ml_features.get('duree_prevue', 365)
                        risk_score = min(days_delay / duree_prevue if duree_prevue > 0 else 0.5, 1.0)
                        
                        # Déterminer le niveau de risque
                        if risk_score >= 0.7:
                            risk_level = 'élevé'
                        elif risk_score >= 0.4:
                            risk_level = 'moyen'
                        else:
                            risk_level = 'faible'
                        
                        # Calculer la confiance
                        nb_taches_total = len(taches)
                        confidence = min(0.6 + (nb_taches_total / 20) * 0.3, 0.95) if nb_taches_total > 0 else 0.5
                        confidence = max(confidence, 0.3)
                        
                        return {
                            'risk_level': risk_level,
                            'risk_score': round(risk_score, 3),
                            'days_delay': days_delay,
                            'confidence': round(confidence, 2),
                            'model_used': 'ML'
                        }
                except Exception as e:
                    self.logger.warning(f"Erreur lors de l'utilisation du modèle ML pour retard: {str(e)}, fallback vers méthode statistique")
            
            # Fallback vers la méthode statistique
            features = self.extract_project_features(projet, chantiers, taches)
            
            if not features:
                return {
                    'risk_level': 'moyen',
                    'risk_score': 0.5,
                    'days_delay': 0,
                    'confidence': 0.3,
                    'model_used': 'statistical'
                }
            
            # Calcul du score de risque basé sur plusieurs facteurs
            risk_factors = []
            
            # Facteur 1: Retard d'avancement
            retard_avancement = features.get('retard_avancement', 0)
            if retard_avancement > 0.2:
                risk_factors.append(0.4)
            elif retard_avancement > 0.1:
                risk_factors.append(0.2)
            else:
                risk_factors.append(0.0)
            
            # Facteur 2: Tâches en retard
            nb_taches_retard = features.get('nb_taches_en_retard', 0)
            nb_taches_total = features.get('nb_taches', 1)
            ratio_retard = nb_taches_retard / nb_taches_total if nb_taches_total > 0 else 0
            if ratio_retard > 0.3:
                risk_factors.append(0.3)
            elif ratio_retard > 0.1:
                risk_factors.append(0.15)
            else:
                risk_factors.append(0.0)
            
            # Facteur 3: Délai restant vs avancement
            jours_restants = features.get('duree_prevue', 365) - features.get('jours_ecoules', 0)
            avancement = features.get('avancement', 0)
            if jours_restants > 0 and avancement < 100:
                avancement_requis_par_jour = (100 - avancement) / jours_restants if jours_restants > 0 else 0
                if avancement_requis_par_jour > 2.0:
                    risk_factors.append(0.2)
                elif avancement_requis_par_jour > 1.0:
                    risk_factors.append(0.1)
            
            # Calcul du score total
            risk_score = min(sum(risk_factors), 1.0)
            
            # Estimation des jours de retard
            if retard_avancement > 0:
                jours_retard = int(retard_avancement * features.get('duree_prevue', 365))
            else:
                if avancement < 50 and features.get('pourcentage_temps_ecoule', 0) > 0.5:
                    jours_retard = int((0.5 - avancement/100) * jours_restants)
                else:
                    jours_retard = 0
            
            # Détermination du niveau de risque
            if risk_score >= 0.7:
                risk_level = 'élevé'
            elif risk_score >= 0.4:
                risk_level = 'moyen'
            else:
                risk_level = 'faible'
            
            # Calcul de la confiance
            confidence = min(0.6 + (nb_taches_total / 20) * 0.3, 0.95) if nb_taches_total > 0 else 0.5
            confidence = max(confidence, 0.3)
            
            return {
                'risk_level': risk_level,
                'risk_score': round(risk_score, 3),
                'days_delay': max(jours_retard, 0),
                'confidence': round(confidence, 2),
                'model_used': 'statistical',
                'factors': {
                    'retard_avancement': round(retard_avancement, 3),
                    'ratio_taches_retard': round(ratio_retard, 3),
                    'avancement_requis_par_jour': round(avancement_requis_par_jour, 2) if 'avancement_requis_par_jour' in locals() else 0
                }
            }
        except Exception as e:
            self.logger.error(f"Erreur lors de la prédiction de retard: {str(e)}")
            return {
                'risk_level': 'moyen',
                'risk_score': 0.5,
                'days_delay': 0,
                'confidence': 0.3,
                'model_used': 'error',
                'error': str(e) if logger.level <= logging.DEBUG else None
            }
    
    def predict_budget_overrun(self, projet, chantiers=None, budget=None) -> Dict:
        """
        Prédit le risque de dépassement budgétaire en utilisant le modèle ML si disponible
        
        Returns:
            {
                'risk_level': 'faible' | 'moyen' | 'élevé',
                'risk_score': float (0-1),
                'estimated_overrun': float (montant en euros),
                'estimated_total': float (montant total estimé),
                'confidence': float (0-1)
            }
        """
        try:
            if chantiers is None:
                chantiers = list(projet.chantiers.all())
            
            budget_total = float(projet.budget) if projet.budget else 0
            budget_utilise = 0
            
            for chantier in chantiers:
                try:
                    budget_utilise += float(chantier.budget_used) if chantier.budget_used else 0
                except (ValueError, TypeError):
                    continue
            
            # Si on a un budget détaillé
            if budget:
                try:
                    montant_prev = float(budget.montant_prev) if budget.montant_prev else budget_total
                    montant_depense = float(budget.montant_depense) if budget.montant_depense else budget_utilise
                except (ValueError, TypeError):
                    montant_prev = budget_total
                    montant_depense = budget_utilise
            else:
                montant_prev = budget_total
                montant_depense = budget_utilise
            
            if montant_prev <= 0:
                return {
                    'risk_level': 'moyen',
                    'risk_score': 0.5,
                    'estimated_overrun': 0,
                    'estimated_total': budget_total,
                    'confidence': 0.3,
                    'model_used': 'statistical'
                }
            
            # Récupérer les tâches
            taches = []
            for chantier in chantiers:
                try:
                    for lot in chantier.lots.all():
                        taches.extend(list(lot.taches.all()))
                except Exception:
                    continue
            
            # Essayer d'utiliser le modèle ML
            if self.models_loaded and 'budget_model' in self.models:
                try:
                    ml_features = self.extract_ml_features(projet, chantiers, taches)
                    if ml_features:
                        # Préparer les features selon l'ordre attendu par le modèle
                        feature_names = self.models['feature_names_budget']
                        feature_values = [ml_features.get(name, 0) for name in feature_names]
                        
                        # Normaliser avec le scaler
                        scaler = self.models['scaler_budget']
                        feature_array = scaler.transform([feature_values])
                        
                        # Prédire avec le modèle RandomForest
                        model = self.models['budget_model']
                        prediction = model.predict_proba(feature_array)[0]
                        
                        # Le modèle prédit la probabilité de dépassement
                        # Classe 1 = dépassement, classe 0 = pas de dépassement
                        risk_score = prediction[1] if len(prediction) > 1 else prediction[0]
                        
                        # Calculer l'estimation du dépassement
                        avancement = 0
                        try:
                            if hasattr(projet, 'avancement_calcule'):
                                avancement = float(projet.avancement_calcule) if projet.avancement_calcule else 0
                        except Exception:
                            avancement = 50
                        
                        avancement = max(min(avancement, 100), 0)
                        
                        if avancement > 0 and avancement < 100:
                            consommation_finale_estimee = montant_depense / (avancement / 100) if avancement > 0 else montant_prev
                            estimated_overrun = max(consommation_finale_estimee - montant_prev, 0)
                        else:
                            estimated_overrun = max(montant_depense - montant_prev, 0)
                        
                        # Ajuster selon le score de risque
                        if risk_score > 0.7:
                            estimated_overrun *= 1.2  # Augmenter de 20% si risque élevé
                        
                        # Déterminer le niveau de risque
                        if risk_score >= 0.7:
                            risk_level = 'élevé'
                        elif risk_score >= 0.4:
                            risk_level = 'moyen'
                        else:
                            risk_level = 'faible'
                        
                        # Calculer la confiance
                        confidence = 0.5
                        if avancement > 20:
                            confidence = min(0.5 + (avancement / 100) * 0.4, 0.9)
                        if budget_total > 0:
                            confidence = max(confidence, 0.4)
                        
                        return {
                            'risk_level': risk_level,
                            'risk_score': round(risk_score, 3),
                            'estimated_overrun': round(estimated_overrun, 2),
                            'estimated_total': round(montant_prev + estimated_overrun, 2),
                            'current_budget': round(montant_depense, 2),
                            'budget_prev': round(montant_prev, 2),
                            'confidence': round(confidence, 2),
                            'ratio_consommation': round(montant_depense / montant_prev, 3) if montant_prev > 0 else 0,
                            'model_used': 'ML'
                        }
                except Exception as e:
                    self.logger.warning(f"Erreur lors de l'utilisation du modèle ML pour budget: {str(e)}, fallback vers méthode statistique")
            
            # Fallback vers la méthode statistique
            ratio_consommation = montant_depense / montant_prev if montant_prev > 0 else 0
            
            avancement = 0
            try:
                if hasattr(projet, 'avancement_calcule'):
                    avancement = float(projet.avancement_calcule) if projet.avancement_calcule else 0
            except Exception:
                avancement = 50
            
            avancement = max(min(avancement, 100), 0)
            
            # Facteurs de risque
            risk_factors = []
            
            if ratio_consommation > 1.0:
                risk_factors.append(0.5)
            elif ratio_consommation > 0.9 and avancement < 80:
                risk_factors.append(0.4)
            elif ratio_consommation > 0.8:
                risk_factors.append(0.2)
            
            if avancement > 0:
                consommation_par_pourcent = ratio_consommation / (avancement / 100) if avancement > 0 else ratio_consommation
                if consommation_par_pourcent > 1.5:
                    risk_factors.append(0.3)
                elif consommation_par_pourcent > 1.2:
                    risk_factors.append(0.15)
            
            risk_score = min(sum(risk_factors), 1.0)
            
            if avancement > 0 and avancement < 100:
                consommation_finale_estimee = montant_depense / (avancement / 100) if avancement > 0 else montant_prev
                estimated_overrun = max(consommation_finale_estimee - montant_prev, 0)
            else:
                estimated_overrun = max(montant_depense - montant_prev, 0)
            
            if risk_score >= 0.7:
                risk_level = 'élevé'
            elif risk_score >= 0.4:
                risk_level = 'moyen'
            else:
                risk_level = 'faible'
            
            confidence = 0.5
            if avancement > 20:
                confidence = min(0.5 + (avancement / 100) * 0.4, 0.9)
            if budget_total > 0:
                confidence = max(confidence, 0.4)
            
            return {
                'risk_level': risk_level,
                'risk_score': round(risk_score, 3),
                'estimated_overrun': round(estimated_overrun, 2),
                'estimated_total': round(montant_prev + estimated_overrun, 2),
                'current_budget': round(montant_depense, 2),
                'budget_prev': round(montant_prev, 2),
                'confidence': round(confidence, 2),
                'ratio_consommation': round(ratio_consommation, 3),
                'model_used': 'statistical'
            }
        except Exception as e:
            self.logger.error(f"Erreur lors de la prédiction budgétaire: {str(e)}")
            return {
                'risk_level': 'moyen',
                'risk_score': 0.5,
                'estimated_overrun': 0,
                'estimated_total': float(projet.budget) if projet.budget else 0,
                'confidence': 0.3,
                'model_used': 'error',
                'error': str(e) if logger.level <= logging.DEBUG else None
            }
    
    def predict_risk(self, projet, chantiers=None, taches=None) -> Dict:
        """
        Prédit le risque global du projet en utilisant le modèle risk_model si disponible
        
        Returns:
            {
                'risk_level': 'faible' | 'moyen' | 'élevé',
                'risk_score': float (0-1),
                'confidence': float (0-1)
            }
        """
        try:
            if chantiers is None:
                chantiers = list(projet.chantiers.all())
            if taches is None:
                taches = []
                for chantier in chantiers:
                    try:
                        for lot in chantier.lots.all():
                            taches.extend(list(lot.taches.all()))
                    except Exception:
                        continue
            
            # Essayer d'utiliser le modèle ML
            if self.models_loaded and 'risk_model' in self.models:
                try:
                    ml_features = self.extract_ml_features(projet, chantiers, taches)
                    if ml_features:
                        # Préparer les features selon l'ordre attendu par le modèle
                        feature_names = self.models['feature_names_risk']
                        feature_values = [ml_features.get(name, 0) for name in feature_names]
                        
                        # Normaliser avec le scaler
                        scaler = self.models['scaler_risk']
                        feature_array = scaler.transform([feature_values])
                        
                        # Prédire avec le modèle RandomForest
                        model = self.models['risk_model']
                        prediction = model.predict_proba(feature_array)[0]
                        
                        # Le modèle prédit la probabilité de risque
                        risk_score = prediction[1] if len(prediction) > 1 else prediction[0]
                        
                        # Déterminer le niveau de risque
                        if risk_score >= 0.7:
                            risk_level = 'élevé'
                        elif risk_score >= 0.4:
                            risk_level = 'moyen'
                        else:
                            risk_level = 'faible'
                        
                        # Calculer la confiance
                        nb_taches_total = len(taches)
                        confidence = min(0.6 + (nb_taches_total / 20) * 0.3, 0.95) if nb_taches_total > 0 else 0.5
                        confidence = max(confidence, 0.3)
                        
                        return {
                            'risk_level': risk_level,
                            'risk_score': round(risk_score, 3),
                            'confidence': round(confidence, 2),
                            'model_used': 'ML'
                        }
                except Exception as e:
                    self.logger.warning(f"Erreur lors de l'utilisation du modèle ML pour risque: {str(e)}, fallback vers méthode statistique")
            
            # Fallback: utiliser les prédictions de retard et budget
            delay_pred = self.predict_delay_risk(projet, chantiers, taches)
            budget_pred = self.predict_budget_overrun(projet, chantiers)
            
            # Combiner les scores
            combined_score = (delay_pred.get('risk_score', 0.5) + budget_pred.get('risk_score', 0.5)) / 2
            combined_confidence = (delay_pred.get('confidence', 0.3) + budget_pred.get('confidence', 0.3)) / 2
            
            if combined_score >= 0.7:
                risk_level = 'élevé'
            elif combined_score >= 0.4:
                risk_level = 'moyen'
            else:
                risk_level = 'faible'
            
            return {
                'risk_level': risk_level,
                'risk_score': round(combined_score, 3),
                'confidence': round(combined_confidence, 2),
                'model_used': 'statistical'
            }
        except Exception as e:
            self.logger.error(f"Erreur lors de la prédiction de risque: {str(e)}")
            return {
                'risk_level': 'moyen',
                'risk_score': 0.5,
                'confidence': 0.3,
                'model_used': 'error',
                'error': str(e) if logger.level <= logging.DEBUG else None
            }
    
    def generate_recommendations(self, projet, delay_prediction=None, budget_prediction=None, historique=None) -> List[Dict]:
        """
        Génère des recommandations automatiques basées sur l'historique et les prédictions
        
        Returns:
            List[Dict] avec {'type': str, 'priority': str, 'message': str, 'action': str}
        """
        try:
            recommendations = []
            
            # Recommandations basées sur les prédictions de retard
            if delay_prediction:
                risk_level = delay_prediction.get('risk_level', 'moyen')
                days_delay = delay_prediction.get('days_delay', 0)
                risk_score = delay_prediction.get('risk_score', 0)
                
                if risk_level == 'élevé':
                    recommendations.append({
                        'type': 'delay',
                        'priority': 'high',
                        'message': f'Risque élevé de retard estimé à {days_delay} jours',
                        'action': 'Réviser la planification et augmenter les ressources',
                        'estimated_delay': days_delay
                    })
                    
                    if days_delay > 30:
                        recommendations.append({
                            'type': 'delay',
                            'priority': 'high',
                            'message': 'Retard significatif prévu - nécessite une intervention immédiate',
                            'action': 'Réorganiser les priorités et évaluer les options d\'accélération',
                            'estimated_delay': days_delay
                        })
                elif risk_level == 'moyen':
                    recommendations.append({
                        'type': 'delay',
                        'priority': 'medium',
                        'message': f'Risque modéré de retard estimé à {days_delay} jours',
                        'action': 'Surveiller de près l\'avancement et anticiper les retards',
                        'estimated_delay': days_delay
                    })
            
            # Recommandations basées sur les prédictions budgétaires
            if budget_prediction:
                risk_level = budget_prediction.get('risk_level', 'moyen')
                estimated_overrun = budget_prediction.get('estimated_overrun', 0)
                
                if risk_level == 'élevé':
                    recommendations.append({
                        'type': 'budget',
                        'priority': 'high',
                        'message': f'Dépassement budgétaire estimé à {estimated_overrun:,.2f} XOF',
                        'action': 'Réviser les coûts et identifier les économies possibles',
                        'estimated_overrun': estimated_overrun
                    })
                    
                    recommendations.append({
                        'type': 'budget',
                        'priority': 'high',
                        'message': 'Optimiser les ressources et négocier les prix fournisseurs',
                        'action': 'Réexaminer les contrats et rechercher des alternatives moins coûteuses',
                        'estimated_overrun': estimated_overrun
                    })
                elif risk_level == 'moyen':
                    recommendations.append({
                        'type': 'budget',
                        'priority': 'medium',
                        'message': f'Risque modéré de dépassement estimé à {estimated_overrun:,.2f} XOF',
                        'action': 'Surveiller les dépenses et contrôler les coûts',
                        'estimated_overrun': estimated_overrun
                    })
            
            # Recommandations basées sur l'historique (si disponible)
            if historique:
                try:
                    projets_similaires = [h for h in historique if h.get('status') == 'Terminé']
                    
                    if projets_similaires:
                        retards_moyens = [h.get('days_delay', 0) for h in projets_similaires]
                        depassements_moyens = [h.get('budget_overrun', 0) for h in projets_similaires]
                        
                        if retards_moyens:
                            retard_moyen = sum(retards_moyens) / len(retards_moyens)
                            if retard_moyen > 15:
                                recommendations.append({
                                    'type': 'historical',
                                    'priority': 'medium',
                                    'message': f'Les projets similaires ont eu en moyenne {int(retard_moyen)} jours de retard',
                                    'action': 'Appliquer les leçons apprises et ajuster la planification',
                                    'based_on': len(projets_similaires)
                                })
                            
                            if depassements_moyens:
                                depassement_moyen = sum(depassements_moyens) / len(depassements_moyens)
                                if depassement_moyen > projet.budget * 0.1:
                                    recommendations.append({
                                        'type': 'historical',
                                        'priority': 'medium',
                                        'message': f'Dépassement budgétaire moyen de {depassement_moyen:,.2f} XOF sur projets similaires',
                                        'action': 'Allouer une marge de sécurité supplémentaire',
                                        'based_on': len(projets_similaires)
                                    })
                except Exception as e:
                    self.logger.warning(f"Erreur lors de l'analyse historique: {str(e)}")
            
            # Recommandations générales basées sur l'état du projet
            try:
                avancement = float(projet.avancement_calcule) if hasattr(projet, 'avancement_calcule') else 0
                
                if avancement < 30:
                    recommendations.append({
                        'type': 'general',
                        'priority': 'medium',
                        'message': 'Projet en phase initiale - établir des jalons clairs',
                        'action': 'Définir des objectifs intermédiaires mesurables'
                    })
                elif avancement > 80:
                    recommendations.append({
                        'type': 'general',
                        'priority': 'low',
                        'message': 'Projet bien avancé - maintenir le rythme',
                        'action': 'Continuer la surveillance et préparer la clôture'
                    })
            except Exception:
                pass
            
            # Si aucune recommandation spécifique, ajouter des recommandations générales
            if not recommendations:
                recommendations.append({
                    'type': 'general',
                    'priority': 'low',
                    'message': 'Surveiller régulièrement l\'avancement du projet',
                    'action': 'Maintenir une communication régulière avec l\'équipe'
                })
            
            return recommendations
        except Exception as e:
            self.logger.error(f"Erreur lors de la génération de recommandations: {str(e)}")
            return [{
                'type': 'general',
                'priority': 'low',
                'message': 'Surveiller régulièrement l\'avancement du projet',
                'action': 'Maintenir une communication régulière avec l\'équipe'
            }]


# Instance globale du service
ml_service = MLPredictionService()
