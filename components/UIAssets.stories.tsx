import React, { useState } from 'react';
import { View, Image, ImageBackground, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { UI } from '@/assets/images/ui';
import { ICON_NAMES } from '@/assets/images/icons';
import { ParchmentPanel } from '@/components/ParchmentPanel';
import { Avatar } from '@/components/Avatar';
import { XpBar } from '@/components/XpBar';
import { SectionHeader } from '@/components/SectionHeader';
import { StoneButton as StoneButtonComponent } from '@/components/StoneButton';
import { PixelIcon } from '@/components/PixelIcon';

// ─── Helpers ─────────────────────────────────────────────────────────

function Label({ text }: { text: string }) {
  return <Text style={s.label}>{text}</Text>;
}

function Sub({ text }: { text: string }) {
  return <Text style={s.subheading}>{text}</Text>;
}

function Sprite({ src, w, h, label }: { src: any; w: number; h: number; label: string }) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Label text={`${label} (${w}x${h})`} />
      <Image source={src} style={{ width: w, height: h, marginTop: 2 }} />
    </View>
  );
}

function SpriteRow({ items }: { items: { src: any; w: number; h: number; label: string }[] }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginBottom: 12 }}>
      {items.map((item) => (
        <View key={item.label}>
          <Label text={item.label} />
          <Image source={item.src} style={{ width: item.w, height: item.h, marginTop: 2 }} />
        </View>
      ))}
    </View>
  );
}

function NineSliceRow({
  left, mid, right, height, capW, capRW, children,
}: {
  left: any; mid: any; right: any; height: number; capW: number; capRW?: number; children?: React.ReactNode;
}) {
  return (
    <View style={{ flexDirection: 'row', height, alignItems: 'center' }}>
      <Image source={left} style={{ width: capW, height }} resizeMode="stretch" />
      <View style={{ flex: 1, height }}>
        <Image source={mid} style={{ width: '100%', height }} resizeMode="stretch" />
        {children && (
          <View style={StyleSheet.absoluteFill}>
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>{children}</View>
          </View>
        )}
      </View>
      <Image source={right} style={{ width: capRW ?? capW, height }} resizeMode="stretch" />
    </View>
  );
}

function HTile({ src, w, h, width }: { src: any; w: number; h: number; width?: number }) {
  return (
    <View style={{ width, flex: width ? undefined : 1, height: h, flexDirection: 'row', overflow: 'hidden' }}>
      {Array.from({ length: 30 }).map((_, i) => (
        <Image key={i} source={src} style={{ width: w, height: h }} />
      ))}
    </View>
  );
}

function InteractiveSlider() {
  const [value, setValue] = useState(0.5);
  const trackRef = React.useRef<View>(null);

  const handleTouch = (evt: any) => {
    trackRef.current?.measure((_x: number, _y: number, width: number, _h: number, pageX: number) => {
      const pos = Math.max(0, Math.min(1, (evt.nativeEvent.pageX - pageX) / width));
      setValue(pos);
    });
  };

  return (
    <View style={{ marginTop: 8 }}>
      <Label text={`Value: ${Math.round(value * 100)}%`} />
      <View
        ref={trackRef}
        style={{ height: 45, marginTop: 4, paddingVertical: 12 }}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={handleTouch}
        onResponderMove={handleTouch}
      >
        <View style={{ position: 'absolute', top: 6, left: 0, right: 0, height: 9, flexDirection: 'row' }}>
          <Image source={UI.sliderTrackLeft} style={{ width: 6, height: 9 }} />
          <Image source={UI.sliderTrackMid} style={{ flex: 1, height: 9 }} resizeMode="stretch" />
          <Image source={UI.sliderTrackRight} style={{ width: 9, height: 9 }} />
        </View>
        <Image
          source={UI.slider}
          style={{ width: 42, height: 21, position: 'absolute', left: `${value * 100}%`, marginLeft: -21 }}
        />
      </View>
    </View>
  );
}

export default { title: 'UI Assets' };

// ═══════════════════════════════════════════════════════════════
// FRAMES — all decorative border sprites
// ═══════════════════════════════════════════════════════════════

export const Frames = () => (
  <ScrollView style={s.container} contentContainerStyle={s.content}>
    <Text style={s.heading}>Frames</Text>

    <SpriteRow items={[
      { src: UI.parchmentFrameDecoratedA, w: 96, h: 96, label: 'DecoratedA' },
      { src: UI.parchmentFrameDecoratedB, w: 96, h: 96, label: 'DecoratedB' },
      { src: UI.parchmentFrameSmallA, w: 84, h: 84, label: 'SmallA' },
      { src: UI.parchmentFrameSmallB, w: 84, h: 84, label: 'SmallB' },
    ]} />

    <SpriteRow items={[
      { src: UI.basicFrameGrayscale, w: 120, h: 120, label: 'BasicGrayscale' },
      { src: UI.intricateFrame, w: 120, h: 126, label: 'IntricateFrame' },
    ]} />

    <SpriteRow items={[
      { src: UI.metalFrame, w: 132, h: 96, label: 'MetalFrame' },
      { src: UI.chunkyFrame, w: 144, h: 72, label: 'ChunkyFrame' },
    ]} />

    <SpriteRow items={[
      { src: UI.decoratedSquare, w: 78, h: 78, label: 'DecoratedSquare' },
      { src: UI.smallFrame, w: 72, h: 72, label: 'SmallFrame' },
      { src: UI.roundedCorner, w: 48, h: 51, label: 'RoundedCorner' },
      { src: UI.circleFrame24, w: 72, h: 72, label: 'CircleFrame24' },
      { src: UI.goldPcircleFrame, w: 57, h: 57, label: 'GoldPcircle' },
    ]} />

    <Sub text="Frames at natural 3x size (no stretch)" />
    <Label text="Pixel art must not be runtime-scaled. Use 9-slice for resizable frames." />
  </ScrollView>
);

// ═══════════════════════════════════════════════════════════════
// CONTAINERS — boxes and panels
// ═══════════════════════════════════════════════════════════════

