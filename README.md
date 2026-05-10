# クーの読書記録タイマー PWA版 v3

iPhoneだけでも扱いやすい、クーと一緒に読書時間と感想を記録するPWAです。

## v3の追加機能

- 本棚の本を編集
- 本棚の本を削除
- 本を削除すると紐づく感想ログも削除
- 本棚カードに最終記録日を表示
- 感想記録時に読書日を指定可能
- 感想ログの編集
- 感想ログの削除
- JSONバックアップ
- JSON復元

## 上書き方法

GitHubのリポジトリで以下のファイルをv3のものに置き換えてください。

- `index.html`
- `style.css`
- `app.js`
- `manifest.json`
- `service-worker.js`
- `README.md`

画像が表示されない場合に備えて、以下もそのまま置いてください。

- `assets/kuu_waiting.png`
- `assets/kuu_reading.png`
- `assets/kuu_recording.png`
- `kuu_waiting.png`
- `kuu_reading.png`
- `kuu_recording.png`

## 注意

Service Workerのキャッシュ名を `kuu-reading-timer-v3` に変更しています。  
GitHub Pagesに反映後、古い表示のままならSafariで再読み込みしてください。
