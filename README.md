# Lineup Lab v1.2.0

VALORANTの定点を **立ち位置 → 中継点 → 着弾点** としてマップ上で管理し、スクリーンショット・動画と一緒に確認できるGitHub Pages向け静的Webアプリです。

## 目的

- マップ / エージェント / アビリティから定点を素早く探す
- 自分の定点を作成・編集する
- 立ち位置 / 合わせ場所 / 着弾結果を画像で残す
- MP4 / YouTubeと一緒に定点を確認する
- GitHub Pagesだけで友達と共有する
- データ量が増えても保存破綻しにくくする
- 見た目と操作性の両方を「競技用の戦術ツール」として揃える

## v1.2 Visual Direction

v1.2では、以前の「Premium Card UI」から **Tactical Workspace** へ方向を変更しました。

Design Concept:

- 中央のマップを一番強いSignatureにする
- 左はフィルター、中央は戦術マップ、右は定点インスペクター
- VALORANT風の派手な演出ではなく、競技用ツールの緊張感を優先
- 赤は重要操作 / 選択状態だけに使用
- 黒〜グラファイトの中立Surfaceを中心にする
- 角丸 / Shadow / Gradientを必要以上に使わない
- 画像・マップ・定点情報そのものを主役にする

### v1.2で変更した見た目

- App Railを72pxの細いツールバーへ整理
- Topbarを76pxへ整理し、Tabsをフラット化
- Panelの大きい角丸・強いShadowを削減
- 左フィルターを密度の高い戦術パネルへ変更
- Map選択をカードではなくFilmstrip寄りに変更
- Agent pickerを5列のコンパクトグリッドへ変更
- 中央Mapに戦術フレームを追加
- Mapをより明るく、背景装飾を弱く変更
- 定点カードを矩形寄り・画像主役へ変更
- 選択中の定点は赤い左ラインで明示
- 右詳細をInspectorとして再設計
- 作成画面をWorkbenchとして統一
- マイ定点 / Modalも同じShape languageへ統一
- 1180px以下は既存のNav / Filter Drawerを維持

現在のVisual Source of Truth:

```text
assets/css/visual.css
```

古いCSSへさらに色違いPatchを足すのではなく、最終Visual layerとして読み込んでいます。

---

## 主な機能

### 定点ライブラリ

- `data/lineups.json` 読み込み
- マップ / エージェント / アビリティ / 攻守 / 難易度フィルター
- エージェント検索
- お気に入り
- フリーワード検索
- 標準 / 難易度 / 名前ソート
- マップ上の立ち位置 / 中継点 / 着弾点
- 軌道表示
- 近い着弾点のグループ化
- 参考画像付き定点カード
- 詳細Inspector
- YouTube / 通常動画 / MP4再生

### 定点作成

- マップ上クリックで位置登録
- マーカーのドラッグ微調整
- 中継点複数
- 立ち位置 / 合わせ場所 / 着弾結果画像
- `Win + Shift + S` → `Ctrl + V`
- 画像ファイル選択
- MP4ファイル選択
- GitHub向けMP4自動圧縮
- メモ / タグ
- 編集 / 削除

### データ管理

- GitHub共有ON/OFF
- 共有パッケージZIP
- JSON検証付き読み込み
- サムネイルON/OFF
- コンパクト表示
- 保存量表示

---

## 保存

### 共通定点

```text
data/lineups.json
```

### マイ定点

localStorage:

```text
lineupLab.userLineups.v1
lineupLab.favorites.v1
lineupLab.preferences.v1
```

### ローカル画像

IndexedDB:

```text
DB: lineupLab.images.v1
store: images
```

localStorageには `_lineup-media/<lineup-id>/<slot>.webp` の参照だけを保存します。

### ローカルMP4

IndexedDB:

```text
DB: lineupLab.videos.v1
store: videos
```

---

## GitHub共有

### 画像あり定点

