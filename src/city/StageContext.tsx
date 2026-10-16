import { createContext, RefObject, useContext } from 'react';
import { Mahalle3DHandle, StageEvents } from '../components/Mahalle3D';

/**
 * Uygulamanın tek 3D sahnesine erişim (App kurar). Mahallem ekranı sahneyi
 * kendisi kurmaz; buradan kumanda eder ve olaylarını `events`e bağlar.
 */
export interface Stage {
  scene: RefObject<Mahalle3DHandle | null>;
  events: RefObject<StageEvents>;
}

export const StageContext = createContext<Stage | null>(null);

export function useStage(): Stage {
  const v = useContext(StageContext);
  if (!v) throw new Error('StageContext eksik');
  return v;
}
