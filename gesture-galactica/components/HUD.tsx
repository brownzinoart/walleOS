import React from 'react';
import { GameStats, GameState } from '../types';

interface HUDProps {
  stats: GameStats;
  gameState: GameState;
  onRestart: () => void;
  onStart: () => void;
  onTutorialComplete?: () => void;
  videoRef: React.RefObject<HTMLVideoElement>;
}

export const HUD: React.FC<HUDProps> = ({ stats, gameState, onRestart, onStart, onTutorialComplete, videoRef }) => {
  return (
    <>
      <style>{`
        @keyframes scan-horizontal {
          0%, 100% { transform: translateX(-20px); }
          50% { transform: translateX(20px); }
        }
        @keyframes fist-pump {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(0.9); }
        }
        @keyframes laser-fire {
          0% { height: 0; opacity: 0; bottom: 100%; }
          20% { height: 40px; opacity: 1; }
          100% { height: 60px; opacity: 0; bottom: 200%; }
        }
        .animate-hand-scan {
          animation: scan-horizontal 2.5s ease-in-out infinite;
        }
        .animate-fist-pump {
          animation: fist-pump 1.5s ease-in-out infinite;
        }
        .laser-beam {
          position: absolute;
          width: 4px;
          background: #ef4444;
          left: 50%;
          transform: translateX(-50%);
          animation: laser-fire 0.8s infinite;
          box-shadow: 0 0 10px #ef4444;
          border-radius: 99px;
        }
      `}</style>

      {/* Top HUD Bar */}
      <div className="absolute top-0 left-0 w-full p-2 sm:p-4 md:p-6 flex justify-between items-start pointer-events-none z-20">
        <div className="flex flex-col">
          <h1 className="text-sm sm:text-xl md:text-3xl font-bold text-cyan-400 font-['Orbitron'] tracking-wider drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]">
            GESTURE GALACTICA
          </h1>
          {gameState === GameState.PLAYING && (
            <div className="text-cyan-200/70 text-[10px] sm:text-sm mt-1 hidden sm:block">
              <span className="inline-block w-2 h-2 sm:w-3 sm:h-3 bg-cyan-500 rounded-full mr-1 sm:mr-2 animate-pulse"></span>
              Vision Active
            </div>
          )}
        </div>

        {gameState === GameState.PLAYING && (
          <div className="flex flex-col items-end gap-1 sm:gap-2">
            <div className="bg-black/40 backdrop-blur-md border border-cyan-500/30 px-2 sm:px-4 md:px-6 py-1 sm:py-2 rounded-lg">
               <span className="text-cyan-400 text-[10px] sm:text-sm uppercase tracking-widest mr-1 sm:mr-2">Score</span>
               <span className="text-lg sm:text-2xl md:text-3xl font-bold text-white font-['Orbitron']">{stats.score.toLocaleString()}</span>
            </div>

            <div className="flex items-center gap-1 sm:gap-2">
              <div className="w-20 sm:w-32 md:w-48 h-2 sm:h-3 md:h-4 bg-gray-800 rounded-full overflow-hidden border border-gray-700">
                <div
                  className={`h-full transition-all duration-300 ${stats.health > 50 ? 'bg-green-500' : stats.health > 20 ? 'bg-yellow-500' : 'bg-red-600'}`}
                  style={{ width: `${stats.health}%` }}
                />
              </div>
              <span className="text-white font-bold text-xs sm:text-sm md:text-base">{stats.health}%</span>
            </div>
          </div>
        )}
      </div>

      {/* Webcam Feed Preview (Only in Playing/Loading) - Hidden on small mobile */}
      {(gameState === GameState.PLAYING || gameState === GameState.LOADING) && (
        <div className="absolute bottom-2 left-2 sm:bottom-6 sm:left-6 z-20 pointer-events-none hidden sm:block">
          <div className="relative border-2 border-cyan-500/50 rounded-lg overflow-hidden w-24 h-18 sm:w-36 sm:h-27 md:w-48 md:h-36 bg-black/80 shadow-[0_0_20px_rgba(6,182,212,0.3)]">
             <div className="absolute inset-0 flex items-center justify-center text-cyan-500/20 font-bold text-[8px] sm:text-xs uppercase tracking-widest">
                Sensor Feed
             </div>
          </div>
          <div className="mt-1 sm:mt-2 text-[8px] sm:text-xs text-cyan-400/80 font-mono hidden md:block">
              PALM (FLY) | FIST (FIRE)
          </div>
        </div>
      )}

      {/* INIT Screen (Start Game) */}
      {gameState === GameState.INIT && (
        <div className="absolute inset-0 bg-black/90 z-50 flex items-center justify-center flex-col pointer-events-auto overflow-auto">
          <div className="max-w-2xl text-center px-4 py-8">
            <h1 className="text-3xl sm:text-5xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-cyan-300 to-cyan-700 font-['Orbitron'] mb-4 md:mb-6 drop-shadow-[0_0_20px_rgba(6,182,212,0.5)]">
              GESTURE GALACTICA
            </h1>
            <p className="text-cyan-100/80 text-base sm:text-xl md:text-2xl mb-8 md:mb-12 font-['Rajdhani'] font-light tracking-wide">
              Neural Interface Status: <span className="text-yellow-400 animate-pulse">STANDBY</span>
            </p>

            <button
              onClick={onStart}
              className="group relative px-6 sm:px-12 py-4 sm:py-6 bg-cyan-600 text-white font-['Orbitron'] font-bold text-base sm:text-2xl tracking-[0.1em] sm:tracking-[0.2em] transition-all duration-300 hover:scale-105 hover:bg-cyan-500"
            >
              <span className="absolute inset-0 w-full h-full border-2 border-cyan-400 blur-sm opacity-50 group-hover:opacity-100 transition-opacity"></span>
              INITIALIZE
            </button>
            <p className="mt-4 md:mt-6 text-gray-500 text-xs sm:text-sm font-mono">Requires Camera • Audio Enabled</p>
          </div>
        </div>
      )}

      {/* TUTORIAL Screen */}
      {gameState === GameState.TUTORIAL && (
        <div className="absolute inset-0 bg-black z-50 flex items-center justify-center pointer-events-auto overflow-auto">
          <div className="w-full max-w-5xl px-4 sm:px-8 py-6">
            <h2 className="text-xl sm:text-2xl md:text-4xl text-cyan-400 font-['Orbitron'] text-center mb-6 md:mb-12 tracking-widest border-b border-cyan-900/50 pb-4 md:pb-6">
              CALIBRATION
            </h2>

            <div className="grid grid-cols-2 gap-3 sm:gap-6 md:gap-12 mb-6 md:mb-12">
              {/* Navigation Tutorial */}
              <div className="bg-cyan-950/20 border border-cyan-500/30 rounded-lg sm:rounded-xl p-3 sm:p-6 md:p-8 flex flex-col items-center">
                <h3 className="text-sm sm:text-lg md:text-2xl text-cyan-200 font-bold mb-2 sm:mb-4 md:mb-6 font-['Orbitron'] tracking-wider">NAVIGATE</h3>

                {/* Image Container - White Background for visibility */}
                <div className="relative w-16 h-16 sm:w-32 sm:h-32 md:w-64 md:h-64 bg-white rounded-full border-2 sm:border-4 border-cyan-500 flex items-center justify-center mb-2 sm:mb-4 md:mb-6 overflow-hidden shadow-[0_0_15px_rgba(34,211,238,0.4)] sm:shadow-[0_0_25px_rgba(34,211,238,0.4)]">

                   {/* Animated Open Hand Image - Black on White */}
                   <div className="animate-hand-scan w-10 h-10 sm:w-20 sm:h-20 md:w-40 md:h-40">
                      <img
                        src="/gesture-galactica/palm.png"
                        alt="Open Palm Gesture"
                        className="w-full h-full object-contain"
                      />
                   </div>

                   <div className="absolute bottom-1 sm:bottom-4 text-cyan-800 font-bold text-[6px] sm:text-[10px] md:text-xs font-mono tracking-wider">CALIBRATING...</div>
                </div>

                <p className="text-gray-300 text-center font-mono text-[10px] sm:text-xs md:text-sm leading-relaxed">
                  <span className="text-cyan-400 font-bold">OPEN PALM</span> to steer
                </p>
              </div>

              {/* Weapons Tutorial */}
              <div className="bg-red-950/10 border border-red-500/30 rounded-lg sm:rounded-xl p-3 sm:p-6 md:p-8 flex flex-col items-center">
                <h3 className="text-sm sm:text-lg md:text-2xl text-red-300 font-bold mb-2 sm:mb-4 md:mb-6 font-['Orbitron'] tracking-wider">FIRE</h3>

                {/* Image Container - White Background for visibility */}
                <div className="relative w-16 h-16 sm:w-32 sm:h-32 md:w-64 md:h-64 bg-white rounded-full border-2 sm:border-4 border-red-500 flex items-center justify-center mb-2 sm:mb-4 md:mb-6 overflow-hidden shadow-[0_0_15px_rgba(239,68,68,0.4)] sm:shadow-[0_0_25px_rgba(239,68,68,0.4)]">

                   {/* Laser Beams (still visible on white) */}
                   <div className="absolute bottom-1/2 left-0 w-full h-full pointer-events-none hidden sm:block">
                      <div className="laser-beam"></div>
                      <div className="laser-beam" style={{ animationDelay: '0.4s', height: '30px' }}></div>
                   </div>

                   {/* Animated Fist Image - Black on White */}
                   <div className="animate-fist-pump relative z-10 w-10 h-10 sm:w-20 sm:h-20 md:w-40 md:h-40">
                       <img
                        src="/gesture-galactica/fist.png"
                        alt="Closed Fist Gesture"
                        className="w-full h-full object-contain"
                      />
                   </div>

                   <div className="absolute bottom-1 sm:bottom-4 text-red-800 font-bold text-[6px] sm:text-[10px] md:text-xs font-mono tracking-wider">WEAPONS HOT</div>
                </div>

                <p className="text-gray-300 text-center font-mono text-[10px] sm:text-xs md:text-sm leading-relaxed">
                  <span className="text-red-400 font-bold">CLOSED FIST</span> to shoot
                </p>
              </div>
            </div>

            <div className="flex justify-center">
              <button
                onClick={onTutorialComplete}
                className="px-4 sm:px-8 md:px-10 py-3 sm:py-4 bg-cyan-700 hover:bg-cyan-600 text-white font-['Orbitron'] font-bold text-sm sm:text-base md:text-xl tracking-wider sm:tracking-widest rounded transition-all duration-200 shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:shadow-[0_0_40px_rgba(6,182,212,0.6)]"
              >
                START
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading Screen */}
      {gameState === GameState.LOADING && (
        <div className="absolute inset-0 bg-black/95 z-50 flex items-center justify-center flex-col">
          <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-6"></div>
          <h2 className="text-2xl text-cyan-400 font-['Orbitron'] animate-pulse">ESTABLISHING NEURAL LINK...</h2>
          <p className="text-gray-400 mt-2 font-mono">Please allow camera access</p>
        </div>
      )}

      {/* Game Over Screen */}
      {gameState === GameState.GAME_OVER && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center flex-col pointer-events-auto px-4">
          <h2 className="text-3xl sm:text-5xl md:text-6xl text-red-500 font-['Orbitron'] font-black mb-2 sm:mb-4 drop-shadow-[0_0_30px_rgba(239,68,68,0.6)] text-center">MISSION FAILED</h2>
          <div className="text-lg sm:text-xl md:text-2xl text-white mb-6 sm:mb-8 font-mono">Score: <span className="text-cyan-400">{stats.score.toLocaleString()}</span></div>

          <button
            onClick={onRestart}
            className="group relative px-6 sm:px-8 py-3 sm:py-4 bg-cyan-900/30 border border-cyan-500 text-cyan-400 font-['Orbitron'] font-bold text-base sm:text-xl tracking-wider sm:tracking-widest hover:bg-cyan-500 hover:text-black transition-all duration-300"
          >
            <span className="absolute inset-0 w-full h-full bg-cyan-400/20 blur-lg group-hover:blur-xl transition-all"></span>
            <span className="relative">RESTART</span>
          </button>
        </div>
      )}
    </>
  );
};