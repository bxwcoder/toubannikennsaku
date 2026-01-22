export interface Hospital {
  name: string;
  address?: string;
  phone?: string;
  department?: string;
  hours?: string;
  latitude?: number;
  longitude?: number;
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface SearchResult {
  hospitals: Hospital[];
  groundingSources: GroundingSource[];
  summary: string;
}

export interface Prefecture {
  id: number;
  name: string;
  region: string;
}

export enum AppStatus {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}