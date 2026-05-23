'use client';
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
}) {
  const cornerColor = 'rgba(255,255,255,.92)';
  const cornerStyle = (pos) => {
    const base = {
      position: 'absolute',
      width: cornerSize,
      height: cornerSize,
      pointerEvents: 'none',
    };
    if (pos === 'tl') return { ...base, top: cornerInset, left: cornerInset, borderTop: `${cornerThickness}px solid ${cornerColor}`, borderLeft: `${cornerThickness}px solid ${cornerColor}` };
    if (pos === 'tr') return { ...base, top: cornerInset, right: cornerInset, borderTop: `${cornerThickness}px solid ${cornerColor}`, borderRight: `${cornerThickness}px solid ${cornerColor}` };
    if (pos === 'bl') return { ...base, bottom: cornerInset, left: cornerInset, borderBottom: `${cornerThickness}px solid ${cornerColor}`, borderLeft: `${cornerThickness}px solid ${cornerColor}` };
    if (pos === 'br') return { ...base, bottom: cornerInset, right: cornerInset, borderBottom: `${cornerThickness}px solid ${cornerColor}`, borderRight: `${cornerThickness}px solid ${cornerColor}` };
  };

  const stripCommon = {
    position: 'absolute',
    color: 'rgba(255,255,255,.9)',
    fontFamily: 'var(--mono)',
    fontSize: 10,
    letterSpacing: '.18em',
    textTransform: 'uppercase',
    pointerEvents: 'none',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  };

  return (
    <div
      onClick={onClick}
      style={{
        position: 'relative',
        background: '#000',
        cursor: onClick ? 'pointer' : 'default',
        overflow: 'hidden',
      }}
    >
      {/* image / content */}
      {children}

      {/* darken outer band slightly for cinematic feel */}
      <div style={{ position: 'absolute', inset: 0, boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.06)', pointerEvents: 'none' }} />

      {/* rule-of-thirds grid (very subtle) */}
      {showGrid && (
        <svg
          style={{ position: 'absolute', inset: cornerInset + 6, width: `calc(100% - ${(cornerInset + 6) * 2}px)`, height: `calc(100% - ${(cornerInset + 6) * 2}px)`, pointerEvents: 'none', opacity: 0.18 }}
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
          style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 28, height: 28, pointerEvents: 'none', opacity: 0.65 }}
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
        <div style={{ ...stripCommon, top: cornerInset + 6, left: cornerInset + 18 }}>
          {recLabel && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#e74848', display: 'inline-block' }} />
              <span style={{ color: '#e74848' }}>{recLabel}</span>
            </span>
          )}
          {cameraLabel && <span style={{ opacity: 0.85 }}>{cameraLabel}</span>}
          {lensLabel && (
            <>
              <span style={{ opacity: 0.45 }}>·</span>
              <span style={{ opacity: 0.85 }}>{lensLabel}</span>
            </>
          )}
        </div>
      )}

      {(isoLabel || shutterLabel || apertureLabel) && (
        <div style={{ ...stripCommon, bottom: cornerInset + 6, left: cornerInset + 18 }}>
          {apertureLabel && <span>{apertureLabel}</span>}
          {shutterLabel && (
            <>
              <span style={{ opacity: 0.45 }}>·</span>
              <span>{shutterLabel}</span>
            </>
          )}
          {isoLabel && (
            <>
              <span style={{ opacity: 0.45 }}>·</span>
              <span>{isoLabel}</span>
            </>
          )}
        </div>
      )}

      {/* bottom-right: aperture circle + AF box style hint */}
      {showAF && (
        <div style={{ ...stripCommon, bottom: cornerInset + 6, right: cornerInset + 18 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, border: '1px solid rgba(255,255,255,.85)', borderRadius: '50%' }} />
            <span style={{ opacity: 0.85 }}>AF · S</span>
          </span>
        </div>
      )}
    </div>
  );
}
