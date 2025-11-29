INSERT INTO public.characters (id, user_id, name, level, ancestry, community, class_id, subclass_id, stats, vitals, hope, fear, gold)
VALUES (
  'c60c73bb-72c7-4a27-a7fe-ff2808d0004d', -- Example character ID (different from user ID)
  'c60c73bb-72c7-4a27-a7fe-ff2808d0004c', -- Your User ID
  'Heroic Warrior',
  1,
  'Human',
  'Orderborne', -- Example community
  'Warrior',
  'Call of the Brave',
  '{
    "agility": 0,
    "strength": 2,
    "finesse": 0,
    "instinct": 1,
    "presence": 1,
    "knowledge": 0
  }'::jsonb,
  '{
    "hp_max": 7,
    "hp_current": 7,
    "stress_max": 7,
    "stress_current": 0,
    "armor_max": 4,
    "armor_current": 4
  }'::jsonb,
  2,
  0,
  '{"handfuls": 5, "bags": 0, "chests": 0}'::jsonb
) ON CONFLICT (id) DO NOTHING;

-- Insert character cards for the demo character
INSERT INTO public.character_cards (character_id, card_id, location, sort_order)
SELECT
  'c60c73bb-72c7-4a27-a7fe-ff2808d0004d',
  lc.id,
  'loadout',
  CASE lc.id
    WHEN 'ability-blade-get-back-up' THEN 1
    WHEN 'ability-valor-forceful-push' THEN 2
  END
FROM public.library lc
WHERE lc.id IN ('ability-blade-get-back-up', 'ability-valor-forceful-push')
ON CONFLICT DO NOTHING;

-- Insert character inventory for the demo character
INSERT INTO public.character_inventory (character_id, item_id, name, description, location, quantity)
SELECT
  'c60c73bb-72c7-4a27-a7fe-ff2808d0004d',
  lc.id,
  lc.name,
  lc.data->>'markdown', -- Get description from library data
  CASE lc.type
    WHEN 'weapon' THEN 'equipped_primary'
    WHEN 'armor' THEN 'equipped_armor'
  END,
  1
FROM public.library lc
WHERE lc.id IN ('weapon-longsword', 'armor-chainmail-armor')
ON CONFLICT DO NOTHING;

-- Add a generic item
INSERT INTO public.character_inventory (character_id, item_id, name, description, location, quantity)
VALUES (
  'c60c73bb-72c7-4a27-a7fe-ff2808d0004d',
  NULL, -- Custom item
  'Torch',
  'A basic wooden torch.',
  'backpack',
  1
) ON CONFLICT DO NOTHING;
