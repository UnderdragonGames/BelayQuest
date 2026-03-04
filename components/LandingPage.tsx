import { useRef, useCallback, useEffect, useState } from "react";
import { View, Image, StyleSheet, Pressable, Text } from "react-native";
import { router } from "expo-router";

// Toggle with ?layout=1 in URL
const DEBUG_LAYOUT =
  typeof window !== "undefined" &&
  new URLSearchParams(window.location.search).has("layout");

// Full-width parallax scene layers (back to front)
const SCENE_LAYERS = [
  { source: require("../assets/images/homepage/0BG.png"), speed: 0.015 },
  { source: require("../assets/images/homepage/1CloudsBack.png"), speed: 0.045 },
  { source: require("../assets/images/homepage/2Castles.png"), speed: 0.08 },
  { source: require("../assets/images/homepage/3CloudsMid.png"), speed: 0.11 },
  { source: require("../assets/images/homepage/4MinorIslands.png"), speed: 0.14 },
  { source: require("../assets/images/homepage/5CloudsFor.png"), speed: 0.18 },
];

const CLIMBER_SPEED = 0.22;
const LOGO_SPEED = -0.025;
const MAX_OFFSET = 55;

// ─── Layout Debug Tool ───
// Activate by adding ?layout=1 to the URL
// Drag elements to reposition, drag corner handle to resize
// Press "L" to log all values to console as style objects

const LAYER_NAMES = [
  "0-BG",
  "1-CloudsBack",
  "2-Castles",
  "3-CloudsMid",
  "4-MinorIslands",
  "5-CloudsFore",
];

// Layout items use % for BOTH position and size (relative to viewport)
// This keeps everything visible and resolution-independent
type LayoutItem = {
  id: string;
  label: string;
  x: number;  // center X as % of viewport width
  y: number;  // center Y as % of viewport height
  w: number;  // width as % of viewport width
  h: number;  // height as % of viewport height
};

const INITIAL_LAYOUT: LayoutItem[] = [
  { id: "scene",   label: "Scene (mask)",  x: 50,   y: 50,   w: 100,  h: 100  },
  { id: "layer-0", label: "0-BG",          x: 48,   y: 33,   w: 99,   h: 99   },
  { id: "layer-1", label: "1-CloudsBack",  x: 50,   y: 39,   w: 99,   h: 99   },
  { id: "layer-2", label: "2-Castles",     x: 44,   y: 46,   w: 78,   h: 67   },
  { id: "layer-3", label: "3-CloudsMid",   x: 47,   y: 66,   w: 95,   h: 82   },
  { id: "layer-4", label: "4-MinorIslands",x: 48,   y: 26,   w: 59,   h: 41   },
  { id: "layer-5", label: "5-CloudsFore",  x: 47,   y: 58,   w: 96,   h: 73   },
  { id: "climber", label: "Climber",       x: 48,   y: 50,   w: 52,   h: 63   },
  { id: "logo",    label: "Logo",          x: 50,   y: 16,   w: 50,   h: 29   },
  { id: "badges",  label: "Badges",        x: 50,   y: 88,   w: 30,   h: 12   },
  { id: "legal",   label: "Legal",         x: 50,   y: 95,   w: 14,   h: 3    },
];

