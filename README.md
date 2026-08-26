# Lineup Lab v0.5 — GitHub共有 + MP4対応

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
サイトを開いた人はこのJSONを読み込むため、GitHub側のJSONを更新すれば友達にも同じ定点が表示されます。

### 定点の共有手順

1. サイトの「自分で作る」から定点を作成します。
2. 左下の「データ管理」を開きます。
3. **共有用JSONを書き出す** を押します。
4. `lineups.json` がダウンロードされます。
5. GitHubの `data/lineups.json` を、そのファイルで置き換えます。
6. GitHub Pages反映後、友達がページを再読み込みすると新しい定点が見えます。

共有用JSONは、現在GitHubにある共有定点と、このブラウザに保存しているマイ定点をまとめて出力します。

> GitHubへ反映した定点がlocalStorage側にも残っている場合、同じ定点が二重表示されることがあります。反映確認後にマイ定点側を削除してください。

## MP4動画

v0.5から、YouTubeや動画URLに加えて **PC内のMP4ファイルを直接選択** できます。

### ローカル利用

1. 「自分で作る」の参考画像・動画欄で **MP4を選択** を押します。
2. `.mp4` を選択します。
3. その場でプレビューできます。
4. 定点を保存すると、MP4本体はブラウザの **IndexedDB** に保存されます。
5. 同じPC・同じブラウザでは、定点詳細からMP4をそのまま再生できます。

MP4は重いため、localStorageやJSONへBase64で埋め込みません。

### 友達にもMP4を共有する

MP4を選ぶと、定点の `videoUrl` にはGitHub Pages上の

```text
assets/videos/<自動生成されたファイル名>.mp4
```

に対応するURLが保存されます。

1. MP4を選択します。
2. **共有用MP4を保存** を押します。
3. ダウンロードされたMP4をGitHubの `assets/videos/` にアップロードします。
4. 通常どおり「共有用JSONを書き出す」で `lineups.json` を更新します。
5. GitHub Pages反映後、友達側でも定点詳細からMP4を再生できます。

### MP4の注意

- MP4本体は `lineups.json` には入りません。
- GitHubへMP4を置かない場合、そのPCのIndexedDBに保存されたローカル動画だけが再生できます。
- GitHubのWeb画面から大きな動画をアップロードすると制限にかかる場合があります。サイトでは25MBを超えるMP4に警告を表示します。
- 秘密情報・個人情報が映った動画を公開リポジトリへ置かないでください。

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
- MP4インライン再生

### 自分の定点を作る
- マップをクリックして立ち位置 / 中継点 / 着弾点を登録
- 登録地点のドラッグ微調整
- 1点戻す / ルート全消去
- 立ち位置 / 合わせ場所 / 着弾結果の画像
- `Win + Shift + S` → `Ctrl + V` でスクリーンショット登録
- クリップボードから直接貼り付け
- 画像ファイル選択のフォールバック
- MP4ファイル選択 / プレビュー / IndexedDB保存
- YouTube / 動画URL
- メモ / タグ
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

## 保存方法

### 共通定点
- GitHub: `data/lineups.json`

### 共有MP4
- GitHub: `assets/videos/*.mp4`

### マイ定点
- localStorage: `lineupLab.userLineups.v1`
- localStorage: `lineupLab.favorites.v1`
- localStorage: `lineupLab.preferences.v1`

### ローカルMP4
- IndexedDB: `lineupLab.videos.v1`

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
  "bounces": [{ "x": 40.0, "y": 55.0 }],
  "end": { "x": 57.0, "y": 31.0 },
  "notes": "合わせ方など",
  "tags": ["recon", "safe"],
  "videoUrl": "https://USER.github.io/REPO/assets/videos/example.mp4",
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
│  ├─ icons/favicon.svg
│  └─ videos/
│     └─ *.mp4
└─ data/
   └─ lineups.json
```

## 崩してはいけない仕様

1. GitHub Pagesの `main / (root)` からそのまま動作すること。
2. Node.js、npm、サーバーサイド処理を必須にしないこと。
3. `data/lineups.json` を全員共通定点として扱うこと。
4. サイト起動時に共有JSONを読み込むこと。
5. 自作定点はlocalStorageへ保存すること。
6. MP4本体をlocalStorageや共有JSONへBase64埋め込みしないこと。
7. ローカルMP4はIndexedDBへ保存すること。
8. 共有MP4は `assets/videos/` のURLで参照すること。
9. マップ座標は0〜100%の正規化座標で保持すること。
10. 立ち位置・着弾点の2点を保存必須とすること。
11. 中継点は0個以上の配列として保持すること。
12. `Win + Shift + S` → `Ctrl + V` の画像登録を維持すること。
13. GitHubトークンや秘密情報をHTML/JSへ埋め込まないこと。
14. Strats.ggのロゴ・HTML・CSS・投稿コンテンツをそのままコピーしないこと。

## 注意点

- GitHub Pagesは静的サイトなので、サイトからGitHubへ直接書き込む機能は入れていません。
- 共通定点を更新するときは共有用 `lineups.json` をGitHubへ反映します。
- 共有MP4は `assets/videos/` へ別途アップロードします。
- VALORANT関連の名称・ゲーム素材等の権利は各権利者に帰属します。
- Riot Games、Strats.ggとは無関係の非公式ツールです。

## バージョン

- v0.1 / 2026-08-26 — 初版
- v0.2 / 2026-08-26 — Win + Shift + Sスクリーンショット登録
- v0.3 / 2026-08-27 — GitHub Pages対応
- v0.4 / 2026-08-27 — GitHub共有JSON運用へ対応
- **v0.5 / 2026-08-27 — MP4ファイル登録・ローカル保存・共有再生対応**
