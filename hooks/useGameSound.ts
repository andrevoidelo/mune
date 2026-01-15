
import useSound from 'use-sound';
import { useSoundSettings } from '../contexts/SoundContext';

export type SoundType = 
  | 'ROLL' 
  | 'SUCCESS' 
  | 'FAILURE' 
  | 'DICE_RESULT' 
  | 'ORACLE' 
  | 'CARD'
  | 'LIST'
  | 'CLICK';

export const useGameSound = () => {
  const { isSoundEnabled } = useSoundSettings();

  // Helper para configuração comum
  // Nota: O caminho '/sounds/' procura uma pasta 'sounds' na raiz pública (public/sounds)
  const soundConfig = (name: string) => ({
    volume: 0.5,
    interrupt: true,
    onloaderror: (_id: any, err: any) => {
      console.warn(`[Audio Error] Falha ao carregar: /sounds/${name}`, err);
    }
  });

  // Load sounds
  const [playRoll] = useSound('/sounds/dice-roll.mp3', soundConfig('dice-roll.mp3'));
  const [playResult] = useSound('/sounds/dice-result.mp3', soundConfig('dice-result.mp3'));
  const [playSuccess] = useSound('/sounds/success.mp3', { ...soundConfig('success.mp3'), volume: 0.4 });
  const [playFailure] = useSound('/sounds/failure.mp3', { ...soundConfig('failure.mp3'), volume: 0.4 });
  const [playCard] = useSound('/sounds/card-flip.mp3', { ...soundConfig('card-flip.mp3'), volume: 0.4 });
  const [playOracle] = useSound('/sounds/magic.mp3', { ...soundConfig('magic.mp3'), volume: 0.4 });
  const [playClick] = useSound('/sounds/click.mp3', { ...soundConfig('click.mp3'), volume: 0.2 });

  const play = (type: SoundType) => {
    if (!isSoundEnabled) return;

    try {
      switch (type) {
        case 'ROLL': playRoll(); break;
        case 'SUCCESS': playSuccess(); break;
        case 'FAILURE': playFailure(); break;
        case 'DICE_RESULT': playResult(); break;
        case 'ORACLE': playOracle(); break;
        case 'LIST': playResult(); break;
        case 'CARD': playCard(); break;
        case 'CLICK': playClick(); break;
      }
    } catch (e) {
      console.warn("Erro ao tentar tocar som:", e);
    }
  };

  return { play };
};
