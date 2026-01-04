import { vi } from 'vitest';
import type { DMResponseType, BackstoryResponseType } from '@/lib/game/schemas';

// Mock DM Response
export const mockDMResponse: DMResponseType = {
  narrative: 'You enter a dimly lit tavern. The smell of ale and smoke fills your nostrils.',
  actions: [
    'Approach the bartender',
    'Look for a seat in the corner',
    'Scan the room for suspicious characters',
  ],
  newCharacter: null,
  newScene: null,
  stateChanges: null,
  combat: null,
};

export const mockDMResponseWithCharacter: DMResponseType = {
  narrative: 'A hooded figure approaches you from the shadows.',
  actions: ['Draw your weapon', 'Greet them cautiously', 'Wait and observe'],
  newCharacter: {
    name: 'Mysterious Stranger',
    description: 'A cloaked figure with piercing blue eyes and a silver brooch',
  },
  newScene: null,
  stateChanges: null,
  combat: null,
};

export const mockDMResponseWithCombat: DMResponseType = {
  narrative: 'The goblin snarls and lunges at you with its rusty dagger!',
  actions: ['Attack with your weapon', 'Dodge and counterattack', 'Attempt to flee'],
  newCharacter: null,
  newScene: null,
  stateChanges: { hpDelta: -3 },
  combat: {
    inCombat: true,
    enemies: [
      {
        id: 'goblin-1',
        name: 'Goblin Scout',
        description: 'A small, green-skinned creature with sharp teeth',
        hp: { current: 7, max: 7 },
      },
    ],
    turnOrder: ['Player', 'Goblin Scout'],
    currentTurn: 'Player',
  },
};

// Mock Backstory Response
export const mockBackstoryResponse: BackstoryResponseType = {
  backstory: 'Born in the mountain halls of Ironforge, you learned the ways of combat from your father.',
  startingScene: 'You stand at the entrance of a mysterious cave, your torch flickering in the cold wind.',
  firstActions: [
    'Enter the cave cautiously',
    'Search for tracks around the entrance',
    'Light a second torch for better visibility',
  ],
};

// Mock Image Response (base64)
export const mockImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

// Mock Audio Response (base64)
export const mockAudioBase64 = 'UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';

// Mock functions
export const mockGenerateDMResponse = vi.fn().mockResolvedValue(mockDMResponse);
export const mockGenerateBackstory = vi.fn().mockResolvedValue(mockBackstoryResponse);
export const mockGeneratePortrait = vi.fn().mockResolvedValue(mockImageBase64);
export const mockGenerateNPCPortrait = vi.fn().mockResolvedValue(mockImageBase64);
export const mockGenerateSceneSprite = vi.fn().mockResolvedValue(mockImageBase64);
export const mockGenerateNarration = vi.fn().mockResolvedValue(mockAudioBase64);

// Reset all mocks
export function resetGeminiMocks() {
  mockGenerateDMResponse.mockClear().mockResolvedValue(mockDMResponse);
  mockGenerateBackstory.mockClear().mockResolvedValue(mockBackstoryResponse);
  mockGeneratePortrait.mockClear().mockResolvedValue(mockImageBase64);
  mockGenerateNPCPortrait.mockClear().mockResolvedValue(mockImageBase64);
  mockGenerateSceneSprite.mockClear().mockResolvedValue(mockImageBase64);
  mockGenerateNarration.mockClear().mockResolvedValue(mockAudioBase64);
}

// Mock Gemini AI client for lower-level mocking
export const mockAiModelsGenerateContent = vi.fn().mockResolvedValue({
  text: JSON.stringify(mockDMResponse),
  candidates: [
    {
      content: {
        parts: [
          { text: JSON.stringify(mockDMResponse) },
          { inlineData: { data: mockImageBase64, mimeType: 'image/png' } },
        ],
      },
    },
  ],
});

export const mockAi = {
  models: {
    generateContent: mockAiModelsGenerateContent,
  },
};
