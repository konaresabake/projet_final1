import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, Bell, Settings } from "lucide-react";
import logo from "@/assets/buildflow-logo.png";
import { useAuth } from "@/contexts/AuthContext";

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth();
  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { path: "/dashboard", label: "Tableau de bord" },
    { path: "/projects", label: "Projets" },
    { path: "/progress", label: "Avancement" },
    { path: "/analysis", label: "Analyse" },
    { path: "/documents", label: "Documents" },
    { path: "/collaboration", label: "Collaboration" },
    { path: "/traceability", label: "Traçabilité" },
    { path: "/teams", label: "Équipes" },
    { path: "/reports", label: "Rapports" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 shadow-sm">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <img src={logo} alt="Yoonu-Tabax" className="h-8 w-auto" />
            <span className="text-xl font-bold text-primary">Yoonu-Tabax</span>
          </Link>
          
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActive(item.path)
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground/80 hover:bg-muted hover:text-foreground"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="rounded-full">
            <Bell className="h-5 w-5" />
          </Button>
          <Link to="/settings">
            <Button variant="ghost" size="icon" className="rounded-full">
              <Settings className="h-5 w-5" />
            </Button>
          </Link>
          <Button variant="ghost" size="icon" className="lg:hidden">
            <Menu className="h-5 w-5" />
          </Button>
          {isAuthenticated ? (
            <Button
              variant="outline"
              className="ml-2"
              onClick={() => {
                logout();
                navigate("/home");
              }}
            >
              Déconnexion
            </Button>
          ) : (
            <Link to="/login">
              <Button className="ml-2">Se connecter</Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
