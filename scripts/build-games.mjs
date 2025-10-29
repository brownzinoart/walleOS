#!/usr/bin/env node

import { execSync } from 'child_process';
import { mkdirSync, existsSync, writeFileSync, readFileSync } from 'fs';
import { resolve, join } from 'path';

const gamesDir = resolve('public/playground/games');
const games = [
  'simon-says-game-in-css-jquery',
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
      if (game === 'simon-says-game-in-css-jquery') {
        // Compile SCSS to CSS using sass package
        const { compileString } = await import('sass');
        const jsContent = readFileSync(join(srcPath, 'script.js'), 'utf8');
        const scssContent = readFileSync(join(srcPath, 'style.scss'), 'utf8');

        // Define tint() function (Compass legacy function)
        // tint() mixes a color with white
        const tintFunction = `
@function tint($color, $percentage) {
  @return mix(white, $color, $percentage);
}
`;

        // Compile SCSS to CSS with tint() function prepended
        const result = compileString(tintFunction + scssContent, {
          style: 'expanded',
          sourceMap: false
        });

        const cssContent = result.css;

        // Create HTML with compiled CSS
        const finalHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Simon Says Game</title>
    <!-- External Dependencies -->
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap-switch/3.3.4/css/bootstrap3/bootstrap-switch.min.css">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/bootstrap-switch/3.3.4/js/bootstrap-switch.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/buzz/1.2.1/buzz.min.js"></script>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div id="case" class="center-block">
        <div id="control">
            <div id="brand">Sl<span class="large">m</span>O<span class="large">n</span><span class="tiny">®</span>
                <div class="detail"></div>
            </div>
            <div id="buttons">
                <div class="row">
                    <div class="col display">
                        <div id="display">
                            <div id="number">888</div>
                        </div>
                        <div class="label">COUNT</div>
                    </div>
                    <div class="col start">
                        <div id="start" class="roundbtn btn"></div>
                        <div class="label">START</div>
                    </div>
                    <div class="col strict">
                        <div id="strictlight" class="center-block"></div>
                        <div id="strict" class="roundbtn btn"></div>
                        <div class="label">STRICT</div>
                    </div>
                </div>
                <div class="row power">
                    <input type="checkbox" name="switch" class="switch">
                </div>
            </div>
        </div>
        <div id="green" class="playbtn btn">
            <div class="lightbulb"></div>
        </div>
        <div id="red" class="playbtn btn">
            <div class="lightbulb"></div>
        </div>
        <div id="yellow" class="playbtn btn">
            <div class="lightbulb"></div>
        </div>
        <div id="blue" class="playbtn btn">
            <div class="lightbulb"></div>
        </div>
    </div>
    <script>
    ${jsContent}
    </script>
</body>
</html>`;

        writeFileSync(join(distPath, 'index.html'), finalHtml);
        writeFileSync(join(distPath, 'style.css'), cssContent);

      } else if (game === 'word-seach') {
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