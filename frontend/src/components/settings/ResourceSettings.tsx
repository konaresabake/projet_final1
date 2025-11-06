import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFournisseurs } from "@/hooks/useFournisseurs";
import { useRessources } from "@/hooks/useRessources";
import { toast } from "sonner";

const ResourceSettings = () => {
  const { fournisseurs, loading: fournisseursLoading, addFournisseur } = useFournisseurs();
  const { ressources, loading: ressourcesLoading, addRessource } = useRessources();

  const [supplierForm, setSupplierForm] = useState({ societe: "", contact: "" });
  const [resourceForm, setResourceForm] = useState({
    nom: "",
    quantite: 1,
    cout_unitaire: 0,
    fournisseur: "",
  });

  const handleAddSupplier = async () => {
    if (!supplierForm.societe.trim() || !supplierForm.contact.trim()) {
      toast.error('Veuillez compléter les informations fournisseur');
      return;
    }

    try {
      await addFournisseur({
        societe: supplierForm.societe.trim(),
        contact: supplierForm.contact.trim(),
      });
      toast.success('Fournisseur ajouté');
      setSupplierForm({ societe: "", contact: "" });
    } catch (error) {
      toast.error('Impossible de créer le fournisseur');
    }
  };

  const handleAddResource = async () => {
    if (!resourceForm.nom.trim()) {
      toast.error('Le nom de la ressource est requis');
      return;
    }

    try {
      await addRessource({
        nom: resourceForm.nom.trim(),
        quantite: Number(resourceForm.quantite) || 0,
        cout_unitaire: Number(resourceForm.cout_unitaire) || 0,
        fournisseur: resourceForm.fournisseur || undefined,
      });
      toast.success('Ressource ajoutée');
      setResourceForm({ nom: "", quantite: 1, cout_unitaire: 0, fournisseur: "" });
    } catch (error) {
      toast.error('Impossible de créer la ressource');
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Ajouter un fournisseur</CardTitle>
            <CardDescription>Référencez vos partenaires et prestataires</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Nom de la société"
              value={supplierForm.societe}
              onChange={(event) => setSupplierForm((prev) => ({ ...prev, societe: event.target.value }))}
            />
            <Input
              placeholder="Contact (email, téléphone...)"
              value={supplierForm.contact}
              onChange={(event) => setSupplierForm((prev) => ({ ...prev, contact: event.target.value }))}
            />
            <Button onClick={handleAddSupplier} disabled={fournisseursLoading}>
              Enregistrer
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fournisseurs enregistrés</CardTitle>
            <CardDescription>Suivi des partenaires disponibles</CardDescription>
          </CardHeader>
          <CardContent>
            {fournisseursLoading ? (
              <div className="py-6 text-center text-muted-foreground">Chargement...</div>
            ) : fournisseurs.length === 0 ? (
              <div className="py-6 text-center text-muted-foreground">Aucun fournisseur enregistré.</div>
            ) : (
              <div className="space-y-3">
                {fournisseurs.map((fournisseur) => (
                  <div key={fournisseur.id} className="p-4 border rounded-lg bg-card">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{fournisseur.societe}</h3>
                        <p className="text-sm text-muted-foreground">{fournisseur.contact}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        ID {fournisseur.id.slice(0, 8)}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Ajouter une ressource</CardTitle>
            <CardDescription>Centralisez le matériel et les équipes disponibles</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Nom de la ressource"
              value={resourceForm.nom}
              onChange={(event) => setResourceForm((prev) => ({ ...prev, nom: event.target.value }))}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                type="number"
                min="0"
                placeholder="Quantité"
                value={resourceForm.quantite}
                onChange={(event) => setResourceForm((prev) => ({ ...prev, quantite: Number(event.target.value) }))}
              />
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="Coût unitaire (€)"
                value={resourceForm.cout_unitaire}
                onChange={(event) => setResourceForm((prev) => ({ ...prev, cout_unitaire: Number(event.target.value) }))}
              />
            </div>
            <Select
              value={resourceForm.fournisseur}
              onValueChange={(value) => setResourceForm((prev) => ({ ...prev, fournisseur: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Associer un fournisseur (optionnel)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Aucun fournisseur</SelectItem>
                {fournisseurs.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.societe}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleAddResource} disabled={ressourcesLoading}>
              Ajouter la ressource
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Inventaire des ressources</CardTitle>
            <CardDescription>Vue synthétique des ressources disponibles</CardDescription>
          </CardHeader>
          <CardContent>
            {ressourcesLoading ? (
              <div className="py-6 text-center text-muted-foreground">Chargement...</div>
            ) : ressources.length === 0 ? (
              <div className="py-6 text-center text-muted-foreground">Aucune ressource pour le moment.</div>
            ) : (
              <div className="space-y-3">
                {ressources.map((ressource) => (
                  <div key={ressource.id} className="p-4 border rounded-lg bg-card">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <h3 className="font-semibold">{ressource.nom}</h3>
                        <p className="text-sm text-muted-foreground">
                          Quantité: {ressource.quantite} • Coût: {Number(ressource.cout_unitaire).toLocaleString('fr-FR')} €
                        </p>
                        {ressource.fournisseur_id && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Fournisseur lié: {fournisseurs.find((f) => f.id === ressource.fournisseur_id)?.societe ?? '---'}
                          </p>
                        )}
                      </div>
                      <Badge variant="outline" className="text-xs">
                        ID {ressource.id.slice(0, 8)}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResourceSettings;

