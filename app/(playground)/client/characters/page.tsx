'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import createClient from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCharacterStore, Character } from '@/store/character-store';

export default function CharacterSelectPage() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();
  const { user, fetchCharacter } = useCharacterStore();

  useEffect(() => {
    const fetchCharacters = async () => {
      if (!user) {
        router.push('/auth/login');
        return;
      }

      const { data, error } = await supabase
        .from('characters')
        .select('*')
        .eq('user_id', user.id)
        .limit(10);

      if (error) {
        console.error('Error fetching characters:', error);
      } else {
        setCharacters(data || []);
      }
      setLoading(false);
    };

    fetchCharacters();
  }, [user, supabase, router]);

  const handleSelectCharacter = async (characterId: string) => {
    if (!user) return;

    // Fetch the selected character into the store
    await fetchCharacter(user.id, characterId);
    router.back();
  };

  if (loading) {
    return <div className="p-4 text-center">Loading characters...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6 text-center">Select Your Character</h1>
      {characters.length === 0 ? (
        <p className="text-center text-gray-500">No characters found. Create one to get started!</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {characters.map((character) => (
            <Card key={character.id} className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800" onClick={() => handleSelectCharacter(character.id)}>
              <CardHeader>
                <CardTitle>{character.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Level {character.level}</p>
                <p>Class: {character.class_id || 'Unknown'}</p>
                <p>Ancestry: {character.ancestry || 'Unknown'}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <div className="mt-8 text-center">
        <Button onClick={() => router.push('/create-character')}>Create New Character</Button>
      </div>
    </div>
  );
}
