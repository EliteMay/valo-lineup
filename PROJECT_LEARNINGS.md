# Lineup Lab Project Learnings

このファイルは、Lineup Labで実際に起きた高コストな失敗・有効だった改善を次回作業へ引き継ぐための記録です。

## L-001 — 大容量MediaをlocalStorageへ入れない

### 問題

初期実装ではスクリーンショットをWebP Data URLとして定点JSONへ直接保持していました。

定点数が増えるほどlocalStorageを急速に圧迫し、保存失敗の原因になります。

### 現在の対策

- 画像本体: IndexedDB `lineupLab.images.v1`
- MP4本体: IndexedDB `lineupLab.videos.v1`
- localStorage: metadata / 軽い参照のみ
- 共有画像: `assets/lineups/`
- 共有動画: `assets/videos/`

### Regression Guard

- Data URL画像を共有JSONへ入れない
- `_lineup-media/` を共有JSONへ入れない
- GitHub Actionsで検証

---

## L-002 — UIを別機能のLoaderへぶら下げない

### 問題

一時期、Visual UIがMP4圧縮Loader経由で起動していました。

動画圧縮側の失敗がUI全体へ波及する構造でした。

### 現在の対策

```text
index.html
├─ storage.js
├─ app.js
└─ foundation-v1.js

storage.js
└─ compressor.js
```

UIと動画圧縮を分離しています。

---

## L-003 — Patch UIを積み重ねすぎない

### 問題

v0.7〜v0.9で、既存CSSへPremium / Product UIを重ねた結果、見た目は改善してもSource of Truthが分かりにくくなりました。

### 現在の対策

v1.2では現在の最終Visual layerを以下へ固定しています。

```text
assets/css/visual.css
```

今後Visualを変更するときは、新しい `visual-v2.css` のようなPatchを増やすより、原則 `visual.css` を更新します。

旧CSSの完全統合はArchitecture作業として別単位で行います。

---

## L-004 — Mapを主役にする

### 問題

以前はFilter / Card / Detail / Dashboardのすべてが同じ強さで、定点サイトなのにMapがVisual hierarchyの主役になっていませんでした。

### 現在の対策

Design SignatureをTactical Mapへ限定しています。

- 最も大きいVisual = Map
- 赤Accent = Primary / Selectedのみ
- Filter / DetailはMapより弱いSurface
- Dashboard統計は常時表示しない
- DecorationはMap frameを中心にする

---

## L-005 — “Premium”をEffectの量で作らない

### 問題

角丸、Shadow、Gradient、Cardを増やすほど高品質になるわけではありません。

むしろ個人制作Dashboard / AI Template感が強くなる場合がありました。

### 現在の対策

v1.2 Tactical Workspaceでは:

- Radius 3〜8px中心
- ShadowはMap / Overlay等の必要箇所のみ
- PanelはBorder / Background difference / Spacingで階層化
- Cardを浮かせすぎない
- Hoverで大きく動かさない
- Screenshot / Map / Agent visualを優先

---

## L-006 — 実戦定点を推測で作らない

### 問題

UI Demoと実用データを混同すると、サイトが綺麗でも定点情報として信用できません。

### 現在の対策

- Demoは実戦精度を保証しないと表示
- 正しい照準 / Charge / Bounceを確認できない定点は実用データとして追加しない

---

## L-007 — 実機未確認は未確認と書く

GitHub Actions / Pages build成功だけでは、Browser UI / IndexedDB / Service Worker / ffmpeg.wasmの実動作確認にはなりません。

作業報告には次を分けて記録します。

- Repository上で確認
- CIで確認
- Pages buildで確認
- Browser実機で確認
- 未確認
