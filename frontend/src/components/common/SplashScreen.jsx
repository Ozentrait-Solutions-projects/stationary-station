import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/* ─────────────────────────────────────────────────────────────────────────
   NexCart Premium Splash Screen
   Animation Sequence:
   0 ms  → Background gradient + orbs animate in
   200ms → Logo mark scales in with glow
   600ms → Brand name "NexCart" reveals letter by letter
   1050ms→ Tagline fades up
   1500ms→ Subtle progress arc fills
   2600ms→ Full screen fades out → app revealed
───────────────────────────────────────────────────────────────────────── */

const BRAND_CHARS = 'NexCart'.split('');

// ── NexCart N-logo SVG (matches the navbar logo) ──────────────────────
function NexLogo({ size = 64 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="spG1" x1="6" y1="6" x2="22.5" y2="30" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#818CF8" />
          <stop offset="100%" stopColor="#EC4899" />
        </linearGradient>
        <linearGradient id="spG2" x1="22.5" y1="6" x2="30" y2="30" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#60A5FA" />
          <stop offset="100%" stopColor="#818CF8" />
        </linearGradient>
        <linearGradient id="spG3" x1="6" y1="6" x2="13.5" y2="30" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#EC4899" />
          <stop offset="100%" stopColor="#60A5FA" />
        </linearGradient>
        <filter id="spGlow">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <path d="M6 6H13.5L22.5 30H15L6 6Z"     fill="url(#spG1)" filter="url(#spGlow)" />
      <path d="M22.5 30H30V6H22.5V30Z"         fill="url(#spG2)" filter="url(#spGlow)" />
      <path d="M6 6V18L13.5 30L22.5 30L6 6Z"   fill="url(#spG3)" filter="url(#spGlow)" />
    </svg>
  );
}

// ── Animated ring / arc progress indicator ────────────────────────────
function ProgressArc({ progress }) {
  const r = 46;
  const circ = 2 * Math.PI * r;
  const dash = circ * progress;
  return (
    <svg
      width={100}
      height={100}
      viewBox="0 0 100 100"
      style={{ position: 'absolute', top: -18, left: -18 }}
    >
      <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" />
      <motion.circle
        cx="50"
        cy="50"
        r={r}
        fill="none"
        stroke="url(#arcGrad)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeDasharray={`${dash} ${circ}`}
        style={{ rotate: -90, originX: '50px', originY: '50px' }}
      />
      <defs>
        <linearGradient id="arcGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#818CF8" />
          <stop offset="100%" stopColor="#EC4899" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// ── Floating particles ────────────────────────────────────────────────
const PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: 1.5 + Math.random() * 3,
  delay: Math.random() * 2,
  dur: 2.5 + Math.random() * 2.5,
  color: ['#818CF8','#EC4899','#60A5FA','#F59E0B','#A78BFA'][i % 5],
}));

