# 3D Assets Directory

This directory contains the 3D model files for the avatar system.

## Required Files

### Model Files (.glb format)
Place these files directly in this directory (`public/assets/ai/`):

- `default.glb` - Default interviewer model
- `jazzar-transformed.glb` - The Jazzar interviewer
- `taha-transformed.glb` - The Dev Lord interviewer  
- `gheeda-transformed.glb` - The Recruitment General interviewer
- `nour-transformed.glb` - The Color Queen interviewer
- `jane-transformed.glb` - The Careerster interviewer

### Animation Files (.glb format)
- `animations.glb` - Female animations (Idle, Talking, etc.)
- `animations_man.glb` - Male animations (Idle, Talking, etc.)

## Model Requirements

- Models should be in GLB format
- Include skeleton/armature for animations
- Optimized for web (under 10MB recommended)
- Include materials and textures embedded

## Animation Requirements

- Must include "Idle" animation
- Must include "Talking" animation
- Animations should be compatible with the model skeletons
- Use consistent naming conventions

## Usage

These files are loaded by the Avatar component using `useGLTF` from `@react-three/drei`.
The system automatically selects the appropriate model and animation files based on the selected interviewer personality.

## Important Notes

- Files must be placed in `public/assets/ai/` (not `src/assets/ai/`)
- The browser accesses these files directly via HTTP
- Make sure all GLB files are properly formatted and not corrupted
- Test each file individually to ensure they load correctly
