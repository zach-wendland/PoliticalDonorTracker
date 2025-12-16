// UI constants for the Political Donor Tracker application

import type { LucideIcon } from 'lucide-react';
import {
  DollarSign,
  Eye,
  UserCheck,
  Map,
  Moon,
  Search,
  Globe2,
  Scale,
  Database,
  BarChart3,
  Network,
  Route,
} from 'lucide-react';

/**
 * Icon mapping for dynamic icon rendering based on string names
 * Used primarily in DashboardTab for category icons
 */
export const ICON_MAP: Record<string, LucideIcon> = {
  DollarSign,
  Eye,
  UserCheck,
  Map,
  Moon,
  Search,
  Globe2,
  Scale,
  Database,
};

/**
 * Color mapping for source categories in charts
 * Keys correspond to SourceCategory enum values
 */
export const CATEGORY_COLORS: Record<string, string> = {
  FEC_FEDERAL: '#10b981',        // emerald-500
  OPENSECRETS: '#3b82f6',        // blue-500
  LOBBYIST_DISCLOSURE: '#f59e0b', // amber-500
  STATE_FINANCE: '#8b5cf6',      // violet-500
  NONPROFIT_DARK_MONEY: '#6366f1', // indigo-500
  WATCHDOG_INVESTIGATIVE: '#ec4899', // pink-500
  FOREIGN_INFLUENCE: '#14b8a6',  // teal-500
  ETHICS_COMPLIANCE: '#f97316',  // orange-500
};

/**
 * Tab view identifier type
 */
export type TabView = 'dashboard' | 'money-trail' | 'network';

/**
 * Tab configuration interface
 */
export interface TabConfig {
  id: TabView;
  label: string;
  icon: LucideIcon;
}

/**
 * Application tab definitions for main navigation
 */
export const TABS: TabConfig[] = [
  { id: 'dashboard', label: 'Intel Overview', icon: BarChart3 },
  { id: 'money-trail', label: 'Money Trail', icon: Route },
  { id: 'network', label: 'Power Connections', icon: Network },
];
