# TMD-Simulator Web

**Ver.Beta01**

GitHub Pages で動作する、TMD 時刻歴解析ツールの Web 版です。
既存 C# 実装（`../HBS_TMDSimulator` / `../並進弾性時刻歴/ElemResp`）の数値仕様を踏襲し、静的 SPA として動作します。

## 主な機能

### 解析機能
- モデル作成・編集（`.dat` 互換）
- 固有値解析（`Modal.cs` 相当）
- 正弦波作成（ForceWave 用）
- 入力波解析（AVD / スペクトル）
- 時刻歴応答（基礎入力）
- 時刻歴応答（強制力入力）
- 既存結果 CSV の再読込表示
- 結果 CSV 出力
- ワークスペース ZIP の入出力

### UI機能（Ver.Beta01で追加）
- 🌙 **ダークモード/ライトモード切り替え**
  - システムテーマ自動検出
  - ユーザー設定の永続化（LocalStorage）
  - テーマフラッシュ防止
- 🌐 **多言語対応（日本語/英語）**
  - デフォルト: 日本語
  - 全UIテキストの翻訳対応
  - ヘルプマニュアルも言語対応
- ❓ **組み込みヘルプマニュアル**
  - 基本的な使い方
  - 各機能の詳細説明
  - データ入出力仕様
- 🎨 **テーマ対応ファビコン**
  - ライト/ダークモード別アイコン
  - SVG形式で高解像度対応

## 使い方

### UI操作
1. **テーマ変更**: 右上の 🌙/☀️ アイコンをクリック
2. **言語変更**: 右上の JA/EN ボタンをクリック
3. **ヘルプ表示**: 右上の「ヘルプ」ボタンをクリック
4. **データ入出力**: 「ZIP取込」「ZIP出力」ボタンでワークスペース全体をバックアップ/復元

### 解析の基本フロー
1. **Model Edit** - モデルを作成または読み込み
2. **Eigen Mode** - 固有値解析で振動特性を確認
3. **Wave Analysis** - 入力波を解析（オプション）
4. **Base Response** または **Force Response** - 時刻歴応答解析を実行
5. **Result View** - 保存済み結果を再表示

## 技術構成

- **フロントエンド**: React 19.2.0 + TypeScript + Vite 7.3.1
- **データ管理**: IndexedDB（`idb`）による作業データ永続化
- **数値計算**: `ml-matrix` による固有値計算
- **可視化**: `plotly.js` によるグラフ表示
- **エンコーディング**: `encoding-japanese` による多様なエンコーディング対応
  - UTF-8（BOM あり/なし）
  - Shift-JIS
  - 自動検出とフォールバック処理
- **テーマ**: CSS変数による動的テーマ切り替え
- **国際化**: TypeScript型安全な翻訳システム

## 開発起動

```bash
npm ci
npm run dev
```

## ビルド

```bash
npm run lint
npm run build
```

## GitHub Pages デプロイ

- ワークフロー: `.github/workflows/deploy-pages.yml`
- `main` または `master` への push / Pull Request で自動実行
- 実行内容:
  - ESLint チェック（`npm run lint`）
  - TypeScript 型チェック（`tsc --noEmit`）
  - ビルド（`npm run build`）
  - main ブランチへの push 時のみ GitHub Pages へ自動デプロイ
- Vite の `base` は GitHub Actions でリポジトリ名から自動設定されます

ローカルでビルドする場合:

```bash
# リポジトリ名が TMD-Simulator の場合
export VITE_BASE_PATH=/TMD-Simulator/
npm run build
```

### GitHub Pages の初回設定

1. GitHubリポジトリの「Settings」→「Pages」に移動
2. 「Source」を「GitHub Actions」に設定
3. `main` ブランチに push すると自動的にビルド・デプロイされます
4. デプロイ完了後、`https://<ユーザー名>.github.io/<リポジトリ名>/` でアクセス可能

## データ互換仕様

### ファイル形式
- モデル: `model/*.dat`
- 入力波: `Wave/*.csv`（1列、`dt=0.01`）
- 強制力波: `ForceWave/*.csv`
- 解析結果: `Result/his/*_res.csv`
- 入力波解析: `WaveAnalysis/avd`, `WaveAnalysis/spectrum`
- 再読込データ: `DisplacementView`（旧名 `変位Viewデータ` も読込対応）

### サポートするエンコーディング
- **UTF-8**（BOMあり/なし）- 推奨
- **Shift-JIS** - C#版との互換性のため対応
- その他の文字コードは自動検出により対応

### エラーハンドリング
- 空ファイルの検出
- エンコーディング自動検出失敗時の詳細エラー表示
- CSV解析エラー時の行番号表示
- モデルデータ不完全時の検証エラー

初回起動時は IndexedDB にサンプルデータを自動投入します。

## 数値計算仕様

- `g = 9.80665`
- `dt = 0.01`
- Newmark-β: `gamma = 0.5`, `beta = 0.25`
- 主系質量換算: `重量[kN] / g`
- 主系剛性換算: `剛性[kN/cm] * 100`
- 減衰既定: `h = min(f1 / 150, 0.04)`
- 強制力入力: 既存 C# の増分外力投入ロジック準拠

## 参照した元コード

- `../HBS_TMDSimulator/MainForm.cs`
- `../HBS_TMDSimulator/MakeModel.cs`
- `../HBS_TMDSimulator/RespView.cs`
- `../HBS_TMDSimulator/RespResult.cs`
- `../HBS_TMDSimulator/RespView2.cs`
- `../HBS_TMDSimulator/SetForceForm.cs`
- `../UnitSignWave/UnitSignWave/MainForm.cs`
- `../並進弾性時刻歴/ElemResp/WorkMain_OuterAccess.cs`
- `../並進弾性時刻歴/ElemResp/Modal.cs`

## 現状の検証結果

- `npm run lint` 通過
- `npm run build` 通過

## バージョン履歴

### Ver.Beta01 (2026-02-11)
**UI機能追加:**
- ダークモード/ライトモード切り替え機能
- 日本語/英語の多言語対応
- 組み込みヘルプマニュアル
- テーマ対応ファビコン
- バージョン表示

**改善:**
- UTF-8 BOM対応の強化
- エンコーディング自動検出の改善（UTF-8優先、Shift-JISフォールバック）
- CSVパース時のエラーハンドリング強化
- モデルデータの検証機能追加
- モデル編集画面でFloor表示を大きい順に変更（上階から表示）

**C#レガシーパターンのクリーンアップ:**
- 正弦波生成: `preCycles`パラメータが正しく参照されるよう修正
- ZIP出力をShift-JISからUTF-8に変更（インポートは両方対応）
- 改行コードをCRLF(`\r\n`)からLF(`\n`)に統一
- 階数上限9のハードコードを`MAX_STORIES`定数に変更
- フォルダ名`変位Viewデータ`を`DisplacementView`に英語化（旧名も読込対応）

**技術的改善:**
- CSS変数によるテーマシステム導入（45+の色変数）
- TypeScript型安全な翻訳システム
- LocalStorageによる設定永続化
- テーマフラッシュ防止スクリプト

### 初期版
- C#版からの移植完了
- 基本的な解析機能の実装
- GitHub Pages対応

## 既知課題

- `plotly.js` を含むためビルドチャンクが大きめです（約2MB）。
- 作業フォルダパスに `#` が含まれると Vite 警告が出ます（機能には影響しないが、可能ならパス変更推奨）。
- C# 実行バイナリとの自動数値比較（最大応答誤差の定量比較）は未自動化です。
- ヘルプマニュアルの内容は基本的な使い方のみで、今後拡充予定です。
