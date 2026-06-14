# nest-prisma-sample

NestJS + Docker + PrismaでPostgreSQLに接続する最小構成のサンプルです。

Qiita記事「NestJS + Docker + PrismaでPostgreSQLに接続する最小構成を作ってみる」の検証用リポジトリです。

## 使用技術

* Node.js
* NestJS
* TypeScript
* Docker
* PostgreSQL
* Prisma

## 検証環境

```txt
Node.js: 24.13.0
npm: 11.6.2
NestJS: @nestjs/core 11.0.1
Prisma CLI: 7.8.0
Prisma Client: 7.8.0
PostgreSQL: 16
OS: Windows 11
Docker Desktop: 4.77.0
```

## このリポジトリで確認できること

* Docker ComposeでPostgreSQLを起動する
* Prisma 7系で `schema.prisma` / `prisma.config.ts` を設定する
* Prisma MigrateでDBにテーブルを作成する
* Prisma Clientを生成する
* NestJSからPrisma経由でPostgreSQLに接続する
* `POST /users` でユーザーを作成する
* `GET /users` でユーザー一覧を取得する

## セットアップ

依存パッケージをインストールします。

```bash
npm install
```

PostgreSQLを起動します。

```bash
docker compose up -d
```

`.env` を作成し、DB接続URLを設定します。

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/nest_prisma_sample?schema=public"
```

migrationを実行します。

```bash
npx prisma migrate dev --name init
```

Prisma Clientを生成します。

```bash
npx prisma generate
```

NestJSを起動します。

```bash
npm run start:dev
```

## 動作確認

ユーザーを作成します。

```bash
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","name":"Test User"}'
```

ユーザー一覧を取得します。

```bash
curl http://localhost:3000/users
```

レスポンス例です。

```json
[
  {
    "id": 1,
    "email": "test@example.com",
    "name": "Test User",
    "createdAt": "2026-01-01T00:00:00.000Z"
  }
]
```

## Windows cmdでcurlを実行する場合

Windowsのcmdで実行する場合は、改行やクォートの書き方が異なります。

```cmd
curl -X POST http://localhost:3000/users ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"test@example.com\",\"name\":\"Test User\"}"
```

## DBをリセットしたい場合

開発用DBのデータを消して再検証したい場合は、以下を実行します。

```bash
npx prisma migrate reset
```

Docker volumeごと削除して完全に初期化したい場合は、以下を実行します。

```bash
docker compose down -v
docker compose up -d
npx prisma migrate dev --name init
npx prisma generate
```

`docker compose down -v` はPostgreSQLのデータも削除するため、開発・検証用DBでのみ使用します。

## 補足

このサンプルはPrisma 7系を前提にしています。

Prisma 7系では、DB接続URLを `schema.prisma` の `datasource` に直接書くのではなく、`prisma.config.ts` 側で扱います。

また、`migrate dev` はDB側の更新、`prisma generate` はTypeScriptから使うPrisma Clientの生成、という役割です。

## 関連記事

* Qiita: https://qiita.com/hiro92196/items/a04d8079d6c87817e5db
