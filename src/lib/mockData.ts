import { Homefolio, Property, Agent } from '@/types/homefolio';

export const mockAgent: Agent = {
  id: '1',
  name: 'Sarah Mitchell',
  email: 'sarah@premierhomes.com',
  phone: '(505) 555-0123',
  company: 'Premier Homes Realty',
};

export const mockProperties: Property[] = [
  {
    id: '1',
    address: '4521 Mesa Vista Drive',
    city: 'Albuquerque',
    state: 'NM',
    zipCode: '87111',
    price: 525000,
    beds: 4,
    baths: 3,
    sqft: 2450,
    photos: [
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80',
    ],
    documents: [
      { id: '1', name: 'MLS Listing.pdf', type: 'mls', url: '#', uploadedAt: new Date() },
      { id: '2', name: 'Property Disclosure.pdf', type: 'disclosure', url: '#', uploadedAt: new Date() },
    ],
    showingNotes: [
      {
        id: '1',
        date: new Date('2024-01-15'),
        notes: 'Great natural light, spacious backyard. Client loved the kitchen.',
      },
    ],
    status: 'active',
    order: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '2',
    address: '892 Sandia Heights Circle',
    city: 'Albuquerque',
    state: 'NM',
    zipCode: '87122',
    price: 685000,
    beds: 5,
    baths: 4,
    sqft: 3200,
    photos: [
      'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800&q=80',
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&q=80',
    ],
    documents: [
      { id: '3', name: 'MLS Listing.pdf', type: 'mls', url: '#', uploadedAt: new Date() },
    ],
    showingNotes: [],
    status: 'active',
    order: 2,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '3',
    address: '156 Old Town Plaza',
    city: 'Albuquerque',
    state: 'NM',
    zipCode: '87104',
    price: 425000,
    beds: 3,
    baths: 2,
    sqft: 1850,
    photos: [
      'https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=800&q=80',
      'https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=800&q=80',
    ],
    documents: [],
    showingNotes: [
      {
        id: '2',
        date: new Date('2024-01-18'),
        notes: 'Historic charm, needs some updates. Client interested but wants to see more.',
      },
    ],
    status: 'active',
    order: 3,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export const mockHomefolios: Homefolio[] = [
  {
    id: '1',
    clientName: 'Michael & Jessica Torres',
    clientNickname: 'The Torres Family',
    clientType: 'buyer',
    privateLink: 'torres-family-abc123',
    properties: mockProperties,
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date(),
  },
  {
    id: '2',
    clientName: 'Robert Chen',
    clientType: 'investor',
    privateLink: 'rchen-investments-xyz789',
    properties: mockProperties.slice(0, 2),
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date(),
  },
  {
    id: '3',
    clientName: 'Amanda Williams',
    clientType: 'buyer',
    privateLink: 'amanda-w-def456',
    properties: mockProperties.slice(1),
    createdAt: new Date('2024-01-12'),
    updatedAt: new Date(),
  },
];

export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(price);
};

export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
};
