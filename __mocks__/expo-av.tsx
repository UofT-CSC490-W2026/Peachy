// Mock for expo-av — native audio module unavailable in Jest
const mockRecording = {
  stopAndUnloadAsync: jest.fn().mockResolvedValue(undefined),
  getURI: jest.fn().mockReturnValue('file://recording.m4a'),
};

export const Audio = {
  Recording: {
    createAsync: jest.fn().mockResolvedValue({ recording: mockRecording }),
  },
  RecordingOptionsPresets: {
    HIGH_QUALITY: {},
  },
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  setAudioModeAsync: jest.fn().mockResolvedValue(undefined),
};
