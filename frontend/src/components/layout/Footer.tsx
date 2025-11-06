import { Link } from "react-router-dom";
import { Mail, Phone, MapPin } from "lucide-react";
import logo from "@/assets/buildflow-logo.png";

const Footer = () => {
  return (
    <footer className="bg-card border-t mt-auto">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <img src={logo} alt="Yoonu-Tabax" className="h-8 w-auto" />
              <span className="text-xl font-bold text-primary">Yoonu-Tabax</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Plateforme intelligente de gestion des projets de construction publics
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Navigation</h3>
            <ul className="space-y-2">
              <li><Link to="/dashboard" className="text-sm text-muted-foreground hover:text-primary transition-colors">Tableau de bord</Link></li>
              <li><Link to="/projects" className="text-sm text-muted-foreground hover:text-primary transition-colors">Projets</Link></li>
              <li><Link to="/reports" className="text-sm text-muted-foreground hover:text-primary transition-colors">Rapports</Link></li>
              <li><Link to="/teams" className="text-sm text-muted-foreground hover:text-primary transition-colors">Équipes</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Ressources</h3>
            <ul className="space-y-2">
              <li><Link to="/documentation" className="text-sm text-muted-foreground hover:text-primary transition-colors">Documentation</Link></li>
              <li><Link to="/support" className="text-sm text-muted-foreground hover:text-primary transition-colors">Support</Link></li>
              <li><Link to="/contact" className="text-sm text-muted-foreground hover:text-primary transition-colors">Contact</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Contact</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span>contact@buildflow.app</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span>+221 77 456 78 09</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>Dakar, Senegal</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Yoonu-Tabax. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
