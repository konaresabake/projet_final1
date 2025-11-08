import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

const Support = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container py-8">
        <h1 className="text-3xl font-bold mb-4">Support</h1>
        <p className="text-muted-foreground">Besoin d'aide ? Contactez-nous via la page Contact ou consultez la documentation.</p>
      </main>
      <Footer />
    </div>
  );
};

export default Support;




