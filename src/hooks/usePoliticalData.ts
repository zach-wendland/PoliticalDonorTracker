// React hook for consuming political finance data

import { useState, useCallback, useEffect } from 'react';
import { politicalApiService } from '../services/politicalApiService';
import type {
  DonorProfile,
  LobbyistProfile,
  RecipientProfile,
  PoliticalApiStatus,
  FECCandidate,
  FECCommittee,
  FECContribution,
  LDAFiling,
} from '../types/political';

interface UsePoliticalDataReturn {
  // Profile data (for detail views)
  donorProfile: DonorProfile | null;
  recipientProfile: RecipientProfile | null;
  lobbyistProfile: LobbyistProfile | null;

  // List data (for overview/search)
  candidates: FECCandidate[];
  committees: FECCommittee[];
  contributions: FECContribution[];
  lobbyistFilings: LDAFiling[];

  // Loading states
  isLoading: boolean;
  isLoadingDonor: boolean;
  isLoadingRecipient: boolean;
  isLoadingLobbyist: boolean;
  isLoadingCandidates: boolean;
  isLoadingCommittees: boolean;
  isLoadingContributions: boolean;
  isLoadingFilings: boolean;

  // Error states
  error: string | null;
  donorError: string | null;
  recipientError: string | null;
  lobbyistError: string | null;

  // API status
  apiStatus: PoliticalApiStatus;

  // Actions
  searchDonor: (name: string) => Promise<void>;
  searchRecipient: (query: string) => Promise<void>;
  searchLobbyist: (name: string) => Promise<void>;
  searchCandidates: (query: string, state?: string, party?: string) => Promise<void>;
  searchCommittees: (query: string, state?: string) => Promise<void>;
  searchContributions: (contributorName: string, state?: string) => Promise<void>;
  searchLobbyistFilings: (registrantName?: string, clientName?: string) => Promise<void>;
  refreshApiStatus: () => void;
  clearCache: () => void;
}

