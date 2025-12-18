# Audio Visualizer

[![GitHub stars](https://img.shields.io/github/stars/adivrskic/audio-visualizer?style=flat-square)](https://github.com/adivrskic/audio-visualizer/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/adivrskic/audio-visualizer?style=flat-square)](https://github.com/adivrskic/audio-visualizer/network)
[![License](https://img.shields.io/github/license/adivrskic/audio-visualizer?style=flat-square)](LICENSE)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black)](https://github.com/adivrskic/audio-visualizer)
[![SCSS](https://img.shields.io/badge/SCSS-CC6699?style=flat-square&logo=sass&logoColor=white)](https://github.com/adivrskic/audio-visualizer)
[![React](https://img.shields.io/badge/React-61DAFB?style=flat-square&logo=react&logoColor=black)](https://github.com/adivrskic/audio-visualizer)

## Features

- **3D Audio Visualization**: Real-time 3D visualization of audio frequency data using Three.js
- **Interactive Controls**: User-friendly interface with play/pause, volume control, and visualization settings
- **Post-Processing Effects**: Advanced visual effects powered by React Three Postprocessing
- **Multiple Visualization Modes**: Various visualization styles and patterns to enhance the audio experience
- **Screenshot Capability**: Export visualizations as images using html2canvas
- **Responsive Design**: Optimized for different screen sizes and devices
- **Modern UI**: Clean interface with Lucide React icons

## Installation

1. Clone the repository:
```bash
git clone https://github.com/adivrskic/audio-visualizer.git
cd audio-visualizer
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

The application will open in your browser at `http://localhost:3000`.

## Usage

### Basic Usage

```javascript
// Start the visualizer with an audio file
const audioFile = new File(['audio-data'], 'song.mp3', { type: 'audio/mp3' });
visualizer.loadAudio(audioFile);
visualizer.play();
```

### Taking Screenshots

```javascript
import html2canvas from 'html2canvas';

// Capture the current visualization
const captureVisualization = () => {
  const canvas = document.querySelector('canvas');
  html2canvas(canvas).then(canvas => {
    const link = document.createElement('a');
    link.download = 'visualization.png';
    link.href = canvas.toDataURL();
    link.click();
  });
};
```

### Custom Visualization Settings

```javascript
// Configure visualization parameters
const visualizationConfig = {
  fftSize: 2048,
  smoothingTimeConstant: 0.8,
  minDecibels: -90,
  maxDecibels: -10
};
```

## Tech Stack

### Core Dependencies
- **React** (^18.2.0) - UI framework
- **Three.js** (^0.182.0) - 3D graphics library
- **@react-three/fiber** (^8.15.24) - React renderer for Three.js
- **@react-three/drei** (^9.101.3) - Useful helpers for React Three Fiber
- **@react-three/postprocessing** (^2.19.1) - Post-processing effects

### Additional Libraries
- **postprocessing** (^6.38.0) - Post-processing library for Three.js
- **html2canvas** (^1.4.1) - Screenshot functionality
- **lucide-react** (^0.344.0) - Modern icon library
- **sass** (^1.96.0) - CSS preprocessor

### Development Tools
- **react-scripts** (5.0.1) - Build tools and configuration

## Contributing

We welcome contributions to the Audio Visualizer project! Here's how you can help:

### Getting Started
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add some amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines
- Follow the existing code style and conventions
- Write clear, descriptive commit messages
- Test your changes thoroughly before submitting
- Update documentation as needed
- Ensure all tests pass: `npm test`

### Reporting Issues
- Use the GitHub Issues tab to report bugs or request features
- Provide detailed information about the issue
- Include steps to reproduce the problem
- Specify your browser and operating system

### Code Style
- Use ES6+ JavaScript features
- Follow React best practices and hooks patterns
- Use meaningful variable and function names
- Comment complex logic and algorithms

## License

This project is currently unlicensed. Please contact the repository owner for information about usage rights and permissions.