1. 定点を保存
2. 「マイ定点」で **GitHub共有** をON
3. 「データ管理」→ **共有パッケージを書き出す**
4. ZIPを展開
5. `lineups.json` を `data/lineups.json` へ反映
6. `assets/lineups/` を同じ構成でGitHubへ反映

ZIP:

```text
lineups.json
assets/
└─ lineups/
   └─ <lineup-id>/
      ├─ standing.webp
      ├─ aim.webp
      └─ result.webp
README.txt
```

### MP4あり定点

MP4は共有ZIPへ含めません。

1. 「共有用MP4を保存」
2. `assets/videos/` へアップロード
3. 共有パッケージを反映

---

## MP4自動圧縮

- 目標24MB以下
- 内部目標 約22.5MB
- H.264 / AAC
- 最大60fps
- 最大1080p / 720p / 540p / 480pを動画時間から選択
- 24MB超なら1回再調整
- 300MB超は自動圧縮対象外
- ffmpeg.wasmは圧縮時だけ読み込み

---

## Runtime構成

```text
index.html
├─ storage.js
├─ app.js
└─ foundation-v1.js
   ├─ media-store.js
   ├─ foundation-core-v1.js
   │  └─ premium-ui-v2.js
   └─ visual.css

storage.js
└─ compressor.js
   └─ compressor-core.js

sw.js
└─ IndexedDB画像配信
```

`visual.css` が現在のVisual Source of Truthです。

---

## 崩してはいけない仕様

1. GitHub Pages `main / (root)` で動く
2. 利用時にNode.js / npmを必須にしない
3. `data/lineups.json` はトップレベル配列
4. 座標は0〜100%
5. 立ち位置・着弾点必須
6. 中継点は0個以上
7. `Win + Shift + S` → `Ctrl + V` を維持
8. APIキー・GitHubトークンを公開コードへ入れない
9. MP4本体をlocalStorage / JSONへ埋め込まない
10. ローカル画像本体をlocalStorageへ保存しない
11. 共有画像は `assets/lineups/`
12. 共有MP4は `assets/videos/`
13. 見た目改善のために主要機能を削除しない

---

## 自動検証

`.github/workflows/validate.yml` で、共有JSONと主要JavaScriptの構文を検証します。

主な検証:

- JSONトップレベル配列
- 必須項目
- ID重複
- 座標0〜100
- side / difficulty / tags / videoUrl
- Data URL画像の共有JSON混入
- `_lineup-media/` の共有JSON混入
- 主要JS / Service Worker構文

---

## 現在残っている重要課題

### app.js / premium-ui-v2.js の統合

カードサムネイル・Agent検索・Detail装飾の一部は、まだ `premium-ui-v2.js` のMutationObserver方式です。

今後は `app.js` の正式render処理へ統合するのが次の大きな保守性改善です。

### 実用定点データ不足

`data/lineups.json` はデモ中心です。実戦定点は正しい照準位置・チャージ・バウンドを確認して追加する必要があります。

### 実機検証

未確認項目は確認済み扱いにしません。

- Firefox / Chromiumで画像Data URL→IndexedDB自動移行
- Service Worker経由の画像再表示
- 共有ZIPを別PCから表示
- Windows実機ffmpeg.wasm圧縮
- 大量画像100件以上の長期利用

---

## バージョン

- v0.1 — 初版
- v0.2 — スクリーンショット改善
- v0.3 — GitHub Pages
- v0.4 — 共有JSON
- v0.5 — MP4 / IndexedDB
- v0.6 — MP4自動圧縮
- v0.7 — Premium UI
- v0.8 — MAP / カード / 詳細再設計
- v0.9 — 他プロジェクトのUIパターン導入
- v1.0.0 — 監査結果を反映した基盤整理
- v1.1.0 — 画像IndexedDB / Service Worker / 共有画像ZIP
- **v1.2.0 / 2026-08-31 — Tactical Workspace Visual Redesign**
