export const GAME_CONFIG = {
  PLAYER_SPEED_LERP: 0.1,
  PLAYER_TILT_FACTOR: 0.5,
  WORLD_WIDTH: 16,
  STAR_COUNT: 2000,
  ENEMY_SPAWN_RATE: 60, // Frames
  BULLET_SPEED: 1.0,
  GAME_SPEED_BASE: 0.5,
  CAMERA_Z: 10,
  START_HEALTH: 100
};

export const AI_CONFIG = {
  VISION_WASM_URL: "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.8/wasm",
  MODEL_ASSET_PATH: "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task"
};