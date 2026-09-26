# Tümle 2048 🪙→🥇

Klasik **2048** bulmacasının Türkiye ekonomisi üzerine kurulmuş satirik uyarlaması. Madeni paraları kaydırıp birleştirerek kağıt paraya, dövize ve altına ulaşırsın; kazandığın parayla da kendi mahalleni satın alıp kurarsın. Kumar/bahis oyunu **değildir** — saf mantık ve eşleştirme bulmacasıdır; arayüzde casino çağrışımı yapan hiçbir öğe kullanılmaz.

## Çalıştırma

```bash
npm install
npx expo start        # i = iOS simülatör, a = Android emülatör
```

- Expo SDK 57 · React Native 0.86 · React 19.2 · TypeScript 6 (strict)
- Ses dosyaları koddan sentezlenir: `npm run sounds` → `assets/sounds/*.wav`

## Oynanış

- **Kaydır (swipe):** Ekranın herhangi bir yerinde yukarı/aşağı/sağa/sola kaydır; tüm taşlar o yöne sonuna kadar gider.
- **Birleşme:** Aynı iki para çarpışınca zincirdeki bir üst değere dönüşür. Her geçerli hamleden sonra boş bir kareye %90 ihtimalle 1 Kuruş, %10 ihtimalle 10 Kuruş doğar.
- **Kazanç:** Her birleşme, oluşan paranın TL karşılığını kalıcı birikimine (cüzdan) ekler.
- **Combo:** Art arda birleşmeli hamleler seri başlatır. 3. hamleden itibaren kazanç **combo sayısı kadar katlanır** (en fazla ×10) ve ekranda kademeli coşkuyla COMBO yazısı patlar (Süper! → Çılgınca! 🔥 → EFSANE! 👑). Her combo'da yükselen bir arpej çalar; seri büyüdükçe ses tizleşir, titreşim sertleşir.
- **Kazanma:** Külçe Altın'a ulaşınca "Külçeye Ulaştın!" ekranı çıkar; istersen devam edebilirsin.
- **Kaybetme:** Izgara dolup hamle kalmayınca "Cüzdan Tıkandı!" ekranı gelir.

### Dönüşüm zinciri (12 seviye)

1 Kuruş → 10 Kuruş → 50 Kuruş → 1 TL → 10 TL → 50 TL → 200 TL → **100 Dolar** → 1 Gr Altın → Çeyrek Altın → Tam Altın → **Külçe Altın** (hedef)

Madeni paralar metalik "şık" sesi, kağıt paralar hışırtı, altın seviyeleri cha-ching sesi ve daha güçlü haptik verir.

## Ekonomi ve Mahallem

Tek ilke: **her şey dünyada, tek mekanik.** Eşya → ızgara hücresine yerleşir; yeni arsa → toz+konfetiyle kayarak açılır. Liste-only eşya, ilerleme çubuğu ya da sekme yoktur.

- **Cüzdan (Birikim):** Oyunlardan kazanılan TL kalıcıdır; ana ekranda ve katalogda görünür.
- **Tek sahne:** **Mahallem** — çimen arsalar + yol. Üç blok: `lot1` (baştan açık), `lot2` (Yan Arsa), `sahil` (Sahil Arsası). Arsa alınınca blok toz ve konfetiyle sahneye kayar, görünür çerçeve genişler.
- **Mağaza:** Tek liste, ucuzdan pahalıya (19 eşya). Evre, kategori ya da sayfa yoktur; bir eşyayı alabilmek için yeterli para ve varsa ön şartı (`requires`) gerekir. Buton ilk eksik şartı gösterir ("Önce: Yan Arsa"). Eşya alınınca mağazada kalınır, kısa bir bildirim çıkar; dünyaya bir sonraki girişte iniş animasyonuyla belirir. Varsayılan hücresi doluysa ilk boş hücreye yerleşir.
- **Serbest yerleşim (Clash tarzı):** Her arsa 6×6 izometrik hücre; eşyaların hücre cinsinden kare ayak izleri vardır (1×1, 2×2). Bir eşyayı **basılı tutunca** taşıma moduna girer, ızgara görünür; eşya hücreden hücreye kilitlenerek atlar, her geçişte haptik tık verir, açık arsaların dışına çıkamaz. Hedef ayak izi boşsa yeşil, doluysa kırmızı boyanır; kırmızıya bırakılan eşya eski yerine döner. Her çizimin izometrik taban merkezi (çapa) hücre merkezine oturur.
- **Yaşayan sahne:** Helikopter pervanesi döner, havuz parıldar, ağaç salınır, evin bacası tüter.
- **Paylaş:** Sahnenin görüntüsü PNG olarak sistem paylaşım menüsüne gider.

