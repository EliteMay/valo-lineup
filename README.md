# Lineup Lab v1.0.0

VALORANTの定点を **立ち位置 → 中継点 → 着弾点** としてマップ上で管理し、参考画像・動画と一緒に確認できるGitHub Pages向け静的Webアプリです。

## 目的

- 定点をマップ・エージェント・アビリティから素早く探す
- 自分で定点を作成・編集する
- スクリーンショットとMP4を定点へ付ける
- GitHub Pagesだけで友達と共通定点を共有する
- 保存事故・共有事故・修正時の連鎖破壊を減らす

## 使用者

個人利用・友達同士での共有を想定しています。大規模サービス向けのアカウント管理や投稿審査は前提にしていません。

## v1.0で直した重要点

### 1. UIと動画圧縮を分離

v0.9ではProduct UIがMP4圧縮ローダー経由で起動していました。v1.0では `index.html` から `foundation-v1.js` を直接読み込むように変更し、圧縮側は圧縮本体だけを読み込みます。

```text
index.html
├─ storage.js
├─ app.js
└─ foundation-v1.js
   └─ premium-ui-v2.js

storage.js
└─ compressor.js
   └─ compressor-core.js
```

動画圧縮側の不具合がUI全体へ波及しにくい構造です。

### 2. v0.9 Product UI層を削除

以下は削除済みです。

- `assets/js/product-ui.js`
- `assets/css/product-ui.css`

過剰だったダッシュボード統計と二重バージョン表示も廃止しました。

### 3. GitHub共有を明示選択式へ変更

「マイ定点」に **GitHub共有** のON/OFFを追加しました。

共有用JSONを書き出すときは、

- GitHub共有ONのマイ定点だけ追加・更新
- GitHub共有OFFへ変更した既存共有定点は共有JSONから除外
- 書き出す前に件数を確認

という流れになります。

作りかけ・テスト用定点を意図せず共有しにくくしています。

### 4. 削除した定点のローカルMP4を掃除

定点削除・全削除・動画差し替え時に、使われなくなったIndexedDB内のMP4を削除する処理を追加しました。

### 5. JSON読み込みを検証

サイトへJSONを読み込む前に、最低限以下を確認します。

- title / map / agent
- start / end 座標
- bounces
- videoUrl

不正JSONはそのまま保存しません。

### 6. GitHub Actionsで共有JSONを自動検証

`tests/validate-data.mjs` と `.github/workflows/validate.yml` を追加しました。

`data/lineups.json` 更新時に以下を自動検査します。

- トップレベル配列か
- 必須項目
- ID重複
- 座標0〜100
- side / difficulty
- tags / images / videoUrl

npm依存はありません。

### 7. 狭い画面を再設計

1180px以下では、

- 左ナビ → ドロワー
- フィルター → 右ドロワー
- MAPを先に見られるレイアウト

へ切り替えます。

### 8. 小さすぎる文字を緩和

8〜9px中心だった補助文字を減らし、10〜12px以上を中心に再調整しました。

### 9. 「おすすめ順」を修正

実際におすすめスコアを計算していなかったため、表示名を **標準順** に変更しました。

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
- 参考画像付き定点カード
- 詳細パネル
- YouTube / 通常動画 / MP4再生

### 定点作成

- マップ上をクリックして位置登録
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
- 共有用 `lineups.json` 書き出し
- 書き出し前の件数確認
- JSON検証付き読み込み
- 保存容量の目安表示
- サムネイルON/OFF
- コンパクト表示

## 保存場所

### 共通定点

`data/lineups.json`

GitHub Pagesを開く全員に共通です。

### マイ定点

ブラウザのlocalStorageです。

- `lineupLab.userLineups.v1`
- `lineupLab.favorites.v1`
- `lineupLab.preferences.v1`

### ローカルMP4

IndexedDB:

- DB: `lineupLab.videos.v1`
- store: `videos`

MP4登録後は元ファイルを削除しても、同じブラウザのIndexedDBが残っていれば再生できます。

