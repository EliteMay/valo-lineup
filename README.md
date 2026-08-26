# Lineup Lab v0.3 — GitHub Pages版

VALORANTの定点を、マップ上の「立ち位置 → 中継点 → 着弾点」で確認・整理し、自分専用の定点も作成・保存できる静的Webアプリです。
Strats.gg の便利な考え方を参考にしていますが、UI・コード・データ構成は独自実装です。

## GitHub Pagesで使う

この版は **Node.js / npm / ローカルサーバー不要** です。

1. GitHubで新しいリポジトリを作成します。
2. このフォルダの中身を **リポジトリ直下** へ配置します。
3. GitHubの `Settings` → `Pages` を開きます。
4. `Build and deployment` を `Deploy from a branch` にします。
5. Branchを `main`、Folderを `/(root)` にして保存します。
6. GitHub PagesのURLを開けば利用できます。

`index.html`、`assets/`、`data/` は必ず同じ階層に置いてください。

## 主な機能

### 定点ライブラリ
- マップ / エージェント / アビリティ / 攻守 / 難易度で絞り込み
- お気に入りだけ表示
- タイトル・サイト・メモ・タグ検索
- マップ上の立ち位置 / 中継点 / 着弾点表示
- 軌道表示
- 近い着弾地点の自動グループ化
- 詳細パネル
- 参考画像3種
- YouTube埋め込み / 動画URL

### 自分の定点を作る
- マップをクリックして立ち位置 / 中継点 / 着弾点を登録
- 登録地点のドラッグ微調整
- 1点戻す / ルート全消去
- 立ち位置 / 合わせ場所 / 着弾結果の画像
- `Win + Shift + S` → `Ctrl + V` でスクリーンショット登録
- クリップボードから直接貼り付け
- 画像ファイル選択のフォールバック
- 動画URL / メモ / タグ
- 保存後の編集

### マイ定点 / データ管理
- 自作定点一覧
- 検索 / 編集 / 削除 / お気に入り
- JSON書き出し / 読み込み
- ブラウザ内自動保存

## スクリーンショット登録

1. 「立ち位置」「合わせ場所」「着弾結果」の画像枠をクリックします。
2. `Win + Shift + S` でVALORANT画面を切り取ります。
3. サイトへ戻って `Ctrl + V` を押します。
4. 選択中の画像枠へ画像が入ります。

GitHub PagesはHTTPSで動くため、ブラウザが許可していれば「貼る」ボタンからClipboard APIで直接読み込むこともできます。

## 保存方法

自作定点はブラウザの `localStorage` にJSON形式で保存します。
GitHubへ自動アップロードされるわけではありません。

保存キー:
- `lineupLab.userLineups.v1`
- `lineupLab.favorites.v1`
- `lineupLab.preferences.v1`

参考画像は保存前にWebPへ縮小・圧縮します。
ブラウザ保存容量には上限があるため、大切な定点は定期的にJSON書き出ししてください。

### GitHub Pages利用時の注意

- 保存データは **GitHubアカウントではなく、そのブラウザのオリジン（https://USER.github.io など）単位** です。
- 同じ `USER.github.io` 配下ならリポジトリのパスが変わっても同じlocalStorageを参照します。別ドメインへ移した場合は自動では引き継がれません。
- PCを変えたりブラウザデータを消した場合も自動同期されません。JSONバックアップで移行してください。

## 外部データ

エージェント名、アビリティ、エージェント画像、マップ画像は起動時に `valorant-api.com` の公開APIから取得します。
APIへ接続できない場合はアプリ内フォールバック情報を使用し、画面全体が使用不能にならない設計です。

画像自体をこのリポジトリへ大量転載せず、公開APIの画像URLを利用しています。
そのため最新画像の表示にはインターネット接続が必要です。

## デモ定点

`data/lineups.json` の定点は **UI・機能確認用デモ** です。
実際のVALORANTで正確に着弾することを保証した実戦定点ではありません。
Strats.ggの投稿済み定点データや動画はコピーしていません。

## データ構造

```json
{
  "id": "uuid",
  "source": "user",
  "title": "A Main Recon",
  "map": "Ascent",
  "agent": "Sova",
  "ability": "Recon Bolt",
  "side": "attack",
  "site": "A",
  "difficulty": "medium",
  "start": { "x": 31.2, "y": 74.0 },
  "bounces": [
    { "x": 40.0, "y": 55.0 }
  ],
  "end": { "x": 57.0, "y": 31.0 },
  "notes": "合わせ方など",
  "tags": ["recon", "safe"],
  "videoUrl": "https://...",
  "images": {
    "standing": "data:image/webp;base64,...",
    "aim": "data:image/webp;base64,...",
    "result": "data:image/webp;base64,..."
  }
}
```

座標 `x / y` はマップ画像上の0〜100%正規化座標です。

## ファイル構成

```text
/
├─ index.html
├─ .nojekyll
├─ .gitignore
├─ README.md
├─ 作業報告書.md
├─ assets/
│  ├─ css/
│  │  └─ styles.css
│  ├─ js/
│  │  ├─ app.js
│  │  └─ storage.js
│  └─ icons/
│     └─ favicon.svg
└─ data/
   └─ lineups.json
```

## 崩してはいけない仕様

1. GitHub Pagesの `main / (root)` からそのまま動作すること。
2. Node.js、npm、サーバーサイド処理を必須にしないこと。
3. アセット・JSONはGitHub Pagesのリポジトリサブパスでも動く相対パスを使うこと。
4. マイ定点はJSONとして扱い、HTMLへ大量に直書きしないこと。
5. マップ座標は0〜100%の正規化座標で保持すること。
6. 立ち位置・着弾点の2点を保存必須とすること。
7. 中継点は0個以上の配列として保持すること。
8. 既存マイ定点を編集・削除・JSON退避できること。
9. `Win + Shift + S` → `Ctrl + V` の画像登録を維持すること。
10. 外部APIが落ちても画面全体が使用不能にならないこと。
11. デモ定点を実戦精度保証済みとして扱わないこと。
12. Strats.ggのロゴ・HTML・CSS・投稿コンテンツをそのままコピーしないこと。

## GitHub Pagesで使用しないもの

v0.2まで同梱していた以下は削除しました。

- `server.js`
- `start.bat`

GitHub Pagesは静的ファイルを直接配信するため不要です。

## 注意点

- 私用向けの静的Webアプリです。
- サーバー同期 / アカウント同期はありません。
- PCブラウザ向けに最適化しています。
- VALORANT関連の名称・ゲーム素材等の権利は各権利者に帰属します。
- Riot Games、Strats.ggとは無関係の非公式ツールです。

## バージョン

- v0.1 / 2026-08-26 — 初版
- v0.2 / 2026-08-26 — Win + Shift + Sスクリーンショット登録
- **v0.3 / 2026-08-27 — GitHub Pages対応**