### Veri modeli (özet)

- `city/world.ts`: tek sahne ve üç arsa bloğu (`lot1/lot2/sahil`), her bloğun `unlockedBy` eşyası ve açılış yönü; `sceneFrame(owned)` görünür çerçeveyi verir.
- `economy/items.ts`: 19 eşya, fiyat sırasında tek liste. Her eşyada `place: { foot, anchor }` ve isteğe bağlı `requires`. Id'ler diske yazıldığı için **yeniden adlandırılmaz**. Modül yüklenirken katalog doğrulanır (çakışan id, bilinmeyen şart, bozuk fiyat sırası → hata); `ItemSvg.tsx` de çizimi olmayan eşyada patlar.
- `economy/progress.ts`: saf türetme. Sahiplik düz `owned: string[]`; satın alma engeli (`checkBuy` → `owned | requires | money`) ve toplam değer bundan hesaplanır. Ek kayıt yok; katalogdan kalkmış id'ler ayıklanır.
- `city/grid.ts`: ızgara motoru; `fits` (blok açık mı, çakışma), `snapCell` (worklet), `findFreeSpot`, `occupancyGrid`. Yerleşim kaydı `layout_v2`; v1 (sayısal blok) otomatik dönüştürülür.

## Başarımlar

34 başarım, tek listede — kademeyi bölüm başlıkları değil madalyanın malzemesi anlatır. Her başarımın kademeye göre **TL ödülü** vardır (normal ₺25.000 · zor ₺250.000 · elit ₺2.5M · efsanevi ₺25M); açılınca kart sarı çerçeveye girer, **Ödülü Al** butonuyla cüzdana aktarılır. Ana ekrandaki kupa butonu alınmamış ödül sayısını kırmızı rozetle gösterir. Bilerek kolay başarım yok. Rozetler para taşlarıyla aynı görsel dilde saf SVG çizilir; kilitliyken madalyanın katman yapısı (kurdele, halka, kesikli kenar, yüz) **gri iskelet** olarak durur, ikonun yerinde asma kilit vardır — içerik kazanılınca açılır. Kazanım anında cha-ching sesiyle üstte rozet bildirimi belirir. Ana ekrandaki kupa butonundan başarımlar ekranına gidilir (n/34 sayacı).

Kurgu iki eksende ilerler: zincirin **her para türü** hem bir "ilk taş" kilometre taşı hem de "türün tamamını aynı anda tahtada topla" koleksiyon görevi verir (`defs.ts`'te `kind` alanı, tetikler `AchievementsContext`'teki `MILESTONES` ve `KIND_SETS` tablolarında); bunun yanında türden bağımsız beceri/ekonomi görevleri durur. Koleksiyon eşikleri modül yüklenirken doğrulanır: doğum tabanı `max - SPAWN_FLOOR_GAP`e yükseldiği için tahtada aynı anda en çok **8 farklı seviye** durabilir, daha fazlasını isteyen bir koleksiyon eklenirse kod patlar.

