# Lineup Lab v1.1.0

VALORANTの定点を **立ち位置 → 中継点 → 着弾点** としてマップ上で管理し、スクリーンショット・動画と一緒に確認できるGitHub Pages向け静的Webアプリです。

## 目的

- 定点をマップ / エージェント / アビリティから素早く探す
- 自分の定点を作成・編集する
- スクリーンショットとMP4を定点へ紐付ける
- GitHub Pagesだけで友達と共有する
- 画像や動画が増えてもlocalStorageを圧迫しにくくする
- 修正時に別機能まで壊れにくい構造へ整理する

## 使用者

個人利用・友達同士での共有を想定しています。大規模サービス向けのアカウント管理や投稿審査は前提にしていません。

---

## v1.1で改善したこと

### 1. 画像をIndexedDBへ移行

v1.0まではWebP化したスクリーンショットをData URLとしてlocalStorageへ保存していました。

v1.1では:

- 画像本体 → IndexedDB `lineupLab.images.v1`
- localStorage → `_lineup-media/<lineup-id>/<slot>.webp` という軽い参照だけ
- 表示 → Service Worker `sw.js` がIndexedDBから画像を返す

という構成へ変更しました。

対応画像:

- `standing` — 立ち位置
- `aim` — 合わせ場所
- `result` — 着弾結果

### 2. 旧Data URLを自動移行

既存のマイ定点にData URL画像が残っていても削除しません。

GitHub Pages上でService Worker / IndexedDBが利用できる場合、初回起動時に:

1. 旧Data URLをIndexedDBへ保存
2. localStorage側を軽い参照へ置換
3. 次回以降はService Worker経由で表示

します。

Service Workerを利用できない環境では従来方式へフォールバックします。

### 3. 画像削除時の孤児データ掃除

- 定点削除
- 全削除
- 画像差し替え / 画像解除

で参照されなくなったIndexedDB画像を削除します。

MP4についても、参照されなくなったローカル動画を従来どおり掃除します。

### 4. 共有パッケージZIP

従来の「共有用JSONを書き出す」を **共有パッケージを書き出す** へ強化しました。

ZIPには以下をまとめます。

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

ローカル専用 `_lineup-media/` 参照は共有JSONへそのまま出しません。

共有時は `assets/lineups/<id>/...` に変換します。

### 5. 共有JSON検証を強化

GitHub Actionsで以下をエラーにします。

- Data URL画像を `data/lineups.json` へ直接埋め込む
- `_lineup-media/` のローカル専用参照を共有JSONへ入れる
- ID重複
- 座標不正
- 必須項目不足
- side / difficulty / tags / videoUrl の形式不正

### 6. JavaScript構文チェック

GitHub Actionsで以下も自動確認します。

- `app.js`
- `storage.js`
- `media-store.js`
- `foundation-v1.js`
- `foundation-core-v1.js`
- `premium-ui-v2.js`
- MP4圧縮関連JS
- `sw.js`

npm依存はありません。

---

## 現在の読み込み構造

```text
index.html
├─ storage.js
├─ app.js
└─ foundation-v1.js
   ├─ media-store.js
   └─ foundation-core-v1.js
      └─ premium-ui-v2.js

storage.js
└─ compressor.js
   └─ compressor-core.js
```

`foundation-v1.js` はv1.1用の薄いローダーです。

UI本体とMP4圧縮は分離されています。

---

## 主な機能

### 定点ライブラリ

- `data/lineups.json` 読み込み
- マップ / エージェント / アビリティ / 攻守 / 難易度
- エージェント検索
- お気に入り
- フリーワード検索
- 標準 / 難易度 / 名前ソート
- マップ上の立ち位置 / 中継点 / 着弾点
- 軌道表示
- 近い着弾点のグループ化
- 参考画像付きカード
- 詳細パネル
- YouTube / 通常動画 / MP4再生

### 定点作成

- マップ上クリックで位置登録
- マーカーのドラッグ微調整
- 中継点複数
- 立ち位置 / 合わせ場所 / 着弾結果画像
- `Win + Shift + S` → `Ctrl + V`
- 画像ファイル選択
- MP4ファイル選択
- MP4をIndexedDBへ保存
- GitHub向けMP4自動圧縮
- メモ / タグ
- 編集 / 削除

### データ管理

- GitHub共有ON/OFF
- 共有パッケージZIP
- JSON検証付き読み込み
- 保存量の目安表示
- サムネイルON/OFF
- コンパクト表示

