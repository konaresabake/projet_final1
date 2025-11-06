from django.contrib import admin
from django.utils.html import format_html
from .models import (
    Projet, Chantier, Lot, Tache,
    Utilisateur, IA, Alerte, Budget, Rapport,
    Ressource, RessourceHumaine, RessourceMaterielle, Fournisseur,
    ContactMessage
)


# ===== PROJET =====
@admin.register(Projet)
class ProjetAdmin(admin.ModelAdmin):
    list_display = ('name', 'status', 'priority', 'budget', 'start_date', 'end_date', 'manager', 'avancement_calcule_display', 'created_at')
    list_filter = ('status', 'priority', 'created_at', 'start_date', 'end_date')
    search_fields = ('name', 'description', 'location', 'manager')
    readonly_fields = ('id', 'created_at', 'updated_at', 'avancement_calcule_display')
    fieldsets = (
        ('Informations générales', {
            'fields': ('id', 'name', 'description', 'status', 'priority')
        }),
        ('Budget et dates', {
            'fields': ('budget', 'start_date', 'end_date')
        }),
        ('Localisation et gestion', {
            'fields': ('location', 'manager')
        }),
        ('Avancement', {
            'fields': ('avancement_calcule_display',)
        }),
        ('Métadonnées', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def avancement_calcule_display(self, obj):
        avancement = obj.avancement_calcule
        color = 'green' if avancement >= 80 else 'orange' if avancement >= 50 else 'red'
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}%</span>',
            color, avancement
        )
    avancement_calcule_display.short_description = 'Avancement'


# ===== CHANTIER =====
@admin.register(Chantier)
class ChantierAdmin(admin.ModelAdmin):
    list_display = ('name', 'projet', 'status', 'priority', 'progress', 'budget', 'budget_used', 'start_date', 'end_date', 'manager')
    list_filter = ('status', 'priority', 'created_at', 'projet')
    search_fields = ('name', 'description', 'location', 'manager', 'projet__name')
    readonly_fields = ('id', 'created_at', 'updated_at', 'avancement_calcule_display')
    raw_id_fields = ('projet',)
    fieldsets = (
        ('Informations générales', {
            'fields': ('id', 'projet', 'name', 'description', 'status', 'priority')
        }),
        ('Budget et dates', {
            'fields': ('budget', 'budget_used', 'start_date', 'end_date')
        }),
        ('Localisation et gestion', {
            'fields': ('location', 'manager')
        }),
        ('Avancement', {
            'fields': ('progress', 'avancement_calcule_display')
        }),
        ('Métadonnées', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def avancement_calcule_display(self, obj):
        avancement = obj.calculer_avancement()
        color = 'green' if avancement >= 80 else 'orange' if avancement >= 50 else 'red'
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}%</span>',
            color, avancement
        )
    avancement_calcule_display.short_description = 'Avancement calculé'


# ===== LOT =====
@admin.register(Lot)
class LotAdmin(admin.ModelAdmin):
    list_display = ('name', 'chantier', 'status', 'progress', 'start_date', 'end_date', 'avancement_calcule_display')
    list_filter = ('status', 'created_at', 'chantier', 'chantier__projet')
    search_fields = ('name', 'description', 'chantier__name', 'chantier__projet__name')
    readonly_fields = ('id', 'created_at', 'updated_at', 'avancement_calcule_display')
    raw_id_fields = ('chantier',)
    
    def avancement_calcule_display(self, obj):
        avancement = obj.calculer_avancement()
        color = 'green' if avancement >= 80 else 'orange' if avancement >= 50 else 'red'
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}%</span>',
            color, avancement
        )
    avancement_calcule_display.short_description = 'Avancement calculé'


# ===== TACHE =====
class RessourceInline(admin.TabularInline):
    model = Tache.ressources.through
    extra = 1
    verbose_name = 'Ressource'
    verbose_name_plural = 'Ressources'


