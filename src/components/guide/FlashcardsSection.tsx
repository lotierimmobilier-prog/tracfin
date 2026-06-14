import { useState, useEffect } from 'react';
import { BookOpen, ChevronLeft, ChevronRight, RotateCw, CheckCircle, Info } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface Flashcard {
  question: string;
  answer: string;
}

export function FlashcardsSection() {
  const { profile } = useAuth();
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [studied, setStudied] = useState<Set<number>>(new Set());

  useEffect(() => {
    loadFlashcards();
  }, [profile?.id]);

  const loadFlashcards = async () => {
    try {
      if (profile?.id) {
        await loadProgress(profile.id);
      }

      const response = await fetch('/flashcards.csv');
      const text = await response.text();

      const lines = text.trim().split('\n');
      const cards: Flashcard[] = [];

      for (const line of lines) {
        const parts = line.split(',');
        if (parts.length >= 2) {
          const question = parts[0].replace(/^"|"$/g, '').trim();
          const answer = parts.slice(1).join(',').replace(/^"|"$/g, '').trim();
          if (question && answer) {
            cards.push({ question, answer });
          }
        }
      }

      setFlashcards(cards);
      setLoading(false);
    } catch (err) {
      console.error('Error loading flashcards:', err);
      setError('Erreur lors du chargement des flashcards');
      setLoading(false);
    }
  };

  const loadProgress = async (uid: string) => {
    try {
      const { data, error } = await supabase
        .from('flashcards_progress')
        .select('card_index')
        .eq('user_id', uid);

      if (error) throw error;

      if (data) {
        const studiedSet = new Set(data.map(item => item.card_index));
        setStudied(studiedSet);
      }
    } catch (err) {
      console.error('Error loading progress:', err);
    }
  };

  const saveProgress = async (cardIndex: number) => {
    if (!profile?.id) return;

    try {
      const { error } = await supabase
        .from('flashcards_progress')
        .upsert({
          user_id: profile.id,
          card_index: cardIndex,
          studied_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,card_index'
        });

      if (error) throw error;
    } catch (err) {
      console.error('Error saving progress:', err);
    }
  };

  const handleNext = () => {
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsFlipped(false);
    }
  };

  const handleFlip = () => {
    if (!isFlipped) {
      setStudied(prev => new Set([...prev, currentIndex]));
      saveProgress(currentIndex);
    }
    setIsFlipped(!isFlipped);
  };

  const handleReset = async () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setStudied(new Set());

    if (profile?.id) {
      try {
        await supabase
          .from('flashcards_progress')
          .delete()
          .eq('user_id', profile.id);
      } catch (err) {
        console.error('Error resetting progress:', err);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-slate-600">Chargement des flashcards...</div>
      </div>
    );
  }

  if (error || flashcards.length === 0) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6">
        <p className="text-red-800">{error || 'Aucune flashcard disponible'}</p>
      </div>
    );
  }

  const currentCard = flashcards[currentIndex];
  const progress = ((studied.size / flashcards.length) * 100).toFixed(0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Flashcards de formation TRACFIN</h2>
        <p className="text-slate-700 leading-relaxed">
          Testez vos connaissances avec {flashcards.length} questions couvrant tous les aspects essentiels
          de la lutte contre le blanchiment et le financement du terrorisme.
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-blue-900 mb-2">Comment utiliser les flashcards</h3>
            <ul className="space-y-1 text-sm text-blue-800">
              <li>• Lisez attentivement la question</li>
              <li>• Réfléchissez à votre réponse</li>
              <li>• Cliquez sur la carte pour révéler la réponse</li>
              <li>• Utilisez les flèches pour naviguer entre les cartes</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <BookOpen className="w-6 h-6 text-slate-900" />
            <div>
              <p className="text-sm font-medium text-slate-900">
                Carte {currentIndex + 1} sur {flashcards.length}
              </p>
              <p className="text-xs text-slate-600">
                {studied.size} carte{studied.size > 1 ? 's' : ''} étudiée{studied.size > 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition text-sm font-medium text-slate-700"
          >
            <RotateCw className="w-4 h-4" />
            Recommencer
          </button>
        </div>

        <div className="mb-6">
          <div className="bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-slate-900 to-slate-700 h-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-slate-600 mt-2 text-center">
            Progression: {progress}% complété
          </p>
        </div>

        <div
          onClick={handleFlip}
          className="relative cursor-pointer perspective-1000 mb-6"
          style={{ minHeight: '300px' }}
        >
          <div
            className={`relative w-full transition-all duration-500 transform-style-3d ${
              isFlipped ? 'rotate-y-180' : ''
            }`}
            style={{
              transformStyle: 'preserve-3d',
              transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            }}
          >
            <div
              className={`absolute inset-0 backface-hidden ${
                isFlipped ? 'invisible' : 'visible'
              }`}
              style={{ backfaceVisibility: 'hidden' }}
            >
              <div className="bg-gradient-to-br from-slate-900 to-slate-700 rounded-2xl p-8 shadow-xl min-h-[300px] flex flex-col items-center justify-center text-white">
                <p className="text-xs uppercase tracking-wider text-slate-300 mb-4">Question</p>
                <p className="text-xl font-medium text-center leading-relaxed">
                  {currentCard.question}
                </p>
                <p className="text-sm text-slate-400 mt-6">Cliquez pour révéler la réponse</p>
              </div>
            </div>

            <div
              className={`absolute inset-0 backface-hidden ${
                isFlipped ? 'visible' : 'invisible'
              }`}
              style={{
                backfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)',
              }}
            >
              <div className="bg-gradient-to-br from-green-600 to-green-500 rounded-2xl p-8 shadow-xl min-h-[300px] flex flex-col items-center justify-center text-white">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle className="w-5 h-5" />
                  <p className="text-xs uppercase tracking-wider">Réponse</p>
                </div>
                <p className="text-lg font-medium text-center leading-relaxed">
                  {currentCard.answer}
                </p>
                <p className="text-sm text-green-100 mt-6">Cliquez pour retourner la carte</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-5 h-5" />
            Précédente
          </button>

          <button
            onClick={handleFlip}
            className="px-8 py-3 bg-white border-2 border-slate-900 text-slate-900 rounded-lg font-medium hover:bg-slate-50 transition"
          >
            {isFlipped ? 'Retourner' : 'Révéler la réponse'}
          </button>

          <button
            onClick={handleNext}
            disabled={currentIndex === flashcards.length - 1}
            className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Suivante
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {studied.size === flashcards.length && (
        <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-6 h-6 text-green-600 mt-1" />
            <div>
              <h3 className="font-bold text-green-900 text-lg mb-2">Félicitations !</h3>
              <p className="text-sm text-green-800">
                Vous avez parcouru toutes les flashcards. Vous pouvez recommencer pour renforcer vos connaissances
                ou passer à l'attestation de formation pour valider votre parcours.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-slate-900 text-white rounded-xl p-6">
        <h3 className="font-semibold mb-2 flex items-center gap-2">
          <BookOpen className="w-5 h-5" />
          Conseil d'apprentissage
        </h3>
        <p className="text-slate-300 text-sm">
          Pour une meilleure mémorisation, n'hésitez pas à parcourir les flashcards plusieurs fois.
          La répétition espacée est une technique d'apprentissage très efficace pour ancrer les connaissances
          dans votre mémoire à long terme.
        </p>
      </div>
    </div>
  );
}
