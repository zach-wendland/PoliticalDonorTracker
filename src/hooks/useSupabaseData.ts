// React hook for consuming Supabase enriched political data

import { useState, useCallback, useEffect } from 'react';
import { supabaseService } from '../services/supabaseService';
import type {
  SupabaseDonor,
  MediaFunding,
  PacContribution,
  PacContributionDetail,
  PoliticalRecipient,
  DonorMediaNetwork,
} from '../types/supabase';

interface UseSupabaseDataReturn {
  // Data
  donors: SupabaseDonor[];
  mediaFunding: MediaFunding[];
  pacContributions: PacContribution[];
  pacContributionDetails: PacContributionDetail[];
  politicalRecipients: PoliticalRecipient[];
  donorMediaNetwork: DonorMediaNetwork | null;

  // Loading states
  isLoading: boolean;
  isLoadingDonors: boolean;
  isLoadingNetwork: boolean;
  isLoadingPacData: boolean;

  // Error states
  error: string | null;

  // Configuration
  isConfigured: boolean;

  // Actions
  fetchDonors: () => Promise<void>;
  fetchDonorById: (id: string) => Promise<SupabaseDonor | null>;
  searchDonors: (name: string) => Promise<SupabaseDonor[]>;
  fetchMediaFunding: () => Promise<void>;
  fetchPacContributions: () => Promise<void>;
  fetchPacContributionDetails: () => Promise<void>;
  fetchPoliticalRecipients: () => Promise<void>;
  fetchDonorMediaNetwork: () => Promise<void>;
  fetchAllData: () => Promise<void>;
  clearCache: () => void;
}

export function useSupabaseData(): UseSupabaseDataReturn {
  // Data states
  const [donors, setDonors] = useState<SupabaseDonor[]>([]);
  const [mediaFunding, setMediaFunding] = useState<MediaFunding[]>([]);
  const [pacContributions, setPacContributions] = useState<PacContribution[]>([]);
  const [pacContributionDetails, setPacContributionDetails] = useState<PacContributionDetail[]>([]);
  const [politicalRecipients, setPoliticalRecipients] = useState<PoliticalRecipient[]>([]);
  const [donorMediaNetwork, setDonorMediaNetwork] = useState<DonorMediaNetwork | null>(null);

  // Loading states
  const [isLoadingDonors, setIsLoadingDonors] = useState(false);
  const [isLoadingNetwork, setIsLoadingNetwork] = useState(false);
  const [isLoadingPacData, setIsLoadingPacData] = useState(false);

  // Error state
  const [error, setError] = useState<string | null>(null);

  // Check if Supabase is configured
  const isConfigured = supabaseService.isConfigured();

  // Fetch donors
  const fetchDonors = useCallback(async () => {
    if (!isConfigured) return;
    setIsLoadingDonors(true);
    setError(null);

    try {
      const data = await supabaseService.getDonors();
      setDonors(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch donors');
    } finally {
      setIsLoadingDonors(false);
    }
  }, [isConfigured]);

  // Fetch single donor by ID
  const fetchDonorById = useCallback(async (id: string): Promise<SupabaseDonor | null> => {
    if (!isConfigured) return null;
    return supabaseService.getDonorById(id);
  }, [isConfigured]);

  // Search donors by name
  const searchDonors = useCallback(async (name: string): Promise<SupabaseDonor[]> => {
    if (!isConfigured) return [];
    return supabaseService.searchDonorsByName(name);
  }, [isConfigured]);

  // Fetch media funding
  const fetchMediaFunding = useCallback(async () => {
    if (!isConfigured) return;
    try {
      const data = await supabaseService.getMediaFunding();
      setMediaFunding(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch media funding');
    }
  }, [isConfigured]);

  // Fetch PAC contributions
  const fetchPacContributions = useCallback(async () => {
    if (!isConfigured) return;
    setIsLoadingPacData(true);

    try {
      const data = await supabaseService.getPacContributions();
      setPacContributions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch PAC contributions');
    } finally {
      setIsLoadingPacData(false);
    }
  }, [isConfigured]);

  // Fetch PAC contribution details
  const fetchPacContributionDetails = useCallback(async () => {
    if (!isConfigured) return;
    setIsLoadingPacData(true);

    try {
      const data = await supabaseService.getPacContributionDetails();
      setPacContributionDetails(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch PAC contribution details');
    } finally {
      setIsLoadingPacData(false);
    }
  }, [isConfigured]);

  // Fetch political recipients
  const fetchPoliticalRecipients = useCallback(async () => {
    if (!isConfigured) return;

    try {
      const data = await supabaseService.getPoliticalRecipients();
      setPoliticalRecipients(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch political recipients');
    }
  }, [isConfigured]);

  // Fetch donor-media network for D3 visualization
  const fetchDonorMediaNetwork = useCallback(async () => {
    if (!isConfigured) return;
    setIsLoadingNetwork(true);
    setError(null);

    try {
      const data = await supabaseService.getDonorMediaNetwork();
      setDonorMediaNetwork(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch network data');
    } finally {
      setIsLoadingNetwork(false);
    }
  }, [isConfigured]);

  // Fetch all data
  const fetchAllData = useCallback(async () => {
    if (!isConfigured) return;

    await Promise.all([
      fetchDonors(),
      fetchMediaFunding(),
      fetchPacContributions(),
      fetchPacContributionDetails(),
      fetchPoliticalRecipients(),
      fetchDonorMediaNetwork(),
    ]);
  }, [
    isConfigured,
    fetchDonors,
    fetchMediaFunding,
    fetchPacContributions,
    fetchPacContributionDetails,
    fetchPoliticalRecipients,
    fetchDonorMediaNetwork,
  ]);

  // Clear cache
  const clearCache = useCallback(() => {
    supabaseService.clearCache();
    setDonors([]);
    setMediaFunding([]);
    setPacContributions([]);
    setPacContributionDetails([]);
    setPoliticalRecipients([]);
    setDonorMediaNetwork(null);
  }, []);

  // Auto-fetch network data on mount if configured
  useEffect(() => {
    if (isConfigured) {
      fetchDonorMediaNetwork();
    }
  }, [isConfigured, fetchDonorMediaNetwork]);

  // Combined loading state
  const isLoading = isLoadingDonors || isLoadingNetwork || isLoadingPacData;

  return {
    // Data
    donors,
    mediaFunding,
    pacContributions,
    pacContributionDetails,
    politicalRecipients,
    donorMediaNetwork,

    // Loading states
    isLoading,
    isLoadingDonors,
    isLoadingNetwork,
    isLoadingPacData,

    // Error states
    error,

    // Configuration
    isConfigured,

    // Actions
    fetchDonors,
    fetchDonorById,
    searchDonors,
    fetchMediaFunding,
    fetchPacContributions,
    fetchPacContributionDetails,
    fetchPoliticalRecipients,
    fetchDonorMediaNetwork,
    fetchAllData,
    clearCache,
  };
}
