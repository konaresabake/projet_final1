-- Create chantiers table
CREATE TABLE public.chantiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL CHECK (status IN ('En cours', 'Terminé', 'En attente', 'Planifié')),
  priority TEXT NOT NULL CHECK (priority IN ('Haute', 'Moyenne', 'Basse')),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  budget DECIMAL(15, 2) NOT NULL DEFAULT 0,
  budget_used DECIMAL(15, 2) DEFAULT 0,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  location TEXT NOT NULL,
  manager TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create lots table
CREATE TABLE public.lots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chantier_id UUID NOT NULL REFERENCES public.chantiers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  status TEXT NOT NULL CHECK (status IN ('completed', 'in-progress', 'pending')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create taches table
CREATE TABLE public.taches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lot_id UUID NOT NULL REFERENCES public.lots(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL CHECK (status IN ('completed', 'in-progress', 'pending')),
  assigned_to TEXT,
  priority TEXT CHECK (priority IN ('Haute', 'Moyenne', 'Basse')),
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.chantiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.taches ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chantiers
CREATE POLICY "Users can view their own chantiers"
  ON public.chantiers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own chantiers"
  ON public.chantiers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own chantiers"
  ON public.chantiers FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own chantiers"
  ON public.chantiers FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for lots
CREATE POLICY "Users can view lots of their chantiers"
  ON public.lots FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.chantiers
    WHERE chantiers.id = lots.chantier_id
    AND chantiers.user_id = auth.uid()
  ));

CREATE POLICY "Users can create lots for their chantiers"
  ON public.lots FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.chantiers
    WHERE chantiers.id = lots.chantier_id
    AND chantiers.user_id = auth.uid()
  ));

CREATE POLICY "Users can update lots of their chantiers"
  ON public.lots FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.chantiers
    WHERE chantiers.id = lots.chantier_id
    AND chantiers.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete lots of their chantiers"
  ON public.lots FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.chantiers
    WHERE chantiers.id = lots.chantier_id
    AND chantiers.user_id = auth.uid()
  ));

-- RLS Policies for taches
CREATE POLICY "Users can view taches of their lots"
  ON public.taches FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.lots
    INNER JOIN public.chantiers ON chantiers.id = lots.chantier_id
    WHERE lots.id = taches.lot_id
    AND chantiers.user_id = auth.uid()
  ));

CREATE POLICY "Users can create taches for their lots"
  ON public.taches FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.lots
    INNER JOIN public.chantiers ON chantiers.id = lots.chantier_id
    WHERE lots.id = taches.lot_id
    AND chantiers.user_id = auth.uid()
  ));

CREATE POLICY "Users can update taches of their lots"
  ON public.taches FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.lots
    INNER JOIN public.chantiers ON chantiers.id = lots.chantier_id
    WHERE lots.id = taches.lot_id
    AND chantiers.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete taches of their lots"
  ON public.taches FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.lots
    INNER JOIN public.chantiers ON chantiers.id = lots.chantier_id
    WHERE lots.id = taches.lot_id
    AND chantiers.user_id = auth.uid()
  ));

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_chantiers_updated_at
  BEFORE UPDATE ON public.chantiers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_lots_updated_at
  BEFORE UPDATE ON public.lots
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_taches_updated_at
  BEFORE UPDATE ON public.taches
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();