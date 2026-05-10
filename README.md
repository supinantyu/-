# クーの読書記録タイマー アイコン更新 v4

この上書き用パックは、ホーム画面アイコンをルート直下のファイルで使うための更新です。

## 追加ファイル
- `icon-192.png`
- `icon-512.png`
- `apple-touch-icon.png`

## 上書きするファイル
- `index.html`
- `app.js`
- `manifest.json`
- `service-worker.js`

## 変更内容
- PWAアイコンを `assets` ではなく **ルート直下** から読み込むように変更
- iPhone用の `apple-touch-icon.png` を追加
- 初期表示のクー画像もルート直下 `kuu_waiting.png` を参照
- Service Worker のキャッシュ名を `kuu-reading-timer-v4` に更新

## 反映方法
1. このZIPを解凍
2. 中のファイルをGitHubリポジトリの同名ファイルに上書き
3. `icon-192.png` `icon-512.png` `apple-touch-icon.png` もルート直下にアップロード
4. GitHub Pagesの反映後、Safariでページを開き直す
5. 既にホーム画面に追加済みなら一度削除し、もう一度「ホーム画面に追加」する
