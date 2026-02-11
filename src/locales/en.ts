import type { Translations } from '../types/translations';

export const en: Translations = {
  app: {
    title: 'TMD-Simulator Web',
    subtitle: 'TMD Response Analysis Tool',
    loading: 'Initializing...',
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
    help: 'Help',
    zipImport: 'Import ZIP',
    zipExport: 'Export ZIP',
    reset: 'Reset',
    ready: 'Ready',
  },

  folders: {
    title: 'Workspace Folders',
  },

  modelEdit: {
    title: 'Model Edit',
    selectModel: 'Select model',
    load: 'Load',
    new: 'New',
    save: 'Save',
    modelName: 'Model Name',
    storyCount: 'Story Count',
    floor: 'Floor',
    weight: 'Weight[kN]',
    stiffness: 'Stiffness[kN/cm]',
    damping: 'Extra Damping[kN/kine]',
    tmdInfo: 'TMD Information',
    addRow: 'Add Row',
    clear: 'Clear',
    delete: 'Delete',
    frequency: 'Frequency[Hz]',
  },

  eigenMode: {
    title: 'Eigen Mode Check',
    selectModel: 'Select model',
    compute: 'Compute',
    order: 'Order',
    naturalFreq: 'Natural Freq[Hz]',
    effectiveMassRatio: 'Effective Mass Ratio',
    participationFactor: 'Participation Factor',
  },

  sineWave: {
    title: 'Sine Wave for Force Input',
    frequency: 'Frequency[Hz]',
    preCycles: 'Pre Cycles',
    harmonicCycles: 'Harmonic Cycles',
    postCycles: 'Post Cycles',
    addObservation: 'Add post-excitation observation',
    generate: 'Generate Wave',
    saveToForceWave: 'Save to ForceWave',
    amplitude: 'Amplitude',
    time: 'Time [s]',
  },

  waveAnalysis: {
    title: 'Input Wave Analysis',
    selectWave: 'Select wave',
    runAnalysis: 'Run Analysis',
    selectExistingAvd: 'Select existing AVD',
    loadExisting: 'Load Existing Result',
    amax: 'Amax',
    vmax: 'Vmax',
    dmax: 'Dmax',
    duration: 'Duration',
    acceleration: 'Acceleration',
    velocity: 'Velocity',
    displacement: 'Displacement',
    spectrum: 'Spectrum',
    note: 'CSV files will be saved to `WaveAnalysis/avd` and `WaveAnalysis/spectrum` during analysis.',
  },

  baseResponse: {
    title: 'Base Input Response',
    selectWave: 'Select wave',
    runResponse: 'Run Response',
    saveResults: 'Save Results CSV',
    showTmd: 'Show TMD',
    selectResult: 'Select result',
    downloadResult: 'Download Selected Result',
    analysisName: 'Analysis Name',
    mainAmax: 'Main Amax',
    mainDmax: 'Main Dmax',
    tmdAmax: 'TMD Amax',
    tmdDmax: 'TMD Dmax',
    absoluteAcceleration: 'Absolute Acceleration',
    responseDisplacement: 'Response Displacement',
  },

  resultView: {
    title: 'Response View (Reload CSV)',
    showSelected: 'Show Selected CSV',
    selectViewTarget: 'Select view target',
    downloadResult: 'Download Selected Result',
    addCsv: 'Add CSV',
    display: 'Display',
    csvPath: 'CSV Path',
    reloadAcceleration: 'Reload Acceleration',
    viewDisplacement: 'View Displacement',
  },

  forceResponse: {
    title: 'Force Response Analysis',
    forceName: 'Force Name',
    addForce: 'Add Force',
    runResponse: 'Run Response',
    saveResults: 'Save Results CSV',
    applyWave: 'Apply Wave',
    floor: 'Floor',
    maxForce: 'Max Force[kN]',
    delete: 'Delete',
    selectResult: 'Select result',
    downloadResult: 'Download Selected Result',
    forceAcceleration: 'Force・Absolute Acceleration',
    forceDisplacement: 'Force Response Displacement',
    selectForceWave: 'Select force wave',
  },

  table: {
    select: 'Select',
    name: 'Name',
    index: 'Index',
    userDamping: 'User Damping',
    dampingH: 'h',
    dampingConstant: 'Damping Constant',
  },

  buttons: {
    save: 'Save',
    load: 'Load',
    reset: 'Reset',
    close: 'Close',
  },

  help: {
    title: 'Help Manual',
    close: 'Close',
    basics: {
      title: 'Getting Started',
      content: `
        <p>TMD-Simulator Web is a web application for time-history response analysis of buildings with TMD (Tuned Mass Damper).</p>
        <h4>How to Start</h4>
        <ol>
          <li>Select an analysis item from the left menu</li>
          <li>Create or load a model</li>
          <li>Set analysis parameters</li>
          <li>Run the analysis and check the results</li>
        </ol>
        <p>All working data is stored in the browser's IndexedDB.</p>
      `,
    },
    features: {
      title: 'Features',
      modelEdit: `
        <h4>1. Model Edit</h4>
        <p>Create and edit building models.</p>
        <ul>
          <li><strong>Story Count</strong>: Number of building stories (1-9)</li>
          <li><strong>Weight[kN]</strong>: Weight of each floor</li>
          <li><strong>Stiffness[kN/cm]</strong>: Stiffness of each floor</li>
          <li><strong>TMD Information</strong>: Set TMD installation floor, weight, and frequency</li>
        </ul>
      `,
      eigenAnalysis: `
        <h4>2. Eigen Mode</h4>
        <p>Perform eigenvalue analysis to check natural frequencies and participation factors.</p>
        <p>Select a model and click "Compute" to display natural frequencies and effective mass ratios for each mode.</p>
      `,
      waveGeneration: `
        <h4>3. Sine Wave</h4>
        <p>Generate sine waves for force input.</p>
        <ul>
          <li><strong>Frequency[Hz]</strong>: Sine wave frequency</li>
          <li><strong>Pre Cycles</strong>: Number of cycles with gradually increasing amplitude</li>
          <li><strong>Harmonic Cycles</strong>: Number of cycles with constant amplitude</li>
          <li><strong>Post Cycles</strong>: Number of cycles with gradually decreasing amplitude</li>
        </ul>
      `,
      responseAnalysis: `
        <h4>4. Wave Analysis</h4>
        <p>Analyze input waves and display time-history of acceleration, velocity, displacement, and response spectrum.</p>
        <h4>5. Base Response</h4>
        <p>Perform base input response analysis. Calculate building response to base acceleration input such as earthquake waves.</p>
        <h4>6. Result View</h4>
        <p>Reload and display saved analysis result CSV files.</p>
        <h4>7. Force Response</h4>
        <p>Perform force input response analysis. Calculate response to external forces acting on each floor.</p>
      `,
    },
    dataIO: {
      title: 'Data Import/Export',
      content: `
        <h4>Workspace Backup</h4>
        <p>Click "Export ZIP" button at the top right to download all model data, input waves, and analysis results as a ZIP file.</p>

        <h4>Data Restoration</h4>
        <p>Use "Import ZIP" button to import previously exported ZIP files.</p>

        <h4>CSV File Format</h4>
        <ul>
          <li><strong>Model</strong>: <code>model/*.dat</code> format</li>
          <li><strong>Input Wave</strong>: <code>Wave/*.csv</code> (1 column, dt=0.01)</li>
          <li><strong>Force Wave</strong>: <code>ForceWave/*.csv</code></li>
          <li><strong>Analysis Result</strong>: <code>Result/his/*_res.csv</code></li>
        </ul>

        <h4>Numerical Specifications</h4>
        <ul>
          <li>Gravity acceleration: g = 9.80665 m/s²</li>
          <li>Time step: dt = 0.01 s</li>
          <li>Newmark-β method: γ = 0.5, β = 0.25</li>
          <li>Damping constant: h = min(f1 / 150, 0.04)</li>
        </ul>
      `,
    },
  },

  footer: {
    license: 'MIT License © 2026',
  },

  messages: {
    modelLoaded: 'Model loaded',
    modelLoadError: 'Model load error',
    modelSaved: 'Model saved',
    eigenComplete: 'Eigen analysis complete',
    eigenError: 'Eigen analysis error',
    saveSineComplete: 'Save complete',
    waveAnalysisComplete: 'Wave analysis complete',
    waveAnalysisError: 'Wave analysis error',
    baseResponseComplete: 'Base response analysis complete',
    baseResponseError: 'Base response analysis error',
    forceResponseComplete: 'Force response analysis complete',
    forceResponseError: 'Force response analysis error',
    resultCsvSaved: 'Result CSV saved',
    existingResultLoaded: 'Existing result loaded',
    analysisResultLoadError: 'Analysis result load error',
    resultCsvImported: 'Result CSV imported',
    zipImportComplete: 'ZIP import complete',
    workspaceReset: 'Workspace has been reset.',
    reloadDisplayComplete: 'Reload display complete',
    reloadError: 'Reload error',
    selectWave: 'Select an input wave.',
    selectModel: 'Select a model for eigen analysis.',
    generateSineFirst: 'Generate a sine wave before saving.',
    configureForceRows: 'Configure force input rows.',
    selectAtLeastOneCsv: 'Select at least one CSV file to view.',
    noResultsToSave: 'No response results to save.',
    selectResultToExport: 'Select a result to export.',
    resetConfirm: 'Reset workspace data in IndexedDB? This action cannot be undone.',
    sineWaveGenerated: 'Sine wave generated',
    files: 'files',
    cases: 'cases',
  },
};
