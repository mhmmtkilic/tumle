# Tümle 2048 🪙→🥇

Klasik **2048** bulmacasının Türkiye ekonomisi üzerine kurulmuş satirik uyarlaması. Madeni paraları kaydırıp birleştirerek kağıt paraya, dövize ve altına ulaşırsın; kazandığın parayla da kendi mahalleni satın alıp kurarsın. Kumar/bahis oyunu **değildir** — saf mantık ve eşleştirme bulmacasıdır; arayüzde casino çağrışımı yapan hiçbir öğe kullanılmaz.

## Çalıştırma

```bash
npm install
npx expo start        # i = iOS simülatör, a = Android emülatör
```

- Expo SDK 58 · React Native 0.88 · React 19.3 · TypeScript 6 (strict)
- Ses dosyaları koddan sentezlenir: `npm run sounds` → `assets/sounds/*.wav`

## Oynanış

- **Kaydır (swipe):** Ekranın herhangi bir yerinde yukarı/aşağı/sağa/sola kaydır; tüm taşlar o yöne sonuna kadar gider.
- **Birleşme:** Aynı iki para çarpışınca zincirdeki bir üst değere dönüşür. Her geçerli hamleden sonra boş bir kareye %90 ihtimalle 1 Kuruş, %10 ihtimalle 10 Kuruş doğar.
- **Kazanç:** Her birleşme, oluşan seviyenin ödemesini (`PAYOUT_TL`) kalıcı birikimine (cüzdan) ekler. Ödeme taşın adındaki değer değildir; bkz. *Ekonomi kalibrasyonu*.
- **Combo:** Art arda birleşmeli hamleler seri başlatır. 3. hamleden itibaren kazanç **combo sayısı kadar katlanır** (en fazla ×20) ve ekranda kademeli coşkuyla COMBO yazısı patlar (Süper! → Çılgınca! 🔥 → EFSANE! 👑). Her combo'da yükselen bir arpej çalar; seri büyüdükçe ses tizleşir, titreşim sertleşir.
- **Kazanma:** Külçe Altın'a ulaşınca "Külçeye Ulaştın!" ekranı çıkar; istersen devam edebilirsin.
- **Kaybetme:** Izgara dolup hamle kalmayınca "Cüzdan Tıkandı!" ekranı gelir.

### Dönüşüm zinciri (24 seviye)

1 Kuruş → 10 Kuruş → 50 Kuruş → 1 TL → 10 TL → 50 TL → 200 TL → **100 Dolar** → 1 Gr Altın → Çeyrek Altın → Tam Altın → **Külçe Altın** (ara kutlama) → Yeşim → Zümrüt → Yakut → Safir → Elmas → Pembe Elmas → Bitcoin → Soğuk Cüzdan → Hazine Sandığı → Banka Kasası → MB Rezervi → **Dünya Serveti** (final)

**Yükselen taban:** doğan taşlar en yüksek taşın `floorGap(max)` altından başlar, altında kalan taşlar tabana çekilir (`denominate`). Aralık Külçe'ye kadar 7, mücevherlerde 8, kripto/epikte 9'dur: her yeni çağ öncekinden daha çok iş ister.

### Ekonomi kalibrasyonu

`npm run economy` oyunun gerçek motoru, ödeme tablosu, fiyatları ve başarım ödülleriyle üç bot (zayıf / orta / usta) oynatır ve kariyer simüle eder (10 çekirdekte ~1 dk). Ödeme, taban, fiyat veya ödül değiştiğinde yeniden koşturulur. Son kalibrasyon (2026-11):

| | zayıf | orta | usta |
| --- | --- | --- | --- |
| Oyun başına ort. kazanç (çarpansız) | ₺125 bin | ₺550 bin | ₺1,9 Mn |
| Külçe'ye ulaşma | %1 | %20 | %58 |
| Yan Arsa (oyun no) | 73 | 17 | 7 |
| Sahil Arsası | 157 | 37 | 14 |
| Mahallenin tamamı | ~408 | ~97 | ~33 |

Simülasyon mahalle çarpanını ve çarpanla ölçeklenen başarım ödüllerini uygular; botlar Geri Al / Çekiç kullanmaz. `npm run economy -- cached` son tam koşunun oyunlarıyla yalnız kariyeri (fiyat/çarpan/ödül) saniyeler içinde yeniden hesaplar.

**Gerçek fiyat ölçeği:** eşya fiyatları Türkiye'nin enflasyon yemiş piyasasına yakındır (cins kedi ₺35 bin, sıfır araba ₺2,4 Mn, müstakil ev ₺14 Mn, sahil arsası ₺280 Mn, gökdelen ₺12 Mr, kruvaziyer ₺30 Mr; toplam ≈ ₺52 Mr). İlk ve son eşya arasında ~1 milyon kat fark olduğundan eşyalar kazancı toplamaz, **çarpar** (tüm mahalle ≈ ×4.625); taşların temel ödemesi değişmez.

