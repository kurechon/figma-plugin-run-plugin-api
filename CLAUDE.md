# Run Plugin API - Figma Plugin

Figma上でPlugin APIのJavaScriptコードを直接実行できるプラグイン。Monaco Editorベースのコードエディタを内蔵。

## アーキテクチャ

```
┌─────────────────────────────────┐
│ Figma Desktop App               │
│                                 │
│  ┌───────────┐  postMessage  ┌──────────┐
│  │Plugin Code│◄────────────►│ UI       │
│  │(sandbox)  │  onmessage   │(iframe)  │
│  │           │              │          │
│  │ code.ts   │              │ React    │
│  │ figma API │              │ Monaco   │
│  │ access    │              │ Zustand  │
│  └───────────┘              └──────────┘
│                                 │
└─────────────────────────────────┘
```

- **Plugin Code (sandbox)**: `src/code.ts` - Figma APIにアクセス可能。ユーザーコードの実行、オプション永続化を担当
- **UI (iframe)**: `src/ui/` - React + Monaco Editorによるコードエディタ UI

## ビルド・開発コマンド

```bash
pnpm install    # 依存インストール
pnpm dev        # 開発ビルド（watch）
pnpm build      # プロダクションビルド
pnpm lint       # lint実行
```

## ディレクトリ構造

```
src/
├── @types/
│   ├── common.d.ts      # 共通型定義（Options, PluginMessage等）
│   ├── assets.d.ts       # アセット型宣言（.dts, .svg）
│   └── global.d.ts       # グローバル型宣言（ts）
├── code.ts               # Plugin Code エントリポイント
├── constants.ts          # 定数（CDN_URL等）
├── defaultOptions.ts     # エディタのデフォルト設定
└── ui/
    ├── main.tsx          # UI エントリポイント
    ├── App.tsx           # ルートコンポーネント
    ├── Store.ts          # 状態管理
    ├── index.html        # HTMLテンプレート
    ├── styles.ts         # グローバルスタイル
    ├── themeList.ts      # エディタテーマ一覧
    ├── assets/           # 静的アセット
    └── components/       # UIコンポーネント
manifest.json             # Figmaプラグインマニフェスト
```

## Figma Plugin 固有の制約

- Plugin Code はFigmaのsandboxで実行され、DOM/ブラウザAPIにアクセス不可
- UI はiframe内で実行され、Figma APIに直接アクセス不可
- 両者の通信は `figma.ui.postMessage()` / `figma.ui.onmessage` で行う
- `ui.html` には全JS/CSSがインライン化される（ビルド時に生成）
- `manifest.json` で `main`（Plugin Code）と `ui`（UI HTML）のパスを指定

## コーディング規約

- TypeScript strict mode
- セミコロンなし（`semi: false`）
- シングルクォート
- 末尾コンマなし
- `@emotion/react` による CSS-in-JS
- パスエイリアス: `@/` → `src/`

## デバッグ方法

1. Figma Desktop Appで `Plugins > Development > Import plugin from manifest...` からmanifest.jsonを読み込む
2. `pnpm dev` でwatchビルドを起動
3. Plugin Codeのログ: Figmaのメニュー `Plugins > Development > Open Console` で確認
4. UIのログ: プラグインウィンドウを右クリック → `Inspect Element` でDevToolsを開く

## 状態管理

UIの状態管理にはZustandを使用。Store.tsで定義されたストアがアプリ全体の状態を管理する。

## 注意点

- Monaco EditorはCDNからロードされる
- エディタテーマのJSONもCDNから取得（`constants.ts` の `CDN_URL`）
- ユーザーコードの実行には `new Function()` を使用（`figma` オブジェクトを引数として渡す）
- オプションは `figma.clientStorage` に永続化される
