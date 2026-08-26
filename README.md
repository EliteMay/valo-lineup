# Lineup Lab v0.4 — GitHub共有版

VALORANTの定点を、マップ上の「立ち位置 → 中継点 → 着弾点」で確認・整理し、自分で作った定点も管理できる静的Webアプリです。
Strats.gg の便利な考え方を参考にしていますが、UI・コード・データ構成は独自実装です。

## GitHub Pagesで使う

この版は **Node.js / npm / ローカルサーバー不要** です。

1. GitHubでリポジトリを用意します。
2. ファイルをリポジトリ直下へ配置します。
3. GitHubの `Settings` → `Pages` を開きます。
4. `Build and deployment` を `Deploy from a branch` にします。
5. Branchを `main`、Folderを `/(root)` にして保存します。
6. GitHub PagesのURLを開けば利用できます。

## 友達と定点を共有する仕組み

`data/lineups.json` を **全員共通の定点データ** として扱います。
サイトを開いた人は毎回このJSONを読み込むため、GitHub側のJSONを更新すれば友達にも同じ定点が表示されます。

### 共有手順

1. サイトの「自分で作る」から定点を作成します。
2. 左下の「データ管理」を開きます。
3. **共有用JSONを書き出す** を押します。
4. `lineups.json` がダウンロードされます。
5. GitHubの `data/lineups.json` を、そのファイルで置き換えます。
6. GitHub Pagesの反映後、友達がページを再読み込みすると新しい定点が見えます。

共有用JSONは、現在GitHubにある共有定点と、このブラウザに保存しているマイ定点をまとめて出力します。

> 注意: GitHubへ反映した定点は、その後もローカルの「マイ定点」に残ります。二重表示を避けたい場合は、GitHubへ反映できたことを確認してからマイ定点側を削除してください。

## 主な機能

### 定点ライブラリ
- GitHubの `data/lineups.json` を起動時に読み込み
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
- 共有用 `lineups.json` 書き出し
- JSON読み込み
- ブラウザ内自動保存

## スクリーンショット登録

1. 「立ち位置」「合わせ場所」「着弾結果」の画像枠をクリックします。
2. `Win + Shift + S` でVALORANT画面を切り取ります。
3. サイトへ戻って `Ctrl + V` を押します。
4. 選択中の画像枠へ画像が入ります。

GitHub PagesはHTTPSで動くため、ブラウザが許可していれば「貼る」ボタンからClipboard APIで直接読み込むこともできます。

## 保存方法

### 共通定点
`data/lineups.json` に保存します。
GitHubへ更新すると、GitHub Pagesを使う全員に共有されます。

### マイ定点
作成途中や自分だけの定点はブラウザの `localStorage` に保存します。

保存キー:
- `lineupLab.userLineups.v1`
- `lineupLab.favorites.v1`
- `lineupLab.preferences.v1`

参考画像は保存前にWebPへ縮小・圧縮します。

## 外部データ

エージェント名、アビリティ、エージェント画像、マップ画像は起動時に `valorant-api.com` の公開APIから取得します。
APIへ接続できない場合はアプリ内フォールバック情報を使用します。

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
├─ README.md
├─ 作業報告書.md
├─ assets/
│  ├─ css/styles.css
│  ├─ js/app.js
│  ├─ js/storage.js
│  └─ icons/favicon.svg
└─ data/
   └─ lineups.json
```

## 崩してはいけない仕様

1. GitHub Pagesの `main / (root)` からそのまま動作すること。
2. Node.js、npm、サーバーサイド処理を必須にしないこと。
3. `data/lineups.json` を全員共通定点として扱うこと。
4. サイト起動時に共有JSONを読み込むこと。
5. 自作途中のデータはlocalStorageへ保存すること。
6. マップ座標は0〜100%の正規化座標で保持すること。
7. 立ち位置・着弾点の2点を保存必須とすること。
8. 中継点は0個以上の配列として保持すること。
9. `Win + Shift + S` → `Ctrl + V` の画像登録を維持すること。
10. GitHubトークンや秘密情報をHTML/JSへ埋め込まないこと。
11. Strats.ggのロゴ・HTML・CSS・投稿コンテンツをそのままコピーしないこと。

## 注意点

- GitHub Pagesは静的サイトなので、サイト上の保存ボタンからGitHubへ直接書き込む機能は入れていません。
- GitHubトークンをブラウザへ埋め込む設計は避けています。
- 共通定点を更新するときは、共有用 `lineups.json` をGitHubへ反映します。
- VALORANT関連の名称・ゲーム素材等の権利は各権利者に帰属します。
- Riot Games、Strats.ggとは無関係の非公式ツールです。

## バージョン

- v0.1 / 2026-08-26 — 初版
- v0.2 / 2026-08-26 — Win + Shift + Sスクリーンショット登録
- v0.3 / 2026-08-27 — GitHub Pages対応
- **v0.4 / 2026-08-27 — GitHub共有JSON運用へ対応**
