# TMD-Simulator Web移行 AIエージェント指示書

## 1. 目的
このプロジェクトの目的は、既存の C# Windows Forms アプリ（`HBS_TMDSimulator`）を、GitHub Pages 上で動作する静的Webアプリへ移行することです。

重要事項:
- 既存アプリで行える「検討（モデル設定、固有値確認、時刻歴応答、結果可視化）」を、Web上でほぼ同等に実施できること。
- 数値計算ロジックは、見た目より優先して互換性を確保すること。
- サーバーは使わない（GitHub Pages前提のSPA）。

## 2. 参照元コード（必読）
実装時は以下を一次情報として読むこと。

- メイン操作フロー: `../HBS_TMDSimulator/MainForm.cs`
- モデル作成・保存形式: `../HBS_TMDSimulator/MakeModel.cs`
- 応答計算実行: `../HBS_TMDSimulator/RespView.cs`
- 結果ファイル形式: `../HBS_TMDSimulator/RespResult.cs`
- 結果再読込表示: `../HBS_TMDSimulator/RespView2.cs`
- 強制力設定: `../HBS_TMDSimulator/SetForceForm.cs`
- 正弦波作成: `../UnitSignWave/UnitSignWave/MainForm.cs`
- 時刻歴計算コア: `../並進弾性時刻歴/ElemResp/WorkMain_OuterAccess.cs`
- 固有値計算コア: `../並進弾性時刻歴/ElemResp/Modal.cs`

## 3. Web版で必須の機能要件
### 3.1 画面/機能メニュー（C#版同等）
最低限、次の機能を持つこと。

1. モデル作成・修正
2. 固有モードの確認
3. 正弦波の作成（強制力用）
4. 入力波特性の確認
5. 時刻歴応答の確認（基礎入力）
6. 時刻歴View（既存結果CSVの再読込表示）
7. 強制力応答の確認
8. 結果CSV出力

### 3.2 データ管理
Windows版の作業フォルダー構成をWeb上でも論理的に再現する。

- `model/`
- `Wave/`
- `ForceWave/`
- `WaveAnalysis/avd/`
- `WaveAnalysis/spectrum/`
- `Result/his/`
- `変位Viewデータ/`

Webでは実ファイルシステムを前提にしないため、以下のいずれかで実現:
- IndexedDB + エクスポート/インポート（zip）
- File System Access API（対応ブラウザ）+ フォールバック

## 4. 入出力フォーマット仕様（互換優先）
### 4.1 モデルファイル（`.dat`）
C#版互換で読み書きすること（Shift_JIS入力も受ける）。

例:
```csv
NAME,ModelA
質点数,3
重量[kN],1000,1000,900
剛性[kN/cm],1200,1100,900
付加減衰係数[kN/kine],0,0,0
# TMD情報
TMD,3,30,2.5
```

`TMD` 行の意味:
- 1列目: 配置床（2F床を1として扱うC#流儀に合わせる）
- 2列目: 重量[kN]
- 3列目: 振動数[Hz]

### 4.2 入力波ファイル（`.csv`）
- 1行1数値（ヘッダーなし）
- サンプリング `dt = 0.01 s`

### 4.3 結果ファイル（`*_res.csv`）
C#版 `RespResult.WriteResult` と同じ列順で出力:
- `Time[s]`
- `入力波[gal]`
- 主架構加速度 `A_xF(gal)`
- 主架構変位 `D_xF(cm)`
- TMD加速度 `Atmd..(gal)`
- TMD変位 `Dtmd..(cm)`

## 5. 数値計算仕様（変更禁止）
以下は必ず踏襲すること。勝手な別解法への置換は禁止。

- 重力加速度: `g = 9.80665`
- 時刻刻み: `dt = 0.01`
- Newmark-β法: `gamma = 0.5`, `beta = 0.25`
- 主系質量換算: `重量[kN] / g`
- 主系剛性換算: `剛性[kN/cm] * 100`

