# クーの読書記録タイマー PWA版 v2

iPhoneだけでも扱いやすい、クーと一緒に読書時間と感想を記録するPWAです。

## 重要：画像が表示されない場合

`index.html` と同じ階層に `assets` フォルダを置き、その中に以下の画像を入れてください。

- `assets/kuu_waiting.png`
- `assets/kuu_reading.png`
- `assets/kuu_recording.png`

このv2では保険としてルート直下にも同名画像を入れています。  
GitHubにアップロードするときは、ZIPの中身をそのまま全部アップロードしてください。

## 機能

- 読書タイマー
- 待機中 / 読書中 / 記録中でクー画像を切り替え
- 本の登録
- 本ごとの感想ログ
- 合計読書時間、合計ページ数、感想件数の表示
- localStorageによるローカル保存
- JSONバックアップ出力
- JSON復元
- PWA対応
- オフラインキャッシュ対応

## GitHub Pagesで公開する方法

1. GitHubで新しいリポジトリを作成
2. ZIPを解凍し、中身をすべてアップロード
3. `index.html`、`style.css`、`app.js`、`manifest.json`、`service-worker.js` がルート直下にあることを確認
4. `assets` フォルダがルート直下にあることを確認
5. Settings → Pages → Branchを `main`、フォルダを `/root` にして保存
6. 表示されたURLをSafariで開く
7. 共有ボタンから「ホーム画面に追加」
