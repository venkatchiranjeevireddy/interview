import React from 'react';

export const DifficultyCard = ({ level, isActive, isLocked, score, onSelect, config }) => {
  const colorClass = 
    config.color === 'emerald' ? 'bg-emerald-500' : 
    config.color === 'blue' ? 'bg-blue-500' : 
    'bg-purple-500';

  return (
    <button
      onClick={() => !isLocked && onSelect(level)}
      disabled={isLocked}
      className={`relative p-6 rounded-2xl transition-all duration-300 ${
        isActive ? 'ring-2 ring-blue-500 scale-105 bg-white/10 shadow-xl' : 'glass-morphism hover:bg-white/5'
      } ${isLocked ? 'opacity-50 grayscale cursor-not-allowed' : 'cursor-pointer'} text-left`}
    >
      {isLocked && (
        <div className="absolute top-4 right-4 text-gray-500">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        </div>
      )}
      
      <div className={`w-12 h-12 rounded-xl mb-4 flex items-center justify-center text-white font-bold ${colorClass}`}>
        {level[0]}
      </div>
      
      <h3 className="text-lg font-bold mb-2">{config.title}</h3>
      <p className="text-gray-400 text-sm mb-4">{config.description}</p>
      
      <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-center">
        <span className="text-xs text-gray-500 uppercase font-semibold">Min Score: {config.minScore}%</span>
        {score !== null && (
          <span className={`px-2 py-1 rounded text-xs font-bold ${score >= config.unlockScore ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
            Score: {Math.round(score)}%
          </span>
        )}
      </div>
    </button>
  );
};
