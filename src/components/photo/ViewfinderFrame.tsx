import React from 'react';

/**
 * Camera-viewfinder frame:
 *   - 4 L-shaped corner brackets (white) around the image
 *   - Crosshair / center reticle
 *   - Optional rule-of-thirds grid (subtle)
 *   - Top-left/right + bottom-left/right metadata strips
 *     (camera/lens/iso/shutter/aperture, REC dot)
 *
 * Designed for dark backgrounds — corners + grid render in white.
 */

interface ViewfinderFrameProps {
  children: React.ReactNode;
  cameraLabel?: string;
  lensLabel?: string;
  isoLabel?: string;
  shutterLabel?: string;
  apertureLabel?: string;
  recLabel?: string;
  onClick?: () => void;
  showGrid?: boolean;
  showCrosshair?: boolean;
  showAF?: boolean;
  cornerInset?: number;
  cornerSize?: number;
  cornerThickness?: number;
}

export function ViewfinderFrame({
  children,
  cameraLabel = '',
  lensLabel = '',
  isoLabel = '',
  shutterLabel = '',
  apertureLabel = '',
  recLabel = 'REC',
  onClick,
  showGrid = true,
  showCrosshair = true,
  showAF = true,
  cornerInset = 14,
  cornerSize = 28,
  cornerThickness = 1.5,
}: ViewfinderFrameProps) {
  const cornerColor = 'rgba(255,255,255,.92)';

  // runtime: bracket size/position from props
  const cornerStyle = (pos: 'tl' | 'tr' | 'bl' | 'br'): React.CSSProperties => {
    const base: React.CSSProperties = {
      position: 'absolute',
      width: cornerSize,
      height: cornerSize,
      pointerEvents: 'none',
    };
    if (pos === 'tl') return { ...base, top: cornerInset, left: cornerInset, borderTop: `${cornerThickness}px solid ${cornerColor}`, borderLeft: `${cornerThickness}px solid ${cornerColor}` };
    if (pos === 'tr') return { ...base, top: cornerInset, right: cornerInset, borderTop: `${cornerThickness}px solid ${cornerColor}`, borderRight: `${cornerThickness}px solid ${cornerColor}` };
    if (pos === 'bl') return { ...base, bottom: cornerInset, left: cornerInset, borderBottom: `${cornerThickness}px solid ${cornerColor}`, borderLeft: `${cornerThickness}px solid ${cornerColor}` };
    return { ...base, bottom: cornerInset, right: cornerInset, borderBottom: `${cornerThickness}px solid ${cornerColor}`, borderRight: `${cornerThickness}px solid ${cornerColor}` };
  };

  // Metadata strip shared Tailwind classes (static styling)
  const stripCommon = 'absolute font-mono text-[10px] tracking-[.18em] uppercase text-white/90 pointer-events-none flex items-center gap-2';

  return (
    <div
      onClick={onClick}
      className={`relative bg-black overflow-hidden ${onClick ? 'cursor-pointer' : 'cursor-default'}`}
    >
      {/* image / content */}
      {children}

      {/* darken outer band slightly for cinematic feel */}
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_0_1px_rgba(255,255,255,.06)]" />

      {/* rule-of-thirds grid (very subtle) */}
      {showGrid && (
        <svg
          // runtime: grid inset/size derived from cornerInset prop
          style={{
            position: 'absolute',
            inset: cornerInset + 6,
            width: `calc(100% - ${(cornerInset + 6) * 2}px)`,
            height: `calc(100% - ${(cornerInset + 6) * 2}px)`,
            pointerEvents: 'none',
            opacity: 0.18,
          }}
          preserveAspectRatio="none"
          viewBox="0 0 300 300"
        >
          <line x1="100" y1="0" x2="100" y2="300" stroke="white" strokeWidth="0.5" />
          <line x1="200" y1="0" x2="200" y2="300" stroke="white" strokeWidth="0.5" />
          <line x1="0" y1="100" x2="300" y2="100" stroke="white" strokeWidth="0.5" />
          <line x1="0" y1="200" x2="300" y2="200" stroke="white" strokeWidth="0.5" />
        </svg>
      )}

      {/* center crosshair */}
      {showCrosshair && (
        <svg
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-7 h-7 pointer-events-none opacity-65"
          viewBox="0 0 28 28"
        >
          <circle cx="14" cy="14" r="6" stroke="white" strokeWidth="1" fill="none" />
          <line x1="14" y1="0" x2="14" y2="6" stroke="white" strokeWidth="1" />
          <line x1="14" y1="22" x2="14" y2="28" stroke="white" strokeWidth="1" />
          <line x1="0" y1="14" x2="6" y2="14" stroke="white" strokeWidth="1" />
          <line x1="22" y1="14" x2="28" y2="14" stroke="white" strokeWidth="1" />
          <circle cx="14" cy="14" r="1" fill="white" />
        </svg>
      )}

      {/* 4 L-shaped corner brackets */}
      <div style={cornerStyle('tl')} />
      <div style={cornerStyle('tr')} />
      <div style={cornerStyle('bl')} />
      <div style={cornerStyle('br')} />

      {/* metadata strips — match a Sony/Canon HUD */}
      {(cameraLabel || lensLabel) && (
        // runtime: top/left offsets derived from cornerInset prop
        <div
          className={stripCommon}
          style={{ top: cornerInset + 6, left: cornerInset + 18 }}
        >
          {recLabel && (
            <span className="inline-flex items-center gap-1.5">
              <span className="w-[7px] h-[7px] rounded-full bg-[#e74848] inline-block" />
              <span className="text-[#e74848]">{recLabel}</span>
            </span>
          )}
          {cameraLabel && <span className="opacity-85">{cameraLabel}</span>}
          {lensLabel && (
            <>
              <span className="opacity-45">·</span>
              <span className="opacity-85">{lensLabel}</span>
            </>
          )}
        </div>
      )}

      {(isoLabel || shutterLabel || apertureLabel) && (
        // runtime: bottom/left offsets derived from cornerInset prop
        <div
          className={stripCommon}
          style={{ bottom: cornerInset + 6, left: cornerInset + 18 }}
        >
          {apertureLabel && <span>{apertureLabel}</span>}
          {shutterLabel && (
            <>
              <span className="opacity-45">·</span>
              <span>{shutterLabel}</span>
            </>
          )}
          {isoLabel && (
            <>
              <span className="opacity-45">·</span>
              <span>{isoLabel}</span>
            </>
          )}
        </div>
      )}

      {/* bottom-right: aperture circle + AF box style hint */}
      {showAF && (
        // runtime: bottom/right offsets derived from cornerInset prop
        <div
          className={stripCommon}
          style={{ bottom: cornerInset + 6, right: cornerInset + 18 }}
        >
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2 h-2 border border-white/85 rounded-full" />
            <span className="opacity-85">AF · S</span>
          </span>
        </div>
      )}
    </div>
  );
}
