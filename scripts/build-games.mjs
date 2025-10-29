#!/usr/bin/env node

import { execSync } from 'child_process';
import { mkdirSync, existsSync, writeFileSync, readFileSync } from 'fs';
import { resolve, join } from 'path';

const gamesDir = resolve('public/playground/games');
const games = [
  'word-seach'
];

async function buildGames() {
  console.log('🎮 Building playground games...');

  for (const game of games) {
    const gamePath = join(gamesDir, game);
    const srcPath = join(gamePath, 'src');
    const distPath = join(gamePath, 'dist');
    
    // Create dist directory
    if (!existsSync(distPath)) {
      mkdirSync(distPath, { recursive: true });
    }
    
    try {
      if (game === 'word-seach') {
        // Copy existing HTML/CSS/JS files and inline them
        const htmlContent = readFileSync(join(srcPath, 'index.html'), 'utf8');
        const cssContent = readFileSync(join(srcPath, 'style.css'), 'utf8');
        const jsContent = readFileSync(join(srcPath, 'script.js'), 'utf8');
        
        // Extract body content from existing HTML
        const bodyMatch = htmlContent.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
        const bodyContent = bodyMatch ? bodyMatch[1] : htmlContent;
        
        // Create final HTML with inlined CSS and JS
        const finalHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Word Search Game</title>
    <!-- External Dependencies -->
    <link href="https://fonts.googleapis.com/css?family=Fresca&display=swap" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css?family=Happy+Monkey&display=swap" rel="stylesheet">
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    <style>
    ${cssContent}
    </style>
</head>
<body>
    ${bodyContent}
    <script>
    ${jsContent}
    </script>
</body>
</html>`;
        
        writeFileSync(join(distPath, 'index.html'), finalHtml);
      }
      console.log(`✅ Built ${game}`);
    } catch (error) {
      console.error(`❌ Failed to build ${game}:`, error.message);
      // Create a fallback HTML file
      const fallbackHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${game.replace(/-/g, ' ')}</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            text-align: center; 
            padding: 50px;
            background: #1a1a1a;
            color: #00ff88;
        }
        .game-container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            border: 2px solid #00ff88;
            border-radius: 10px;
            background: #2a2a2a;
        }
        h1 { color: #00ff88; margin-bottom: 20px; }
        p { color: #cccccc; line-height: 1.6; }
        .coming-soon {
            font-size: 24px;
            margin: 30px 0;
            color: #ff6b6b;
        }
    </style>
</head>
<body>
    <div class="game-container">
        <h1>${game.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</h1>
        <div class="coming-soon">🎮 Game Coming Soon!</div>
        <p>This interactive game is being prepared for deployment.</p>
        <p>Please check back later or navigate back to the playground.</p>
        <button onclick="history.back()" style="
            background: #00ff88; 
            color: #1a1a1a; 
            border: none; 
            padding: 10px 20px; 
            border-radius: 5px; 
            cursor: pointer; 
            margin-top: 20px;
            font-weight: bold;
        ">Go Back</button>
    </div>
</body>
</html>`;
      
      writeFileSync(join(distPath, 'index.html'), fallbackHtml);
      console.log(`⚠️  Created fallback for ${game}`);
    }
  }

  console.log('🎮 Games build complete!');
}

buildGames().catch(console.error);
