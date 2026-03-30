export interface InterestTag {
  id: string;
  label: string;
}

export interface InterestCategory {
  id: string;
  label: string;
  tags: InterestTag[];
}

export const INTEREST_CATEGORIES: InterestCategory[] = [
  {
    id: 'active',
    label: 'Active',
    tags: [
      { id: 'running', label: 'Running' },
      { id: 'cycling', label: 'Cycling' },
      { id: 'swimming', label: 'Swimming' },
      { id: 'gym', label: 'Gym' },
      { id: 'yoga', label: 'Yoga' },
      { id: 'team_sports', label: 'Team Sports' },
    ],
  },
  {
    id: 'outdoors',
    label: 'Outdoors',
    tags: [
      { id: 'hiking', label: 'Hiking' },
      { id: 'camping', label: 'Camping' },
      { id: 'rock_climbing', label: 'Rock Climbing' },
      { id: 'gardening', label: 'Gardening' },
      { id: 'beach', label: 'Beach' },
    ],
  },
  {
    id: 'creative',
    label: 'Creative',
    tags: [
      { id: 'photography', label: 'Photography' },
      { id: 'music', label: 'Music' },
      { id: 'art', label: 'Art' },
      { id: 'writing', label: 'Writing' },
      { id: 'dancing', label: 'Dancing' },
    ],
  },
  {
    id: 'food',
    label: 'Food & Drink',
    tags: [
      { id: 'cooking', label: 'Cooking' },
      { id: 'baking', label: 'Baking' },
      { id: 'coffee', label: 'Coffee' },
      { id: 'foodie', label: 'Foodie' },
    ],
  },
  {
    id: 'wellness',
    label: 'Wellness',
    tags: [
      { id: 'meditation', label: 'Meditation' },
      { id: 'reading', label: 'Reading' },
      { id: 'journaling', label: 'Journaling' },
    ],
  },
  {
    id: 'social',
    label: 'Social & Culture',
    tags: [
      { id: 'travel', label: 'Travel' },
      { id: 'gaming', label: 'Gaming' },
      { id: 'movies', label: 'Movies' },
      { id: 'volunteering', label: 'Volunteering' },
    ],
  },
];

export const ALL_TAGS = INTEREST_CATEGORIES.flatMap((c) => c.tags);