---

## 保存場所

### 共通定点

```text
data/lineups.json
```

GitHub Pagesを開く全員に共通です。

### マイ定点

localStorage:

```text
lineupLab.userLineups.v1
lineupLab.favorites.v1
lineupLab.preferences.v1
```

画像本体はlocalStorageへ入れず、画像参照だけを保存します。

### ローカル画像

IndexedDB:

```text
DB: lineupLab.images.v1
store: images
```

### ローカルMP4

IndexedDB:

```text
DB: lineupLab.videos.v1
store: videos
```

---

## GitHub共有手順

### 画像あり定点

1. 「自分で作る」で定点を保存
2. 「マイ定点」で共有したい定点の **GitHub共有** をON
3. 「データ管理」→ **共有パッケージを書き出す**
4. ZIPを展開
5. `lineups.json` をGitHubの `data/lineups.json` へ置き換える
6. ZIP内 `assets/lineups/` をGitHubの `assets/lineups/` へ同じ構成でアップロード
7. GitHub Pages反映後に更新

### MP4あり定点

MP4はZIPへ自動同梱しません。

1. 「共有用MP4を保存」
2. MP4をGitHub `assets/videos/` へアップロード
3. その後、共有パッケージZIPを反映

MP4をZIPへ含めない理由は、動画サイズが大きくGitHubアップロード制限へ到達しやすいためです。

---

## MP4自動圧縮

- 目標: 24MB以下
- 内部目標: 約22.5MB
- H.264 / AAC
- 最大60fps
- 動画時間に応じ最大1080p / 720p / 540p / 480p
- 24MBを超えた場合は1回再調整
- 300MB超は自動圧縮対象外
- ffmpeg.wasmは圧縮時だけ読み込み

---

## ファイル構成

```text
/
├─ .github/
│  └─ workflows/
│     └─ validate.yml
├─ .gitignore
├─ .nojekyll
├─ index.html
├─ sw.js
├─ README.md
├─ 作業報告書.md
├─ assets/
│  ├─ css/
│  │  ├─ styles.css
│  │  ├─ premium-v2.css
│  │  └─ foundation-v1.css
│  ├─ icons/
│  │  └─ favicon.svg
│  ├─ js/
│  │  ├─ app.js
│  │  ├─ storage.js
│  │  ├─ media-store.js
│  │  ├─ foundation-v1.js
│  │  ├─ foundation-core-v1.js
│  │  ├─ premium-ui-v2.js
│  │  ├─ compressor.js
│  │  ├─ compressor-core.js
│  │  └─ ffmpeg-worker.js
│  ├─ lineups/
│  │  └─ .gitkeep
│  └─ videos/
│     └─ .gitkeep
├─ data/
│  └─ lineups.json
└─ tests/
   └─ validate-data.mjs
```

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
11. 共有画像は `assets/lineups/` を使用
12. 共有MP4は `assets/videos/` を使用
13. 見た目改善のために主要機能を削除しない

---

## 現在残っている重要課題

### 1. app.js / premium-ui-v2.js の統合

カードサムネイルなど一部は、まだ `premium-ui-v2.js` がMutationObserverで後付けしています。

次の大きな保守性改善は、これを `app.js` のrender処理へ統合することです。

### 2. 実用定点データ不足

`data/lineups.json` はUI確認用デモ中心です。

実戦用定点は正しい照準位置・チャージ・バウンド等を確認して追加する必要があります。未確認データは追加しません。

### 3. 実機検証

未確認:

- Firefox / Chromiumで画像Data URL→IndexedDB自動移行
- Service Worker経由の画像再表示
- 共有ZIPをGitHubへ反映した後の友達PC表示
- Windows実機でのffmpeg.wasm圧縮完走
- 大量画像100件以上の長期利用

未確認項目は確認済みとして扱いません。

---

## バージョン

- v0.1 — 初版
- v0.2 — スクリーンショット改善
- v0.3 — GitHub Pages対応
- v0.4 — 共有JSON
- v0.5 — MP4 / IndexedDB
- v0.6 — MP4自動圧縮
- v0.7 — Premium UI
- v0.8 — MAP / カード / 詳細再設計
- v0.9 — 他プロジェクトのUIパターン導入
- v1.0.0 — 監査結果を反映した保存・共有・UI・検証基盤整理
- **v1.1.0 / 2026-08-30 — 画像IndexedDB化 / Service Worker / 共有画像ZIP対応**