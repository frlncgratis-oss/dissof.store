import React from 'react';
import { Sparkles, Heart } from 'lucide-react';

interface BeadVisualizerProps {
  accessoryType: string;
  colorTheme: string;
  charms: string[];
  initials: string;
}

const THEME_COLORS: Record<string, { bg: string[]; border: string; glow: string; name: string }> = {
  'Pastel Candy Mix': {
    bg: ['#F472B6', '#FDE047', '#C084FC', '#86EFAC', '#7DD3FC'],
    border: 'border-pink-300',
    glow: 'rgba(244, 114, 182, 0.4)',
    name: 'Candy Mix'
  },
  'Sakura Pink & Pearl': {
    bg: ['#FDA4AF', '#FDF2F8', '#F472B6', '#FFFFFF', '#FB7185'],
    border: 'border-rose-300',
    glow: 'rgba(251, 113, 133, 0.4)',
    name: 'Sakura Pink'
  },
  'Lilac Dream & Violet': {
    bg: ['#E9D5FF', '#C084FC', '#FAF5FF', '#A855F7', '#F3E8FF'],
    border: 'border-purple-300',
    glow: 'rgba(192, 132, 252, 0.4)',
    name: 'Lilac Dream'
  },
  'Matcha Sage & Cream': {
    bg: ['#BBF7D0', '#FEF3C7', '#86EFAC', '#DCFCE7', '#F0FDF4'],
    border: 'border-emerald-300',
    glow: 'rgba(134, 239, 172, 0.4)',
    name: 'Matcha Sage'
  },
  'Ocean Sky Blue': {
    bg: ['#BAE6FD', '#7DD3FC', '#F0F9FF', '#38BDF8', '#E0F2FE'],
    border: 'border-sky-300',
    glow: 'rgba(125, 211, 252, 0.4)',
    name: 'Sky Blue'
  },
  'Butter Sunshine': {
    bg: ['#FEF08A', '#FDE047', '#FFFBEB', '#FACC15', '#FEF9C3'],
    border: 'border-amber-300',
    glow: 'rgba(253, 224, 71, 0.4)',
    name: 'Butter Sunshine'
  }
};

const CHARM_ICONS: Record<string, string> = {
  'Heart Pearl': '💖',
  'Bow Ribbon': '🎀',
  'Gummy Bear': '🧸',
  'Daisy Flower': '🌼',
  'Star Crystal': '⭐',
  'Cherry Charm': '🍒',
  'Angel Wings': '🪽',
  'Butterfly': '🦋',
  'Smile Pastel': '😊',
  'Strawberry': '🍓',
};