export function usePoliticalData(): UsePoliticalDataReturn {
  // Profile states
  const [donorProfile, setDonorProfile] = useState<DonorProfile | null>(null);
  const [recipientProfile, setRecipientProfile] = useState<RecipientProfile | null>(null);
  const [lobbyistProfile, setLobbyistProfile] = useState<LobbyistProfile | null>(null);

  // List states
  const [candidates, setCandidates] = useState<FECCandidate[]>([]);
  const [committees, setCommittees] = useState<FECCommittee[]>([]);
  const [contributions, setContributions] = useState<FECContribution[]>([]);
  const [lobbyistFilings, setLobbyistFilings] = useState<LDAFiling[]>([]);

  // Loading states
  const [isLoadingDonor, setIsLoadingDonor] = useState(false);
  const [isLoadingRecipient, setIsLoadingRecipient] = useState(false);
  const [isLoadingLobbyist, setIsLoadingLobbyist] = useState(false);
  const [isLoadingCandidates, setIsLoadingCandidates] = useState(false);
  const [isLoadingCommittees, setIsLoadingCommittees] = useState(false);
  const [isLoadingContributions, setIsLoadingContributions] = useState(false);
  const [isLoadingFilings, setIsLoadingFilings] = useState(false);

  // Error states
  const [error, setError] = useState<string | null>(null);
  const [donorError, setDonorError] = useState<string | null>(null);
  const [recipientError, setRecipientError] = useState<string | null>(null);
  const [lobbyistError, setLobbyistError] = useState<string | null>(null);

  // API status
  const [apiStatus, setApiStatus] = useState<PoliticalApiStatus>(
    politicalApiService.getApiStatus()
  );

  // Refresh API status
  const refreshApiStatus = useCallback(() => {
    setApiStatus(politicalApiService.getApiStatus());
  }, []);

  // Refresh status periodically
  useEffect(() => {
    const interval = setInterval(refreshApiStatus, 30000); // Every 30 seconds
    return () => clearInterval(interval);
  }, [refreshApiStatus]);

  // Search donor by name
  const searchDonor = useCallback(async (name: string) => {
    if (!name.trim()) return;

    setIsLoadingDonor(true);
    setDonorError(null);

    try {
      const result = await politicalApiService.fetchDonorProfile(name);
      setDonorProfile(result.data);
      if (result.error) {
        setDonorError(result.error);
      }
    } catch (err) {
      setDonorError(err instanceof Error ? err.message : 'Failed to fetch donor');
      setDonorProfile(null);
    } finally {
      setIsLoadingDonor(false);
      refreshApiStatus();
    }
  }, [refreshApiStatus]);

  // Search recipient (candidate or committee)
  const searchRecipient = useCallback(async (query: string) => {
    if (!query.trim()) return;

    setIsLoadingRecipient(true);
    setRecipientError(null);

    try {
      const result = await politicalApiService.fetchRecipientProfile(query);
      setRecipientProfile(result.data);
      if (result.error) {
        setRecipientError(result.error);
      }
    } catch (err) {
      setRecipientError(err instanceof Error ? err.message : 'Failed to fetch recipient');
      setRecipientProfile(null);
    } finally {
      setIsLoadingRecipient(false);
      refreshApiStatus();
    }
  }, [refreshApiStatus]);

  // Search lobbyist by name
  const searchLobbyist = useCallback(async (name: string) => {
    if (!name.trim()) return;

    setIsLoadingLobbyist(true);
    setLobbyistError(null);

    try {
      const result = await politicalApiService.fetchLobbyistProfile(name);
      setLobbyistProfile(result.data);
      if (result.error) {
        setLobbyistError(result.error);
      }
    } catch (err) {
      setLobbyistError(err instanceof Error ? err.message : 'Failed to fetch lobbyist');
      setLobbyistProfile(null);
    } finally {
      setIsLoadingLobbyist(false);
      refreshApiStatus();
    }
  }, [refreshApiStatus]);

  // Search candidates
  const searchCandidates = useCallback(async (query: string, state?: string, party?: string) => {
    setIsLoadingCandidates(true);
    setError(null);

    try {
      const result = await politicalApiService.searchCandidates({
        q: query || undefined,
        state: state || undefined,
        party: party || undefined,
      });
      setCandidates(result.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search candidates');
      setCandidates([]);
    } finally {
      setIsLoadingCandidates(false);
      refreshApiStatus();
    }
  }, [refreshApiStatus]);

  // Search committees
  const searchCommittees = useCallback(async (query: string, state?: string) => {
    setIsLoadingCommittees(true);
    setError(null);

    try {
      const result = await politicalApiService.searchCommittees({
        q: query || undefined,
        state: state || undefined,
      });
      setCommittees(result.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search committees');
      setCommittees([]);
    } finally {
      setIsLoadingCommittees(false);
      refreshApiStatus();
    }
  }, [refreshApiStatus]);

  // Search contributions
  const searchContributions = useCallback(async (contributorName: string, state?: string) => {
    setIsLoadingContributions(true);
    setError(null);

    try {
      const result = await politicalApiService.searchContributions({
        contributor_name: contributorName || undefined,
        contributor_state: state || undefined,
      });
      setContributions(result.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search contributions');
      setContributions([]);
    } finally {
      setIsLoadingContributions(false);
      refreshApiStatus();
    }
  }, [refreshApiStatus]);

  // Search lobbyist filings
  const searchLobbyistFilings = useCallback(async (registrantName?: string, clientName?: string) => {
    setIsLoadingFilings(true);
    setError(null);

    try {
      const result = await politicalApiService.searchLobbyists({
        registrant_name: registrantName,
        client_name: clientName,
      });
      setLobbyistFilings(result.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search lobbyist filings');
      setLobbyistFilings([]);
    } finally {
      setIsLoadingFilings(false);
      refreshApiStatus();
    }
  }, [refreshApiStatus]);

  // Clear cache
  const clearCache = useCallback(() => {
    politicalApiService.clearCache();
    refreshApiStatus();
  }, [refreshApiStatus]);

  // Computed loading state
  const isLoading = isLoadingDonor || isLoadingRecipient || isLoadingLobbyist ||
                    isLoadingCandidates || isLoadingCommittees || isLoadingContributions || isLoadingFilings;

  return {
    // Profile data
    donorProfile,
    recipientProfile,
    lobbyistProfile,

    // List data
    candidates,
    committees,
    contributions,
    lobbyistFilings,

    // Loading states
    isLoading,
    isLoadingDonor,
    isLoadingRecipient,
    isLoadingLobbyist,
    isLoadingCandidates,
    isLoadingCommittees,
    isLoadingContributions,
    isLoadingFilings,

    // Error states
    error,
    donorError,
    recipientError,
    lobbyistError,

    // API status
    apiStatus,

    // Actions
    searchDonor,
    searchRecipient,
    searchLobbyist,
    searchCandidates,
    searchCommittees,
    searchContributions,
    searchLobbyistFilings,
    refreshApiStatus,
    clearCache,
  };
}
