export interface GameStats {
  score: number;
  health: number;
  isGameOver: boolean;
}

export enum GameState {
  INIT = 'INIT',
  TUTORIAL = 'TUTORIAL',
  LOADING = 'LOADING',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER'
}

export interface EnemyData {
  mesh: any; // THREE.Mesh but using any to avoid strict type coupling in simple types file
  speed: number;
  id: string;
}

export interface BulletData {
  mesh: any;
  id: string;
}