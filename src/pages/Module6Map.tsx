import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp, DEV_UNLOCK_ALL } from '@/lib/store';
import { countries, regions, mapConfig } from '@/lib/data/countries';
import AudioPlayer from '@/components/AudioPlayer';
import { Button } from '@/components/ui';
import { UpgradeModal } from '@/components/Layout';

// Base map served from public/images/ — no external dependency.
// Exact user-provided original map; its 1408×768 viewBox matches mapConfig.
const MAP_IMG = '/images/arab-world-map.png';

export function Module6Map() {
  const { user, award } = useApp();
  const [selectedCountry, setSelectedCountry] = useState<typeof countries[0] | null>(null);
  const [activeRegion, setActiveRegion] = useState<string | null>(null);
  const [testMode, setTestMode] = useState<'find' | 'name' | 'hear' | null>(null);
  const [testTarget, setTestTarget] = useState<typeof countries[0] | null>(null);
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
  const [selectedCountryForMap, setSelectedCountryForMap] = useState<typeof countries[0] | null>(null);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [testOptions, setTestOptions] = useState<typeof countries>([]);
  const [feedback, setFeedback] = useState<{ id: string; ok: boolean } | null>(null);

  const countriesLearned = Object.keys(user?.progress ?? {}).filter(k => k.startsWith('map:')).map(k => k.split(':')[1]);

  const displayCountries = activeRegion
    ? countries.filter(c => c.region === activeRegion)
    : countries;

  const handleClick = (c: typeof countries[0]) => {
    const idx = countries.findIndex(x => x.id === c.id);
    if (!DEV_UNLOCK_ALL && !user?.premium && idx >= 5 && !countriesLearned.includes(c.id)) {
      setUpgradeOpen(true);
      return;
    }
    award('map', c.id);
    setSelectedCountry(c);
  };

  const startTest = (mode: 'find' | 'name' | 'hear') => {
    const target = countries[Math.floor(Math.random() * countries.length)];
    const others = [...countries]
      .filter(c => c.id !== target.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, mode === 'hear' ? 3 : 5);
    setTestOptions([...others, target].sort(() => Math.random() - 0.5));
    setTestTarget(target);
    setTestMode(mode);
    setFeedback(null);
  };

  const handleTestClick = (c: typeof countries[0]) => {
    if (!testTarget) return;
    if (c.id === testTarget.id) {
      setFeedback({ id: c.id, ok: true });
      award('map', c.id);
      setTimeout(() => {
        setTestMode(null);
        setTestTarget(null);
        setFeedback(null);
      }, 1500);
    } else {
      setFeedback({ id: c.id, ok: false });
      setTimeout(() => setFeedback(null), 1000);
    }
  };

  const testAnswerButtons = () => (
    <div className="flex flex-wrap gap-2 justify-center max-h-48 overflow-y-auto">
      {testOptions.map(c => (
        <button
          key={c.id}
          onClick={() => handleTestClick(c)}
          className={cn(
            "px-4 py-2 rounded-xl font-medium transition-all hover:scale-105 text-sm border",
            feedback?.id === c.id
              ? feedback.ok ? "bg-ok border-ok text-white" : "bg-red-500 border-red-500 text-white"
              : "bg-white/10 hover:bg-white/20 border-white/10"
          )}
        >
          <div className="ar">{c.nameArabic}</div>
          <div className="text-sand/80">{c.nameEnglish}</div>
        </button>
      ))}
    </div>
  );

  if (testMode && testTarget) {
    return (
      <div className="max-w-3xl mx-auto text-center space-y-6 p-4">
        <Button variant="ghost" onClick={() => { setTestMode(null); setTestTarget(null); setFeedback(null); }}>← Back to map</Button>

        {testMode === 'find' && (
          <>
            <div className="space-y-2">
              <p className="text-xl font-medium">🔍 Find this country on the map:</p>
              <p className="ar text-4xl text-gold">{testTarget.nameArabic}</p>
              <div className="flex justify-center"><AudioPlayer folder="countries" fileKey={testTarget.id} text={testTarget.nameArabic} /></div>
            </div>
            
            <div className="relative rounded-2xl overflow-hidden shadow-lg border border-gold/30 bg-white">
              <img src={MAP_IMG} alt="Arab World Map" className="w-full block" />
              <svg viewBox={mapConfig.viewBox} className="absolute inset-0 w-full h-full">
                {countries.map(c => (
                  <circle
                    key={c.id}
                    cx={c.cx}
                    cy={c.cy}
                    r={c.r * 2.5}
                    fill={feedback?.id === c.id ? (feedback.ok ? "rgba(34,197,94,0.6)" : "rgba(239,68,68,0.6)") : "transparent"}
                    stroke={feedback?.id === c.id ? (feedback.ok ? "#22c55e" : "#ef4444") : "none"}
                    strokeWidth="3"
                    className="cursor-pointer transition-colors duration-200"
                    onClick={() => handleTestClick(c)}
                  />
                ))}
                {feedback?.ok && (
                  <text x={testTarget.cx} y={testTarget.cy}
                    textAnchor="middle" dominantBaseline="central"
                    fill="#1A1A2E" fontSize="28" fontWeight="bold"
                    fontFamily="'Noto Naskh Arabic', serif"
                    stroke="#FFFFFF" strokeWidth="4" paintOrder="stroke"
                  >
                    {testTarget.nameArabic}
                  </text>
                )}
              </svg>
            </div>
            <p className="text-sm text-sand/50 italic">Tap the location of the country on the map</p>
          </>
        )}

        {testMode === 'name' && (
          <div className="space-y-6">
            <p className="text-xl font-medium">🗺️ Which country is highlighted?</p>
            <div className="relative rounded-2xl overflow-hidden shadow-lg border border-gold/30 bg-white">
              <img src={MAP_IMG} alt="Arab World Map" className="w-full block" />
              <svg viewBox={mapConfig.viewBox} className="absolute inset-0 w-full h-full">
                <circle
                  cx={testTarget.cx}
                  cy={testTarget.cy}
                  r={testTarget.r * 2.5}
                  fill="rgba(255,200,0,0.4)"
                  stroke="#FF8F00"
                  strokeWidth="3"
                />
                {feedback?.ok && (
                  <text x={testTarget.cx} y={testTarget.cy}
                    textAnchor="middle" dominantBaseline="central"
                    fill="#1A1A2E" fontSize="28" fontWeight="bold"
                    fontFamily="'Noto Naskh Arabic', serif"
                    stroke="#FFFFFF" strokeWidth="4" paintOrder="stroke"
                  >
                    {testTarget.nameArabic}
                  </text>
                )}
              </svg>
            </div>
            {testAnswerButtons()}
          </div>
        )}

        {testMode === 'hear' && (
          <div className="space-y-6">
            <p className="text-xl font-medium">🎧 Which country do you hear?</p>
            <div className="flex justify-center scale-150 py-4"><AudioPlayer folder="countries" fileKey={testTarget.id} text={testTarget.nameArabic} /></div>
            <div className="relative rounded-2xl overflow-hidden shadow-md border border-white/10 opacity-40 grayscale">
              <img src={MAP_IMG} alt="Arab World Map" className="w-full" />
            </div>
            {testAnswerButtons()}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 p-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gold">🗺️ Arab World Map</h1>
          <p className="text-lg opacity-70">Explore 22 Arab League countries — click to learn!</p>
        </div>
        <div className="flex gap-2">
          {(['find', 'name', 'hear'] as const).map(mode => (
            <Button key={mode} size="sm" onClick={() => startTest(mode)}>
              {mode === 'find' ? '🔍 Find' : mode === 'name' ? '🗺️ Name' : '🎧 Hear'}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant={!activeRegion ? "primary" : "ghost"} onClick={() => setActiveRegion(null)}>
          🌍 All Regions
        </Button>
        {regions.map(r => (
          <Button key={r.name} size="sm" variant={activeRegion === r.name ? "primary" : "ghost"} onClick={() => setActiveRegion(r.name)}>
            {r.name} ({r.countries.length})
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <div className="xl:col-span-3">
          {/* ---- THE MAP ---- */}
          <div className="relative rounded-2xl overflow-hidden shadow-sm bg-white border border-gold/30">
            {/* Base layer: the physical map image */}
            <img src={MAP_IMG} alt="Arab World Map" className="w-full block" />

            {/* Overlay layer: interactive SVG circles on 1408×768 coordinate grid */}
            <svg viewBox={mapConfig.viewBox} className="absolute inset-0 w-full h-full" style={{ top: 0, left: 0 }}>
              {countries.map(c => {
                if (activeRegion && c.region !== activeRegion) return null;
                const isSelected = selectedCountryForMap?.id === c.id || selectedCountry?.id === c.id;
                const isHovered = hoveredCountry === c.id;
                // Give the active country a generous visual target without changing the
                // source map or the country coordinates.
                const activeRadius = isSelected
                  ? Math.max(c.r * 3, 48)
                  : isHovered
                    ? Math.max(c.r * 1.6, 28)
                    : c.r;
                const activeFontSize = isSelected
                  ? Math.max(28, Math.min(42, c.r * 1.65))
                  : Math.max(18, Math.min(26, c.r * 0.85));

                let fillColor = 'transparent';
                let strokeColor = 'none';
                let strokeW = 0;
                let opacity = 0;

                if (isSelected) {
                  fillColor = 'rgba(255,200,0,0.42)';  // prominent yellow highlight
                  opacity = 1;
                  strokeColor = '#FF8F00';
                  strokeW = 4;
                } else if (isHovered) {
                  fillColor = 'rgba(0,0,0,0.1)';  // subtle on hover
                  opacity = 1;
                  strokeColor = '#333';
                  strokeW = 1.5;
                }

                return (
                  <g
                    key={c.id}
                    onClick={() => { setSelectedCountryForMap(c); handleClick(c); }}
                    onMouseEnter={() => setHoveredCountry(c.id)}
                    onMouseLeave={() => setHoveredCountry(null)}
                    className="cursor-pointer"
                    style={{ cursor: 'pointer' }}
                  >
                    {/* The clickable circle — invisible at rest, yellow on select */}
                    <circle
                      cx={c.cx}
                      cy={c.cy}
                      r={activeRadius}
                      fill={fillColor}
                      stroke={strokeColor}
                      strokeWidth={strokeW}
                      opacity={opacity}
                      className="transition-all duration-150"
                      pointerEvents="all"
                    />
                    {/* Arabic name shown inside the yellow circle when selected */}
                    {(isSelected || isHovered) && (
                      <text
                        x={c.cx}
                        y={c.cy}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill="#1A1A2E"
                        fontSize={activeFontSize}
                        fontWeight="bold"
                        fontFamily="'Noto Naskh Arabic', serif"
                        className="pointer-events-none"
                        stroke="#FFFFFF"
                        strokeWidth={isSelected ? 4 : 3}
                        paintOrder="stroke"
                        style={{ transition: 'font-size 150ms ease' }}
                      >
                        {c.nameArabic}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        <div className="xl:col-span-2 space-y-3 max-h-[500px] overflow-y-auto pr-1">
          <AnimatePresence>
            {displayCountries.map(c => {
              const isSelected = selectedCountry?.id === c.id;
              const isLearned = countriesLearned.includes(c.id);
              return (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                  onMouseEnter={() => setHoveredCountry(c.id)}
                  onMouseLeave={() => setHoveredCountry(null)}
                  onClick={() => { setSelectedCountry(c); setSelectedCountryForMap(c); handleClick(c); }}
                  className={`p-3 rounded-xl cursor-pointer transition-all hover:scale-[1.01] ${isSelected ? 'shadow-md border border-gold' : 'hover:shadow-sm border border-white/10'}`}
                  style={{ backgroundColor: isSelected ? 'rgba(201,162,39,0.15)' : 'rgba(26,26,46,0.6)' }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="ar text-lg truncate">{c.nameArabic}</div>
                      <div className="font-semibold truncate text-sand">{c.nameEnglish}</div>
                      <div className="text-xs text-sand/50">{c.region}</div>
                    </div>
                    <div className="flex items-center gap-2 ml-2 shrink-0">
                      <AudioPlayer folder="countries" fileKey={c.id} text={c.nameArabic} compact />
                      {isLearned && <span className="text-ok text-sm font-bold">✓</span>}
                    </div>
                  </div>
                  {isSelected && (
                    <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-2 text-sm italic text-sand/70 leading-relaxed">
                      💡 {c.fact}
                    </motion.p>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      <div className="p-4 rounded-2xl glass border border-gold/20">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <h3 className="font-bold mb-2 text-gold">📊 Progress</h3>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-3 rounded-full bg-white/10 overflow-hidden">
                <div className="h-full rounded-full transition-all bg-gold" style={{ width: `${(countriesLearned.length / 22) * 100}%` }} />
              </div>
              <span className="text-sm font-semibold shrink-0">{countriesLearned.length}/22</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {countries.map(c => (
              <span key={c.id} className={`text-[10px] px-2 py-0.5 rounded-full transition-all ${countriesLearned.includes(c.id) ? 'bg-ok text-white font-medium' : 'bg-white/10 text-sand/50'}`}>
                {c.nameEnglish}
              </span>
            ))}
          </div>
        </div>
      </div>

      <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
    </div>
  );
}