### 5.1 減衰設定
モデル選択時に指定がない場合:
- `f1` を1次固有振動数[Hz]とし、`h = min(f1/150, 0.04)`

### 5.2 TMDパラメータ
既存実装準拠で算定:
- `k_tmd = (4*pi^2*f_tmd^2)*(W_tmd/g)/100`  （kN/cm）
- `myu = W_tmd / sum(W_main)`
- `h_opt = sqrt(3/8 * myu / (1 + myu))`

### 5.3 強制力入力
- ForceWaveの波形に対し、指定最大強制力[kN]を `kN -> tf` 変換して倍率適用（既存同等）
- 解析には増分外力として投入（既存 `SetForce` の挙動を再現）

## 6. 推奨技術スタック
GitHub Pages運用を前提に次を推奨。

- `TypeScript`
- `React + Vite`
- グラフ: `Plotly.js` か `ECharts`
- 行列計算: `ml-matrix` など
- 文字コード対応: Shift_JIS読込対応（必要なら `encoding-japanese` 併用）

注意:
- `vite.config` で `base` を GitHub Pages 用に設定
- 重い計算は `Web Worker` 化する

## 7. 実装手順（AIエージェントへの作業指示）
以下の順序で実装し、各段階で動作確認すること。

1. プロジェクト初期化
- SPA雛形作成
- GitHub Pages向けビルド/デプロイ設定

2. ドメイン層実装
- モデル/波形/結果の型定義
- `.dat/.csv` パーサとシリアライザ

3. 数値計算移植
- 固有値解析（`Modal.cs` 相当）
- 時刻歴解析（`WorkMain_OuterAccess.cs` 相当）
- 基礎入力/強制力入力の両対応

4. UI実装
- C#メニュー同等の機能画面
- モデル編集、波形選択、解析実行、結果一覧、描画

5. 検証
- 同一入力で C#版と比較し、誤差を定量化
- 誤差が閾値を超える場合は数式・単位・列順を再確認

6. 仕上げ
- README整備
- サンプルデータ同梱
- GitHub Pages公開

## 8. 受け入れ基準（Definition of Done）
次を全て満たしたら完了。

- C#版の主要機能（3.1）をWebで再現
- 既存フォーマット（`.dat`, `*_res.csv`）を読み書き可能
- 同条件の解析で、主要応答（最大加速度・最大変位）の誤差が概ね 1% 程度以内
- GitHub Pages URLで起動し、初見ユーザーが解析～結果出力まで完了できる

## 9. AIエージェントへの実行プロンプト（そのまま利用可）
以下を別AIへ渡して実行させること。

```text
あなたは構造振動解析ツールの移植エンジニアです。
`TMD-Simulator` フォルダーに、GitHub Pagesで動作する静的Webアプリを実装してください。

必須条件:
1) `../HBS_TMDSimulator` と `../並進弾性時刻歴/ElemResp` を一次情報として読み、計算仕様を一致させる。
2) 既存の .dat / .csv 形式と互換性を持たせる（Shift_JIS入力対応）。
3) 機能は「モデル作成、固有値確認、正弦波作成、入力波確認、時刻歴応答（基礎/強制）、結果再読込表示、結果CSV出力」を実装する。
4) 時刻歴計算は Newmark-β（gamma=0.5, beta=0.25, dt=0.01）を使う。
5) 変更ごとにテストまたは比較結果を示し、最後に C#版との差分と残課題を報告する。

進め方:
- まず実装計画を簡潔に示す
- 次に最小構成で動く版を作る
- その後に機能を段階追加し、各段階で検証
- 最終的に README と GitHub Pages デプロイ設定を完成させる
```

## 10. 補足
- 本指示書は「完全コピー」ではなく「数値仕様互換」を最重視する。
- UIはWeb向けに調整してよいが、機能欠落は不可。
- 不明点が出た場合は、推測実装せず参照元コードの式・単位・列定義を優先すること。