export const BeadVisualizer: React.FC<BeadVisualizerProps> = ({
  accessoryType,
  colorTheme,
  charms,
  initials,
}) => {
  const theme = THEME_COLORS[colorTheme] || THEME_COLORS['Pastel Candy Mix'];
  const colors = theme.bg;

  // Clean initials letters
  const letters = (initials || 'DISSOF ♡').toUpperCase().split('').slice(0, 10);

  return (
    <div className="w-full bg-gradient-to-br from-white via-[#FFF9F5] to-pink-50/50 rounded-3xl p-5 sm:p-7 border border-pink-200/80 shadow-md relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-pink-500 animate-pulse"></span>
          <span className="text-xs font-bold uppercase tracking-wider text-pink-600">
            Interactive Live Preview ♡
          </span>
        </div>
        <span className="text-[11px] bg-white border border-pink-200 text-pink-700 px-2.5 py-0.5 rounded-full font-medium shadow-xs">
          {accessoryType || 'Charm Bracelet'}
        </span>
      </div>

      {/* Visual Bead String Canvas */}
      <div className="relative py-10 px-4 flex items-center justify-center min-h-[160px] bg-white/70 rounded-2xl border border-pink-100 shadow-inner overflow-x-auto">
        
        {/* String line */}
        <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 h-1 bg-gradient-to-r from-pink-200 via-rose-300 to-purple-200 rounded-full z-0" />

        {/* Beads & Charms Chain */}
        <div className="relative z-10 flex items-center gap-1.5 sm:gap-2 flex-wrap justify-center py-2">
          
          {/* Left Decorative Beads */}
          <div className="flex items-center gap-1">
            <span
              className="w-4 h-4 rounded-full border border-white shadow-xs"
              style={{ backgroundColor: colors[0] }}
            />
            <span
              className="w-5 h-5 rounded-full border border-white shadow-xs"
              style={{ backgroundColor: colors[1 % colors.length] }}
            />
            <span
              className="w-3.5 h-3.5 rounded-full border border-white shadow-xs"
              style={{ backgroundColor: colors[2 % colors.length] }}
            />
            <span className="w-5 h-5 rounded-full bg-white border border-pink-200 shadow-xs flex items-center justify-center text-[10px]">
              🤍
            </span>
          </div>

          {/* Left Charms */}
          {charms.slice(0, 2).map((charm, idx) => (
            <div
              key={`left-charm-${idx}`}
              className="animate-bounce"
              style={{ animationDuration: `${2 + idx * 0.3}s` }}
            >
              <div className="w-8 h-8 rounded-full bg-white border-2 border-pink-200 shadow-md flex items-center justify-center text-base hover:scale-110 transition-transform cursor-pointer">
                {CHARM_ICONS[charm] || '✨'}
              </div>
            </div>
          ))}

          {/* Custom Initials Letter Cubes */}
          <div className="flex items-center gap-1 bg-white/90 px-2.5 py-1.5 rounded-2xl border border-pink-200 shadow-sm">
            {letters.map((char, index) => (
              <div
                key={`letter-${index}`}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-tr from-pink-100 to-white border border-pink-300 text-[#3A2E28] font-bold text-xs sm:text-sm flex items-center justify-center shadow-xs transition-transform hover:-translate-y-0.5"
              >
                {char === ' ' ? '·' : char}
              </div>
            ))}
          </div>

          {/* Right Charms */}
          {charms.slice(2).map((charm, idx) => (
            <div
              key={`right-charm-${idx}`}
              className="animate-bounce"
              style={{ animationDuration: `${2.2 + idx * 0.4}s` }}
            >
              <div className="w-8 h-8 rounded-full bg-white border-2 border-pink-200 shadow-md flex items-center justify-center text-base hover:scale-110 transition-transform cursor-pointer">
                {CHARM_ICONS[charm] || '✨'}
              </div>
            </div>
          ))}

          {/* Right Decorative Beads */}
          <div className="flex items-center gap-1">
            <span className="w-5 h-5 rounded-full bg-white border border-pink-200 shadow-xs flex items-center justify-center text-[10px]">
              🤍
            </span>
            <span
              className="w-3.5 h-3.5 rounded-full border border-white shadow-xs"
              style={{ backgroundColor: colors[3 % colors.length] }}
            />
            <span
              className="w-5 h-5 rounded-full border border-white shadow-xs"
              style={{ backgroundColor: colors[4 % colors.length] }}
            />
            <span
              className="w-4 h-4 rounded-full border border-white shadow-xs"
              style={{ backgroundColor: colors[0] }}
            />
          </div>

        </div>
      </div>

      {/* Visualizer Footer Info */}
      <div className="mt-3 flex flex-wrap items-center justify-between text-[11px] text-[#73635B] gap-2">
        <span className="flex items-center gap-1 text-pink-600 font-medium">
          <Sparkles className="w-3 h-3" />
          Color Theme: <b>{colorTheme}</b>
        </span>
        <span className="bg-pink-100/70 text-pink-800 px-2 py-0.5 rounded-full font-medium">
          {charms.length > 0 ? `${charms.length} Charms Dipilih` : 'Pilih charm di bawah ♡'}
        </span>
      </div>
    </div>
  );
};
