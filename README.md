# Lineup Lab v0.8 — Visual Library Redesign

VALORANTの定点を、マップ上の「立ち位置 → 中継点 → 着弾点」で確認・整理し、自分で作った定点も管理できる静的Webアプリです。
Strats.gg の便利な考え方を参考にしていますが、UI・コード・データ構成は独自実装です。

## 目的

- 友達同士で同じ定点をGitHub Pagesから確認する。
- 自分で定点を作成・編集する。
- スクリーンショットやMP4を定点へ付ける。
- 大きいMP4はサイト上でGitHub向けに自動圧縮する。
- 個人制作の管理画面感を減らし、定点を探しやすい高品質な攻略ツールUIにする。

## 使用者

個人・友達同士でVALORANTの定点を共有する用途を想定しています。
アカウント管理・投稿審査・外部DBなどの大規模サービス向け機能は入れていません。

## v0.8 UIデザイン方針

v0.8では、v0.7の表面的な装飾調整から一段進めて、ライブラリ画面の情報設計を再調整しています。

- 中央MAPを画面の主役として大きく・明るく表示
- 定点カードを文字中心から参考画像サムネイル中心へ変更
- 参考画像がない定点はマップ画像 + エージェント画像で補完
- 右詳細パネルのエージェントヒーローと参考画像を大型化
- マップ選択を大きい横スクロールカードへ変更
- エージェント検索欄を追加
- エージェント一覧は高さを抑えてスクロール可能に変更
- 細かすぎる文字を減らし、11〜13px中心へ調整
- 1px枠線の多用を減らし、背景差・影・余白で階層を表現
- 作成画面、MP4、圧縮、マイ定点、モーダルも同じデザインシステムへ統一
- 常時動く重いアニメーションや巨大背景画像は追加しない

UI本体は以下へ分離しています。

- `assets/css/premium-v2.css`
- `assets/js/premium-ui-v2.js`

既存の定点データ構造・保存方式・MP4圧縮本体は変更していません。

## GitHub Pagesで使う

Node.js / npm / ローカルサーバーは不要です。

1. GitHubリポジトリを用意する。
2. このプロジェクトをリポジトリ直下へ配置する。
3. `Settings` → `Pages` を開く。
4. `Deploy from a branch` を選ぶ。
5. `main` / `/(root)` を選んで保存する。
6. 発行されたGitHub Pages URLを開く。

## 共有データ

### 共通定点

`data/lineups.json` を全員共通の定点データとして扱います。
サイト起動時にこのJSONを読み込むため、GitHub側を更新すると友達側にも反映されます。

### マイ定点

作成した定点は最初にブラウザの `localStorage` へ保存します。

保存キー:

- `lineupLab.userLineups.v1`
- `lineupLab.favorites.v1`
- `lineupLab.preferences.v1`

### ローカルMP4

PCから選択したMP4本体は `IndexedDB` へ保存します。
IndexedDBへの保存完了後なら、元のPC上のMP4ファイルを削除しても同じブラウザでは再生できます。

ただし、ブラウザのサイトデータ削除・別ブラウザ・別PCではIndexedDBの動画は引き継がれません。

## 定点共有手順

1. サイトの「自分で作る」から定点を作る。
2. 必要なら画像・MP4を登録する。
3. 左下の「データ管理」を開く。
4. **共有用JSONを書き出す** を押す。
5. 出力された `lineups.json` をGitHubの `data/lineups.json` と置き換える。
6. GitHub Pages反映後、友達がページを更新すると同じ定点が表示される。

## MP4共有手順

1. 「自分で作る」→「MP4を選択」で動画を登録する。
2. 24MBを超えている場合は **24MB以下へ自動圧縮** を押す。
3. 圧縮結果を確認する。
4. **共有用MP4を保存** を押す。
5. ダウンロードされたMP4をGitHubの `assets/videos/` へアップロードする。
6. 共有用 `lineups.json` も `data/lineups.json` へ反映する。

定点JSONにはMP4本体を埋め込まず、`assets/videos/...mp4` のURLだけ保存します。

## GitHub向けMP4自動圧縮

### 基本仕様

- 目標: **24MB以下**
- 内部目標: 約22.5MB
- 形式: MP4
- 動画: H.264 / libx264
- 音声: AAC 96kbps
- FPS: 最大60fps
- 解像度: 動画時間と必要ビットレートから自動調整
- 1回目で24MBを超えた場合: 自動で1回だけ再圧縮
- 300MB超の入力: ブラウザ安定性優先で圧縮しない
- 圧縮後が元動画より大きい場合: 元動画を維持

### 解像度の自動調整

必要ビットレートに応じて最大解像度を選びます。

- 高ビットレート: 最大1920px幅（1080p相当）
- 中: 最大1280px幅（720p相当）
- 低: 最大960px幅（540p相当）
- 非常に低い場合: 最大854px幅（480p相当）

元動画より大きくアップスケールする用途ではありません。

### 圧縮エンジン

ブラウザ内で `ffmpeg.wasm` を使用します。
通常の定点閲覧ではFFmpeg coreを読み込まず、圧縮ボタンを押した時だけ圧縮エンジンを取得します。

GitHub Pagesで特殊なHTTPヘッダーを要求しないよう、単一スレッドcoreを使用します。

## 主な機能

### 定点ライブラリ

