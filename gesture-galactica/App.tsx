import React, { useState, useCallback } from 'react';
import { SpaceShooter } from './components/SpaceShooter';
import { HUD } from './components/HUD';
import { GameState, GameStats } from './types';
import { GAME_CONFIG } from './constants';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.INIT);
  const [stats, setStats] = useState<GameStats>({
    score: 0,
    health: GAME_CONFIG.START_HEALTH,
    isGameOver: false
  });

  const [gameKey, setGameKey] = useState(0);

  const handleStatsUpdate = useCallback((newStats: GameStats) => {
    setStats(prev => {
        if (prev.score !== newStats.score || prev.health !== newStats.health) {
            return newStats;
        }
        return prev;
    });
  }, []);

  const handleGameStateChange = useCallback((newState: GameState) => {
    setGameState(newState);
  }, []);

  // INIT -> TUTORIAL
  const handleStart = () => {
    setGameState(GameState.TUTORIAL);
  };

  // TUTORIAL -> LOADING
  const handleTutorialComplete = () => {
    setGameState(GameState.LOADING);
  };

  const handleRestart = () => {
    setGameKey(k => k + 1);
    setStats({
        score: 0,
        health: GAME_CONFIG.START_HEALTH,
        isGameOver: false
    });
    setGameState(GameState.LOADING);
  };

  const videoRef = React.useRef<HTMLVideoElement>(null);

  // Determine if the game engine should be active
  const isGameActive = gameState === GameState.LOADING || gameState === GameState.PLAYING || gameState === GameState.GAME_OVER;

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black selection:bg-cyan-500/30">
      {/* 
        Only render the SpaceShooter when we are ready to load the engine/camera.
        This prevents camera permissions from popping up during the Tutorial.
      */}
      {isGameActive && (
        <SpaceShooter 
            key={gameKey}
            gameState={gameState}
            onStatsUpdate={handleStatsUpdate} 
            onGameStateChange={handleGameStateChange} 
        />
      )}
      
      <HUD 
        stats={stats} 
        gameState={gameState} 
        onRestart={handleRestart}
        onStart={handleStart}
        onTutorialComplete={handleTutorialComplete}
        videoRef={videoRef}
      />
    </div>
  );
};

export default App;