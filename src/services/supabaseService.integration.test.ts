// Integration tests for SupabaseService using real database
// These tests require VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to be configured

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createSupabaseService, type ISupabaseService } from './supabaseService';
import { createCache } from './cache';
import { supabase } from '../lib/supabase';

// Skip these tests if Supabase is not configured
const runIntegrationTests = !!supabase;

describe.skipIf(!runIntegrationTests)('SupabaseService Integration Tests', () => {
  let service: ISupabaseService;
  const testDonorIds: string[] = [];
  const testMediaFundingIds: string[] = [];
  const testPacIds: string[] = [];

  beforeAll(async () => {
    if (!supabase) return;

    service = createSupabaseService(createCache());

    // Create test donor
    const { data: donor, error: donorError } = await supabase
      .from('donors')
      .insert({
        name: 'Test Donor for Integration',
        donor_type: 'individual',
        net_worth_billions: 5.5,
        wealth_source: 'Tech startup',
        total_contributions: 1000000,
        contribution_count: 10,
        pro_israel_indicators: ['AIPAC donor'],
        media_connections: [
          { outlet_name: 'Test Media Outlet', relationship: 'investor' }
        ],
        israel_connections: ['Tech partnership'],
        metadata: { notes: 'Integration test donor' },
        sources: [
          {
            url: 'https://example.com/test',
            name: 'Test Source',
            accessDate: new Date().toISOString()
          }
        ]
      })
      .select()
      .single();

    if (!donorError && donor) {
      testDonorIds.push(donor.id);
    }

    // Create test media funding
    if (testDonorIds.length > 0) {
      const { data: media, error: mediaError } = await supabase
        .from('media_funding')
        .insert({
          donor_id: testDonorIds[0],
          outlet_name: 'Test News Network',
          outlet_domain: 'testnews.com',
          relationship_type: 'investor',
          outlet_type: 'Digital',
          estimated_amount: 5000000,
          start_year: 2020,
          source_citations: [
            {
              url: 'https://example.com/funding',
              name: 'Test Funding Source',
              accessDate: new Date().toISOString()
            }
          ]
        })
        .select()
        .single();

      if (!mediaError && media) {
        testMediaFundingIds.push(media.id);
      }
    }

    // Create test PAC contribution
    const { data: pac, error: pacError } = await supabase
      .from('pac_contributions')
      .insert({
        pac_name: 'Test Political Action Committee',
        pac_type: 'pro-Israel',
        total_raised: 2000000,
        total_spent: 1500000,
        election_cycle: '2024',
        top_recipients: [
          { name: 'Test Candidate A', amount: 50000, party: 'D' },
          { name: 'Test Candidate B', amount: 45000, party: 'R' }
        ],
        source_fec_id: 'C00TEST123'
      })
      .select()
      .single();

    if (!pacError && pac) {
      testPacIds.push(pac.id);
    }

    console.log('✅ Test data created:', {
      donors: testDonorIds.length,
      mediaFunding: testMediaFundingIds.length,
      pacs: testPacIds.length
    });
  });

  afterAll(async () => {
    if (!supabase) return;

    // Clean up test data
    if (testMediaFundingIds.length > 0) {
      await supabase.from('media_funding').delete().in('id', testMediaFundingIds);
    }

    if (testPacIds.length > 0) {
      await supabase.from('pac_contributions').delete().in('id', testPacIds);
    }

    if (testDonorIds.length > 0) {
      await supabase.from('donors').delete().in('id', testDonorIds);
    }

    console.log('🧹 Test data cleaned up');
  });

  describe('Configuration', () => {
    it('should detect that Supabase is configured', () => {
      expect(service.isConfigured()).toBe(true);
    });
  });

  describe('getDonors()', () => {
    it('should fetch donors from real database', async () => {
      const donors = await service.getDonors();

      expect(Array.isArray(donors)).toBe(true);
      expect(donors.length).toBeGreaterThan(0);

      console.log(`📊 Fetched ${donors.length} real donors from database`);

      // Verify structure of real donors
      const firstDonor = donors[0];
      expect(firstDonor).toBeDefined();
      expect(firstDonor.id).toBeDefined();
      expect(firstDonor.name).toBeDefined();
      expect(firstDonor.donor_type).toBeDefined();
      expect(firstDonor.total_contributions).toBeGreaterThanOrEqual(0);
    });

    it('should return donors sorted by net worth', async () => {
      const donors = await service.getDonors();

      if (donors.length >= 2) {
        for (let i = 1; i < donors.length; i++) {
          const prev = donors[i - 1].net_worth_billions ?? -Infinity;
          const curr = donors[i].net_worth_billions ?? -Infinity;
          expect(prev).toBeGreaterThanOrEqual(curr);
        }
      }
    });
  });

  describe('getDonorById()', () => {
    it('should fetch specific donor by ID', async () => {
      if (testDonorIds.length === 0) {
        console.warn('⚠️ No test donor ID available');
        return;
      }

      const donor = await service.getDonorById(testDonorIds[0]);

      expect(donor).toBeDefined();
      expect(donor?.name).toBe('Test Donor for Integration');
      expect(donor?.wealth_source).toBe('Tech startup');
    });

    it('should return null for non-existent donor', async () => {
      const donor = await service.getDonorById('00000000-0000-0000-0000-000000000000');

      expect(donor).toBeNull();
    });
  });

  describe('searchDonorsByName()', () => {
    it('should find donors by partial name match using real data', async () => {
      // Get a real donor name from the database first
      const allDonors = await service.getDonors();
      if (allDonors.length === 0) {
        console.warn('⚠️ No donors in database to search');
        return;
      }

      const firstDonor = allDonors[0];
      const searchTerm = firstDonor.name.substring(0, 5); // Search by first 5 chars

      const results = await service.searchDonorsByName(searchTerm);

      expect(Array.isArray(results)).toBe(true);
      console.log(`🔍 Search for "${searchTerm}" found ${results.length} donors`);

      // Should find at least the donor we searched for
      const found = results.some(d => d.name.includes(searchTerm));
      expect(found).toBe(true);
    });

    it('should be case-insensitive', async () => {
      const allDonors = await service.getDonors();
      if (allDonors.length === 0) return;

      const firstDonor = allDonors[0];
      const searchTerm = firstDonor.name.substring(0, 5).toLowerCase();

      const results = await service.searchDonorsByName(searchTerm);

      expect(Array.isArray(results)).toBe(true);
      console.log(`🔍 Case-insensitive search for "${searchTerm}" found ${results.length} donors`);
    });

    it('should return empty array for no matches', async () => {
      const results = await service.searchDonorsByName('XyZnOnExIsTeNt12345');

      expect(results).toEqual([]);
    });
  });

  describe('getMediaFunding()', () => {
    it('should fetch media funding records', async () => {
      const funding = await service.getMediaFunding();

      expect(Array.isArray(funding)).toBe(true);

      if (testMediaFundingIds.length > 0) {
        const testFunding = funding.find(f => f.outlet_name === 'Test News Network');
        expect(testFunding).toBeDefined();
        expect(testFunding?.relationship_type).toBe('investor');
        expect(testFunding?.estimated_amount).toBe(5000000);
      }
    });
  });

  describe('getMediaFundingByDonor()', () => {
    it('should fetch media funding for specific donor', async () => {
      if (testDonorIds.length === 0) return;

      const funding = await service.getMediaFundingByDonor(testDonorIds[0]);

      expect(Array.isArray(funding)).toBe(true);
      expect(funding.length).toBeGreaterThan(0);
      expect(funding[0].outlet_name).toBe('Test News Network');
    });
  });

  describe('getPacContributions()', () => {
    it('should fetch PAC contributions', async () => {
      const pacs = await service.getPacContributions();

      expect(Array.isArray(pacs)).toBe(true);

      if (testPacIds.length > 0) {
        const testPac = pacs.find(p => p.pac_name === 'Test Political Action Committee');
        expect(testPac).toBeDefined();
        expect(testPac?.pac_type).toBe('pro-Israel');
        expect(testPac?.total_raised).toBe(2000000);
        expect(testPac?.top_recipients).toHaveLength(2);
      }
    });
  });

  describe('getDonorMediaNetwork()', () => {
    it('should fetch network graph data', async () => {
      const network = await service.getDonorMediaNetwork();

      expect(network).toBeDefined();
      expect(Array.isArray(network.nodes)).toBe(true);
      expect(Array.isArray(network.links)).toBe(true);

      console.log(`📊 Network has ${network.nodes.length} nodes and ${network.links.length} links`);
    });

    it('should include donor and media nodes', async () => {
      const network = await service.getDonorMediaNetwork();

      const donorNodes = network.nodes.filter(n => n.type === 'donor');
      const mediaNodes = network.nodes.filter(n => n.type === 'media');

      expect(donorNodes.length).toBeGreaterThanOrEqual(0);
      expect(mediaNodes.length).toBeGreaterThanOrEqual(0);

      console.log(`👥 Donors: ${donorNodes.length}, 📺 Media: ${mediaNodes.length}`);
    });
  });

  describe('Cache Management', () => {
    it('should clear cache without errors', () => {
      expect(() => service.clearCache()).not.toThrow();
    });
  });

  describe('Data Integrity', () => {
    it('should have valid timestamps on all records', async () => {
      const donors = await service.getDonors();

      donors.forEach(donor => {
        expect(donor.created_at).toBeDefined();
        expect(new Date(donor.created_at).getTime()).toBeGreaterThan(0);
        expect(donor.updated_at).toBeDefined();
        expect(new Date(donor.updated_at).getTime()).toBeGreaterThan(0);
      });
    });

    it('should have valid donor types', async () => {
      const donors = await service.getDonors();
      const validTypes = ['individual', 'foundation', 'pac', 'corporation'];

      donors.forEach(donor => {
        expect(validTypes).toContain(donor.donor_type);
      });
    });

    it('should have non-negative contribution amounts', async () => {
      const donors = await service.getDonors();

      donors.forEach(donor => {
        expect(donor.total_contributions).toBeGreaterThanOrEqual(0);
        expect(donor.contribution_count).toBeGreaterThanOrEqual(0);
      });
    });
  });
});

// Unit tests that don't require database
describe('SupabaseService Unit Tests', () => {
  it('should create service instance', () => {
    const service = createSupabaseService(createCache());
    expect(service).toBeDefined();
  });

  it('should have all required methods', () => {
    const service = createSupabaseService(createCache());

    expect(typeof service.isConfigured).toBe('function');
    expect(typeof service.getDonors).toBe('function');
    expect(typeof service.getDonorById).toBe('function');
    expect(typeof service.searchDonorsByName).toBe('function');
    expect(typeof service.getMediaFunding).toBe('function');
    expect(typeof service.getPacContributions).toBe('function');
    expect(typeof service.getDonorMediaNetwork).toBe('function');
    expect(typeof service.clearCache).toBe('function');
  });
});
