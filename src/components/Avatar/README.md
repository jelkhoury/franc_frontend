# 3D Avatar Implementation for Mock Interview

## Overview
This implementation adds a 3D avatar feature to the mock interview system, allowing users to interact with animated 3D characters instead of traditional video questions.

## Components

### Avatar Component (`src/components/Avatar/Avatar.js`)
- Loads 3D models using `useGLTF` from `@react-three/drei`
- Handles animations using `useAnimations`
- Supports multiple interviewer personalities
- Manages audio playback synchronized with animations

### Experience Component (`src/components/Screen/Screen.js`)
- Sets up the 3D scene environment
- Includes lighting, shadows, and background
- Shows loading indicators during AI processing

### UI Component (`src/components/UI/UIScreen.js`)
- Integrates the 3D canvas with React Three Fiber
- Handles user interaction and audio permissions
- Provides the main interface for avatar interaction

## Contexts

### InterviewContext (`src/contexts/InterviewContext/InterviewContext.js`)
- Manages interviewer selection and personality
- Stores current question state
- Provides interviewer configuration data

### ChatContext (`src/contexts/ChatContext/ChatContext.js`)
- Handles avatar interactions and AI responses
- Manages message flow and audio playback
- Simulates AI conversation for mock interviews

## Required 3D Assets

Place the following files in `src/assets/ai/`:

### Model Files (.glb)
- `default.glb` - Default interviewer model
- `jazzar-transformed.glb` - The Jazzar interviewer
- `taha-transformed.glb` - The Dev Lord interviewer
- `gheeda-transformed.glb` - The Recruitment General interviewer
- `nour-transformed.glb` - The Color Queen interviewer
- `jane-transformed.glb` - The Careerster interviewer

### Animation Files (.glb)
- `animations.glb` - Female animations
- `animations_man.glb` - Male animations

## Usage

1. Users can choose between "Start with Video" (traditional) or "Start with 3D Avatar"
2. When selecting avatar mode, users choose an interviewer personality
3. The avatar appears and speaks the interview questions
4. Users record their responses as before

## Integration

The feature is integrated into `MockInterviewQuestionsPage.js` with:
- Mode selection buttons
- Interviewer setup modal
- Conditional rendering based on selected mode
- Context providers wrapping the component

## Dependencies

- `@react-three/fiber` - React renderer for Three.js
- `@react-three/drei` - Useful helpers for react-three-fiber
- `three` - 3D graphics library
- `three-stdlib` - Three.js utilities

## Notes

- The current implementation uses mock audio data
- Real AI integration would require backend services for voice synthesis
- 3D models need to be provided in GLB format
- Animations should include "Idle" and "Talking" states