function LayoutDebugOverlay({
  items,
  onChange,
}: {
  items: LayoutItem[];
  onChange: (items: LayoutItem[]) => void;
}) {
  const [locked, setLocked] = useState<Set<string>>(() => new Set());
  const [selected, setSelected] = useState<string | null>(null);
  const dragging = useRef<{
    idx: number;
    type: "move" | "resize";
    startMouseX: number;
    startMouseY: number;
    startX: number;
    startY: number;
    startW: number;
    startH: number;
  } | null>(null);

  const toggleLock = (id: string) => {
    setLocked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const d = dragging.current;
      if (!d) return;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const dx = e.clientX - d.startMouseX;
      const dy = e.clientY - d.startMouseY;

      const next = [...items];
      if (d.type === "move") {
        next[d.idx] = {
          ...next[d.idx],
          x: Math.round((d.startX + (dx / vw) * 100) * 10) / 10,
          y: Math.round((d.startY + (dy / vh) * 100) * 10) / 10,
        };
      } else {
        next[d.idx] = {
          ...next[d.idx],
          w: Math.round((d.startW + (dx / vw) * 100) * 10) / 10,
          h: Math.round((d.startH + (dy / vh) * 100) * 10) / 10,
        };
      }
      onChange(next);
    };
    const onUp = () => {
      dragging.current = null;
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [items, onChange]);

  // Press L to log
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "l" || e.key === "L") {
        console.log("\n=== LAYOUT VALUES (all % of viewport) ===");
        items.forEach((it) => {
          console.log(`${it.label}: { x: ${it.x}, y: ${it.y}, w: ${it.w}, h: ${it.h} }`);
        });
        console.log("=====================\n");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [items]);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 9999,
        pointerEvents: "none",
      }}
    >
      {/* Panel: layer list with lock toggles */}
      <div
        style={{
          position: "absolute",
          top: 8,
          left: 8,
          background: "rgba(0,0,0,0.85)",
          color: "#0f0",
          fontFamily: "monospace",
          fontSize: 11,
          padding: "8px 10px",
          borderRadius: 4,
          pointerEvents: "auto",
          zIndex: 10000,
          maxHeight: "90vh",
          overflowY: "auto",
          minWidth: 220,
        }}
      >
        <div style={{ marginBottom: 6, color: "#aaa", fontSize: 10 }}>
          Click name to select · Click lock to toggle · Press L to log
        </div>
        {items.map((it) => {
          const isLocked = locked.has(it.id);
          const isSelected = selected === it.id;
          return (
            <div
              key={it.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "2px 0",
                cursor: "pointer",
                opacity: isLocked ? 0.4 : 1,
                background: isSelected ? "rgba(0,255,0,0.15)" : "transparent",
                borderRadius: 2,
                paddingLeft: 4,
                paddingRight: 4,
              }}
            >
              {/* Lock button */}
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  toggleLock(it.id);
                }}
                style={{
                  cursor: "pointer",
                  fontSize: 12,
                  width: 16,
                  textAlign: "center",
                }}
                title={isLocked ? "Unlock" : "Lock"}
              >
                {isLocked ? "🔒" : "🔓"}
              </div>
              {/* Name — click to select */}
              <div
                onClick={() => setSelected(isSelected ? null : it.id)}
                style={{ flex: 1, color: isSelected ? "#0f0" : "#8f8" }}
              >
                {it.label}
              </div>
              <div style={{ color: "#666", fontSize: 9 }}>
                {it.w.toFixed(1)}×{it.h.toFixed(1)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Boxes for each unlocked item — only selected or all-if-none-selected */}
      {items.map((it, idx) => {
        const isLocked = locked.has(it.id);
        const isSelected = selected === it.id;
        // Show box if: selected, or no selection and not locked
        const showBox = isSelected || (!selected && !isLocked);
        if (!showBox) return null;

        return (
          <div
            key={it.id}
            style={{
              position: "absolute",
              left: `${it.x - it.w / 2}vw`,
              top: `${it.y - it.h / 2}vh`,
              width: `${it.w}vw`,
              height: `${it.h}vh`,
              border: isSelected
                ? "2px solid rgba(255,255,0,0.9)"
                : "2px solid rgba(0,255,0,0.5)",
              background: isSelected
                ? "rgba(255,255,0,0.08)"
                : "rgba(0,255,0,0.05)",
              pointerEvents: isLocked ? "none" : "auto",
              cursor: isLocked ? "default" : "move",
              userSelect: "none",
            }}
            onMouseDown={(e) => {
              if (isLocked) return;
              e.preventDefault();
              setSelected(it.id);
              dragging.current = {
                idx,
                type: "move",
                startMouseX: e.clientX,
                startMouseY: e.clientY,
                startX: it.x,
                startY: it.y,
                startW: it.w,
                startH: it.h,
              };
            }}
          >
            {/* Label */}
            <div
              style={{
                position: "absolute",
                top: -18,
                left: 0,
                background: "rgba(0,0,0,0.8)",
                color: isSelected ? "#ff0" : "#0f0",
                fontFamily: "monospace",
                fontSize: 10,
                padding: "1px 4px",
                borderRadius: 2,
                whiteSpace: "nowrap",
              }}
            >
              {it.label} ({it.x}%, {it.y}%) {it.w.toFixed(1)}×{it.h.toFixed(1)}%
            </div>

            {/* Resize handle */}
            {!isLocked && (
              <div
                style={{
                  position: "absolute",
                  right: -4,
                  bottom: -4,
                  width: 12,
                  height: 12,
                  background: isSelected ? "#ff0" : "#0f0",
                  cursor: "nwse-resize",
                  borderRadius: 2,
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  dragging.current = {
                    idx,
                    type: "resize",
                    startMouseX: e.clientX,
                    startMouseY: e.clientY,
                    startX: it.x,
                    startY: it.y,
                    startW: it.w,
                    startH: it.h,
                  };
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Component ───

// Responsive: on portrait/narrow screens, scale up key elements
function getResponsiveLayout(): LayoutItem[] {
  if (typeof window === "undefined") return INITIAL_LAYOUT;
  const ratio = window.innerWidth / window.innerHeight;
  // Landscape (>1): use as-is. Portrait (<1): scale up proportionally.
  if (ratio >= 1) return INITIAL_LAYOUT;

  // Scale factor: at ratio=0.5 (tall phone), scale ~1.8x. At ratio=0.8, ~1.25x.
  const scale = Math.min(2, 1 / ratio);

  return INITIAL_LAYOUT.map((item) => {
    if (item.id === "logo") {
      return { ...item, w: 90, h: Math.min(95, item.h * scale) };
    }
    if (item.id === "badges") {
      return { ...item, w: 90, h: Math.min(95, item.h * scale) };
    }
    if (item.id === "climber") {
      return { ...item, w: Math.min(95, item.w * scale), h: Math.min(95, item.h * scale) };
    }
    if (item.id === "legal") {
      return { ...item, w: Math.min(95, item.w * scale) };
    }
    return item;
  });
}

export function LandingPage() {
  const [layoutItems, setLayoutItems] = useState(getResponsiveLayout);
  const layerRefs = useRef<(View | null)[]>([]);
  const climberRef = useRef<View>(null);
  const logoRef = useRef<View>(null);
  const rafId = useRef<number>(0);
  const targetX = useRef(0);
  const targetY = useRef(0);
  const currentX = useRef(0);
  const currentY = useRef(0);

  // Recalculate layout on resize (orientation change, etc.)
  useEffect(() => {
    if (DEBUG_LAYOUT) return; // Don't override user dragging
    const onResize = () => setLayoutItems(getResponsiveLayout());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Inject CSS for the radial mask (not expressible in RN StyleSheet)
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      .scene-mask {
        -webkit-mask-image: radial-gradient(ellipse 46% 44% at 50% 50%, black 65%, transparent 100%);
        mask-image: radial-gradient(ellipse 46% 44% at 50% 50%, black 65%, transparent 100%);
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Apply CSS class to scene container after mount
  const sceneRef = useRef<View>(null);
  useEffect(() => {
    if (sceneRef.current) {
      const el = sceneRef.current as unknown as HTMLElement;
      el.classList.add("scene-mask");
    }
  }, []);

  // Smooth lerp animation loop (disabled in layout mode)
  useEffect(() => {
    if (DEBUG_LAYOUT) return;

    const animate = () => {
      const ease = 0.06;
      currentX.current += (targetX.current - currentX.current) * ease;
      currentY.current += (targetY.current - currentY.current) * ease;

      const x = currentX.current;
      const y = currentY.current;

      layerRefs.current.forEach((ref, i) => {
        if (!ref) return;
        const el = ref as unknown as HTMLElement;
        const { speed } = SCENE_LAYERS[i];
        const tx = x * speed * MAX_OFFSET;
        const ty = y * speed * MAX_OFFSET;
        el.style.transform = `translate(${tx}px, ${ty}px)`;
      });

      if (climberRef.current) {
        const el = climberRef.current as unknown as HTMLElement;
        const tx = x * CLIMBER_SPEED * MAX_OFFSET;
        const ty = y * CLIMBER_SPEED * MAX_OFFSET;
        el.style.transform = `translate(${tx}px, ${ty}px)`;
      }

      if (logoRef.current) {
        const el = logoRef.current as unknown as HTMLElement;
        const tx = x * LOGO_SPEED * MAX_OFFSET;
        const ty = y * LOGO_SPEED * MAX_OFFSET;
        el.style.transform = `translate(${tx}px, ${ty}px)`;
      }

      rafId.current = requestAnimationFrame(animate);
    };

    rafId.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId.current);
  }, []);

  useEffect(() => {
    if (DEBUG_LAYOUT) return;

    const handleMouseMove = (e: MouseEvent) => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      targetX.current = (e.clientX - w / 2) / (w / 2);
      targetY.current = (e.clientY - h / 2) / (h / 2);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const setLayerRef = useCallback(
    (index: number) => (ref: View | null) => {
      layerRefs.current[index] = ref;
    },
    []
  );

  // Always read positions from layout state (debug mode allows dragging to update)
  const getLayout = (id: string) => {
    return layoutItems.find((it) => it.id === id)!;
  };

  const logoLayout = getLayout("logo");
  const climberLayout = getLayout("climber");
  const badgesLayout = getLayout("badges");
  const legalLayout = getLayout("legal");
  const sceneLayout = getLayout("scene");

  return (
    <View style={styles.container}>
      {/* Parchment frame — fixed, no parallax */}
      <Image
        source={require("../assets/images/homepage/00Parchment.png")}
        style={styles.parchment}
        resizeMode="cover"
      />

      {/* Masked scene group — parallax layers + climber inside soft radial mask */}
      <View
        ref={sceneRef}
        style={{
          position: "absolute",
          left: `${sceneLayout.x - sceneLayout.w / 2}vw`,
          top: `${sceneLayout.y - sceneLayout.h / 2}vh`,
          width: `${sceneLayout.w}vw`,
          height: `${sceneLayout.h}vh`,
          overflow: "hidden",
        } as any}
      >
        {SCENE_LAYERS.map((layer, i) => {
          const l = getLayout(`layer-${i}`);
          return (
            <View
              key={i}
              ref={setLayerRef(i)}
              style={{
                position: "absolute",
                left: `${l.x - l.w / 2}vw`,
                top: `${l.y - l.h / 2}vh`,
                width: `${l.w}vw`,
                height: `${l.h}vh`,
              } as any}
            >
              <Image
                source={layer.source}
                style={styles.layerImage}
                resizeMode="cover"
              />
            </View>
          );
        })}

        {/* Climber inside the mask group */}
        <View
          ref={climberRef}
          style={{
            position: "absolute",
            left: `${climberLayout.x - climberLayout.w / 2}vw`,
            top: `${climberLayout.y - climberLayout.h / 2}vh`,
          } as any}
        >
          <Image
            source={require("../assets/images/homepage/6Climber.png")}
            style={{ width: `${climberLayout.w}vw`, height: `${climberLayout.h}vh` } as any}
            resizeMode="contain"
          />
        </View>
      </View>

      {/* Logo — OUTSIDE mask, over everything */}
      <View
        ref={logoRef}
        style={{
          position: "absolute",
          left: `${logoLayout.x - logoLayout.w / 2}vw`,
          top: `${logoLayout.y - logoLayout.h / 2}vh`,
        } as any}
      >
        <Image
          source={require("../assets/images/homepage/TitleLogo.png")}
          style={{ width: `${logoLayout.w}vw`, height: `${logoLayout.h}vh` } as any}
          resizeMode="contain"
        />
      </View>

      {/* Store badges */}
      <View
        style={{
          position: "absolute",
          left: `${badgesLayout.x - badgesLayout.w / 2}vw`,
          top: `${badgesLayout.y - badgesLayout.h / 2}vh`,
          width: `${badgesLayout.w}vw`,
          height: `${badgesLayout.h}vh`,
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
        } as any}
      >
        <Text style={styles.comingSoon}>Coming soon to</Text>
        <View style={styles.badgeRow}>
          <Pressable style={styles.badge}>
            <Image
              source={require("../assets/images/homepage/AppStore.png")}
              style={styles.badgeImage}
              resizeMode="contain"
            />
          </Pressable>
          <Pressable style={styles.badge}>
            <Image
              source={require("../assets/images/homepage/GooglePlay.png")}
              style={styles.badgeImage}
              resizeMode="contain"
            />
          </Pressable>
        </View>
      </View>

      {/* Legal links */}
      <View
        style={{
          position: "absolute",
          left: `${legalLayout.x - legalLayout.w / 2}vw`,
          top: `${legalLayout.y - legalLayout.h / 2}vh`,
          width: `${legalLayout.w}vw`,
          height: `${legalLayout.h}vh`,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
        } as any}
      >
        <Pressable onPress={() => router.push("/legal/privacy")}>
          <Text style={styles.legalText}>Privacy Policy</Text>
        </Pressable>
        <Text style={styles.legalSeparator}>·</Text>
        <Pressable onPress={() => router.push("/legal/tos")}>
          <Text style={styles.legalText}>Terms of Service</Text>
        </Pressable>
      </View>

      {/* Debug overlay */}
      {DEBUG_LAYOUT && (
        <LayoutDebugOverlay items={layoutItems} onChange={setLayoutItems} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#2a1f14",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  parchment: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },
  sceneContainer: {
    position: "absolute",
    left: "7.5vw",   // (50 - 85/2)
    top: "2.5vh",    // (50 - 95/2)
    width: "85vw",
    height: "95vh",
    overflow: "hidden",
  } as any,
  layerWrapper: {
    position: "absolute",
    // Default — overridden per-layer in layout mode
    width: "110%",
    height: "110%",
    top: "-5%",
    left: "-5%",
  },
  layerImage: {
    width: "100%",
    height: "100%",
  },
  climberContainer: {
    position: "absolute",
    left: "22vw",    // (48 - 52/2)
    top: "18.5vh",   // (50 - 63/2)
  } as any,
  climber: {
    width: "52vw",
    height: "63vh",
  } as any,
  logoContainer: {
    position: "absolute",
    left: "25vw",    // (50 - 50/2)
    top: "1.5vh",    // (16 - 29/2)
  } as any,
  logo: {
    width: "50vw",
    height: "29vh",
  } as any,
  badgeContainer: {
    position: "absolute",
    left: "40vw",    // (50 - 20/2)
    top: "83vh",     // (88 - 10/2)
    width: "20vw",
    height: "10vh",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  } as any,
  comingSoon: {
    color: "#5c4a32",
    fontSize: 13,
    fontWeight: "500",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  badgeRow: {
    flexDirection: "row",
    gap: 16,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  badge: {
    opacity: 0.9,
  },
  badgeImage: {
    width: 160,
    height: 48,
  },
  legalLinks: {
    position: "absolute",
    left: "43vw",    // (50 - 14/2)
    top: "93.5vh",   // (95 - 3/2)
    width: "14vw",
    height: "3vh",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  } as any,
  legalText: {
    color: "#7a6b54",
    fontSize: 12,
  },
  legalSeparator: {
    color: "#7a6b54",
    fontSize: 12,
  },
});
