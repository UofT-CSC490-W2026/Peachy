import { renderHook, act } from '@testing-library/react-native';
import { useInterests } from '@/hooks/use-interests';

describe('useInterests', () => {
  it('starts with empty selection when no initialInterests', async () => {
    const { result } = renderHook(() => useInterests());
    await act(async () => {});
    expect(result.current.selected.size).toBe(0);
  });

  it('starts with provided initialInterests', () => {
    const { result } = renderHook(() => useInterests(['running', 'yoga']));
    expect(result.current.selected.has('running')).toBe(true);
    expect(result.current.selected.has('yoga')).toBe(true);
  });

  it('toggle adds an interest', () => {
    const { result } = renderHook(() => useInterests());
    act(() => {
      result.current.toggle('running');
    });
    expect(result.current.selected.has('running')).toBe(true);
  });

  it('toggle removes an already-selected interest', () => {
    const { result } = renderHook(() => useInterests(['running']));
    act(() => {
      result.current.toggle('running');
    });
    expect(result.current.selected.has('running')).toBe(false);
  });

  it('loaded is true when initialInterests provided', () => {
    const { result } = renderHook(() => useInterests(['hiking']));
    expect(result.current.loaded).toBe(true);
  });

  it('can toggle multiple interests independently', () => {
    const { result } = renderHook(() => useInterests());
    act(() => {
      result.current.toggle('running');
      result.current.toggle('yoga');
    });
    expect(result.current.selected.has('running')).toBe(true);
    expect(result.current.selected.has('yoga')).toBe(true);
  });
});