## GitHub共有手順

1. 「自分で作る」で定点を保存
2. 「マイ定点」で共有したい定点の **GitHub共有** をON
3. MP4を共有する場合は共有用MP4を保存
4. MP4を `assets/videos/` へアップロード
5. 「データ管理」→「共有用JSONを書き出す」
6. 確認画面で件数を確認
7. 出力された `lineups.json` で `data/lineups.json` を置き換える
8. GitHub Pages反映後に更新

## MP4自動圧縮

- 目標: 24MB以下
- 内部目標: 約22.5MB
- H.264 / AAC
- 最大60fps
- 動画時間に応じて最大1080p / 720p / 540p / 480p
- 1回目で24MBを超えた場合は1回再調整
- 300MB超は自動圧縮対象外
- ffmpeg.wasmは圧縮時だけ読み込み

## ファイル構成

```text
/
├─ .github/
│  └─ workflows/
│     └─ validate.yml
├─ .gitignore
├─ .nojekyll
├─ index.html
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
│  │  ├─ foundation-v1.js
│  │  ├─ premium-ui-v2.js
│  │  ├─ compressor.js
│  │  ├─ compressor-core.js
│  │  └─ ffmpeg-worker.js
│  └─ videos/
│     └─ .gitkeep
├─ data/
│  └─ lineups.json
└─ tests/
   └─ validate-data.mjs
```

## 崩してはいけない仕様

1. GitHub Pagesの `main / (root)` で動く
2. 利用時にNode.js / npmを必須にしない
3. `data/lineups.json` はトップレベル配列を維持
4. 座標は0〜100%で保存
5. 立ち位置・着弾点は必須
6. 中継点は0個以上
7. `Win + Shift + S` → `Ctrl + V` を維持
8. APIキー・GitHubトークンを公開HTML/JSへ入れない
9. MP4本体をlocalStorage/JSONへ埋め込まない
10. 共有MP4は `assets/videos/` を利用
11. 見た目改善のために主要機能を削除しない

## 現在残っている重要課題

### 共有定点の内容不足

現在の `data/lineups.json` はUI確認用デモが中心です。実戦で使える定点データは別途追加が必要です。内容を推測して実用定点を捏造することはしません。

### 画像保存はまだlocalStorage互換方式

画像はWebP圧縮していますが、Data URLを定点JSON内へ保持する方式が残っています。

v1.0では、

- 4MBを超えそうなローカル定点JSONを保存しないガード
- データ管理で使用量表示
- バックアップ注意表示

まで追加しています。

将来的には画像もIndexedDBへ移し、共有時は `assets/lineups/<id>/` にWebPを置く方式へ移行するのが理想です。この移行は既存保存データとの互換処理が必要なため、今回のv1.0では無理に破壊的変更をしていません。

### app.js / premium-ui-v2.js の統合

v0.9よりUIレイヤーは1枚減りましたが、カード装飾など一部はまだ `premium-ui-v2.js` のMutationObserver方式です。今後さらに保守性を上げる場合は `app.js` のrender処理へ統合します。

## 未確認

- Windows実機のGitHub Pages上でのffmpeg.wasm圧縮完走
- Firefox / Chromiumでのv1.0全画面最終視覚確認
- 大量の実画像・実定点を入れた状態の長期容量テスト
- 1180px以下の全端末での実機操作

未確認項目は確認済みとして扱いません。

## バージョン

- v0.1 — 初版
- v0.2 — スクリーンショット運用改善
- v0.3 — GitHub Pages対応
- v0.4 — GitHub共有JSON
- v0.5 — MP4 / IndexedDB
- v0.6 — MP4自動圧縮
- v0.7 — Premium UI
- v0.8 — MAP / カード / 詳細再設計
- v0.9 — 他プロジェクトのUIパターン導入
- **v1.0.0 / 2026-08-30 — 監査結果を反映した保存・共有・UI・検証基盤の整理**
