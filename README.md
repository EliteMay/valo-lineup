# Lineup Lab v0.9.0

VALORANTの定点を、**立ち位置 → 中継点 → 着弾点**としてマップ上で管理し、参考画像・動画と一緒に確認できるGitHub Pages向け静的Webアプリです。

友達同士で同じ定点を共有しつつ、自分の作成途中データはブラウザ内に保持する構成です。

## 目的

- 定点をマップ・エージェント・アビリティから素早く探す
- 自分で定点を作成・編集する
- スクリーンショットやMP4を一緒に保存する
- GitHub Pagesだけで友達と共通定点を共有する
- 個人制作感を減らし、日常的に使いやすい攻略ツールにする

## v0.9で改善したこと

他の自作GitHubプロジェクトで使っている良い設計を、Lineup Lab向けに取り入れました。

### VReviewから参考にしたもの

- サイト上へ現在バージョンを常時表示
- 状態・数値を短く見せるUI
- UI機能とデータ処理を分離する考え方

### ASMRTubeから参考にしたもの

- ダッシュボード型の概要表示
- モバイル時のサイドメニュードロワー
- データ管理画面内の統計・表示設定
- コンパクト表示などのユーザー設定

### LyricTubeから参考にしたもの

- 読みやすい文字サイズと情報密度
- `focus-visible` によるキーボード操作の分かりやすさ
- 操作部品の統一感
- GitHub Pages運用時の `.nojekyll`

### AP Study Notesから参考にしたもの

- データが増えた時にHTMLへ直書きせずJSON側へ寄せる方針
- 大規模化してから分割できるよう、表示処理とデータを分離する考え方

現時点では共有フローを単純に保つため、定点データは引き続き `data/lineups.json` 1ファイルです。

## 主な機能

### 定点ライブラリ

- GitHub共通 `data/lineups.json` 読み込み
- マップ選択
- エージェント検索・選択
- アビリティ選択
- 攻め / 守り
- 難易度
- お気に入り
- フリーワード検索
- ソート
- マップ上の立ち位置 / 中継点 / 着弾点
- 軌道表示
- 近い着弾点のグループ化
- 参考画像付き定点カード
- エージェント画像付き詳細パネル
- YouTube / 通常動画 / MP4再生

### v0.9 Product UX

ライブラリ上部に以下を常時表示します。

- 現在のマップ
- 現在条件に一致する定点数
- GitHub共有定点数
- マイ定点数
- お気に入り数

キーボードショートカット:

- `/` — 定点検索へ移動
- `N` — 新しい定点を作成

### 表示設定

データ管理画面から、このブラウザだけの表示設定を変更できます。

- サムネイル表示 ON / OFF
- コンパクト表示 ON / OFF

設定は `localStorage` に保存します。

### モバイル / 狭い画面

900px以下では左ナビを固定表示せず、メニューボタンから開くドロワー方式になります。

デスクトップでは従来どおり、マップ・フィルター・詳細を同時に見られる構成です。

## 自分の定点を作る

- 定点名
- マップ
- エージェント
- アビリティ
- サイト
- 攻守
- 難易度
- 立ち位置
- 0個以上の中継点
- 着弾点
- 立ち位置スクリーンショット
- 合わせ場所スクリーンショット
- 着弾結果スクリーンショット
- MP4
- YouTube / 動画URL
- メモ
- タグ

マップ上のマーカーはドラッグして微調整できます。

## スクリーンショット登録

1. 「立ち位置」「合わせ場所」「着弾結果」の枠を選択
2. `Win + Shift + S`
3. VALORANT画面を切り取る
4. サイトへ戻る
5. `Ctrl + V`

画像はWebPへ縮小圧縮して保存します。

## MP4

### ローカル保存

PCから選択したMP4本体は **IndexedDB** へ保存します。

そのため、IndexedDB保存完了後なら、元のPC上のMP4を削除しても同じブラウザでは再生できます。

ただし以下では引き継がれません。

- ブラウザのサイトデータ削除
- 別ブラウザ
- 別PC

### GitHub共有

友達にも動画を見せる場合:

1. MP4を選択
2. 必要ならGitHub向け自動圧縮
3. 「共有用MP4を保存」
4. GitHubの `assets/videos/` へアップロード
5. 共有用 `lineups.json` も更新

定点JSONには動画本体を埋め込まず、MP4 URLだけを保存します。

## GitHub向けMP4自動圧縮

ブラウザ内の `ffmpeg.wasm` を使用します。

- 目標: 24MB以下
- 内部目標: 約22.5MB
- H.264 / libx264
- AAC 96kbps
- 最大60fps
- 動画時間からビットレートを自動計算
- 最大解像度を1080p / 720p / 540p / 480p相当から自動選択
- 24MBを超えた場合は1回だけ自動再調整
- 圧縮後が元動画より大きい場合は元動画を維持
- 300MB超はブラウザ安定性優先で対象外

