# TMD-Simulator Web

GitHub Pages で動作する、TMD 時刻歴解析ツールの Web 版です。  
既存 C# 実装（`../HBS_TMDSimulator` / `../並進弾性時刻歴/ElemResp`）の数値仕様を踏襲し、静的 SPA として動作します。

## 主な機能

- モデル作成・編集（`.dat` 互換）
- 固有値解析（`Modal.cs` 相当）
- 正弦波作成（ForceWave 用）
- 入力波解析（AVD / スペクトル）
- 時刻歴応答（基礎入力）
- 時刻歴応答（強制力入力）
- 既存結果 CSV の再読込表示
- 結果 CSV 出力
- ワークスペース ZIP の入出力

## 技術構成

- React + TypeScript + Vite
- IndexedDB（`idb`）による作業データ管理
- `ml-matrix` による固有値計算
- `plotly.js` によるグラフ表示
- `encoding-japanese` による Shift_JIS 読込対応

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
- `main` または `master` への push で自動デプロイ
- Vite の `base` は `VITE_BASE_PATH` で上書き可能（未指定時 `./`）

例:

```bash
# リポジトリ名が tmd-simulator-web の場合
set VITE_BASE_PATH=/tmd-simulator-web/
npm run build
```

## データ互換仕様

- モデル: `model/*.dat`
- 入力波: `Wave/*.csv`（1列、`dt=0.01`）
- 強制力波: `ForceWave/*.csv`
- 解析結果: `Result/his/*_res.csv`
- 入力波解析: `WaveAnalysis/avd`, `WaveAnalysis/spectrum`
- 再読込データ: `変位Viewデータ`

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

## 既知課題

- `plotly.js` を含むためビルドチャンクが大きめです。
- 作業フォルダパスに `#` が含まれると Vite 警告が出ます（機能には影響しないが、可能ならパス変更推奨）。
- C# 実行バイナリとの自動数値比較（最大応答誤差の定量比較）は未自動化です。
