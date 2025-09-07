# Audio Files Directory

This directory should contain audio files for the avatar's speech.

## Required Files

Place your audio files in this directory (`public/assets/audio/`):

### Sample Audio Files (you can add these):
- `welcome.m4a` - Welcome message
- `question1.m4a` - First interview question
- `question2.m4a` - Second interview question
- `question3.m4a` - Third interview question
- `question4.m4a` - Fourth interview question
- `question5.m4a` - Fifth interview question
- `question6.m4a` - Sixth interview question
- `goodbye.m4a` - Closing message

## File Requirements

- **Format**: M4A audio files (or MP4, MP3, WAV)
- **Quality**: Clear, professional voice recordings
- **Duration**: 5-30 seconds per file
- **Naming**: Use descriptive names (e.g., `welcome.m4a`, `question1.m4a`)
- **Size**: Optimized for web (under 5MB per file recommended)

## Usage

The avatar system will automatically:
1. Load audio files when needed
2. Play them synchronized with talking animations
3. Fall back to text-to-speech if audio files are missing

## File Structure

```
public/
└── assets/
    └── audio/
        ├── welcome.m4a
        ├── question1.m4a
        ├── question2.m4a
        ├── question3.m4a
        ├── question4.m4a
        ├── question5.m4a
        ├── question6.m4a
        └── goodbye.m4a
```

## Integration

The system automatically detects and uses audio files when available. If a file is missing, it falls back to text-to-speech for that specific message.