Eski ayarda (sabit taban aralığı 7, seviye başına ×2 değer) usta bot tek oyunda Dünya Serveti'ne ulaşıp ₺200–500 milyar kazanıyor, mağazanın tamamını (o zaman ₺16 milyar) tek oyunda bitiriyordu.

Madeni paralar metalik "şık" sesi, kağıt paralar hışırtı, altın seviyeleri cha-ching sesi ve daha güçlü haptik verir.

## Ekonomi ve Mahallem

Tek ilke: **her şey dünyada, tek mekanik.** Eşya → ızgara hücresine yerleşir; yeni arsa → toz+konfetiyle kayarak açılır. Liste-only eşya, ilerleme çubuğu ya da sekme yoktur.

- **Cüzdan (Birikim):** Oyunlardan kazanılan TL kalıcıdır; ana ekranda ve katalogda görünür.
- **Tek sahne:** **Mahallem** — çimen arsalar + yol. Üç blok: `lot1` (baştan açık), `lot2` (Yan Arsa), `sahil` (Sahil Arsası). Arsa alınınca blok toz ve konfetiyle sahneye kayar, görünür çerçeve genişler.
- **Mağaza:** Tek liste, ucuzdan pahalıya (19 eşya). Evre, kategori ya da sayfa yoktur; bir eşyayı alabilmek için yeterli para ve varsa ön şartı (`requires`) gerekir. Ön şartı eksik eşyanın içeriği gizlidir (soru işareti, "???"), yalnız hangi arsanın açtığı yazar. Fiyat butonu ayrıntı penceresini açar, satın alma oradaki "Satın Al" ile onaylanır. Eşya alınınca Mahallem'e geçilir ve eşya gökten iner. Varsayılan hücresi doluysa ilk boş hücreye yerleşir.
- **Eşyalar oyuna geri verir:** Çoğu eşya tüm birleşme kazançlarını kalıcı olarak **çarpar** (çarpanlar çarpılır; tüm mahalle ≈ ×4.625). Dört eşya oyun başına bir **araç hakkı** açar: Araba ve Sürat Teknesi → **Geri Al** (son hamleyi kazancıyla ve başarım sayaçlarıyla birlikte geri alır; oyun bitince de kullanılır), Villa ve Kruvaziyer Gemisi → **Çekiç** (seçilen bir taşı kırar; tıkanmış tahtayı açar). Tahtanın altındaki araç çubuğu çarpanı ve kalan hakları gösterir; satın alınmamış araç gösterilmez. Oyun bitince "Cüzdan Tıkandı" ekranı kalan araçlarla kurtarma sunar. Veri: `items.ts`'te `perk`, `earnMultiplier`, `toolCharges`.
- **Serbest yerleşim (Clash tarzı):** Her arsa 6×6 izometrik hücre; eşyaların hücre cinsinden kare ayak izleri vardır (1×1, 2×2). Bir eşyayı **basılı tutunca** taşıma moduna girer, ızgara görünür; eşya hücreden hücreye kilitlenerek atlar, her geçişte haptik tık verir, açık arsaların dışına çıkamaz. Hedef ayak izi boşsa yeşil, doluysa kırmızı boyanır; kırmızıya bırakılan eşya eski yerine döner. Her çizimin izometrik taban merkezi (çapa) hücre merkezine oturur.
- **Yaşayan sahne:** Helikopter pervanesi döner, havuz parıldar, ağaç salınır, evin bacası tüter.
- **Paylaş:** Sahnenin görüntüsü PNG olarak sistem paylaşım menüsüne gider.

### Veri modeli (özet)

- `city/world.ts`: tek sahne ve üç arsa bloğu (`lot1/lot2/sahil`), her bloğun `unlockedBy` eşyası ve açılış yönü; `sceneFrame(owned)` görünür çerçeveyi verir.
- `economy/items.ts`: 19 eşya, fiyat sırasında tek liste. Her eşyada `place: { foot, anchor }` ve isteğe bağlı `requires`. Id'ler diske yazıldığı için **yeniden adlandırılmaz**. Modül yüklenirken katalog doğrulanır (çakışan id, bilinmeyen şart, bozuk fiyat sırası → hata); `ItemSvg.tsx` de çizimi olmayan eşyada patlar.
- `economy/progress.ts`: saf türetme. Sahiplik düz `owned: string[]`; satın alma engeli (`checkBuy` → `owned | requires | money`) ve toplam değer bundan hesaplanır. Ek kayıt yok; katalogdan kalkmış id'ler ayıklanır.
- `city/grid.ts`: ızgara motoru; `fits` (blok açık mı, çakışma), `snapCell` (worklet), `findFreeSpot`, `occupancyGrid`. Yerleşim kaydı `layout_v2`; v1 (sayısal blok) otomatik dönüştürülür.

