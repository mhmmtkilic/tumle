import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { Easing, FadeOut, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { ExpoWebGLRenderingContext, GLView } from 'expo-gl';
import * as Haptics from 'expo-haptics';
import { CityLayout, CityPos } from '../city/grid';
import { loadModels, makeRenderer, present } from '../three/gl';
import * as THREE from 'three';
import { MahalleWorld, WorldView } from '../three/MahalleWorld';

/*
 * Uygulamanın TEK 3D sahnesi: App bir kez kurar ve hiç kaldırmaz. Ana ekranda
 * dönen arka plan, Mahallem'de etkileşimli sahne; diğer ekranlarda gizlenir ve
 * çizim durur (GL bağlamı ve modeller bellekte kalır, geri dönüşte yükleme yok).
 * Mod değişince kamera yeni çerçeveye süzülür.
 *
 * Mahallem jestleri:
 *  - tek parmak sürükle: döndür (yatay) / eğ (dikey), bırakınca ataletle durur
 *  - iki parmak kıstır: yakınlaştır (mahalle hep ekranın ortasında kalır)
 *  - dokun: eşyayı seç
 *  - basılı tut + sürükle: eşyayı taşı (hücreye kilitlenir, dolu hücre kırmızı)
 * Kare döngüsü React durumuna dokunmaz; yalnız etkinken tam hızda çizer.
 */

const MAHALLE_GLB: number = require('../../assets/3d/mahalle.glb');

/** Yalnız arabalar oynarken çizim aralığı (pil dostu) */
const IDLE_FRAME_MS = 33;
/** Gizlenme solması; bitince çizim durur */
const FADE_MS = 240;

/** Ana ekran: kendi kendine yavaşça döner (tam tur ~1 dk), arayüze yer açmak için biraz yukarıda */
const HOME_VIEW: WorldView = { spin: 0.1, shiftY: 0.04, zoom: 1.08, pitch: 0.6 };
/** Mahallem: ana ekranla aynı bakış açısı, ortada, dönüş parmakla */
const CITY_VIEW: WorldView = { spin: 0, shiftY: 0, zoom: 1, pitch: 0.6 };

export type StageMode = 'home' | 'city' | 'hidden';

export interface Mahalle3DHandle {
  zoomIn: () => void;
  zoomOut: () => void;
  select: (id: string | null) => void;
  /** Sahnenin PNG görüntüsü (paylaşım için) */
  snapshot: () => Promise<string | null>;
}

/** Mahallem ekranının sahneden aldığı olaylar (ekran kendini buraya bağlar) */
export interface StageEvents {
  onSelect?: (id: string | null) => void;
  onMove?: (id: string, pos: CityPos) => void;
  onEditChange?: (id: string | null) => void;
}

interface Props {
  owned: readonly string[];
  layout: CityLayout;
  mode: StageMode;
  /**
   * Son Mahallem ziyaretinden beri alınanlar: Mahallem açılınca gökten iner /
   * arsa açılır. O zamana kadar sahnede gösterilmez.
   */
  fresh?: readonly string[];
  events?: React.RefObject<StageEvents>;
  /** İlk kare çizildi (açılış ekranı bunu bekler) */
  onReady?: () => void;
}

const Mahalle3D = forwardRef<Mahalle3DHandle, Props>(function Mahalle3D(props, ref) {
  const { owned, layout, mode, fresh = [] } = props;
  const worldRef = useRef<MahalleWorld | null>(null);
  const glRef = useRef<GLView>(null);
  const size = useRef({ w: 1, h: 1 });
  const alive = useRef(true);
  const panning = useRef(false);
  const zoomStart = useRef(1);
  /** Çizim döngüsü: gizliyken durur, görününce yeniden başlar */
  const paused = useRef(mode === 'hidden');
  const kick = useRef<(() => void) | null>(null);
  const selectedRef = useRef<string | null>(null);
  const [ready, setReady] = useState(false);
  // Jest geri çağrıları en güncel prop'ları görsün
  const cb = useRef(props);
  cb.current = props;
  const ev = () => props.events?.current ?? {};

  const shown = fresh.length > 0 && mode !== 'city' ? owned.filter((id) => !fresh.includes(id)) : owned;

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  useEffect(() => {
    worldRef.current?.sync(shown, layout, mode === 'city' ? fresh : []);
  }, [shown.length, owned, layout, mode]);

  // Mod değişimi: kamera süzülür; gizlenince solma bitince çizim durur
  const opacity = useSharedValue(mode === 'hidden' ? 0 : 1);
  useEffect(() => {
    const world = worldRef.current;
    if (world) {
      if (mode !== 'city') {
        if (world.isEditing()) world.endEdit();
        world.select(null);
        selectedRef.current = null;
      }
      // Mahallem'den çıkınca ekranın seçim/taşıma durumu da sıfırlanır
      if (mode !== 'city') {
        ev().onSelect?.(null);
        ev().onEditChange?.(null);
      }
      if (mode !== 'hidden') world.setView(mode === 'city' ? CITY_VIEW : HOME_VIEW);
    }
    opacity.value = withTiming(mode === 'hidden' ? 0 : 1, { duration: FADE_MS, easing: Easing.out(Easing.quad) });
    if (mode === 'hidden') {
      const t = setTimeout(() => (paused.current = true), FADE_MS + 40);
      return () => clearTimeout(t);
    }
    if (paused.current) {
      paused.current = false;
      kick.current?.();
    }
  }, [mode]);
  const fade = useAnimatedStyle(() => ({ opacity: opacity.value }));

  useImperativeHandle(ref, () => ({
    zoomIn: () => worldRef.current?.setZoom(worldRef.current.getZoom() / 1.35),
    zoomOut: () => worldRef.current?.setZoom(worldRef.current.getZoom() * 1.35),
    select: (id) => {
      selectedRef.current = id;
      worldRef.current?.select(id);
    },
    snapshot: async () => {
      try {
        const snap = await glRef.current?.takeSnapshotAsync({ format: 'png' });
        return typeof snap?.uri === 'string' ? snap.uri : null;
      } catch {
        return null;
      }
    },
  }));

  const onContextCreate = async (gl: ExpoWebGLRenderingContext) => {
    try {
      const renderer = makeRenderer(gl);
      const models = await loadModels(MAHALLE_GLB);
      if (!alive.current) return;
      const world = new MahalleWorld(models, gl.drawingBufferWidth / gl.drawingBufferHeight);
      world.onLanded = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const p = cb.current;
      const f = p.fresh ?? [];
      world.sync(p.mode === 'city' ? p.owned : p.owned.filter((id) => !f.includes(id)), p.layout, p.mode === 'city' ? f : []);
      world.setView(p.mode === 'city' ? CITY_VIEW : HOME_VIEW, true);
      worldRef.current = world;

      let last = Date.now();
      let lastDraw = 0;
      let running = false;
      const loop = () => {
        if (!alive.current) {
          world.dispose();
          renderer.dispose();
          worldRef.current = null;
          return;
        }
        if (paused.current) {
          running = false;
          return;
        }
        const now = Date.now();
        const { active } = world.update((now - last) / 1000);
        last = now;
        if (active || now - lastDraw >= IDLE_FRAME_MS) {
          renderer.render(world.scene, world.camera);
          present(gl);
          lastDraw = now;
        }
        requestAnimationFrame(loop);
      };
      kick.current = () => {
        if (running) return;
        running = true;
        // Duraklamada geçen süre animasyonları sıçratmasın
        last = Date.now();
        requestAnimationFrame(loop);
      };
      // İlk kare: shader'lar derlenir, modeller GPU'ya yüklenir; örtü sonra kalkar
      world.update(0);
      renderer.compile(world.scene, world.camera);
      // Sonradan eklenecek efektlerin (konfeti, toz, taşıma) shader'ları da şimdi derlenir
      const warm = new THREE.Scene();
      warm.add(world.warmup());
      renderer.compile(warm, world.camera);
      renderer.render(world.scene, world.camera);
      present(gl);
      setReady(true);
      cb.current.onReady?.();
      if (!paused.current) kick.current();
    } catch (e) {
      console.warn('3D mahalle açılamadı', e);
      cb.current.onReady?.();
    }
  };

  const ndc = (x: number, y: number): [number, number] => [(x / size.current.w) * 2 - 1, -(y / size.current.h) * 2 + 1];

  const finishEdit = () => {
    const world = worldRef.current;
    if (!world?.isEditing()) return;
    const r = world.endEdit();
    ev().onEditChange?.(null);
    if (r?.moved) {
      ev().onMove?.(r.moved.id, r.moved.pos);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else if (r?.rejected) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  // Jestler bir kez kurulur (yalnız ref'lere bakar); her çizimde yeniden bağlanmasın
  const gesture = useMemo(() => {
    const tap = Gesture.Tap()
      .runOnJS(true)
      .maxDuration(280)
      .onEnd((e, success) => {
        const world = worldRef.current;
        if (!success || !world || world.isEditing() || cb.current.mode !== 'city') return;
        const id = world.pick(...ndc(e.x, e.y));
        if (id) {
          ev().onSelect?.(id === selectedRef.current ? null : id);
          Haptics.selectionAsync();
        } else {
          ev().onSelect?.(null);
        }
      });

    const longPress = Gesture.LongPress()
      .runOnJS(true)
      .minDuration(320)
      .maxDistance(10000)
      .onStart((e) => {
        const world = worldRef.current;
        // Sürükleyerek döndürürken basılı tutma sayılmaz
        if (!world || panning.current || cb.current.mode !== 'city') return;
        const id = world.pick(...ndc(e.x, e.y));
        if (id && world.beginEdit(id)) {
          ev().onSelect?.(null);
          ev().onEditChange?.(id);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
      })
      .onFinalize(() => {
        // Parmak kıpırdamadan kalktıysa taşıma burada biter; sürüklendiyse pan bitirir
        if (!panning.current) finishEdit();
      });

    const pan = Gesture.Pan()
      .runOnJS(true)
      .maxPointers(1)
      .minDistance(4)
      .onStart(() => {
        panning.current = true;
        worldRef.current?.holdStill();
      })
      .onChange((e) => {
        const world = worldRef.current;
        if (!world) return;
        if (world.isEditing()) world.dragTo(...ndc(e.x, e.y));
        else world.rotateBy(e.changeX, e.changeY);
      })
      .onFinalize(() => {
        panning.current = false;
        if (worldRef.current?.isEditing()) finishEdit();
        else worldRef.current?.release();
      });

    const pinch = Gesture.Pinch()
      .runOnJS(true)
      .onStart(() => {
        zoomStart.current = worldRef.current?.getZoom() ?? 1;
      })
      .onUpdate((e) => {
        worldRef.current?.setZoom(zoomStart.current / e.scale);
      });

    return Gesture.Simultaneous(tap, longPress, pan, pinch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    size.current = { w: width, h: height };
    worldRef.current?.setAspect(width / height);
  };

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        style={[StyleSheet.absoluteFill, styles.root, fade]}
        onLayout={onLayout}
        collapsable={false}
        pointerEvents={mode === 'city' ? 'auto' : 'none'}
      >
        <GLView ref={glRef} style={[StyleSheet.absoluteFill, styles.gl]} onContextCreate={onContextCreate} pointerEvents="none" />
        {/* Sahne kurulana kadar ufuk rengi; ilk kare hazır olunca yumuşakça kalkar */}
        {!ready ? <Animated.View exiting={FadeOut.duration(250)} style={[StyleSheet.absoluteFill, styles.cover]} pointerEvents="none" /> : null}
      </Animated.View>
    </GestureDetector>
  );
});

export default Mahalle3D;

const styles = StyleSheet.create({
  root: { backgroundColor: '#CDEBFF' },
  // zIndex: yeni mimaride GL görünümü kardeşlerinin altında kalmasın
  gl: { zIndex: 1 },
  cover: { backgroundColor: '#CDEBFF', zIndex: 2 },
});