@admin.register(Tache)
class TacheAdmin(admin.ModelAdmin):
    list_display = ('name', 'lot', 'status', 'priority', 'progress', 'cost', 'assigned_to', 'start_date', 'end_date')
    list_filter = ('status', 'priority', 'created_at', 'lot', 'lot__chantier__projet')
    search_fields = ('name', 'description', 'assigned_to', 'lot__name', 'lot__chantier__name')
    readonly_fields = ('id', 'created_at', 'updated_at')
    raw_id_fields = ('lot',)
    inlines = [RessourceInline]
    fieldsets = (
        ('Informations générales', {
            'fields': ('id', 'lot', 'name', 'description', 'status', 'priority')
        }),
        ('Assignation et dates', {
            'fields': ('assigned_to', 'start_date', 'end_date')
        }),
        ('Suivi', {
            'fields': ('progress', 'cost')
        }),
        ('Métadonnées', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


# ===== UTILISATEUR =====
@admin.register(Utilisateur)
class UtilisateurAdmin(admin.ModelAdmin):
    list_display = ('nom', 'email', 'role', 'is_approved', 'is_active', 'created_at')
    list_filter = ('role', 'is_approved', 'is_active', 'created_at')
    search_fields = ('nom', 'email')
    readonly_fields = ('id', 'created_at', 'updated_at')
    list_editable = ('is_approved', 'is_active')
    fieldsets = (
        ('Informations personnelles', {
            'fields': ('id', 'nom', 'email', 'mot_de_passe')
        }),
        ('Rôle et permissions', {
            'fields': ('role', 'is_approved', 'is_active')
        }),
        ('Métadonnées', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_readonly_fields(self, request, obj=None):
        if obj:  # Si l'objet existe (modification)
            return self.readonly_fields + ('mot_de_passe',)
        return self.readonly_fields


# ===== IA =====
@admin.register(IA)
class IAAdmin(admin.ModelAdmin):
    list_display = ('modele', 'seuil_confiance', 'created_at')
    list_filter = ('created_at', 'seuil_confiance')
    search_fields = ('modele',)


# ===== BUDGET =====
@admin.register(Budget)
class BudgetAdmin(admin.ModelAdmin):
    list_display = ('projet', 'montant_prev', 'montant_depense', 'ecart_display', 'created_at')
    list_filter = ('created_at', 'projet')
    search_fields = ('projet__name',)
    readonly_fields = ('ecart_calcule',)
    raw_id_fields = ('projet',)
    
    def ecart_display(self, obj):
        ecart = float(obj.montant_prev) - float(obj.montant_depense)
        color = 'green' if ecart >= 0 else 'red'
        ecart_formatted = f"{ecart:.2f}"
        return format_html(
            '<span style="color: {}; font-weight: bold;">{} €</span>',
            color, ecart_formatted
        )
    ecart_display.short_description = 'Écart'
    
    def ecart_calcule(self, obj):
        return f"{float(obj.montant_prev) - float(obj.montant_depense):.2f} €"
    ecart_calcule.short_description = 'Écart calculé'


# ===== ALERTE =====
@admin.register(Alerte)
class AlerteAdmin(admin.ModelAdmin):
    list_display = ('type', 'projet', 'statut', 'date', 'created_at', 'description_short')
    list_filter = ('type', 'statut', 'date', 'created_at', 'projet')
    search_fields = ('description', 'projet__name')
    readonly_fields = ('id', 'date', 'created_at', 'updated_at')
    raw_id_fields = ('projet', 'ia')
    list_editable = ('statut',)
    
    def description_short(self, obj):
        return obj.description[:50] + '...' if len(obj.description) > 50 else obj.description
    description_short.short_description = 'Description'
    
    fieldsets = (
        ('Informations générales', {
            'fields': ('id', 'projet', 'ia', 'type', 'statut', 'date')
        }),
        ('Description', {
            'fields': ('description',)
        }),
        ('Métadonnées', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


# ===== RAPPORT =====
@admin.register(Rapport)
class RapportAdmin(admin.ModelAdmin):
    list_display = ('titre', 'projet', 'date_generation', 'created_at')
    list_filter = ('date_generation', 'created_at', 'projet')
    search_fields = ('titre', 'contenu', 'projet__name')
    readonly_fields = ('date_generation', 'created_at', 'updated_at')
    raw_id_fields = ('projet',)
    fieldsets = (
        ('Informations générales', {
            'fields': ('projet', 'titre', 'date_generation')
        }),
        ('Contenu', {
            'fields': ('contenu',)
        }),
        ('Métadonnées', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


# ===== FOURNISSEUR =====
@admin.register(Fournisseur)
class FournisseurAdmin(admin.ModelAdmin):
    list_display = ('societe', 'contact', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('societe', 'contact')
    readonly_fields = ('id', 'created_at', 'updated_at')


# ===== RESSOURCE =====
@admin.register(Ressource)
class RessourceAdmin(admin.ModelAdmin):
    list_display = ('nom', 'quantite', 'cout_unitaire', 'cout_total_display', 'fournisseur', 'created_at')
    list_filter = ('created_at', 'fournisseur')
    search_fields = ('nom', 'fournisseur__societe')
    readonly_fields = ('id', 'created_at', 'updated_at')
    raw_id_fields = ('fournisseur',)
    
    def cout_total_display(self, obj):
        total = float(obj.quantite * obj.cout_unitaire)
        total_formatted = f"{total:.2f}"
        return format_html('<strong>{} €</strong>', total_formatted)
    cout_total_display.short_description = 'Coût total'


# ===== RESSOURCE HUMAINE =====
@admin.register(RessourceHumaine)
class RessourceHumaineAdmin(admin.ModelAdmin):
    list_display = ('nom', 'role', 'competence', 'quantite', 'cout_unitaire', 'fournisseur')
    list_filter = ('role', 'competence', 'created_at')
    search_fields = ('nom', 'role', 'competence')
    readonly_fields = ('id', 'created_at', 'updated_at')
    raw_id_fields = ('fournisseur',)
    
    fieldsets = (
        ('Informations de base', {
            'fields': ('id', 'nom', 'quantite', 'cout_unitaire', 'fournisseur')
        }),
        ('Spécificités humaines', {
            'fields': ('role', 'competence')
        }),
        ('Métadonnées', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


# ===== RESSOURCE MATERIELLE =====
@admin.register(RessourceMaterielle)
class RessourceMaterielleAdmin(admin.ModelAdmin):
    list_display = ('nom', 'type', 'etat', 'quantite', 'cout_unitaire', 'fournisseur')
    list_filter = ('type', 'etat', 'created_at')
    search_fields = ('nom', 'type', 'etat')
    readonly_fields = ('id', 'created_at', 'updated_at')
    raw_id_fields = ('fournisseur',)
    
    fieldsets = (
        ('Informations de base', {
            'fields': ('id', 'nom', 'quantite', 'cout_unitaire', 'fournisseur')
        }),
        ('Spécificités matérielles', {
            'fields': ('type', 'etat')
        }),
        ('Métadonnées', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


# ===== MESSAGE DE CONTACT =====
@admin.register(ContactMessage)
class ContactMessageAdmin(admin.ModelAdmin):
    list_display = ('first_name', 'last_name', 'email', 'subject', 'is_read', 'created_at')
    list_filter = ('is_read', 'subject', 'created_at')
    search_fields = ('first_name', 'last_name', 'email', 'subject', 'message', 'organization')
    readonly_fields = ('id', 'created_at', 'updated_at')
    list_editable = ('is_read',)
    date_hierarchy = 'created_at'
    
    fieldsets = (
        ('Informations du contact', {
            'fields': ('id', 'first_name', 'last_name', 'email', 'phone', 'organization')
        }),
        ('Message', {
            'fields': ('subject', 'message')
        }),
        ('Statut', {
            'fields': ('is_read',)
        }),
        ('Métadonnées', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_readonly_fields(self, request, obj=None):
        # Permettre l'édition de is_read même pour les nouveaux messages
        return self.readonly_fields if obj else self.readonly_fields


# Configuration de l'interface admin
admin.site.site_header = "Yoonu-Tabax Administration"
admin.site.site_title = "Yoonu-Tabax Admin"
admin.site.index_title = "Gestion de la plateforme Yoonu-Tabax"
