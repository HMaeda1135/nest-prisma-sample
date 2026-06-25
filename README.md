# NestJS Prisma Unique Conflict Sample

NestJS + Prismaで、一意制約エラーを `409 Conflict` として返すサンプルです。

Prismaの `P2002` エラーを捕捉し、NestJSの `ConflictException` に変換することで、同じメールアドレスを登録した場合に適切なHTTPステータスを返します。

## 概要

このリポジトリでは、NestJS + Prismaで作成したユーザー登録APIに対して、一意制約エラーのハンドリングを追加しています。

`email` に `@unique` を設定し、同じメールアドレスでユーザー登録しようとした場合に、Prismaのエラーをそのまま返すのではなく、`409 Conflict` として返すことを確認します。

## 使用技術

* NestJS
* Prisma
* PostgreSQL
* Docker
* TypeScript
* class-validator
* class-transformer

## このサンプルで確認できること

* Prismaの一意制約エラーを発生させる
* Prismaの `P2002` エラーを捕捉する
* `PrismaClientKnownRequestError` でPrismaの既知エラーを判定する
* NestJSの `ConflictException` を使って `409 Conflict` を返す
* DTO / ValidationPipeの入力チェックとDB制約エラーの違いを確認する
* 作成APIと更新APIで一意制約エラーを考慮する

## セットアップ

依存関係をインストールします。

```cmd
npm install
```

DockerでPostgreSQLを起動します。

```cmd
docker compose up -d
```

Prisma migrationを実行します。

```cmd
npx prisma migrate dev
```

Prisma Clientを生成します。

```cmd
npx prisma generate
```

## 起動方法

開発サーバーを起動します。

```cmd
npm run start:dev
```

起動後、以下のエンドポイントでAPIを確認できます。

```txt
POST http://localhost:3000/users
```

## 動作確認

### 正常系

まず、ユーザーを作成します。

```cmd
curl -X POST http://localhost:3000/users ^
  -H "Content-Type: application/json" ^
  -d "{\"name\":\"Taro\",\"email\":\"taro@example.com\"}"
```

正常に作成されると、作成されたユーザー情報が返ります。

### 一意制約エラー

同じメールアドレスでもう一度リクエストします。

```cmd
curl -X POST http://localhost:3000/users ^
  -H "Content-Type: application/json" ^
  -d "{\"name\":\"Taro\",\"email\":\"taro@example.com\"}"
```

以下のように `409 Conflict` が返ればOKです。

```json
{
  "message": "Email already exists",
  "error": "Conflict",
  "statusCode": 409
}
```

### バリデーションエラー

DTOのルールに違反する値を送ります。

```cmd
curl -X POST http://localhost:3000/users ^
  -H "Content-Type: application/json" ^
  -d "{\"name\":\"\",\"email\":\"not-email\"}"
```

以下のように `400 Bad Request` が返ります。

```json
{
  "message": [
    "name should not be empty",
    "email must be an email"
  ],
  "error": "Bad Request",
  "statusCode": 400
}
```

### 更新APIでの一意制約エラー

すでに以下の2件が存在する状態を想定します。

```txt
id: 1, email: taro@example.com
id: 2, email: jiro@example.com
```

`id: 2` のメールアドレスを、既に存在する `taro@example.com` に変更しようとします。

```cmd
curl -X PATCH http://localhost:3000/users/2 ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"taro@example.com\"}"
```

この場合も、`409 Conflict` が返ることを確認します。

## 主なファイル構成

```txt
prisma/
└─ schema.prisma

src/
├─ main.ts
├─ prisma/
│  └─ prisma.service.ts
└─ users/
   ├─ dto/
   │  ├─ create-user.dto.ts
   │  └─ update-user.dto.ts
   ├─ users.controller.ts
   ├─ users.module.ts
   └─ users.service.ts
```

## 補足

### Prisma schema

`User` モデルでは、`email` に `@unique` を設定しています。

```prisma
model User {
  id        Int      @id @default(autoincrement())
  name      String
  email     String   @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @default(now()) @updatedAt
}
```

この設定により、同じメールアドレスを複数登録しようとすると、Prisma側で一意制約エラーが発生します。

### P2002について

Prismaでは、一意制約違反が発生した場合、エラーコード `P2002` が返ります。

このサンプルでは、`P2002` を捕捉して `ConflictException` を投げることで、HTTPレスポンスとして `409 Conflict` を返しています。

```ts
if (
  error instanceof Prisma.PrismaClientKnownRequestError &&
  error.code === 'P2002'
) {
  throw new ConflictException('Email already exists');
}
```

### DTOのバリデーションとの違い

DTOと `ValidationPipe` は、リクエストbodyの形式をチェックします。

たとえば、メール形式ではない値や空文字は `400 Bad Request` として扱います。

一方で、`email` が既にDBに存在するかどうかは、DTOだけでは判断できません。

そのため、DBの一意制約エラーはPrisma側で捕捉し、`409 Conflict` として返します。

| エラー内容            | 発生する場所               | ステータス           |
| ---------------- | -------------------- | --------------- |
| メール形式ではない        | DTO / ValidationPipe | 400 Bad Request |
| 必須項目が空           | DTO / ValidationPipe | 400 Bad Request |
| 同じメールアドレスが既に存在する | Prisma / DB制約        | 409 Conflict    |

### DB確認

Prisma Studioで確認できます。

```cmd
npx prisma studio
```

PostgreSQLに直接接続する場合は、まずコンテナ名を確認します。

```cmd
docker ps
```

`NAMES` に表示されたコンテナ名を使って接続します。

```cmd
docker exec -it コンテナ名 psql -U postgres -d nest_prisma_sample
```

psqlに入ったら、以下で確認できます。

```sql
\dt
SELECT * FROM "User";
\d "User"
```

終了する場合は以下です。

```sql
\q
```

### 500エラーになる場合

期待どおり `409 Conflict` にならず、`500 Internal server error` になる場合は、サーバーログを確認します。

主な原因は以下です。

* PostgreSQLが起動していない
* migrationが未適用
* `DATABASE_URL` が間違っている
* `updatedAt` などの必須カラムでエラーになっている
* `P2002` 以外のPrismaエラーが発生している

## 参考

* NestJS Docs - Exception filters
  https://docs.nestjs.com/exception-filters

* NestJS Docs - Built-in HTTP exceptions
  https://docs.nestjs.com/exception-filters#built-in-http-exceptions

* Prisma Docs - Error reference
  https://www.prisma.io/docs/orm/reference/error-reference

* Prisma Docs - CRUD
  https://www.prisma.io/docs/orm/prisma-client/queries/crud

## 関連記事

* Qiita: https://qiita.com/hiro92196/items/9d93ebf61b2fe3af4b7b