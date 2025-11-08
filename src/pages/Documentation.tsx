import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

const Documentation = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container py-8">
        <h1 className="text-3xl font-bold mb-4">Documentation</h1>
        <p className="text-muted-foreground">La documentation détaillée sera disponible ici.</p>
      </main>
      <Footer />
    </div>
  );
};

export default Documentation;