| Para türü | Kilometre taşları | Koleksiyon |
| --- | --- | --- |
| Madeni (1 kr–1 TL) | Cebinde Bozukluk (1 TL) | Kumbara Tamam (4 madeni tür) |
| Kağıt (10 TL–100 $) | Kağıda Terfi (10 TL) · Dövize Kaçış (100 Dolar) | Deste Deste (4 kağıt tür) |
| Altın (1 gr–külçe) | Altın Günü (1 gr) · Damat Altını (Tam Altın) · Külçe Avcısı (Külçe) | Altın Vitrini (4 altın tür) · Çifte Külçe · Altın Çağ |
| Mücevher (yeşim–pembe elmas) | Kuyumcu (Yeşim) · Elmas Kesim (Elmas) · Pembe Nadir (Pembe Elmas) | Mücevher Kutusu (3 taş) · Mücevher Vitrini (5 farklı tür) |
| Kripto (Bitcoin, Soğuk Cüzdan) | Elmas Eller (Bitcoin) · Soğuk Depo (Soğuk Cüzdan) | Soğuk Zincir (ikisi aynı anda) |
| Epik (sandık–dünya) | Define Avcısı (Hazine Sandığı) · Kasa Kilidi (Banka Kasası) · Rezerv Sahibi (MB Rezervi) · Dünyanın Sahibi (Dünya Serveti) | — |

Türden bağımsız olanlar: Zincir Reaksiyon (×5 combo) · EFSANE (×10 combo) · Seri Manyağı (15 hamlelik seri) · Boğa Piyasası (tek oyunda ₺100.000) · Hiper Enflasyon (tek oyunda ₺1M) · Kağıt Üstünde Milyoner (₺1M birikim) · Holding (₺10M birikim) · İlk Anahtar (ilk eşya) · Toprak Ağası (Yan Arsa) · Mahalle Kralı (tüm sahne eşyaları) · Nümizmat (12 para türü aynı anda — **şu an ulaşılamaz**, bkz. `AchievementsContext.tsx` notu).

Kademe dağılımı: 7 normal · 8 zor · 7 elit · 12 efsanevi.

## Ayarlar

- Ses efektleri ve titreşim aç/kapa
- İlerlemeyi sıfırla (onay diyaloğu ile)

## Kalıcılık

Her şey `AsyncStorage`'da tutulur: devam eden oyun (taşlar, kazanç, combo, durum), cüzdan, satın alınan eşyalar ve ayarlar. Uygulama kapanıp açılınca kaldığın yerden devam edersin. Kayıt yüklenirken doğrulanır; bozuk kayıt sessizce yeni oyunla değiştirilir.

## Kod Yapısı

```
App.tsx                     Ekran geçişleri (home/game/shop/city/settings), provider'lar
src/game/engine.ts          Saf oyun motoru: move/merge/spawn/canMove (test edilebilir)
src/game/levels.ts          12 seviyelik zincir, TL değerleri, formatTL
src/useGame.ts              Oyun durumu + combo + kayıt/yükleme hook'u
src/economy/                Cüzdan + satın alma (EconomyContext), katalog (items), türetme (progress)
src/city/                   Dünya modeli (world: sahneler/bloklar/çerçeve), ızgara (grid), yerleşim kaydı (LayoutContext)
src/settings/               Ses/titreşim/ızgara ayarları (SettingsContext)
src/audio.ts                expo-audio çalarlar + haptikler (açılışta ısınma turu)
src/screens/                Home, Game, Catalog, City (Mahallem), Settings, Achievements ekranları
src/components/             BoardView, TileView (animasyonlar), CityScene (mahalle sahnesi),
                            iso (izometrik yardımcılar), ItemSvg (19 eşya çizimi)
scripts/gen-sounds.js       Ses efektlerini sentezleyip WAV yazar
```

Animasyonlar `react-native-reanimated` ile UI thread'de çalışır (kayma, spawn yayı, merge pop'u); tüm görseller `react-native-svg` ile çizilir, bitmap asset kullanılmaz.

## Tasarım İlkeleri

- Pastel tonlarda temiz "kumbara/cüzdan" arayüzü; kumar algısı yaratacak hiçbir görsel yok.
- Tatmin edici geri bildirim: seviye türüne göre ses + haptik, birleşmede pop/scale efekti, sıfır gecikmeli kaydırma hissi.
- Mizah her yerde: eşya açıklamaları, bitiş ekranı metinleri, "Merkez bankası seni arayabilir."