## Başarımlar

34 başarım, tek listede — kademeyi bölüm başlıkları değil madalyanın malzemesi anlatır. Her başarımın kademeye göre **TL ödülü** vardır (taban: normal ₺25 bin · zor ₺100 bin · elit ₺400 bin · efsanevi ₺1 Mn; ödül alınırken oyuncunun kazanç çarpanıyla çarpılır, gelirin orta oyuncuda ~%9'u); açılınca kart sarı çerçeveye girer, **Ödülü Al** butonuyla cüzdana aktarılır. Ana ekrandaki kupa butonu alınmamış ödül sayısını kırmızı rozetle gösterir. Bilerek kolay başarım yok. Rozetler para taşlarıyla aynı görsel dilde saf SVG çizilir; kilitliyken madalyanın katman yapısı (kurdele, halka, kesikli kenar, yüz) **gri iskelet** olarak durur, ikonun yerinde asma kilit vardır — içerik kazanılınca açılır. Kazanım anında cha-ching sesiyle üstte rozet bildirimi belirir. Ana ekrandaki kupa butonundan başarımlar ekranına gidilir (n/34 sayacı).

Kurgu iki eksende ilerler: zincirin **her para türü** hem bir "ilk taş" kilometre taşı hem de "türün tamamını aynı anda tahtada topla" koleksiyon görevi verir (`defs.ts`'te `kind` alanı, tetikler `AchievementsContext`'teki `MILESTONES` ve `KIND_SETS` tablolarında); bunun yanında türden bağımsız beceri/ekonomi görevleri durur. Koleksiyon eşikleri modül yüklenirken doğrulanır: doğum tabanı en az `max - SPAWN_FLOOR_GAP` (7) seviye aşağıda kaldığı için 8 farklı seviyeye kadar koleksiyon her zaman ulaşılabilirdir, daha fazlasını isteyen bir koleksiyon eklenirse kod patlar.

| Para türü | Kilometre taşları | Koleksiyon |
| --- | --- | --- |
| Madeni (1 kr–1 TL) | Cebinde Bozukluk (1 TL) | Kumbara Tamam (4 madeni tür) |
| Kağıt (10 TL–100 $) | Kağıda Terfi (10 TL) · Dövize Kaçış (100 Dolar) | Deste Deste (4 kağıt tür) |
| Altın (1 gr–külçe) | Altın Günü (1 gr) · Damat Altını (Tam Altın) · Külçe Avcısı (Külçe) | Altın Vitrini (4 altın tür) · Çifte Külçe · Altın Çağ |
| Mücevher (yeşim–pembe elmas) | Kuyumcu (Yeşim) · Elmas Kesim (Elmas) · Pembe Nadir (Pembe Elmas) | Mücevher Kutusu (3 taş) · Mücevher Vitrini (5 farklı tür) |
| Kripto (Bitcoin, Soğuk Cüzdan) | Elmas Eller (Bitcoin) · Soğuk Depo (Soğuk Cüzdan) | Soğuk Zincir (ikisi aynı anda) |
| Epik (sandık–dünya) | Define Avcısı (Hazine Sandığı) · Kasa Kilidi (Banka Kasası) · Rezerv Sahibi (MB Rezervi) · Dünyanın Sahibi (Dünya Serveti) | — |

Türden bağımsız olanlar: Zincir Reaksiyon (×5 combo) · EFSANE (×10 combo) · Seri Manyağı (15 hamlelik seri) · Boğa Piyasası (tek oyunda ₺50 Mn) · Hiper Enflasyon (tek oyunda ₺1 Mr) · Kağıt Üstünde Milyoner (₺10 Mn birikim) · Holding (₺1 Mr birikim) · İlk Anahtar (ilk eşya) · Toprak Ağası (Yan Arsa) · Mahalle Kralı (tüm sahne eşyaları) · Nümizmat (12 para türü aynı anda — **şu an ulaşılamaz**, bkz. `AchievementsContext.tsx` notu).

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
src/game/levels.ts          24 seviyelik zincir, ödeme tablosu (PAYOUT_TL), formatTL
src/game/payout.ts          Hamle kazancı: combo çarpanı + mahalle çarpanı (oyun ve simülasyon ortak)
scripts/economy/sim.ts      Ekonomi kalibrasyonu (npm run economy)
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