- `data/lineups.json` 自動読み込み
- マップ / エージェント / アビリティ / 攻守 / 難易度フィルター
- エージェント検索
- お気に入り
- 定点検索
- マップ上の立ち位置 / 中継点 / 着弾点
- 軌道表示
- 近接着弾地点のグループ化
- 参考画像付き定点カード
- 詳細パネル
- 参考画像3種
- YouTube / 動画URL
- MP4プレイヤー

### 自分の定点を作る

- 立ち位置 / 中継点 / 着弾点をマップ上で指定
- マーカーのドラッグ微調整
- 1点戻す / ルート全消去
- 立ち位置 / 合わせ場所 / 着弾結果の画像
- `Win + Shift + S` → `Ctrl + V`
- クリップボード貼り付け
- 画像ファイル選択
- MP4ファイル選択
- IndexedDBへMP4保存
- GitHub向けMP4自動圧縮
- MP4プレビュー
- 共有用MP4ダウンロード
- 動画URL
- メモ / タグ
- 保存後の編集

### マイ定点 / データ管理

- 自作定点一覧
- 検索
- 編集 / 削除
- お気に入り
- 共有用 `lineups.json` 書き出し
- JSON読み込み

## スクリーンショット登録

1. 「立ち位置」「合わせ場所」「着弾結果」の枠をクリックする。
2. `Win + Shift + S` でVALORANT画面を切り取る。
3. サイトへ戻る。
4. `Ctrl + V` を押す。
5. 選択中の画像枠へ登録される。

参考画像はWebPへ縮小圧縮して保存します。

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
├─ index.html
├─ README.md
├─ 作業報告書.md
├─ assets/
│  ├─ css/
│  │  ├─ styles.css
│  │  └─ premium-v2.css
│  ├─ icons/
│  │  └─ favicon.svg
│  ├─ js/
│  │  ├─ app.js
│  │  ├─ storage.js
│  │  ├─ premium-ui-v2.js
│  │  ├─ compressor.js
│  │  ├─ compressor-core.js
│  │  └─ ffmpeg-worker.js
│  └─ videos/
│     └─ .gitkeep
└─ data/
   └─ lineups.json
```

`compressor.js` は起動時の軽量ローダーです。
`premium-ui-v2.js` を読み込んだあと、圧縮本体の `compressor-core.js` を読み込みます。

## 外部データ / ライブラリ

- VALORANT画像・エージェント情報: `valorant-api.com`
- MP4圧縮: `ffmpeg.wasm`
- FFmpeg wrapper: `@ffmpeg/ffmpeg 0.12.15`
- FFmpeg single-thread core: `@ffmpeg/core 0.12.10`

圧縮ライブラリは必要時のみCDNから読み込みます。

## 崩してはいけない仕様

1. GitHub Pagesの `main / (root)` から動くこと。
2. Node.js / npmを必須にしないこと。
3. `data/lineups.json` を全員共通データとして使うこと。
4. 自作定点はブラウザへ保存すること。
5. MP4本体をJSONやlocalStorageへ埋め込まないこと。
6. ローカルMP4はIndexedDBへ保存すること。
7. 共有MP4は `assets/videos/` を使うこと。
8. マップ座標は0〜100%で保持すること。
9. 立ち位置・着弾点は保存必須とすること。
10. 中継点は0個以上に対応すること。
11. `Win + Shift + S` → `Ctrl + V` を維持すること。
12. GitHubトークンや秘密情報をHTML/JSへ入れないこと。
13. Strats.ggのHTML/CSS/ロゴ/投稿内容をそのままコピーしないこと。
14. 見た目改善のために既存主要機能を削除しないこと。
15. プレミアムUIは重い背景素材や常時動作アニメーションを必須にしないこと。
16. 定点カードの参考画像は既存 `images.result / aim / standing` を利用し、データ形式を増やさないこと。

## 注意点

- GitHub Pagesは静的サイトなので、サイトからGitHubへ直接書き込む機能はありません。
- MP4圧縮はPCのCPU・メモリを使うため、長い動画では処理負荷が高くなります。
- 初回圧縮時は圧縮エンジン取得のためインターネット接続が必要です。
- ブラウザのサイトデータを削除するとIndexedDBのローカルMP4も消えます。
- GitHubへ共有したMP4はリポジトリ容量・通信量も使用します。
- VALORANT関連素材の権利は各権利者に帰属します。
- Riot Games / Strats.ggとは無関係の非公式ツールです。

## 既知の問題 / 未確認

- Windows実機のGitHub Pages上で、ffmpeg.wasmによる実MP4圧縮完走は未確認です。
- Firefox / Chromiumそれぞれでv0.8の最終視覚確認は未実施です。
- 実際の各定点スクリーンショットが多数入った状態でのカード密度は未確認です。
- 300MBを超える動画は自動圧縮対象外です。

## バージョン

- v0.1 / 2026-08-26 — 初版
- v0.2 / 2026-08-26 — Win + Shift + S対応
- v0.3 / 2026-08-27 — GitHub Pages対応
- v0.4 / 2026-08-27 — GitHub共有JSON対応
- v0.5 / 2026-08-27 — MP4登録 / IndexedDB / 共有MP4対応
- v0.6 / 2026-08-27 — GitHub向けMP4自動圧縮対応
- v0.7 / 2026-08-27 — プレミアムUI全面調整
- **v0.8 / 2026-08-27 — MAP / 定点カード / 詳細パネルを中心にビジュアル再設計**
