# VS Code Web Clone

A browser-based replica of the Visual Studio Code interface built with React, Vite, and Tailwind CSS. It is designed to act as a stealthy cheat sheet platform that looks identical to a local code editor environment.

## Features

* Integrated File Explorer with full CRUD operations (Create, Rename, Delete).
* Monaco Editor integration for accurate syntax highlighting.
* Native keyboard shortcuts support (Ctrl+S, Alt+W, Ctrl+B).
* Local Storage persistence for the entire workspace and file tree.
* Simulated integrated terminal with basic bash commands.
* Custom VS Code authentic language icons (Python, Java, HTML, JS).
* Fullscreen toggle functionality mimicking desktop applications.

## Development Setup

1. Install dependencies:
npm install

2. Start the development server:
npm run dev

3. Build for production:
npm run lint && npm run build

## File System Generation

The workspace files are loaded dynamically. To update the file tree structure, run the generator script from the root directory:
python generate_fs.py

This will scan the target directories and update the data configuration file.