export const Containers = () => (
  <ScrollView style={s.container} contentContainerStyle={s.content}>
    <Text style={s.heading}>Containers</Text>

    <Sub text="Paper Box" />
    <SpriteRow items={[
      { src: UI.paperBox, w: 177, h: 135, label: 'PaperBox 177x135' },
    ]} />
    <Sub text="Action Boxes" />
    <SpriteRow items={[
      { src: UI.actionBox24x24, w: 72, h: 72, label: 'ActionBox 24' },
      { src: UI.actionBox33x34, w: 99, h: 102, label: 'ActionBox 33' },
      { src: UI.actionBoxWood24x24, w: 72, h: 72, label: 'WoodBox 24' },
      { src: UI.actionBoxWood33x34, w: 99, h: 102, label: 'WoodBox 33' },
    ]} />

    <Sub text="Tiny Box" />
    <SpriteRow items={[
      { src: UI.tinyBox, w: 36, h: 36, label: 'TinyBox' },
    ]} />

    <Sub text="Stone Tablet" />
    <Sprite src={UI.stoneTablet} w={231} h={72} label="StoneTablet" />
    <Sub text="Large Stone Borders" />
    <Sprite src={UI.largeStoneTopCenter} w={312} h={96} label="LargeStoneTop" />
    <Sprite src={UI.largeStoneBottomCenter} w={312} h={96} label="LargeStoneBottom" />
  </ScrollView>
);

// ═══════════════════════════════════════════════════════════════
// PORTRAITS & CHARACTERS
// ═══════════════════════════════════════════════════════════════

export const Portraits = () => (
  <ScrollView style={s.container} contentContainerStyle={s.content}>
    <Text style={s.heading}>Portraits & Characters</Text>

    <SpriteRow items={[
      { src: UI.portrait, w: 87, h: 90, label: 'Portrait' },
      { src: UI.portraitPlain, w: 72, h: 66, label: 'PortraitPlain' },
      { src: UI.paperdoll, w: 123, h: 168, label: 'Paperdoll' },
    ]} />

    <Sub text="Avatar component (frame + portrait)" />
    <View style={{ flexDirection: 'row', gap: 16, marginTop: 8 }}>
      <Avatar seed="user-1" size={78} />
      <Avatar seed="user-2" size={100} />
      <Avatar seed="user-3" size={60} />
    </View>
  </ScrollView>
);

// ═══════════════════════════════════════════════════════════════
// ITEM SLOTS
// ═══════════════════════════════════════════════════════════════

export const ItemSlots = () => (
  <ScrollView style={s.container} contentContainerStyle={s.content}>
    <Text style={s.heading}>Item Slots</Text>

    <Sub text="Slot variants" />
    <SpriteRow items={[
      { src: UI.itemSlot, w: 54, h: 54, label: 'ItemSlot' },
      { src: UI.itemSlotStone, w: 54, h: 54, label: 'ItemSlotStone' },
      { src: UI.itemSlotCheckeredBG, w: 54, h: 54, label: 'ItemSlotCheckered' },
    ]} />

    <Sub text="With icons inside" />
    <View style={{ flexDirection: 'row', gap: 6, marginTop: 8 }}>
      {(['helmet', 'shield', 'swords', 'potion', 'rope', 'shoe'] as const).map((icon) => (
        <ImageBackground key={icon} source={UI.itemSlotStone} style={{ width: 54, height: 54, justifyContent: 'center', alignItems: 'center' }}>
          <PixelIcon name={icon} size={32} />
        </ImageBackground>
      ))}
    </View>

    <Sub text="Checkered slots with icons" />
    <View style={{ flexDirection: 'row', gap: 6, marginTop: 8 }}>
      {(['crown', 'key', 'star', 'compass'] as const).map((icon) => (
        <ImageBackground key={icon} source={UI.itemSlotCheckeredBG} style={{ width: 54, height: 54, justifyContent: 'center', alignItems: 'center' }}>
          <PixelIcon name={icon} size={32} />
        </ImageBackground>
      ))}
    </View>
  </ScrollView>
);

// ═══════════════════════════════════════════════════════════════
// SCROLLS & BANNERS
// ═══════════════════════════════════════════════════════════════

