import type { Translations } from '../types/translations';

export const ja: Translations = {
  app: {
    title: 'TMD-Simulator Web',
    subtitle: 'TMD応答解析ツール',
    loading: '初期化中...',
  },

  menu: {
    modelEdit: '1. Model Edit',
    eigenMode: '2. Eigen Mode',
    sineWave: '3. Sine Wave',
    waveAnalysis: '4. Wave Analysis',
    baseResponse: '5. Base Response',
    resultView: '6. Result View',
    forceResponse: '7. Force Response',
  },

  topbar: {
    help: 'ヘルプ',
    zipImport: 'ZIP取込',
    zipExport: 'ZIP出力',
    reset: '初期化',
    ready: 'Ready',
  },

  folders: {
    title: 'Workspace Folders',
  },

  modelEdit: {
    title: 'モデル作成・修正',
    selectModel: 'Select model',
    load: '読込',
    new: '新規',
    save: 'Save',
    modelName: 'モデル名',
    storyCount: '階数',
    floor: 'Floor',
    weight: '重量[kN]',
    stiffness: '剛性[kN/cm]',
    damping: '付加減衰[kN/kine]',
    tmdInfo: 'TMD情報',
    addRow: '行追加',
    clear: 'クリア',
    delete: '削除',
    frequency: '振動数[Hz]',
  },

  eigenMode: {
    title: 'Eigen Mode Check',
    selectModel: 'Select model',
    compute: 'Compute',
    order: '次数',
    naturalFreq: '振動数[Hz]',
    effectiveMassRatio: 'Effective Mass Ratio',
    participationFactor: '刺激係数',
  },

  sineWave: {
    title: 'Sine Wave for Force Input',
    frequency: '振動数[Hz]',
    preCycles: '漸増回数',
    harmonicCycles: '定常回数',
    postCycles: '漸減回数',
    addObservation: '加振後の残り観測を追加',
    generate: '波形生成',
    saveToForceWave: 'Save to ForceWave',
    amplitude: 'Amplitude',
    time: 'Time [s]',
  },

  waveAnalysis: {
    title: 'Input Wave Analysis',
    selectWave: 'Select wave',
    runAnalysis: 'Run Analysis',
    selectExistingAvd: 'Select existing AVD',
    loadExisting: '既存解析結果を読込',
    amax: 'Amax',
    vmax: 'Vmax',
    dmax: 'Dmax',
    duration: '継続時間',
    acceleration: 'Acceleration',
    velocity: 'Velocity',
    displacement: 'Displacement',
    spectrum: 'Spectrum',
    note: '解析時に `WaveAnalysis/avd` と `WaveAnalysis/spectrum` へCSVを保存します。',
  },

  baseResponse: {
    title: 'Base Input Response',
    selectWave: 'Select wave',
    runResponse: 'Run Response',
    saveResults: '結果CSV出力・読込',
    showTmd: 'TMDを描画',
    selectResult: 'Select result',
    downloadResult: '選択結果をダウンロード',
    analysisName: '解析名',
    mainAmax: 'Main Amax',
    mainDmax: 'Main Dmax',
    tmdAmax: 'TMD Amax',
    tmdDmax: 'TMD Dmax',
    absoluteAcceleration: '絶対加速度',
    responseDisplacement: 'Response Displacement',
  },

  resultView: {
    title: 'Response View (Reload CSV)',
    showSelected: '選択CSVを表示',
    selectViewTarget: 'Select view target',
    downloadResult: '選択結果をダウンロード',
    addCsv: 'CSV追加',
    display: '表示',
    csvPath: 'CSVパス',
    reloadAcceleration: '再読込 加速度',
    viewDisplacement: 'View Displacement',
  },

  forceResponse: {
    title: 'Force Response Analysis',
    forceName: '強制力名',
    addForce: '強制力追加',
    runResponse: 'Run Response',
    saveResults: '結果CSV出力・読込',
    applyWave: '作用波',
    floor: 'Floor',
    maxForce: '最大強制力[kN]',
    delete: '削除',
    selectResult: 'Select result',
    downloadResult: '選択結果をダウンロード',
    forceAcceleration: '強制力・絶対加速度',
    forceDisplacement: 'Force Response Displacement',
    selectForceWave: 'Select force wave',
  },

  table: {
    select: 'Select',
    name: 'Name',
    index: 'Index',
    userDamping: '任意減衰',
    dampingH: 'h',
    dampingConstant: '減衰定数',
  },

  buttons: {
    save: '保存',
    load: '読込',
    reset: 'リセット',
    close: '閉じる',
  },

  help: {
    title: 'ヘルプマニュアル',
    close: '閉じる',
    basics: {
      title: '基本的な使い方',
      content: `
        <p>TMD-Simulator Webは、TMD（Tuned Mass Damper）を含む建物の時刻歴応答解析を行うWebアプリケーションです。</p>
        <h4>開始方法</h4>
        <ol>
          <li>左側のメニューから解析したい項目を選択します</li>
          <li>モデルの作成または読込を行います</li>
          <li>解析パラメータを設定します</li>
          <li>解析を実行し、結果を確認します</li>
        </ol>
        <p>全ての作業データはブラウザのIndexedDBに保存されます。</p>
      `,
    },
    features: {
      title: '各機能の詳細',
      modelEdit: `
        <h4>1. Model Edit</h4>
        <p>建物モデルの作成・編集を行います。</p>
        <ul>
          <li><strong>階数</strong>: 建物の階数（1〜9階）</li>
          <li><strong>重量[kN]</strong>: 各階の重量</li>
          <li><strong>剛性[kN/cm]</strong>: 各階の剛性</li>
          <li><strong>TMD情報</strong>: TMDダンパーの設置階、重量、振動数を設定</li>
        </ul>
      `,
      eigenAnalysis: `
        <h4>2. Eigen Mode</h4>
        <p>固有値解析を実行し、建物の固有振動数や刺激係数を確認します。</p>
        <p>モデルを選択して「Compute」ボタンをクリックすると、各次数の固有振動数と有効質量比が表示されます。</p>
      `,
      waveGeneration: `
        <h4>3. Sine Wave</h4>
        <p>強制力入力用の正弦波を生成します。</p>
        <ul>
          <li><strong>振動数[Hz]</strong>: 正弦波の振動数</li>
          <li><strong>漸増回数</strong>: 振幅が徐々に増加する周期数</li>
          <li><strong>定常回数</strong>: 一定振幅を維持する周期数</li>
          <li><strong>漸減回数</strong>: 振幅が徐々に減少する周期数</li>
        </ul>
      `,
      responseAnalysis: `
        <h4>4. Wave Analysis</h4>
        <p>入力波の解析を行い、加速度・速度・変位の時刻歴と応答スペクトルを表示します。</p>
        <h4>5. Base Response</h4>
        <p>基礎入力応答解析を実行します。地震波などの基礎加速度入力に対する建物の応答を計算します。</p>
        <h4>6. Result View</h4>
        <p>保存済みの解析結果CSVを再読込して表示します。</p>
        <h4>7. Force Response</h4>
        <p>強制力入力応答解析を実行します。各階に作用する外力に対する応答を計算します。</p>
      `,
    },
    dataIO: {
      title: 'データの入出力',
      content: `
        <h4>ワークスペースのバックアップ</h4>
        <p>右上の「ZIP出力」ボタンで、全てのモデルデータ、入力波、解析結果をZIPファイルとしてダウンロードできます。</p>

        <h4>データの復元</h4>
        <p>「ZIP取込」ボタンで、以前にエクスポートしたZIPファイルをインポートできます。</p>

        <h4>CSVファイル形式</h4>
        <ul>
          <li><strong>モデル</strong>: <code>model/*.dat</code> 形式</li>
          <li><strong>入力波</strong>: <code>Wave/*.csv</code> (1列、dt=0.01)</li>
          <li><strong>強制力波</strong>: <code>ForceWave/*.csv</code></li>
          <li><strong>解析結果</strong>: <code>Result/his/*_res.csv</code></li>
        </ul>

        <h4>数値計算仕様</h4>
        <ul>
          <li>重力加速度: g = 9.80665 m/s²</li>
          <li>時間刻み: dt = 0.01 s</li>
          <li>Newmark-β法: γ = 0.5, β = 0.25</li>
          <li>減衰定数: h = min(f1 / 150, 0.04)</li>
        </ul>
      `,
    },
  },

  footer: {
    license: 'MIT License © 2026',
  },

  messages: {
    modelLoaded: 'モデル読込',
    modelLoadError: 'モデル読込エラー',
    modelSaved: 'モデル保存',
    eigenComplete: '固有値解析完了',
    eigenError: '固有値解析エラー',
    saveSineComplete: '保存完了',
    waveAnalysisComplete: '入力波解析完了',
    waveAnalysisError: '入力波解析エラー',
    baseResponseComplete: '基礎入力応答解析完了',
    baseResponseError: '基礎入力応答解析エラー',
    forceResponseComplete: '強制力応答解析完了',
    forceResponseError: '強制力応答解析エラー',
    resultCsvSaved: '結果CSV出力完了',
    existingResultLoaded: '既存結果読込',
    analysisResultLoadError: '分析結果読込エラー',
    resultCsvImported: '結果CSV取込',
    zipImportComplete: 'ZIP取込完了',
    workspaceReset: 'Workspace has been reset.',
    reloadDisplayComplete: '再読込表示',
    reloadError: '再読込エラー',
    selectWave: 'Select an input wave.',
    selectModel: 'Select a model for eigen analysis.',
    generateSineFirst: 'Generate a sine wave before saving.',
    configureForceRows: 'Configure force input rows.',
    selectAtLeastOneCsv: 'Select at least one CSV file to view.',
    noResultsToSave: 'No response results to save.',
    selectResultToExport: 'Select a result to export.',
    resetConfirm: 'Reset workspace data in IndexedDB? This action cannot be undone.',
    sineWaveGenerated: 'Sine wave generated',
    files: 'ファイル',
    cases: 'ケース',
  },
};
