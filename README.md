# クーの読書記録タイマー PWA版 v5

本棚に、ジャンル画像と⭐️5段階評価を追加した上書き版です。

## v5の追加機能

- 本ごとにジャンルを設定
- 7種類のジャンル画像を本棚カードに表示
  - ミステリー
  - SF
  - 青春
  - 新書
  - ホラー
  - ラノベ
  - ファンタジー
- 本棚カード上で⭐️5段階評価を直感的に変更
- 同じ星をもう一度押すと評価を解除
- 本の追加・編集画面でもジャンルと評価を設定
- 本の詳細画面にもジャンル画像と評価を表示
- 既存データは自動でv5形式に補正

## 上書き方法

このZIPの中身をGitHubリポジトリのルート直下にすべて上書きしてください。

特に必要なファイル：

- `index.html`
- `style.css`
- `app.js`
- `manifest.json`
- `service-worker.js`
- `genre-mystery.png`
- `genre-sf.png`
- `genre-youth.png`
- `genre-shinsho.png`
- `genre-horror.png`
- `genre-lightnovel.png`
- `genre-fantasy.png`

## 注意

Service Workerのキャッシュ名を `kuu-reading-timer-v5` に変更しています。  
反映直後に古い画面が出る場合は、Safariで再読み込み、またはホーム画面のPWAを削除して追加し直してください。
