export type ClientType = 'buyer' | 'seller' | 'investor';

export interface Property {
  id: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  price: number;
  beds: number;
  baths: number;
  sqft: number;
  photos: string[];
  documents: Document[];
  showingNotes: ShowingNote[];
  status: 'active' | 'archived';
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Document {
  id: string;
  name: string;
  type: 'mls' | 'disclosure' | 'other';
  url: string;
  uploadedAt: Date;
}

export interface ShowingNote {
  id: string;
  date: Date;
  notes: string;
  agentNotes?: string;
  clientFeedback?: string;
}

export interface Homefolio {
  id: string;
  clientName: string;
  clientNickname?: string;
  clientType: ClientType;
  privateLink: string;
  properties: Property[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Agent {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  avatar?: string;
}
