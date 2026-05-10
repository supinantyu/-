# クーの読書記録タイマー PWA版 v6 AI総合感想

v6では、本ごとの全感想ログをAIに渡して「AI総合感想」を生成する画面を追加しました。

## v6追加機能

- 本の詳細画面に「AI総合感想」パネルを追加
- 「AIで生成」ボタンを追加
- その本に紐づく全ての感想ログをまとめて送信
- AIの生成結果を `book.aiSummary` に保存
- 最終生成日を `book.aiSummaryUpdatedAt` に保存
- 感想がない本ではAI生成ボタンを無効化
- 既存のv5データをv6形式へ自動補正

## 重要

PWAだけではAI要約は動きません。  
`app.js` の `AI_SUMMARY_ENDPOINT` にCloudflare WorkersのURLを入れる必要があります。

```js
const AI_SUMMARY_ENDPOINT = "https://あなたのworker名.あなたのサブドメイン.workers.dev";
```

## Cloudflare Workers側で必要な環境変数

- `OPENAI_API_KEY`
- 任意: `OPENAI_MODEL`
  - 例: `gpt-4.1-mini`
- 任意: `ALLOWED_ORIGIN`
  - GitHub PagesのURLを入れると安全性が上がります
  - 例: `https://ユーザー名.github.io`

## 反映手順

1. Cloudflare Workersを作る
2. `cloudflare-worker-ai-summary.js` の中身を貼る
3. Workersの環境変数に `OPENAI_API_KEY` を設定
4. Workersをデプロイ
5. 発行されたWorkers URLをコピー
6. `app.js` の `AI_SUMMARY_ENDPOINT` に貼る
7. このv6ファイル一式をGitHubに上書き
8. GitHub Pagesを開き直す

Service Workerのキャッシュ名は `kuu-reading-timer-v6` です。
