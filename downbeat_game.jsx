import React, { useState, useEffect, useRef } from 'react';

// DOWNBEAT! - Ragtime Runner Game
// Browser port of the Intellivision IntyBASIC version
// Jump over musical note obstacles to perform Maple Leaf Rag!

const DOWNBEAT = () => {
  const canvasRef = useRef(null);
  const [gameState, setGameState] = useState('menu'); // menu, levelselect, playing, gameover, complete
  const [currentLevel, setCurrentLevel] = useState(0);
  
  // Load retro font
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    return () => document.head.removeChild(link);
  }, []);
  
  // Game constants
  const SCALE = 4; // Scale up the tiny 160x96 canvas
  const PLAYER_X = 40;
  const GROUND_Y = 40; // Player standing position (feet on ground)
  const JUMP_FRAMES = 36;
  const NOTE_Y = 48; // Note position (bottom on ground)
  const NOTE_SPAWN_X = 168;
  const GROUND_LINE_Y = 56; // Visual ground line
  const SCROLL_SPEED = 1.668; // ~100 px/sec at 60 FPS
  const MAX_HEARTS = 5;
  const FRAMES_PER_NOTE = 9;
  const MELODY_LENGTH = 128;
  const SPAWN_OFFSET = 9;
  
  // Sprite graphics (from IntyBASIC GRAM data)
  const sprites = {
    // Player alien (8x8, stretched to 8x16)
    player: [
      '..XXXX..',
      '.XXXXXX.',
      'XX.XX.XX',
      'XXXXXXXX',
      '..XXXX..',
      '.XXXXXX.',
      '.X.XX.X.',
      '.X....X.'
    ],
    // Player celebration (hands up!)
    celebration: [
      'X..XX..X',
      '.XXXXXX.',
      'XX.XX.XX',
      'XXXXXXXX',
      '..XXXX..',
      '.XXXXXX.',
      '..XXXX..',
      '..X..X..'
    ],
    // Note obstacle (quarter note)
    note: [
      '...XX...',
      '...XX...',
      '...XX...',
      '..XXXX..',
      '.XXXXXX.',
      'XXXXXXXX',
      '.XXXXXX.',
      '..XXXX..'
    ],
    // Heart
    heart: [
      '........',
      '..X..X..',
      '.XXXXXX.',
      '.XXXXXX.',
      '..XXXX..',
      '...XX...',
      '........',
      '........'
    ],
    // Flower
    flower: [
      '..X.X...',
      '.XXXXX..',
      '.XXXXX..',
      '..XXX...',
      '...X....',
      '...X....',
      '..XX....',
      '........'
    ],
    // Pencil
    pencil: [
      '..XXXX..',
      '..XXXX..',
      '...XX...',
      '...XX...',
      '...XX...',
      '...XX...',
      '...XX...',
      '...XX...'
    ]
  };
  
  // Game state ref
  const gameRef = useRef({
    playerY: GROUND_Y,
    jumpActive: false,
    jumpFrame: 0,
    floatUsed: 0,
    floatActive: false,
    floatTimer: 0,
    hearts: 3,
    beatCounter: 0,
    spawnCountdown: FRAMES_PER_NOTE,
    songDone: false,
    songEndTimer: 0,
    notes: [],
    pencils: [],
    flower: null,
    pencilSpawnTimer: 0,
    pencilsSpawned: 0,
    flowerSpawnTimer: 0,
    flowersSpawned: 0,
    keys: {},
    buttonReleased: true,
    animFrame: 0
  });
  
  // Jump arc (parabolic)
  const jumpArc = [
    0, 2, 4, 6, 8, 10, 11, 13, 14, 15, 16, 17, 18, 19, 19, 20, 20, 20,
    20, 20, 20, 19, 19, 18, 17, 16, 15, 14, 13, 11, 10, 8, 6, 4, 2, 0
  ];
  
  // Maple Leaf Rag melody (PSG frequencies)
  const melodyData = [
    1438,0,1077,539, 360,539,428,360, 1017,571,360,571, 480,360,807,0,
    1438,0,1077,539, 360,539,428,360, 1017,571,360,571, 480,360,807,0,
    1438,360,1357,539, 453,339,1438,360, 1438,360,1357,539, 453,339,1438,360,
    0,0,2155,2155, 1812,1077,2155,1077, 906,539,1077,539, 453,269,539,269,
    226,135,135,0, 135,0,135,0, 135,135,428,180, 160,214,180,160,
    428,269,453,240, 226,269,240,214, 428,269,214,269, 240,0,269,0,
    0,269,906,0, 269,0,269,0, 269,269,855,360, 320,428,360,320,
    855,539,906,480, 453,539,480,428, 855,539,428,539, 480,0,539,0
  ];
  
  // Obstacle map
  const obstacleMap = [
    0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,
    0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,
    0,1,0,1,0,0,0,0,0,1,0,0,0,0,0,1,
    0,0,0,0,0,1,0,0,0,0,0,0,1,0,0,0,
    0,0,0,0,1,0,1,0,0,0,0,0,1,0,0,0,
    0,0,1,0,1,0,0,0,0,0,0,1,0,0,0,0,
    0,1,0,1,0,0,0,0,0,1,0,0,0,0,0,0,
    1,0,1,0,0,0,0,0,0,1,0,0,0,0,0,0
  ];
  
  // Audio context
  const audioContextRef = useRef(null);
  
  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
  }, []);
  
  const psgToFreq = (psg) => {
    if (psg === 0) return 0;
    return 3579545 / (16 * psg);
  };
  
  const playNote = (psg, duration = 0.15, volume = 0.15) => {
    if (!audioContextRef.current || psg === 0) return;
    
    const freq = psgToFreq(psg);
    const ctx = audioContextRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'square';
    osc.frequency.value = freq;
    
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  };
  
  const playDud = (psg) => {
    if (psg === 0) return playNote(200, 0.1, 0.4);
    const dudPsg = psg + Math.floor(psg / 16);
    playNote(dudPsg, 0.1, 0.4);
  };
  
  // Draw sprite helper
  const drawSprite = (ctx, sprite, x, y, color, doubleHeight = false) => {
    sprite.forEach((row, rowIdx) => {
      [...row].forEach((pixel, colIdx) => {
        if (pixel === 'X') {
          ctx.fillStyle = color;
          if (doubleHeight) {
            // Stretch vertically
            ctx.fillRect(x + colIdx, y + rowIdx * 2, 1, 2);
          } else {
            ctx.fillRect(x + colIdx, y + rowIdx, 1, 1);
          }
        }
      });
    });
  };
  
  // Start game
  const startGame = (level) => {
    setCurrentLevel(level);
    setGameState('playing');
    const game = gameRef.current;
    game.playerY = GROUND_Y;
    game.jumpActive = false;
    game.jumpFrame = 0;
    game.floatUsed = 0;
    game.floatActive = false;
    game.floatTimer = 0;
    game.hearts = 3;
    game.beatCounter = 0;
    game.spawnCountdown = FRAMES_PER_NOTE;
    game.songDone = false;
    game.songEndTimer = 0;
    game.notes = [];
    game.pencils = [];
    game.flower = null;
    game.pencilSpawnTimer = Math.floor(Math.random() * 120) + 150;
    game.pencilsSpawned = 0;
    game.flowerSpawnTimer = Math.floor(Math.random() * 120) + 60;
    game.flowersSpawned = 0;
    game.buttonReleased = true;
    game.animFrame = 0;
  };
  
  // Game loop
  useEffect(() => {
    if (gameState !== 'playing') return;
    
    const game = gameRef.current;
    let animationId;
    
    const gameLoop = () => {
      game.animFrame++;
      
      // Beat system
      if (!game.songDone) {
        game.spawnCountdown--;
        
        if (game.spawnCountdown === 0) {
          game.spawnCountdown = FRAMES_PER_NOTE;
          
          // Play melody note
          const psg = melodyData[game.beatCounter];
          if (psg > 0) {
            playNote(psg, 0.15, 0.15);
          }
          
          // Spawn obstacles
          const spawnBeat = game.beatCounter + SPAWN_OFFSET;
          if (spawnBeat < MELODY_LENGTH && obstacleMap[spawnBeat] === 1) {
            game.notes.push({
              x: NOTE_SPAWN_X,
              xFrac: 0,
              y: NOTE_Y,
              cleared: false,
              psg: melodyData[spawnBeat]
            });
          }
          
          game.beatCounter++;
          if (game.beatCounter >= MELODY_LENGTH) {
            game.songDone = true;
          }
        }
      }
      
      // Pencil spawning (Level 1 only)
      if (currentLevel === 1) {
        if (game.pencilsSpawned < 2 && !game.songDone) {
          if (game.beatCounter >= 20 && game.beatCounter < 108) {
            if (game.pencilSpawnTimer > 0) {
              game.pencilSpawnTimer--;
            }
            if (game.pencilSpawnTimer === 0) {
              // Don't spawn while another pencil is falling
              const hasFalling = game.pencils.some(p => p.state === 'falling');
              if (hasFalling) {
                game.pencilSpawnTimer = 15;
              } else {
                game.pencils.push({
                  x: Math.floor(Math.random() * 60) + 100,
                  y: 0,
                  state: 'falling',
                  cleared: false,
                  xFrac: 0
                });
                game.pencilsSpawned++;
                game.pencilSpawnTimer = Math.floor(Math.random() * 180) + 300;
              }
            }
          }
        }
      }
      
      // Flower spawning (Level 1 only)
      if (currentLevel === 1) {
        if (!game.flower && game.flowersSpawned < 2 && !game.songDone) {
          if (game.beatCounter >= 55 && game.beatCounter < 95) {
            if (game.flowerSpawnTimer > 0) {
              game.flowerSpawnTimer--;
            }
            if (game.flowerSpawnTimer === 0) {
              const hasFalling = game.pencils.some(p => p.state === 'falling');
              if (hasFalling) {
                game.flowerSpawnTimer = 30;
              } else {
                game.flower = {
                  x: Math.floor(Math.random() * 60) + 80,
                  y: 0,
                  driftY: 0
                };
                game.flowersSpawned++;
                game.flowerSpawnTimer = Math.floor(Math.random() * 180) + 300;
              }
            }
          }
        }
      }
      
      // Input
      if (game.keys[' '] || game.keys['ArrowUp']) {
        if (game.buttonReleased) {
          if (!game.jumpActive) {
            game.jumpActive = true;
            game.jumpFrame = 0;
            game.floatUsed = 0;
            game.buttonReleased = false;
          } else if (game.floatUsed < 3 && !game.floatActive) {
            if (game.jumpFrame >= 15 && game.jumpFrame <= 20) {
              game.floatActive = true;
              game.floatTimer = 10;
              game.floatUsed++;
              game.buttonReleased = false;
            }
          }
        }
      } else {
        game.buttonReleased = true;
      }
      
      // Update jump
      if (game.jumpActive) {
        if (game.floatActive) {
          game.playerY = GROUND_Y - 20;
          game.floatTimer--;
          if (game.floatTimer === 0) {
            game.floatActive = false;
            game.jumpFrame = 18;
          }
        } else {
          game.playerY = GROUND_Y - jumpArc[game.jumpFrame];
          game.jumpFrame++;
          if (game.jumpFrame >= JUMP_FRAMES) {
            game.jumpActive = false;
            game.floatActive = false;
            game.playerY = GROUND_Y;
          }
        }
      }
      
      // Scroll notes
      game.notes = game.notes.filter(note => {
        note.xFrac += 171;
        if (note.xFrac >= 256) {
          note.xFrac -= 256;
          note.x -= 2;
        } else {
          note.x -= 1;
        }
        
        // Collision
        if (!note.cleared && note.x < PLAYER_X) {
          if (game.playerY + 12 > note.y) { // Use note.y instead of NOTE_Y constant
            // Hit!
            game.hearts--;
            playDud(note.psg);
            if (game.hearts <= 0) {
              setGameState('gameover');
            }
            return false;
          }
          if (note.x < PLAYER_X - 10) {
            note.cleared = true;
          }
        }
        
        return note.x > -8;
      });
      
      // Update pencils (Level 1)
      if (currentLevel === 1) {
        game.pencils = game.pencils.filter(pencil => {
          if (pencil.state === 'falling') {
            // Scroll left
            pencil.xFrac += 171;
            if (pencil.xFrac >= 256) {
              pencil.xFrac -= 256;
              pencil.x = Math.max(0, pencil.x - 2);
            } else {
              pencil.x = Math.max(0, pencil.x - 1);
            }
            
            // Fall down
            pencil.y += 2;
            
            // Check collision while falling
            if (!pencil.cleared && game.jumpActive) {
              if (pencil.x + 8 > PLAYER_X && pencil.x < PLAYER_X + 8) {
                if (pencil.y + 8 > game.playerY && pencil.y < game.playerY + 16) {
                  game.hearts--;
                  playDud(200);
                  if (game.hearts <= 0) {
                    setGameState('gameover');
                  }
                  return false;
                }
              }
            }
            
            // Remove if off screen
            if (pencil.y > 96 || pencil.x < -8) {
              return false;
            }
          }
          return true;
        });
      }
      
      // Update flower (Level 1)
      if (currentLevel === 1 && game.flower) {
        game.flower.driftY++;
        
        // Drift left (every 2 frames)
        if (game.flower.driftY & 1) {
          game.flower.x = Math.max(0, game.flower.x - 1);
        }
        
        // Drift down (every 3 frames)
        if (game.flower.driftY >= 3) {
          game.flower.driftY = 0;
          game.flower.y++;
        }
        
        // Check collection
        if (game.jumpActive) {
          if (game.flower.x + 8 > PLAYER_X && game.flower.x < PLAYER_X + 8) {
            if (game.flower.y + 8 > game.playerY && game.flower.y < game.playerY + 16) {
              // Collected! +1 heart
              game.hearts = Math.min(MAX_HEARTS, game.hearts + 1);
              playNote(80, 0.1, 0.3); // Tinkle sound
              game.flower = null;
            }
          }
        }
        
        // Remove if off screen
        if (game.flower && (game.flower.y > 90 || game.flower.x < -8)) {
          game.flower = null;
        }
      }
      
      // Check completion
      if (game.songDone && game.notes.length === 0) {
        game.songEndTimer++;
        if (game.songEndTimer >= 30) {
          setGameState('complete');
        }
      }
      
      // Render
      draw();
      
      animationId = requestAnimationFrame(gameLoop);
    };
    
    animationId = requestAnimationFrame(gameLoop);
    
    return () => {
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [gameState]);
  
  // Draw
  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const game = gameRef.current;
    
    // Clear
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, 160, 96);
    
    // Ground
    ctx.fillStyle = '#FFF';
    ctx.fillRect(0, GROUND_LINE_Y, 160, 2);
    
    // Hearts (top right) - only show filled hearts
    const heartX = 144;
    const heartSpacing = 10;
    for (let i = 0; i < game.hearts; i++) {
      const x = heartX - i * heartSpacing;
      drawSprite(ctx, sprites.heart, x, 0, '#990099');
    }
    
    // Notes (cyan spaceships!)
    game.notes.forEach(note => {
      drawSprite(ctx, sprites.note, note.x, note.y, '#0FF');
    });
    
    // Pencils (Level 1)
    if (currentLevel === 1) {
      game.pencils.forEach(pencil => {
        drawSprite(ctx, sprites.pencil, pencil.x, pencil.y, '#FA0');
      });
      
      // Flower
      if (game.flower) {
        drawSprite(ctx, sprites.flower, game.flower.x, game.flower.y, '#F0F');
      }
    }
    
    // Player (tomato red alien, stretched vertically)
    const playerSprite = (game.songEndTimer > 0 && game.hearts > 0) ? sprites.celebration : sprites.player;
    drawSprite(ctx, playerSprite, PLAYER_X, game.playerY, '#f10909', true);
  };
  
  // Keyboard
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === ' ' || e.key === 'ArrowUp') {
        e.preventDefault();
      }
      gameRef.current.keys[e.key] = true;
    };
    
    const handleKeyUp = (e) => {
      gameRef.current.keys[e.key] = false;
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);
  
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: '#191717',
      color: '#FFF',
      fontFamily: '"Press Start 2P", "Courier New", monospace',
      padding: '20px'
    }}>
      <h1 style={{ 
        margin: '0 0 10px 0', 
        color: '#ffa227',
        fontSize: '48px',
        textShadow: '3px 3px 0 #000',
        fontFamily: '"Press Start 2P", "Courier New", monospace'
      }}>
        DOWNBEAT!
      </h1>
      
      {gameState === 'menu' && (
        <div style={{ textAlign: 'center' }}>
          <p style={{ marginBottom: '30px', fontSize: '18px' }}>
            A rhythm runner
          </p>
          <button
            onClick={() => setGameState('levelselect')}
            style={{
              padding: '15px 30px',
              fontSize: '20px',
              background: '#990099',
              color: '#FFF',
              border: '3px solid #000',
              cursor: 'pointer',
              fontFamily: '"Press Start 2P", "Courier New", monospace',
              fontWeight: 'bold'
            }}
          >
            CHOOSE LEVEL
          </button>
          <p style={{ marginTop: '30px', fontSize: '14px', color: '#AAA' }}>
            Controls: SPACE or ↑ to jump<br/>
            Press again near peak to float!<br/>
            <br/>
            Jump over the notes.<br/>
            Avoid the pencils. Catch the flowers!
          </p>
          <p style={{ 
            marginTop: '30px', 
            fontSize: '12px', 
            color: '#666',
            textAlign: 'center'
          }}>
            Original Intellivision game by Shaya Bendix Lyon<br/>
            Maple Leaf Rag by Scott Joplin (1899)
          </p>
        </div>
      )}
      
      {gameState === 'levelselect' && (
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ color: '#0FF', marginBottom: '30px' }}>SELECT LEVEL</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <button
              onClick={() => startGame(0)}
              style={{
                padding: '15px 30px',
                fontSize: '18px',
                background: '#4d02d9',
                color: '#FFF',
                border: '3px solid #000',
                cursor: 'pointer',
                fontFamily: '"Press Start 2P", "Courier New", monospace',
                fontWeight: 'bold'
              }}
            >
              1: MAPLE LEAF RAG
            </button>
            <button
              onClick={() => startGame(1)}
              style={{
                padding: '15px 30px',
                fontSize: '18px',
                background: '#990099',
                color: '#FFF',
                border: '3px solid #000',
                cursor: 'pointer',
                fontFamily: '"Press Start 2P", "Courier New", monospace',
                fontWeight: 'bold'
              }}
            >
              2: PENCIL DROP
            </button>
          </div>
        </div>
      )}
      
      {gameState === 'playing' && (
        <div style={{ 
          border: '4px solid #FFF', 
          background: '#000',
          boxShadow: '0 0 20px rgba(255,255,255,0.3)'
        }}>
          <canvas
            ref={canvasRef}
            width={160}
            height={96}
            style={{ 
              imageRendering: 'pixelated', 
              width: `${160 * SCALE}px`, 
              height: `${96 * SCALE}px` 
            }}
          />
        </div>
      )}
      
      {gameState === 'gameover' && (
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ color: '#f10909', fontSize: '36px' }}>GAME OVER!</h2>
          <button
            onClick={() => setGameState('menu')}
            style={{
              padding: '15px 30px',
              fontSize: '20px',
              background: '#990099',
              color: '#FFF',
              border: '3px solid #000',
              cursor: 'pointer',
              fontFamily: '"Press Start 2P", "Courier New", monospace',
              fontWeight: 'bold',
              marginTop: '20px'
            }}
          >
            TRY AGAIN
          </button>
        </div>
      )}
      
      {gameState === 'complete' && (
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ color: '#ffa227', fontSize: '36px' }}>
            {gameRef.current.hearts === MAX_HEARTS ? 'PERFECT RUN!' : 'SONG COMPLETE!'}
          </h2>
          <button
            onClick={() => setGameState('menu')}
            style={{
              padding: '15px 30px',
              fontSize: '20px',
              background: '#990099',
              color: '#FFF',
              border: '3px solid #000',
              cursor: 'pointer',
              fontFamily: '"Press Start 2P", "Courier New", monospace',
              fontWeight: 'bold',
              marginTop: '20px'
            }}
          >
            PLAY AGAIN
          </button>
        </div>
      )}
    </div>
  );
};

export default DOWNBEAT;
