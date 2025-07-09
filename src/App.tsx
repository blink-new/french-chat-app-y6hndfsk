import React, { useState, useEffect, useCallback } from 'react';
import './App.css';

const HERO_SIZE = 50;
const GAME_WIDTH = 800;
const GAME_HEIGHT = 500;
const GRAVITY = 0.6;
const JUMP_FORCE = 15;
const OBSTACLE_WIDTH = 50;
const OBSTACLE_GAP = 200;
const OBSTACLE_SPEED = 5;

const App = () => {
  const [heroPosition, setHeroPosition] = useState(0);
  const [heroVelocity, setHeroVelocity] = useState(0);
  const [obstacles, setObstacles] = useState([]);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);

  const handleKeyPress = useCallback((e) => {
    if (e.code === 'Space' && heroPosition === 0) {
      setHeroVelocity(-JUMP_FORCE);
    }
  }, [heroPosition]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [handleKeyPress]);

  useEffect(() => {
    if (gameOver) return;

    const gameLoop = setInterval(() => {
      // Hero physics
      const newVelocity = heroVelocity + GRAVITY;
      const newPosition = heroPosition + newVelocity;

      if (newPosition > 0) {
        newPosition = 0;
        newVelocity = 0;
      }

      setHeroPosition(newPosition);
      setHeroVelocity(newVelocity);

      // Obstacle logic
      const newObstacles = obstacles.map(obstacle => ({
        ...obstacle,
        left: obstacle.left - OBSTACLE_SPEED,
      })).filter(obstacle => obstacle.left > -OBSTACLE_WIDTH);

      // Collision detection
      for (const obstacle of newObstacles) {
        const heroLeft = 50;
        const heroRight = heroLeft + HERO_SIZE;
        const heroBottom = GAME_HEIGHT - (GAME_HEIGHT + newPosition);

        const obstacleLeft = obstacle.left;
        const obstacleRight = obstacle.left + OBSTACLE_WIDTH;
        const obstacleTop = GAME_HEIGHT - obstacle.height;

        if (
          heroRight > obstacleLeft &&
          heroLeft < obstacleRight &&
          heroBottom > obstacleTop
        ) {
          setGameOver(true);
        }
      }
      
      // Update score
      const passedObstacle = obstacles.find(o => o.left + OBSTACLE_WIDTH < 50 && !o.passed);
      if (passedObstacle) {
        setScore(s => s + 1);
        newObstacles = newObstacles.map(o => o.id === passedObstacle.id ? {...o, passed: true} : o);
      }


      // Add new obstacles
      if (
        newObstacles.length === 0 ||
        newObstacles[newObstacles.length - 1].left < GAME_WIDTH - OBSTACLE_GAP
      ) {
        const newHeight = Math.floor(Math.random() * (GAME_HEIGHT / 2)) + 50;
        newObstacles.push({ id: Date.now(), left: GAME_WIDTH, height: newHeight, passed: false });
      }

      setObstacles(newObstacles);
    }, 1000 / 60);

    return () => clearInterval(gameLoop);
  }, [heroPosition, heroVelocity, obstacles, gameOver]);

  const restartGame = () => {
    setHeroPosition(0);
    setHeroVelocity(0);
    setObstacles([]);
    setGameOver(false);
    setScore(0);
  };

  return (
    <div id="game-board" style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}>
      <div id="hero" style={{ transform: `translateY(${heroPosition}px)` }}></div>
      {obstacles.map(obstacle => (
        <div
          key={obstacle.id}
          className="obstacle"
          style={{ left: obstacle.left, height: obstacle.height }}
        ></div>
      ))}
      {gameOver && (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', color: 'white' }}>
          <h1>Game Over</h1>
          <p>Score: {score}</p>
          <button onClick={restartGame}>Restart</button>
        </div>
      )}
       <div style={{ position: 'absolute', top: 10, left: 10, color: 'white', fontSize: 24 }}>
        Score: {score}
      </div>
    </div>
  );
};

export default App;