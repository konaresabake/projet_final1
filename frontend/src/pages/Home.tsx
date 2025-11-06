import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, BarChart3, Users, FileText, TrendingUp, Shield } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import heroImage from "@/assets/hero-illustration.png";
import dashboardPreview from "@/assets/dashboard-preview.png";

const Home = () => {
  const features = [
    {
      icon: BarChart3,
      title: "Suivi en temps réel",
      description: "Visualisez l'avancement de tous vos projets en temps réel avec des tableaux de bord interactifs.",
    },
    {
      icon: TrendingUp,
      title: "Analyse prédictive",
      description: "L'IA prédit les risques de retard et de dépassement budgétaire pour anticiper les problèmes.",
    },
    {
      icon: Users,
      title: "Collaboration simplifiée",
      description: "Travaillez efficacement en équipe avec des outils de communication et de partage intégrés.",
    },
    {
      icon: FileText,
      title: "Gestion documentaire",
      description: "Centralisez tous vos documents : plans, contrats, rapports, photos de chantier.",
    },
    {
      icon: CheckCircle2,
      title: "Traçabilité complète",
      description: "Historique détaillé de toutes les actions et modifications pour un audit transparent.",
    },
    {
      icon: Shield,
      title: "Sécurité renforcée",
      description: "Données chiffrées et conformité aux normes de sécurité les plus strictes.",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="container py-20 lg:py-32">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8 animate-fade-in">
              <div className="inline-block">
                <span className="px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
                  Plateforme intelligente de gestion
                </span>
              </div>
              <h1 className="text-5xl lg:text-6xl font-bold leading-tight">
                Gérez vos projets de{" "}
                <span className="text-gradient">construction</span> avec intelligence
              </h1>
              <p className="text-xl text-muted-foreground">
                Yoonu-Tabax centralise le suivi, l'analyse et la collaboration pour optimiser vos projets de construction publics.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/login">
                  <Button size="lg" className="w-full sm:w-auto text-lg px-8">
                    Se connecter
                  </Button>
                </Link>
                <Link to="/admin" target="_blank" rel="noreferrer">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg px-8">
                    Accès admin
                  </Button>
                </Link>
              </div>
            </div>
            <div className="animate-slide-up">
              <img
                src={heroImage}
                alt="Yoonu-Tabax Platform"
                className="w-full rounded-2xl shadow-2xl"
              />
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="bg-muted/50 py-20">
          <div className="container">
            <div className="text-center max-w-3xl mx-auto mb-16 animate-fade-in">
              <h2 className="text-4xl font-bold mb-4">
                Une solution complète pour vos projets
              </h2>
              <p className="text-xl text-muted-foreground">
                Toutes les fonctionnalités dont vous avez besoin pour gérer efficacement vos chantiers
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, idx) => (
                <Card key={idx} className="card-hover">
                  <CardContent className="p-6">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Dashboard Preview */}
        <section className="container py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1 animate-slide-up">
              <img
                src={dashboardPreview}
                alt="Dashboard Preview"
                className="w-full rounded-2xl shadow-2xl border"
              />
            </div>
            <div className="order-1 lg:order-2 space-y-6 animate-fade-in">
              <h2 className="text-4xl font-bold">
                Tableaux de bord intelligents
              </h2>
              <p className="text-xl text-muted-foreground">
                Visualisez en un coup d'œil l'état de tous vos projets, les KPIs importants et les alertes critiques.
              </p>
              <ul className="space-y-4">
                {[
                  "Indicateurs de performance en temps réel",
                  "Graphiques et diagrammes interactifs",
                  "Alertes automatiques sur les risques",
                  "Rapports personnalisables",
                ].map((item, idx) => (
                  <li key={idx} className="flex items-center gap-3">
                    <CheckCircle2 className="h-6 w-6 text-success flex-shrink-0" />
                    <span className="text-lg">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-gradient-to-r from-primary to-primary-hover text-primary-foreground py-20">
          <div className="container text-center space-y-8">
            <h2 className="text-4xl font-bold">
              Prêt à transformer la gestion de vos projets ?
            </h2>
            <p className="text-xl max-w-2xl mx-auto opacity-90">
              Rejoignez les centaines d'organisations qui font confiance à Yoonu-Tabax pour gérer leurs projets de construction.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/login">
                <Button size="lg" variant="secondary" className="text-lg px-8">
                  Se connecter
                </Button>
              </Link>
              <Link to="/admin" target="_blank" rel="noreferrer">
                <Button size="lg" variant="outline" className="text-lg px-8 bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary">
                  Accès admin
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Home;
