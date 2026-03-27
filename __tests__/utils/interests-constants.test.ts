import { INTEREST_CATEGORIES, ALL_TAGS } from '@/constants/interests';

describe('INTEREST_CATEGORIES', () => {
  it('has 6 categories', () => {
    expect(INTEREST_CATEGORIES).toHaveLength(6);
  });

  it('each category has id, label, and tags', () => {
    for (const cat of INTEREST_CATEGORIES) {
      expect(cat.id).toBeTruthy();
      expect(cat.label).toBeTruthy();
      expect(Array.isArray(cat.tags)).toBe(true);
      expect(cat.tags.length).toBeGreaterThan(0);
    }
  });

  it('each tag has id and label', () => {
    for (const cat of INTEREST_CATEGORIES) {
      for (const tag of cat.tags) {
        expect(tag.id).toBeTruthy();
        expect(tag.label).toBeTruthy();
      }
    }
  });

  it('contains expected categories', () => {
    const ids = INTEREST_CATEGORIES.map(c => c.id);
    expect(ids).toContain('active');
    expect(ids).toContain('creative');
    expect(ids).toContain('wellness');
  });
});

describe('ALL_TAGS', () => {
  it('is a flat list of all tags across all categories', () => {
    const total = INTEREST_CATEGORIES.reduce((sum, c) => sum + c.tags.length, 0);
    expect(ALL_TAGS).toHaveLength(total);
  });

  it('contains tags from every category', () => {
    const tagIds = ALL_TAGS.map(t => t.id);
    expect(tagIds).toContain('running');
    expect(tagIds).toContain('photography');
    expect(tagIds).toContain('meditation');
    expect(tagIds).toContain('travel');
  });

  it('has no duplicate tag ids', () => {
    const ids = ALL_TAGS.map(t => t.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });
});
