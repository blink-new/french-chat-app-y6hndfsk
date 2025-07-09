import React, { useCallback, useEffect, useRef, useState } from 'react';
import './App.css';

/***********************
 * CONFIG
 **********************/
const HERO_SIZE = 50;
const GAME_WIDTH = 800;
const GAME_HEIGHT = 500;
const GRAVITY = 0.6;
const JUMP_FORCE = 15;
const OBSTACLE_WIDTH = 50;
const OBSTACLE_GAP = 200;
const OBSTACLE_SPEED = 5;

interface Obstacle {
  id: number;
  left: number;
  height: number;
  passed: boolean;
}

/***********************
 * COMPONENT
 **********************/
const App: React.FC = () => {
  /* ---------- React state used only for rendering ---------- */
  const [heroY, setHeroY] = useState(0); // 0 means on the ground, negative means up
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  /* ---------- Refs for mutable game data (not triggering re-render) ---------- */
  const heroYRef = useRef(0);
  const heroVelRef = useRef(0);
  const obstaclesRef = useRef<Obstacle[]>([]);
  const gameOverRef = useRef(false);

  /* ---------- Jump (space key) ---------- */
  const handleKeyPress = useCallback(
    (e: KeyboardEvent) => {
      if (e.code === 'Space' && heroYRef.current === 0 && !gameOverRef.current) {
        heroVelRef.current = -JUMP_FORCE;
      }
    },
    []
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  /* ---------- Main game loop ---------- */
  useEffect(() => {
    if (gameOver) return; // stop loop when game over

    const interval = setInterval(() => {
      // Update hero physics
      heroVelRef.current += GRAVITY;
      heroYRef.current += heroVelRef.current;
      if (heroYRef.current > 0) {
        heroYRef.current = 0;
        heroVelRef.current = 0;
      }

      // Update obstacles
      let newObstacles = obstaclesRef.current
        .map((o) => ({ ...o, left: o.left - OBSTACLE_SPEED }))
        .filter((o) => o.left > -OBSTACLE_WIDTH);

      // Collision detection
      for (const o of newObstacles) {
        const heroLeft = 50;
        const heroRight = heroLeft + HERO_SIZE;
        const heroBottom = -heroYRef.current; // heroY is negative when in air

        const obstacleLeft = o.left;
        const obstacleRight = o.left + OBSTACLE_WIDTH;
        const obstacleTop = GAME_HEIGHT - o.height;

        const horizontalOverlap = heroRight > obstacleLeft && heroLeft < obstacleRight;
        const verticalOverlap = heroBottom > obstacleTop;

        if (horizontalOverlap && verticalOverlap) {
          gameOverRef.current = true;
          setGameOver(true);
          clearInterval(interval);
          return;
        }
      }

      // Score update
      const passed = newObstacles.find((o) => !o.passed && o.left + OBSTACLE_WIDTH < 50);
      if (passed) {
        setScore((s) => s + 1);
        newObstacles = newObstacles.map((o) => (o.id === passed.id ? { ...o, passed: true } : o));
      }

      // Spawn new obstacle if needed
      const needNew =
        newObstacles.length === 0 ||
        newObstacles[newObstacles.length - 1].left < GAME_WIDTH - OBSTACLE_GAP;
      if (needNew) {
        const h = Math.floor(Math.random() * (GAME_HEIGHT / 2)) + 50;
        newObstacles.push({ id: Date.now(), left: GAME_WIDTH, height: h, passed: false });
      }

      // Commit updates
      obstaclesRef.current = newObstacles;
      setObstacles(newObstacles);
      setHeroY(heroYRef.current);
    }, 1000 / 60);

    return () => clearInterval(interval);
  }, [gameOver]);

  /* ---------- Restart ---------- */
  const restartGame = () => {
    heroYRef.current = 0;
    heroVelRef.current = 0;
    obstaclesRef.current = [];
    gameOverRef.current = false;

    setHeroY(0);
    setObstacles([]);
    setScore(0);
    setGameOver(false);
  };

  /* ---------- Render ---------- */
  return (
    <div id="game-board" style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}>
      {/* Hero */}
      <div id="hero" style={{ transform: `translateY(${heroY}px)` }} />

      {/* Obstacles */}
      {obstacles.map((o) => (
        <div
          key={o.id}
          className="obstacle"
          style={{ left: o.left, height: o.height }}
        />
      ))}

      {/* Score */}
      <div
        style={{
          position: 'absolute',
          top: 10,
          left: 10,
          color: 'white',
          fontSize: 24,
          fontWeight: 600,
        }}
      >
        Score: {score}
      </div>

      {/* Game over overlay */}
      {gameOver && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            color: 'white',
          }}
        >
          <h1 style={{ margin: 0 }}>Game Over</h1>
          <p>Score: {score}</p>
          <button onClick={restartGame} style={{ padding: '6px 14px', cursor: 'pointer' }}>
            Restart
          </button>
        </div>
      )}
    </div>
  );
};

export default App;