圧縮エンジンは通常閲覧時には読み込まず、圧縮時だけ取得します。

## 保存場所

### GitHub

- 共通定点: `data/lineups.json`
- 共有MP4: `assets/videos/`

### ブラウザ

- マイ定点: `localStorage`
- お気に入り: `localStorage`
- マップ / 表示設定: `localStorage`
- ローカルMP4本体: `IndexedDB`

主なlocalStorageキー:

```text
lineupLab.userLineups.v1
lineupLab.favorites.v1
lineupLab.preferences.v1
```

## 共有用JSON

1. 自分の定点を作成
2. 左下「データ管理」
3. 「共有用JSONを書き出す」
4. ダウンロードされた `lineups.json` をGitHubの `data/lineups.json` と置き換える
5. GitHub Pages反映後、友達が更新すると同じ定点を確認できる

ブラウザへGitHubトークンは保存しません。

## データ構造

```json
{
  "id": "uuid",
  "source": "shared",
  "title": "A Main Recon",
  "map": "Ascent",
  "agent": "Sova",
  "ability": "Recon Bolt",
  "side": "attack",
  "site": "A",
  "difficulty": "medium",
  "start": { "x": 31.2, "y": 74.0 },
  "bounces": [],
  "end": { "x": 57.0, "y": 31.0 },
  "notes": "合わせ方など",
  "tags": ["recon", "safe"],
  "videoUrl": "https://USER.github.io/valo-lineup/assets/videos/example.mp4",
  "images": {
    "standing": "data:image/webp;base64,...",
    "aim": "data:image/webp;base64,...",
    "result": "data:image/webp;base64,..."
  }
}
```

座標は0〜100%の正規化座標です。

## ファイル構成

```text
/
├─ .gitignore
├─ .nojekyll
├─ index.html
├─ README.md
├─ 作業報告書.md
├─ assets/
│  ├─ css/
│  │  ├─ styles.css
│  │  ├─ premium-v2.css
│  │  └─ product-ui.css
│  ├─ icons/
│  │  └─ favicon.svg
│  ├─ js/
│  │  ├─ app.js
│  │  ├─ storage.js
│  │  ├─ premium-ui-v2.js
│  │  ├─ product-ui.js
│  │  ├─ compressor.js
│  │  ├─ compressor-core.js
│  │  └─ ffmpeg-worker.js
│  └─ videos/
│     └─ .gitkeep
└─ data/
   └─ lineups.json
```

### UIレイヤー

```text
styles.css
   ↓
premium-v2.css / premium-ui-v2.js
   ↓
product-ui.css / product-ui.js
```

`product-ui.js` はv0.9のプロダクトUXを担当し、定点データやMP4圧縮本体とは分離しています。

`compressor.js` は軽量ローダーで、Product UIと `compressor-core.js` を読み込みます。

## GitHub Pages

Node.js / npm / ローカルサーバーは不要です。

`Settings` → `Pages`:

```text
Deploy from a branch
main
/(root)
```

`.nojekyll` をリポジトリ直下へ配置しています。

## 崩してはいけない仕様

1. GitHub Pagesの `main / (root)` で動く
2. Node.js / npmを必須にしない
3. `data/lineups.json` を全員共通データとして使う
4. 自作定点はブラウザへ保存する
5. MP4本体をJSON / localStorageへ埋め込まない
6. ローカルMP4はIndexedDBへ保存する
7. 共有MP4は `assets/videos/` を使う
8. マップ座標は0〜100%で保持する
9. 立ち位置・着弾点は保存必須
10. 中継点は0個以上
11. `Win + Shift + S` → `Ctrl + V` を維持
12. GitHubトークンや秘密情報を公開コードへ入れない
13. 見た目改善のために主要機能を削除しない
14. 重いアニメーションを常時動作させない
15. 表示設定を変更しても既存のマップ設定を消さない

## 注意点 / 未確認

- Windows実機のGitHub Pages上でffmpeg.wasmの圧縮完走は未確認
- Firefox / Chromium両方でv0.9の最終視覚確認は未実施
- 300MBを超える動画は自動圧縮対象外
- 大量の定点が増えた場合は `data/lineups.json` のマップ別分割を検討する

## バージョン

- v0.1 — 初版
- v0.2 — Win + Shift + S対応
- v0.3 — GitHub Pages対応
- v0.4 — GitHub共有JSON対応
- v0.5 — MP4 / IndexedDB対応
- v0.6 — GitHub向けMP4自動圧縮
- v0.7 — プレミアムUI
- v0.8 — MAP / 定点カード / 詳細パネル再設計
- **v0.9.0 — 他の自作GitHubプロジェクトを参考にProduct UX・モバイル・表示設定・運用を改善**