export const ScrollsAndBanners = () => (
  <ScrollView style={s.container} contentContainerStyle={s.content}>
    <Text style={s.heading}>Scrolls & Banners</Text>

    <Sub text="Full Scroll sprites" />
    <SpriteRow items={[
      { src: UI.scroll, w: 288, h: 120, label: 'Scroll' },
    ]} />
    <Sprite src={UI.scrollHanging} w={252} h={153} label="ScrollHanging" />

    <Sub text="Small Scrolls" />
    <SpriteRow items={[
      { src: UI.scrollSmallA, w: 168, h: 75, label: 'ScrollSmallA' },
      { src: UI.scrollSmallB, w: 168, h: 72, label: 'ScrollSmallB' },
    ]} />
    <Sprite src={UI.scrollSmallC} w={168} h={69} label="ScrollSmallC" />

    <Sub text="Scrolls with text overlay (natural size)" />
    <View style={{ gap: 8 }}>
      <ImageBackground source={UI.scroll} style={{ width: 288, height: 120, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={s.bannerText}>QUEST COMPLETE!</Text>
      </ImageBackground>
      <ImageBackground source={UI.scrollHanging} style={{ width: 252, height: 153, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={[s.bannerText, { paddingBottom: 12 }]}>WANTED</Text>
      </ImageBackground>
      <ImageBackground source={UI.scrollSmallA} style={{ width: 168, height: 75, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={[s.bannerText, { fontSize: 16 }]}>INVENTORY</Text>
      </ImageBackground>
      <ImageBackground source={UI.scrollSmallB} style={{ width: 168, height: 72, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={[s.bannerText, { fontSize: 16 }]}>EQUIPMENT</Text>
      </ImageBackground>
      <ImageBackground source={UI.scrollSmallC} style={{ width: 168, height: 69, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={[s.bannerText, { fontSize: 16 }]}>PARTY</Text>
      </ImageBackground>
    </View>

    <Sub text="PergamentHeader (raw)" />
    <Sprite src={UI.pergamentHeader} w={183} h={57} label="PergamentHeader" />

    <Sub text="3-slice Scroll Banner" />
    <View style={{ gap: 8 }}>
      <NineSliceRow left={UI.scrollLeft} mid={UI.scrollMid} right={UI.scrollRight} height={80} capW={92} capRW={90}>
        <Text style={s.bannerText}>QUEST LOG</Text>
      </NineSliceRow>
      <NineSliceRow left={UI.scrollLeft} mid={UI.scrollMid} right={UI.scrollRight} height={80} capW={92} capRW={90}>
        <Text style={s.bannerText}>ACHIEVEMENTS</Text>
      </NineSliceRow>
    </View>

    <Sub text="3-slice Banner" />
    <NineSliceRow left={UI.bannerLeft} mid={UI.bannerMid} right={UI.bannerRight} height={40} capW={60} capRW={60}>
      <Text style={s.bannerText}>STATS</Text>
    </NineSliceRow>

    <Sub text="SectionHeader component" />
    <View style={{ gap: 12, marginTop: 8 }}>
      <SectionHeader title="Equipment" />
      <SectionHeader title="Climbing Stats" />
    </View>
  </ScrollView>
);

// ═══════════════════════════════════════════════════════════════
// BARS & METERS
// ═══════════════════════════════════════════════════════════════

export const BarsAndMeters = () => (
  <ScrollView style={s.container} contentContainerStyle={s.content}>
    <Text style={s.heading}>Bars & Meters</Text>

    <Sub text="Raw sprites" />
    <SpriteRow items={[
      { src: UI.healthBarMetalBorder, w: 96, h: 24, label: 'HealthBarBorder' },
      { src: UI.resourceVialVertical, w: 36, h: 72, label: 'ResourceVial' },
      { src: UI.slider, w: 42, h: 21, label: 'Slider' },
      { src: UI.sliderTrack, w: 21, h: 9, label: 'SliderTrack' },
    ]} />

    <Sub text="Fill tiles" />
    <SpriteRow items={[
      { src: UI.lifeHorizontal, w: 6, h: 9, label: 'LifeHoriz' },
      { src: UI.lifeFill, w: 24, h: 24, label: 'LifeFill' },
      { src: UI.healthVertical, w: 18, h: 6, label: 'HealthVert' },
      { src: UI.manaVertical, w: 18, h: 6, label: 'ManaVert' },
      { src: UI.staminaVertical, w: 18, h: 6, label: 'StaminaVert' },
      { src: UI.yellowResourceVertical, w: 18, h: 6, label: 'YellowVert' },
    ]} />

    <Sub text="Horizontal bars (3-slice frame + body + highlight)" />
    <Label text="Body stretches, highlight cap is fixed 3px at right edge" />
    <View style={{ gap: 10, marginTop: 8 }}>
      {([
        { pct: 85, label: 'HP  85/100' },
        { pct: 40, label: 'HP  40/100' },
        { pct: 60, label: 'HP  60/100' },
        { pct: 15, label: 'HP  15/100' },
      ] as const).map(({ pct, label }) => (
        <View key={label}>
          <View style={{ height: 24, position: 'relative' }}>
            {/* Bar frame (opaque dark center) */}
            <View style={{ flexDirection: 'row', height: 24 }}>
              <Image source={UI.barLeft} style={{ width: 57, height: 24 }} />
              <Image source={UI.barMid} style={{ flex: 1, height: 24 }} resizeMode="stretch" />
              <Image source={UI.barRight} style={{ width: 27, height: 24 }} />
            </View>
            {/* Fill ON TOP: body stretches + 3px highlight cap at right */}
            <View style={{ position: 'absolute', top: 9, bottom: 6, left: 0, right: 9, overflow: 'hidden' }}>
              <View style={{ flexDirection: 'row', width: `${pct}%`, height: '100%' }}>
                <Image source={UI.lifeHorizontalBody} style={{ flex: 1, height: '100%' }} resizeMode="stretch" />
                <Image source={UI.lifeHorizontalHighlight} style={{ width: 3, height: '100%' }} />
              </View>
            </View>
          </View>
          <Text style={[s.label, { marginTop: 2 }]}>{label}</Text>
        </View>
      ))}
    </View>

    <Sub text="Vertical vials (frame + body + highlight)" />
    <Label text="Body stretches vertically, highlight cap is fixed 3px at top" />
    <View style={{ flexDirection: 'row', gap: 16, marginTop: 8 }}>
      {([
        { pct: 90, body: UI.healthVerticalBody, hl: UI.healthVerticalHighlight, label: 'HP' },
        { pct: 50, body: UI.manaVerticalBody, hl: UI.manaVerticalHighlight, label: 'MP' },
        { pct: 70, body: UI.staminaVerticalBody, hl: UI.staminaVerticalHighlight, label: 'STA' },
        { pct: 30, body: UI.yellowResourceVerticalBody, hl: UI.yellowResourceVerticalHighlight, label: 'XP' },
      ] as const).map(({ pct, body, hl, label }) => (
        <View key={label} style={{ alignItems: 'center' }}>
          <View style={{ width: 36, height: 72, position: 'relative' }}>
            {/* Vial frame */}
            <Image source={UI.resourceVialVertical} style={{ width: 36, height: 72 }} />
            {/* Fill ON TOP: 3px highlight at top + body stretches down */}
            <View style={{ position: 'absolute', top: 12, bottom: 9, left: 9, right: 9, overflow: 'hidden', justifyContent: 'flex-end' }}>
              <View style={{ height: `${pct}%`, width: '100%' }}>
                <Image source={hl} style={{ width: '100%', height: 3 }} />
                <Image source={body} style={{ width: '100%', flex: 1 }} resizeMode="stretch" />
              </View>
            </View>
          </View>
          <Text style={[s.label, { marginTop: 4 }]}>{label}</Text>
        </View>
      ))}
    </View>

    <Sub text="Interactive slider" />
    <InteractiveSlider />

    <Sub text="Static slider positions" />
    <View style={{ gap: 20, marginTop: 8 }}>
      {[0, 0.5, 1].map((pos) => (
        <View key={pos}>
          <Label text={`${Math.round(pos * 100)}%`} />
          <View style={{ height: 21, marginTop: 4 }}>
            <View style={{ position: 'absolute', top: 6, left: 0, right: 0, height: 9, flexDirection: 'row' }}>
              <Image source={UI.sliderTrackLeft} style={{ width: 6, height: 9 }} />
              <Image source={UI.sliderTrackMid} style={{ flex: 1, height: 9 }} resizeMode="stretch" />
              <Image source={UI.sliderTrackRight} style={{ width: 9, height: 9 }} />
            </View>
            <Image
              source={UI.slider}
              style={{ width: 42, height: 21, position: 'absolute', left: `${pos * 100}%`, marginLeft: -21 }}
            />
          </View>
        </View>
      ))}
    </View>

    <Sub text="XpBar component" />
    <View style={{ gap: 12, marginTop: 8 }}>
      <XpBar progress={0} label="0 / 1000 XP" />
      <XpBar progress={0.25} label="250 / 1000 XP" />
      <XpBar progress={0.5} label="500 / 1000 XP" />
      <XpBar progress={0.75} label="750 / 1000 XP" />
      <XpBar progress={1} label="1000 / 1000 XP" />
    </View>
  </ScrollView>
);

// ═══════════════════════════════════════════════════════════════
// BUTTONS — all button types
// ═══════════════════════════════════════════════════════════════

export const Buttons = () => {
  const [tapCount, setTapCount] = useState(0);

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <Text style={s.heading}>Buttons</Text>

      <Sub text="Interactive Stone Button (tap it!)" />
      <Pressable onPress={() => setTapCount((c) => c + 1)}>
        {({ pressed }) => (
          <View style={{ alignItems: 'center', gap: 4 }}>
            <Image source={pressed ? UI.stoneButtonDown : UI.stoneButton} style={{ width: 48, height: 48 }} />
            <Label text={pressed ? 'pressed!' : `taps: ${tapCount}`} />
          </View>
        )}
      </Pressable>

      <Sub text="Interactive Emerald Button" />
      <Pressable onPress={() => setTapCount((c) => c + 1)}>
        {({ pressed }) => (
          <ImageBackground
            source={pressed ? UI.emeraldButtonDown3x : UI.emeraldButton3x}
            style={{ width: 120, height: 63, justifyContent: 'center', alignItems: 'center' }}
          >
            <Text style={[s.btnLabel, pressed ? { paddingTop: 4, fontSize: 14 } : { paddingBottom: 8, fontSize: 14 }]}>QUEST</Text>
          </ImageBackground>
        )}
      </Pressable>

      <Sub text="Interactive Tiny Button" />
      <Pressable onPress={() => setTapCount((c) => c + 1)}>
        {({ pressed }) => (
          <Image source={pressed ? UI.tinyButtonDown : UI.tinyButton} style={{ width: 27, height: 27 }} />
        )}
      </Pressable>

      <Sub text="Interactive 3-slice StoneButton" />
      <View style={{ gap: 12, marginTop: 8 }}>
        <StoneButtonComponent label="Log Climb" onPress={() => setTapCount((c) => c + 1)} />
        <StoneButtonComponent label="Find Gym" onPress={() => setTapCount((c) => c + 1)} />
      </View>
      <Label text={`Total taps: ${tapCount}`} />

      <Sub text="Sprite reference" />
      <SpriteRow items={[
        { src: UI.stoneButton, w: 48, h: 48, label: 'StoneBtn' },
        { src: UI.stoneButtonDown, w: 48, h: 48, label: 'StoneBtnDown' },
      ]} />
      <SpriteRow items={[
        { src: UI.emeraldButton3x, w: 120, h: 63, label: 'EmeraldBtn' },
        { src: UI.emeraldButtonDown3x, w: 120, h: 63, label: 'EmeraldBtnDown' },
      ]} />
      <SpriteRow items={[
        { src: UI.tinyButton, w: 27, h: 27, label: 'TinyBtn' },
        { src: UI.tinyButtonDown, w: 27, h: 27, label: 'TinyBtnDown' },
      ]} />
    </ScrollView>
  );
};

// ═══════════════════════════════════════════════════════════════
// FACE BUTTONS — controller-style colored buttons
// ═══════════════════════════════════════════════════════════════

export const FaceButtons = () => {
  const [lastPressed, setLastPressed] = useState('');

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <Text style={s.heading}>Face Buttons</Text>

      <Sub text="Interactive face buttons (tap them!)" />
      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 8 }}>
        {([
          { up: UI.faceButtonRed, down: UI.faceButtonRedDown, letter: UI.faceButtonLetterB, label: 'B', w: 39, hUp: 42, hDn: 39 },
          { up: UI.faceButtonBlue, down: UI.faceButtonBlueDown, letter: UI.faceButtonLetterA, label: 'A', w: 39, hUp: 42, hDn: 39 },
          { up: UI.faceButtonGreen, down: UI.faceButtonGreenDown, letter: UI.faceButtonLetterX, label: 'X', w: 39, hUp: 42, hDn: 39 },
          { up: UI.faceButtonYellow, down: UI.faceButtonYellowDown, letter: UI.faceButtonLetterY, label: 'Y', w: 39, hUp: 42, hDn: 42 },
        ] as const).map((btn) => (
          <Pressable key={btn.label} onPress={() => setLastPressed(btn.label)}>
            {({ pressed }) => (
              <View style={{ alignItems: 'center', width: btn.w, height: btn.hUp }}>
                <Image source={pressed ? btn.down : btn.up} style={{ width: btn.w, height: pressed ? btn.hDn : btn.hUp, position: 'absolute', bottom: 0 }} />
                <Image source={btn.letter} style={{ width: 21, height: 21, position: 'absolute', top: pressed ? 12 : 9 }} />
              </View>
            )}
          </Pressable>
        ))}
      </View>
      {lastPressed ? <Label text={`Last pressed: ${lastPressed}`} /> : <Label text="Tap a button!" />}

      <Sub text="Sprite reference" />
      <SpriteRow items={[
        { src: UI.faceButtonRed, w: 39, h: 42, label: 'Red' },
        { src: UI.faceButtonBlue, w: 39, h: 42, label: 'Blue' },
        { src: UI.faceButtonGreen, w: 39, h: 42, label: 'Green' },
        { src: UI.faceButtonYellow, w: 39, h: 42, label: 'Yellow' },
      ]} />
    </ScrollView>
  );
}

// ═══════════════════════════════════════════════════════════════
// ARROWS & CONTROLS
// ═══════════════════════════════════════════════════════════════

export const ArrowsAndControls = () => {
  const [direction, setDirection] = useState('');
  const [toggled, setToggled] = useState(false);

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <Text style={s.heading}>Arrows & Controls</Text>

      <Sub text="Interactive D-pad" />
      <View style={{ alignItems: 'center', marginTop: 8 }}>
        <Pressable onPressIn={() => setDirection('Up')} onPressOut={() => setDirection('')}>
          {({ pressed }) => <Image source={pressed ? UI.arrowUpDown : UI.arrowUp} style={{ width: 39, height: 36 }} />}
        </Pressable>
        <View style={{ flexDirection: 'row', gap: 24 }}>
          <Pressable onPressIn={() => setDirection('Left')} onPressOut={() => setDirection('')}>
            {({ pressed }) => <Image source={pressed ? UI.arrowLeftDown : UI.arrowLeft} style={{ width: 33, height: 39 }} />}
          </Pressable>
          <Pressable onPressIn={() => setDirection('Right')} onPressOut={() => setDirection('')}>
            {({ pressed }) => <Image source={pressed ? UI.arrowRightDown : UI.arrowRight} style={{ width: 33, height: 39 }} />}
          </Pressable>
        </View>
        <Pressable onPressIn={() => setDirection('Down')} onPressOut={() => setDirection('')}>
          {({ pressed }) => <Image source={pressed ? UI.arrowDownDown : UI.arrowDown} style={{ width: 39, height: 36 }} />}
        </Pressable>
        <Label text={direction ? `Moving: ${direction}` : 'Tap an arrow!'} />
      </View>

      <Sub text="Interactive toggle" />
      <Pressable onPress={() => setToggled((t) => !t)} hitSlop={12}>
        <View style={{ width: 54, height: 30, position: 'relative' }}>
          <Image source={UI.toggleButtonFrame} style={{ width: 54, height: 30, position: 'absolute' }} />
          <Image source={UI.toggleButton} style={{ width: 21, height: 30, position: 'absolute', left: toggled ? 27 : 6 }} />
        </View>
      </Pressable>
      <Label text={toggled ? 'ON' : 'OFF'} />

      <Sub text="Sprite reference" />
      <SpriteRow items={[
        { src: UI.arrowUp, w: 39, h: 36, label: 'Up' },
        { src: UI.arrowDown, w: 39, h: 36, label: 'Down' },
        { src: UI.arrowLeft, w: 33, h: 39, label: 'Left' },
        { src: UI.arrowRight, w: 33, h: 39, label: 'Right' },
      ]} />
      <SpriteRow items={[
        { src: UI.toggleButton, w: 21, h: 30, label: 'ToggleBtn' },
        { src: UI.toggleButtonFrame, w: 54, h: 30, label: 'ToggleFrame' },
      ]} />
    </ScrollView>
  );
};

// ═══════════════════════════════════════════════════════════════
// ACTION BARS — horizontal/vertical action bar frames
// ═══════════════════════════════════════════════════════════════

export const ActionBars = () => (
  <ScrollView style={s.container} contentContainerStyle={s.content}>
    <Text style={s.heading}>Action Bars</Text>

    <Sub text="Horizontal (natural size)" />
    <Sprite src={UI.actionBarBottom} w={246} h={81} label="ActionBarBottom" />

    <Sub text="Bottom bar (stretched to fill width)" />
    <View style={{ flexDirection: 'row', height: 81, marginHorizontal: 6, marginBottom: 12 }}>
      <Image source={UI.actionBarBottomLeft} style={{ width: 96, height: 81 }} />
      <Image source={UI.actionBarBottomMid} style={{ flex: 1, height: 81 }} resizeMode="stretch" />
      <Image source={UI.actionBarBottomRight} style={{ width: 111, height: 81 }} />
    </View>

    <Sub text="Left bar (3-col: cap|stretch|cap, full width)" />
    <View style={{ marginHorizontal: 6, marginBottom: 12 }}>
      {([
        { s: [UI.ablT1, UI.ablT2, UI.ablT3], h: 18 },
        { s: [UI.ablM1, UI.ablM2, UI.ablM3], h: 51 },
        { s: [UI.ablB1, UI.ablB2, UI.ablB3], h: 177 },
      ] as const).map(({ s, h }, i) => (
        <View key={i} style={{ flexDirection: 'row', height: h }}>
          <Image source={s[0]} style={{ width: 36, height: h }} />
          <Image source={s[1]} style={{ flex: 1, height: h }} resizeMode="stretch" />
          <Image source={s[2]} style={{ width: 33, height: h }} />
        </View>
      ))}
    </View>

    <Sub text="Right bar (3-col: cap|stretch|cap, full width)" />
    <View style={{ marginHorizontal: 6, marginBottom: 12 }}>
      {([
        { s: [UI.abrT1, UI.abrT2, UI.abrT3], h: 18 },
        { s: [UI.abrM1, UI.abrM2, UI.abrM3], h: 51 },
        { s: [UI.abrB1, UI.abrB2, UI.abrB3], h: 177 },
      ] as const).map(({ s, h }, i) => (
        <View key={i} style={{ flexDirection: 'row', height: h }}>
          <Image source={s[0]} style={{ width: 33, height: h }} />
          <Image source={s[1]} style={{ flex: 1, height: h }} resizeMode="stretch" />
          <Image source={s[2]} style={{ width: 36, height: h }} />
        </View>
      ))}
    </View>

    <Sub text="Vertical (natural size)" />
    <SpriteRow items={[
      { src: UI.actionBarLeft, w: 81, h: 246, label: 'Left' },
      { src: UI.actionBarRight, w: 81, h: 246, label: 'Right' },
    ]} />

    <Sub text="End caps" />
    <SpriteRow items={[
      { src: UI.actionBarStart, w: 81, h: 93, label: 'Start' },
      { src: UI.actionBarEnd, w: 81, h: 93, label: 'End' },
      { src: UI.actionBarCenter, w: 81, h: 63, label: 'Center' },
    ]} />
  </ScrollView>
);

// ═══════════════════════════════════════════════════════════════
// DECORATIONS — dividers, brackets, dragon heads, etc.
// ═══════════════════════════════════════════════════════════════

export const Decorations = () => (
  <ScrollView style={s.container} contentContainerStyle={s.content}>
    <Text style={s.heading}>Decorations</Text>

    <Sub text="Dividers" />
    <View style={{ gap: 16 }}>
      <Sprite src={UI.divider} w={195} h={18} label="Divider" />
      <Sprite src={UI.thinDivider} w={144} h={15} label="ThinDivider" />
    </View>

    <Sub text="Dragon Heads" />
    <SpriteRow items={[
      { src: UI.dragonheadLeft, w: 138, h: 93, label: 'DragonLeft' },
      { src: UI.dragonheadRight, w: 138, h: 93, label: 'DragonRight' },
    ]} />

    <Sub text="Metal Brackets" />
    <SpriteRow items={[
      { src: UI.metalBracketLeft, w: 108, h: 39, label: 'BracketLeft' },
      { src: UI.metalBracketRight, w: 108, h: 39, label: 'BracketRight' },
    ]} />

    <Sub text="Small elements" />
    <SpriteRow items={[
      { src: UI.cog, w: 36, h: 36, label: 'Cog' },
      { src: UI.metalKnob, w: 6, h: 6, label: 'MetalKnob' },
    ]} />

    <Sub text="Wood Tile Decorated" />
    <Sprite src={UI.woodTileDecorated} w={93} h={39} label="WoodTileDecorated" />
  </ScrollView>
);

// ═══════════════════════════════════════════════════════════════
// TILES — repeating border/edge tiles
// ═══════════════════════════════════════════════════════════════

export const Tiles = () => (
  <ScrollView style={s.container} contentContainerStyle={s.content}>
    <Text style={s.heading}>Tiles</Text>

    <Sub text="Stone Tiles" />
    <SpriteRow items={[
      { src: UI.stoneTileHorizontalTop, w: 48, h: 42, label: 'StoneHTop' },
      { src: UI.stoneTileHorizontalBottom, w: 48, h: 48, label: 'StoneHBot' },
      { src: UI.stoneTileVerticalLeft, w: 48, h: 48, label: 'StoneVLeft' },
      { src: UI.stoneTileVerticalRight, w: 48, h: 48, label: 'StoneVRight' },
    ]} />

    <Sub text="Wood Tiles" />
    <SpriteRow items={[
      { src: UI.woodTileHorizontalTop, w: 39, h: 39, label: 'WoodHTop' },
      { src: UI.woodTileHorizontalBottom, w: 39, h: 39, label: 'WoodHBot' },
      { src: UI.woodTileVerticalLeft, w: 45, h: 33, label: 'WoodVLeft' },
      { src: UI.woodTileVerticalRight, w: 45, h: 33, label: 'WoodVRight' },
    ]} />

    <Sub text="Stone/Wood Borders (large)" />
    <Label text="StoneWood borders are 960x96 / 96x540 at 3x — shown scrollable" />
    <ScrollView horizontal style={{ marginTop: 8 }}>
      <Image source={UI.stoneWoodBorderTop320} style={{ width: 960, height: 96 }} />
    </ScrollView>
    <ScrollView horizontal style={{ marginTop: 8 }}>
      <Image source={UI.stoneWoodBorderBottom320} style={{ width: 960, height: 96 }} />
    </ScrollView>
    <SpriteRow items={[
      { src: UI.stoneWoodBorderLeft180, w: 96, h: 540, label: 'SWBorderLeft' },
      { src: UI.stoneWoodBorderRight180, w: 96, h: 540, label: 'SWBorderRight' },
    ]} />
  </ScrollView>
);

// ═══════════════════════════════════════════════════════════════
// SPRITE ICONS — mini icons from the sprite sheet
// ═══════════════════════════════════════════════════════════════

export const SpriteIcons = () => (
  <ScrollView style={s.container} contentContainerStyle={s.content}>
    <Text style={s.heading}>Sprite Sheet Icons</Text>

    <Sub text="Object Icons" />
    <SpriteRow items={[
      { src: UI.iconChest, w: 45, h: 42, label: 'Chest' },
      { src: UI.iconCompass, w: 48, h: 48, label: 'Compass' },
      { src: UI.iconEmerald, w: 27, h: 45, label: 'Emerald' },
      { src: UI.iconGoldCoin, w: 30, h: 30, label: 'GoldCoin' },
      { src: UI.iconGoldPile, w: 36, h: 27, label: 'GoldPile' },
      { src: UI.iconMedallion, w: 45, h: 48, label: 'Medallion' },
    ]} />

    <Sub text="Status Icons" />
    <SpriteRow items={[
      { src: UI.iconCross, w: 42, h: 42, label: 'Cross' },
      { src: UI.iconExclamation, w: 18, h: 42, label: 'Exclaim' },
      { src: UI.iconQuestion, w: 30, h: 42, label: 'Question' },
      { src: UI.iconMapmarker, w: 30, h: 45, label: 'Mapmarker' },
      { src: UI.iconSkull, w: 39, h: 42, label: 'Skull' },
    ]} />

    <Sub text="Symbols" />
    <SpriteRow items={[
      { src: UI.symbolCheckmark, w: 27, h: 24, label: 'Checkmark' },
      { src: UI.symbolCross, w: 21, h: 21, label: 'Cross' },
      { src: UI.symbolMagic, w: 30, h: 30, label: 'Magic' },
      { src: UI.symbolShield, w: 30, h: 30, label: 'Shield' },
      { src: UI.symbolSword, w: 30, h: 30, label: 'Sword' },
    ]} />

    <Sub text="Spell Icons" />
    <SpriteRow items={[
      { src: UI.spellIconFireball, w: 48, h: 48, label: 'Fireball' },
      { src: UI.spellIconHeal, w: 48, h: 48, label: 'Heal' },
    ]} />

    <Sub text="Skull Tiles" />
    <SpriteRow items={[
      { src: UI.skullTile, w: 48, h: 48, label: 'SkullTile' },
      { src: UI.skullTileDark, w: 48, h: 48, label: 'SkullTileDark' },
    ]} />
  </ScrollView>
);

// ═══════════════════════════════════════════════════════════════
// BACKGROUNDS & TEXTURES
// ═══════════════════════════════════════════════════════════════

export const Backgrounds = () => (
  <ScrollView style={s.container} contentContainerStyle={s.content}>
    <Text style={s.heading}>Backgrounds & Textures</Text>

    <Sub text="Parchment texture" />
    <Sprite src={UI.parchmentTexture64} w={192} h={192} label="parchmentTexture64" />

    <Sub text="Map Parchment (tileable)" />
    <Sprite src={UI.mapParchment128} w={384} h={384} label="mapParchment128" />

    <Sub text="Block Backgrounds" />
    <SpriteRow items={[
      { src: UI.blockBackgroundBrown, w: 33, h: 27, label: 'Brown' },
      { src: UI.blockBackgroundMuddyYellow, w: 33, h: 27, label: 'MuddyYellow' },
      { src: UI.blockBackgroundMudgreen, w: 60, h: 36, label: 'Mudgreen' },
      { src: UI.blockBackgroundRed, w: 60, h: 36, label: 'Red' },
    ]} />

    <Sub text="Transparent / Special" />
    <SpriteRow items={[
      { src: UI.checkeredBG, w: 24, h: 24, label: 'CheckeredBG' },
      { src: UI.plainBackgroundRecolorable, w: 48, h: 48, label: 'PlainBG' },
      { src: UI.transparentBackgroundBlue, w: 48, h: 48, label: 'TransBlue' },
      { src: UI.transparentBackgroundOrange, w: 48, h: 48, label: 'TransOrange' },
    ]} />
  </ScrollView>
);

// ═══════════════════════════════════════════════════════════════
// ALL PIXEL ICONS — standalone icon sprites
// ═══════════════════════════════════════════════════════════════

export const AllIcons = () => (
  <ScrollView style={s.container} contentContainerStyle={s.content}>
    <Text style={s.heading}>All Icons ({ICON_NAMES.length})</Text>
    <Label text="128px source, shown at 48px" />
    <View style={s.iconGrid}>
      {ICON_NAMES.map((name) => (
        <View key={name} style={s.iconCell}>
          <PixelIcon name={name} size={48} />
          <Text style={s.iconLabel}>{name}</Text>
        </View>
      ))}
    </View>

    <Sub text="Size comparison" />
    <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-end', marginTop: 8 }}>
      {[16, 24, 32, 48, 64].map((sz) => (
        <View key={sz} style={{ alignItems: 'center' }}>
          <PixelIcon name="shield" size={sz} />
          <Text style={s.iconLabel}>{sz}</Text>
        </View>
      ))}
    </View>
  </ScrollView>
);

// ═══════════════════════════════════════════════════════════════
// PANELS — ParchmentPanel component
// ═══════════════════════════════════════════════════════════════

export const Panels = () => (
  <ScrollView style={s.container} contentContainerStyle={s.content}>
    <Text style={s.heading}>ParchmentPanel</Text>

    <Sub text="Basic" />
    <ParchmentPanel><Text style={s.innerText}>Basic panel content</Text></ParchmentPanel>

    <Sub text="With stats" />
    <ParchmentPanel>
      <View style={{ gap: 4 }}>
        <Text style={s.innerText}>Strength: 14</Text>
        <Text style={s.innerText}>Dexterity: 12</Text>
        <Text style={s.innerText}>Endurance: 18</Text>
      </View>
    </ParchmentPanel>

    <Sub text="With icon row" />
    <ParchmentPanel>
      <View style={{ flexDirection: 'row', gap: 16, justifyContent: 'center' }}>
        <PixelIcon name="boulder" size={40} />
        <PixelIcon name="rope" size={40} />
        <PixelIcon name="chalkbag" size={40} />
        <PixelIcon name="helmet" size={40} />
      </View>
    </ParchmentPanel>
  </ScrollView>
);

// ═══════════════════════════════════════════════════════════════
// TYPOGRAPHY — font sizes, colors, and text styles
// ═══════════════════════════════════════════════════════════════

export const Typography = () => (
  <ScrollView style={s.container} contentContainerStyle={s.content}>
    <Text style={s.heading}>Typography</Text>

    <Sub text="Font: VT323 (pixel font)" />

    <Sub text="Size scale" />
    <View style={{ gap: 4, marginTop: 4 }}>
      {[10, 12, 14, 16, 18, 20, 24, 28, 32, 40, 48].map((size) => (
        <Text key={size} style={{ fontFamily: 'VT323', fontSize: size, color: '#f5e6c8' }}>
          {size}px — The quick brown fox
        </Text>
      ))}
    </View>

    <Sub text="Color palette" />
    <View style={{ gap: 4, marginTop: 4 }}>
      {([
        ['text', '#f5e6c8', 'Primary text (parchment)'],
        ['primary', '#d4a44a', 'Primary / gold highlights'],
        ['muted', '#a89070', 'Muted / labels'],
        ['xp', '#4a7c59', 'XP / success (forest green)'],
        ['danger', '#c44', 'Danger / errors'],
        ['card', '#3b2a1a', 'Card text (on parchment)'],
      ] as const).map(([name, color, desc]) => (
        <View key={name} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ width: 18, height: 18, backgroundColor: color, borderWidth: 1, borderColor: '#5a4230' }} />
          <Text style={{ fontFamily: 'VT323', fontSize: 16, color }}>
            {desc} ({color})
          </Text>
        </View>
      ))}
    </View>

    <Sub text="Text styles in context" />
    <View style={{ gap: 8, marginTop: 4 }}>
      <Text style={{ fontFamily: 'VT323', fontSize: 28, color: '#f5e6c8' }}>Page Heading</Text>
      <Text style={{ fontFamily: 'VT323', fontSize: 20, color: '#d4a44a' }}>Section Subheading</Text>
      <Text style={{ fontFamily: 'VT323', fontSize: 16, color: '#f5e6c8' }}>Body text — used for main content and descriptions.</Text>
      <Text style={{ fontFamily: 'VT323', fontSize: 14, color: '#a89070' }}>Muted label — XP counters, timestamps, metadata</Text>
      <Text style={{ fontFamily: 'VT323', fontSize: 13, color: '#a89070' }}>Small caption — sprite dimensions, annotations</Text>
    </View>

    <Sub text="On parchment background" />
    <ParchmentPanel>
      <View style={{ gap: 6 }}>
        <Text style={{ fontFamily: 'VT323', fontSize: 20, color: '#3b2a1a' }}>Panel Title</Text>
        <Text style={{ fontFamily: 'VT323', fontSize: 16, color: '#3b2a1a' }}>Body text on parchment uses dark brown for contrast.</Text>
        <Text style={{ fontFamily: 'VT323', fontSize: 14, color: '#5a4230' }}>Secondary text uses border brown.</Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ fontFamily: 'VT323', fontSize: 16, color: '#3b2a1a' }}>Stat Label</Text>
          <Text style={{ fontFamily: 'VT323', fontSize: 16, color: '#d4a44a' }}>V4</Text>
        </View>
      </View>
    </ParchmentPanel>

    <Sub text="Banner / button text" />
    <View style={{ gap: 8, marginTop: 4 }}>
      <SectionHeader title="Quest Log" />
      <StoneButtonComponent label="Start Raid" onPress={() => {}} />
    </View>

    <Sub text="Letter spacing" />
    <View style={{ gap: 4, marginTop: 4 }}>
      <Text style={{ fontFamily: 'VT323', fontSize: 20, color: '#f5e6c8', letterSpacing: 0 }}>letterSpacing: 0 (default)</Text>
      <Text style={{ fontFamily: 'VT323', fontSize: 20, color: '#f5e6c8', letterSpacing: 1 }}>letterSpacing: 1</Text>
      <Text style={{ fontFamily: 'VT323', fontSize: 20, color: '#f5e6c8', letterSpacing: 2 }}>letterSpacing: 2</Text>
      <Text style={{ fontFamily: 'VT323', fontSize: 20, color: '#f5e6c8', letterSpacing: 4 }}>letterSpacing: 4</Text>
    </View>
  </ScrollView>
);

// ═══════════════════════════════════════════════════════════════
// FULL COMPOSITIONS — components assembled in context
// ═══════════════════════════════════════════════════════════════

export const Compositions = () => (
  <ScrollView style={s.container} contentContainerStyle={s.content}>
    <Text style={s.heading}>Full Compositions</Text>

    <Sub text="Character header" />
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 }}>
      <Avatar seed="hero" size={78} />
      <View style={{ flex: 1 }}><XpBar progress={0.65} label="650 / 1000 XP" /></View>
    </View>

    <Sub text="Section with content" />
    <SectionHeader title="Sends" />
    <ParchmentPanel style={{ marginTop: -8 }}>
      <View style={{ gap: 8 }}>
        {['V3 Crimson Overhang', 'V4 Blue Slab', 'V2 Green Arete'].map((name) => (
          <View key={name} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <PixelIcon name="checkmark" size={20} />
            <Text style={s.innerText}>{name}</Text>
          </View>
        ))}
      </View>
    </ParchmentPanel>

    <Sub text="Inventory row" />
    <View style={{ flexDirection: 'row', gap: 6, marginTop: 8 }}>
      {(['helmet', 'shield', 'shoe', 'rope', 'chalkbag', 'potion'] as const).map((icon) => (
        <ImageBackground key={icon} source={UI.itemSlotStone} style={{ width: 54, height: 54, justifyContent: 'center', alignItems: 'center' }}>
          <PixelIcon name={icon} size={32} />
        </ImageBackground>
      ))}
    </View>

    <Sub text="Action buttons" />
    <View style={{ gap: 8, marginTop: 8 }}>
      <StoneButtonComponent label="Log Send" onPress={() => {}} />
      <StoneButtonComponent label="Find Gym" onPress={() => {}} />
    </View>

    <Sub text="Stats panel" />
    <SectionHeader title="Stats" />
    <ParchmentPanel style={{ marginTop: -8 }}>
      <View style={{ gap: 6 }}>
        {[['boulder', 'Bouldering', 'V4'], ['rope', 'Top Rope', '5.10a'], ['hand', 'Lead', '5.9'], ['footprints', 'Sessions', '42']].map(([icon, stat, val]) => (
          <View key={stat} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <PixelIcon name={icon as any} size={24} />
            <Text style={[s.innerText, { flex: 1 }]}>{stat}</Text>
            <Text style={[s.innerText, { color: '#d4a44a' }]}>{val}</Text>
          </View>
        ))}
      </View>
    </ParchmentPanel>
  </ScrollView>
);

// ─── Styles ──────────────────────────────────────────────────

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#2a1f14' },
  content: { padding: 16, paddingTop: 60, paddingBottom: 80 },
  heading: { fontFamily: 'VT323', fontSize: 28, color: '#f5e6c8', marginBottom: 12 },
  subheading: { fontFamily: 'VT323', fontSize: 20, color: '#d4a44a', marginTop: 24, marginBottom: 4 },
  label: { fontFamily: 'VT323', fontSize: 13, color: '#a89070', marginBottom: 2 },
  innerText: { fontFamily: 'VT323', fontSize: 16, color: '#3b2a1a' },
  bannerText: { fontFamily: 'VT323', fontSize: 20, color: '#3b2a1a', letterSpacing: 2, textTransform: 'uppercase' },
  btnLabel: { fontFamily: 'VT323', fontSize: 18, color: '#e8d8c0', letterSpacing: 1 },
  iconGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 12 },
  iconCell: { width: 72, alignItems: 'center', paddingVertical: 8 },
  iconLabel: { fontFamily: 'VT323', fontSize: 11, color: '#a89070', marginTop: 4, textAlign: 'center' },
});
