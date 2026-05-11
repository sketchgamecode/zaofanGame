import React, { createContext, useContext } from 'react';

type GameScaleContextType = {
  scale: number;
};

// 既然去除了动态缩放，scale 永远为 1
const GameScaleContext = createContext<GameScaleContextType>({ scale: 1 });

export function useGameScale() {
  return useContext(GameScaleContext);
}

type GameContainerProps = {
  children: React.ReactNode;
};

// 严丝合缝的经典游戏分辨率：200(左) + 360(中) + 480(右) = 1040
const BASE_WIDTH = 1040;
const BASE_HEIGHT = 720;

export const GameContainer: React.FC<GameContainerProps> = ({ children }) => {
  return (
    <GameScaleContext.Provider value={{ scale: 1 }}>
      {/* 使用 Flexbox 居中，坚决不使用任何 transform，解决所有拖拽和 Tooltip 的坐标系偏移问题 */}
      <div className="w-screen h-screen flex items-center justify-center bg-black/90">
        <div 
          style={{
            width: BASE_WIDTH,
            height: BASE_HEIGHT,
            WebkitFontSmoothing: 'antialiased',
          }}
        >
          {/* 背景和边界 */}
          <div className="w-full h-full bg-[#041124] overflow-hidden shadow-[0_0_80px_rgba(0,10,30,1)] border border-stone-800/50 relative">
            {children}
          </div>
        </div>
      </div>
    </GameScaleContext.Provider>
  );
};
