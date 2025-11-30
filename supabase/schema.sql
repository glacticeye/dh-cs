-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES
-- Linked to Supabase Auth
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT,
  avatar_url TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- 4. CHARACTER CARDS (The Loadout)
CREATE TABLE IF NOT EXISTS public.character_cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  character_id UUID REFERENCES public.characters(id) ON DELETE CASCADE NOT NULL,
  card_id TEXT REFERENCES public.library(id) ON DELETE CASCADE NOT NULL,
  location TEXT NOT NULL DEFAULT 'vault',
  state JSONB DEFAULT '{"tokens": 0, "exhausted": false}'::jsonb,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. CHARACTER INVENTORY (Equipment)
CREATE TABLE IF NOT EXISTS public.character_inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  character_id UUID REFERENCES public.characters(id) ON DELETE CASCADE NOT NULL,
  item_id TEXT REFERENCES public.library(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  location TEXT NOT NULL DEFAULT 'backpack',
  quantity INT DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ROW LEVEL SECURITY (RLS) --
-- Profiles RLS and policies (drop policy if exists first)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
             WHERE c.relname = 'profiles' AND n.nspname = 'public') THEN

    ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

    -- Drop existing policies if present, then create
    BEGIN
      EXECUTE 'DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles';
    EXCEPTION WHEN undefined_object THEN
      -- ignore
    END;

    CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);

    BEGIN
      EXECUTE 'DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles';
    EXCEPTION WHEN undefined_object THEN
    END;
    CREATE POLICY "Users can insert their own profile." ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

    BEGIN
      EXECUTE 'DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles';
    EXCEPTION WHEN undefined_object THEN
    END;
    CREATE POLICY "Users can update own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Characters RLS and policies
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
             WHERE c.relname = 'characters' AND n.nspname = 'public') THEN

    ALTER TABLE public.characters ENABLE ROW LEVEL SECURITY;

    EXECUTE 'DROP POLICY IF EXISTS "Characters viewable by owner" ON public.characters';
    CREATE POLICY "Characters viewable by owner" ON public.characters FOR SELECT USING (auth.uid() = user_id);

    EXECUTE 'DROP POLICY IF EXISTS "Characters insertable by owner" ON public.characters';
    CREATE POLICY "Characters insertable by owner" ON public.characters FOR INSERT WITH CHECK (auth.uid() = user_id);

    EXECUTE 'DROP POLICY IF EXISTS "Characters updatable by owner" ON public.characters';
    CREATE POLICY "Characters updatable by owner" ON public.characters FOR UPDATE USING (auth.uid() = user_id);

    EXECUTE 'DROP POLICY IF EXISTS "Characters deletable by owner" ON public.characters';
    CREATE POLICY "Characters deletable by owner" ON public.characters FOR DELETE USING (auth.uid() = user_id);
  END IF;
END;
$$ LANGUAGE plpgsql;



-- Character Cards RLS
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
             WHERE c.relname = 'character_cards' AND n.nspname = 'public') THEN

    ALTER TABLE public.character_cards ENABLE ROW LEVEL SECURITY;

    EXECUTE 'DROP POLICY IF EXISTS "Cards viewable by char owner" ON public.character_cards';
    CREATE POLICY "Cards viewable by char owner" ON public.character_cards FOR SELECT USING (
      EXISTS (SELECT 1 FROM public.characters WHERE id = character_id AND user_id = auth.uid())
    );

    EXECUTE 'DROP POLICY IF EXISTS "Cards insertable by char owner" ON public.character_cards';
    CREATE POLICY "Cards insertable by char owner" ON public.character_cards FOR INSERT WITH CHECK (
      EXISTS (SELECT 1 FROM public.characters WHERE id = character_id)
    );

    EXECUTE 'DROP POLICY IF EXISTS "Cards updatable by char owner" ON public.character_cards';
    CREATE POLICY "Cards updatable by char owner" ON public.character_cards FOR UPDATE USING (
      EXISTS (SELECT 1 FROM public.characters WHERE id = character_id AND user_id = auth.uid())
    );

    EXECUTE 'DROP POLICY IF EXISTS "Cards deletable by char owner" ON public.character_cards';
    CREATE POLICY "Cards deletable by char owner" ON public.character_cards FOR DELETE USING (
      EXISTS (SELECT 1 FROM public.characters WHERE id = character_id AND user_id = auth.uid())
    );
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Character Inventory RLS
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
             WHERE c.relname = 'character_inventory' AND n.nspname = 'public') THEN

    ALTER TABLE public.character_inventory ENABLE ROW LEVEL SECURITY;

    EXECUTE 'DROP POLICY IF EXISTS "Inventory viewable by char owner" ON public.character_inventory';
    CREATE POLICY "Inventory viewable by char owner" ON public.character_inventory FOR SELECT USING (
      EXISTS (SELECT 1 FROM public.characters WHERE id = character_id AND user_id = auth.uid())
    );

    EXECUTE 'DROP POLICY IF EXISTS "Inventory insertable by char owner" ON public.character_inventory';
    CREATE POLICY "Inventory insertable by char owner" ON public.character_inventory FOR INSERT WITH CHECK (
      EXISTS (SELECT 1 FROM public.characters WHERE id = character_id AND user_id = auth.uid())
    );

    EXECUTE 'DROP POLICY IF EXISTS "Inventory updatable by char owner" ON public.character_inventory';
    CREATE POLICY "Inventory updatable by char owner" ON public.character_inventory FOR UPDATE USING (
      EXISTS (SELECT 1 FROM public.characters WHERE id = character_id AND user_id = auth.uid())
    );

    EXECUTE 'DROP POLICY IF EXISTS "Inventory deletable by char owner" ON public.character_inventory';
    CREATE POLICY "Inventory deletable by char owner" ON public.character_inventory FOR DELETE USING (
      EXISTS (SELECT 1 FROM public.characters WHERE id = character_id AND user_id = auth.uid())
    );
  END IF;
END;
$$ LANGUAGE plpgsql;

-- TRIGGERS --
-- Recreate trigger function (non-destructive)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Avoid duplicate insert if profile already exists
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.id) THEN
    INSERT INTO public.profiles (id, username, avatar_url)
    VALUES (
      NEW.id,
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'avatar_url'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure old trigger removed, then create
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();