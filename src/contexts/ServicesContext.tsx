// Services Context - Provides dependency injection for testability
// Components access services via useServices() hook instead of importing singletons directly

import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import type { IPoliticalApiService } from '../services/politicalApiService';
import type { ISupabaseService } from '../services/supabaseService';
import type { SimpleCache } from '../services/cache';

export interface Services {
  politicalApiService: IPoliticalApiService;
  supabaseService: ISupabaseService;
  cache: SimpleCache;
}

const ServicesContext = createContext<Services | null>(null);

interface ServicesProviderProps {
  children: ReactNode;
  services: Services;
}

export function ServicesProvider({ children, services }: ServicesProviderProps) {
  return (
    <ServicesContext.Provider value={services}>
      {children}
    </ServicesContext.Provider>
  );
}

/**
 * Hook to access services from context
 * Throws error if used outside ServicesProvider (helps catch missing provider in tests)
 */
// eslint-disable-next-line react-refresh/only-export-components
export function useServices(): Services {
  const services = useContext(ServicesContext);
  if (!services) {
    throw new Error('useServices must be used within a ServicesProvider');
  }
  return services;
}