export default function SplashScreen({ onComplete }) {
  const [phase, setPhase] = useState('in');
  const [progress, setProgress] = useState(0);
  const [showLogo, setShowLogo] = useState(false);
  const [showText, setShowText] = useState(false);
  const [showTagline, setShowTagline] = useState(false);
  const [showArc, setShowArc] = useState(false);
  const progressRef = useRef(null);

  /* Respect prefers-reduced-motion */
  const prefersReduced =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    if (prefersReduced) {
      onComplete();
      return;
    }

    const t1 = setTimeout(() => setShowLogo(true),    180);
    const t2 = setTimeout(() => setShowText(true),    580);
    const t3 = setTimeout(() => setShowTagline(true), 1050);
    const t4 = setTimeout(() => setShowArc(true),     1100);

    let start = null;
    const animArc = (ts) => {
      if (!start) start = ts;
      const elapsed = ts - start;
      const p = Math.min(elapsed / 1300, 1);
      setProgress(p);
      if (p < 1) progressRef.current = requestAnimationFrame(animArc);
    };
    const t5 = setTimeout(() => {
      progressRef.current = requestAnimationFrame(animArc);
    }, 1100);

    const t6 = setTimeout(() => setPhase('out'), 2450);
    const t7 = setTimeout(() => onComplete(), 2900);

    return () => {
      [t1,t2,t3,t4,t5,t6,t7].forEach(clearTimeout);
      if (progressRef.current) cancelAnimationFrame(progressRef.current);
    };
  }, [onComplete, prefersReduced]);

  return (
    <AnimatePresence>
      {phase === 'in' && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.04 }}
          transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            background: 'linear-gradient(135deg, #0a0a1a 0%, #12063a 40%, #1a0a30 70%, #0d0d24 100%)',
          }}
          aria-hidden="true"
          role="img"
          aria-label="NexCart loading"
        >
          {/* Deep glow orbs */}
          <div style={{
            position: 'absolute', top: '-20%', left: '-10%',
            width: '60vw', height: '60vw', maxWidth: 480, maxHeight: 480,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(99,102,241,0.22) 0%, transparent 70%)',
            filter: 'blur(60px)',
            pointerEvents: 'none',
          }} />
          <div style={{
            position: 'absolute', bottom: '-15%', right: '-10%',
            width: '50vw', height: '50vw', maxWidth: 400, maxHeight: 400,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(236,72,153,0.18) 0%, transparent 70%)',
            filter: 'blur(60px)',
            pointerEvents: 'none',
          }} />
          <div style={{
            position: 'absolute', top: '40%', right: '20%',
            width: '30vw', height: '30vw', maxWidth: 240, maxHeight: 240,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(96,165,250,0.12) 0%, transparent 70%)',
            filter: 'blur(48px)',
            pointerEvents: 'none',
          }} />

          {/* Floating particles */}
          {PARTICLES.map(p => (
            <motion.div
              key={p.id}
              style={{
                position: 'absolute',
                left: `${p.x}%`,
                top: `${p.y}%`,
                width: p.size,
                height: p.size,
                borderRadius: '50%',
                backgroundColor: p.color,
                opacity: 0,
              }}
              animate={{
                y: [0, -24, 0],
                opacity: [0, 0.7, 0],
                scale: [0.8, 1.2, 0.8],
              }}
              transition={{
                delay: p.delay,
                duration: p.dur,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          ))}

          {/* Dot grid overlay */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.04,
            backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
            backgroundSize: '28px 28px',
          }} />

          {/* Center content */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0, position: 'relative' }}>

            {/* Logo + arc ring */}
            <div style={{ position: 'relative', width: 64, height: 64, marginBottom: 28 }}>
              <AnimatePresence>
                {showLogo && (
                  <motion.div
                    initial={{ scale: 0.4, opacity: 0, filter: 'blur(12px)' }}
                    animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
                    style={{ position: 'relative', zIndex: 2 }}
                  >
                    <div style={{
                      position: 'absolute', inset: -12, borderRadius: '50%',
                      background: 'radial-gradient(circle, rgba(129,140,248,0.35) 0%, transparent 70%)',
                      filter: 'blur(10px)',
                    }} />
                    <NexLogo size={64} />
                  </motion.div>
                )}
              </AnimatePresence>
              {showArc && <ProgressArc progress={progress} />}
            </div>

            {/* Brand name — letter-by-letter reveal */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 0, overflow: 'hidden' }}>
              {BRAND_CHARS.map((char, i) => (
                showText && (
                  <motion.span
                    key={i}
                    initial={{ y: 30, opacity: 0, filter: 'blur(6px)' }}
                    animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
                    transition={{
                      delay: i * 0.055,
                      duration: 0.42,
                      ease: [0.34, 1.2, 0.64, 1],
                    }}
                    style={{
                      fontFamily: "'Outfit', 'Inter', sans-serif",
                      fontWeight: 900,
                      fontSize: 'clamp(2.2rem, 8vw, 3.2rem)',
                      letterSpacing: '-0.02em',
                      lineHeight: 1,
                      background: i < 3
                        ? 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 60%, #818CF8 100%)'
                        : 'linear-gradient(135deg, #818CF8 0%, #A78BFA 50%, #EC4899 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                      display: 'inline-block',
                    }}
                  >
                    {char}
                  </motion.span>
                )
              ))}
            </div>

            {/* Divider */}
            {showTagline && (
              <motion.div
                initial={{ scaleX: 0, opacity: 0 }}
                animate={{ scaleX: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.05, ease: 'easeOut' }}
                style={{
                  width: 48, height: 1.5,
                  margin: '14px 0 12px',
                  borderRadius: 9999,
                  background: 'linear-gradient(90deg, #6366F1, #EC4899)',
                  transformOrigin: 'center',
                }}
              />
            )}

            {/* Tagline */}
            {showTagline && (
              <motion.p
                initial={{ y: 12, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.45, delay: 0.12, ease: 'easeOut' }}
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 'clamp(0.7rem, 2.5vw, 0.82rem)',
                  fontWeight: 500,
                  letterSpacing: '0.22em',
                  textTransform: 'uppercase',
                  color: 'rgba(199, 210, 254, 0.65)',
                  textAlign: 'center',
                  margin: 0,
                }}
              >
                Shop Smart. Shop Fast.
              </motion.p>
            )}
          </div>

          {/* Bottom tagline */}
          {showTagline && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              style={{
                position: 'absolute',
                bottom: 'max(36px, env(safe-area-inset-bottom, 36px))',
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                whiteSpace: 'nowrap',
              }}
            >
              <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'rgba(129,140,248,0.5)' }} />
              <span style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '0.65rem',
                fontWeight: 600,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: 'rgba(199,210,254,0.35)',
              }}>
                Your Smart Shopping Destination
              </span>
              <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'rgba(236,72,153,0.5)' }} />
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
