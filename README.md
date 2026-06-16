# NestJS Prisma Validation Sample

NestJS + Prismaで作成したPOST APIに、DTOと `ValidationPipe` を追加して入力チェックを行うサンプルです。

`class-validator` / `class-transformer` を使い、リクエストbodyの値をDB登録前に検証します。

## 使用技術

* NestJS
* Prisma
* PostgreSQL
* Docker
* TypeScript
* class-validator
* class-transformer

## このサンプルで確認できること

* NestJS + PrismaでPOST APIを作成する
* DTOでリクエストbodyの形を定義する
* `class-validator` のデコレーターで入力ルールを書く
* `ValidationPipe` を使ってDTOの検証を有効化する
* `whitelist` / `forbidNonWhitelisted` で想定外のプロパティを制御する
* PrismaでPostgreSQLにデータを登録する
* DTOとPrismaの型の役割の違いを確認する

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

起動後、以下のエンドポイントでPOST APIを確認できます。

```txt
POST http://localhost:3000/users
```

## 動作確認

### 正常系

```cmd
curl -X POST http://localhost:3000/users ^
  -H "Content-Type: application/json" ^
  -d "{\"name\":\"Taro\",\"email\":\"taro@example.com\"}"
```

`email` には `@unique` を付けているため、同じメールアドレスで2回実行するとPrisma側の一意制約エラーになります。

再実行する場合は、別のメールアドレスに変更してください。

```cmd
curl -X POST http://localhost:3000/users ^
  -H "Content-Type: application/json" ^
  -d "{\"name\":\"Taro\",\"email\":\"taro2@example.com\"}"
```

### バリデーションエラー

```cmd
curl -X POST http://localhost:3000/users ^
  -H "Content-Type: application/json" ^
  -d "{\"name\":\"\",\"email\":\"not-email\"}"
```

レスポンス例です。

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

### DTOにないプロパティを送った場合

```cmd
curl -X POST http://localhost:3000/users ^
  -H "Content-Type: application/json" ^
  -d "{\"name\":\"Taro\",\"email\":\"taro@example.com\",\"role\":\"admin\"}"
```

レスポンス例です。

```json
{
  "message": [
    "property role should not exist"
  ],
  "error": "Bad Request",
  "statusCode": 400
}
```

## DB確認

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
   │  └─ create-user.dto.ts
   ├─ users.controller.ts
   ├─ users.module.ts
   └─ users.service.ts
```

## 補足・注意点

### DTOのプロパティに `!` を付ける理由

DTOのプロパティで以下のようなエラーが出る場合があります。

```txt
Property 'name' has no initializer and is not definitely assigned in the constructor.
```

このサンプルでは、以下のように `!` を付けて対応しています。

```ts
name!: string;
email!: string;
```

DTOの値はリクエストbodyからセットされるため、definite assignment assertionを使っています。

### DTOとPrismaの型の役割

DTOとPrismaの型は、似ているようで役割が違います。

DTOは、APIに入ってくるリクエストbodyの形を定義するものです。

Prismaの型は、Prismaを使ってDB操作するときの型を安全にするものです。

| 種類             | 主な役割                  |
| -------------- | --------------------- |
| DTO            | APIで受け取る入力値の形を定義する    |
| ValidationPipe | DTOに書いたルールでリクエストを検証する |
| Prismaの型       | DB操作の型安全性を高める         |

DTOはAPIの入口を守るもの、Prismaの型はDB操作を安全にするもの、と考えると分かりやすいです。

### migration時の注意

既存データがある状態で、必須カラムを追加するとmigrationでエラーになることがあります。

例：

```txt
Added the required column `updatedAt` to the `User` table without a default value.
```

検証用DBでデータを消してよい場合は、以下でリセットできます。

```cmd
npx prisma migrate reset
```

ただし、DBのデータが削除されるため注意してください。

## 参考

* NestJS Docs - Validation
  https://docs.nestjs.com/techniques/validation

* NestJS Docs - Pipes
  https://docs.nestjs.com/pipes

* NestJS Docs - Prisma
  https://docs.nestjs.com/recipes/prisma

* Prisma Docs - How to use Prisma ORM and Prisma Postgres with NestJS
  https://www.prisma.io/docs/guides/frameworks/nestjs


## 関連記事

* Qiita: https://qiita.com/hiro92196/items/8caed73e0c789859ac5f
