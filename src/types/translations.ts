export interface Translations {
  app: {
    title: string;
    subtitle: string;
    version: string;
    loading: string;
  };

  menu: {
    modelEdit: string;
    eigenMode: string;
    sineWave: string;
    waveAnalysis: string;
    baseResponse: string;
    resultView: string;
    forceResponse: string;
  };

  topbar: {
    help: string;
    guide: string;
    zipImport: string;
    zipExport: string;
    reset: string;
    ready: string;
  };

  folders: {
    title: string;
  };

  modelEdit: {
    title: string;
    selectModel: string;
    load: string;
    new: string;
    save: string;
    modelName: string;
    storyCount: string;
    floor: string;
    weight: string;
    stiffness: string;
    damping: string;
    tmdInfo: string;
    addRow: string;
    clear: string;
    delete: string;
    frequency: string;
  };

  eigenMode: {
    title: string;
    selectModel: string;
    compute: string;
    order: string;
    naturalFreq: string;
    effectiveMassRatio: string;
    participationFactor: string;
  };

  sineWave: {
    title: string;
    frequency: string;
    preCycles: string;
    harmonicCycles: string;
    postCycles: string;
    addObservation: string;
    generate: string;
    saveToForceWave: string;
    amplitude: string;
    time: string;
  };

  waveAnalysis: {
    title: string;
    selectWave: string;
    runAnalysis: string;
    selectExistingAvd: string;
    loadExisting: string;
    amax: string;
    vmax: string;
    dmax: string;
    duration: string;
    acceleration: string;
    velocity: string;
    displacement: string;
    spectrum: string;
    note: string;
  };

  baseResponse: {
    title: string;
    selectWave: string;
    runResponse: string;
    saveResults: string;
    showTmd: string;
    selectResult: string;
    downloadResult: string;
    analysisName: string;
    mainAmax: string;
    mainDmax: string;
    tmdAmax: string;
    tmdDmax: string;
    absoluteAcceleration: string;
    responseDisplacement: string;
  };

  resultView: {
    title: string;
    showSelected: string;
    selectViewTarget: string;
    downloadResult: string;
    addCsv: string;
    display: string;
    csvPath: string;
    reloadAcceleration: string;
    viewDisplacement: string;
  };

  forceResponse: {
    title: string;
    forceName: string;
    addForce: string;
    runResponse: string;
    saveResults: string;
    applyWave: string;
    floor: string;
    maxForce: string;
    delete: string;
    selectResult: string;
    downloadResult: string;
    forceAcceleration: string;
    forceDisplacement: string;
    selectForceWave: string;
  };

  table: {
    select: string;
    name: string;
    index: string;
    userDamping: string;
    dampingH: string;
    dampingConstant: string;
  };

  buttons: {
    save: string;
    load: string;
    reset: string;
    close: string;
  };

  help: {
    title: string;
    close: string;
    basics: {
      title: string;
      content: string;
    };
    features: {
      title: string;
      modelEdit: string;
      eigenAnalysis: string;
      waveGeneration: string;
      responseAnalysis: string;
    };
    dataIO: {
      title: string;
      content: string;
    };
  };

  welcome: {
    title: string;
    dismiss: string;
    close: string;
    sampleDataTitle: string;
    sampleDataDesc: string;
    workflowTitle: string;
    workflowSteps: string;
    dataManageTitle: string;
    dataManageDesc: string;
  };

  footer: {
    license: string;
  };

  messages: {
    modelLoaded: string;
    modelLoadError: string;
    modelSaved: string;
    eigenComplete: string;
    eigenError: string;
    saveSineComplete: string;
    waveAnalysisComplete: string;
    waveAnalysisError: string;
    baseResponseComplete: string;
    baseResponseError: string;
    forceResponseComplete: string;
    forceResponseError: string;
    resultCsvSaved: string;
    existingResultLoaded: string;
    analysisResultLoadError: string;
    resultCsvImported: string;
    zipImportComplete: string;
    workspaceReset: string;
    reloadDisplayComplete: string;
    reloadError: string;
    selectWave: string;
    selectModel: string;
    generateSineFirst: string;
    configureForceRows: string;
    selectAtLeastOneCsv: string;
    noResultsToSave: string;
    selectResultToExport: string;
    resetConfirm: string;
    sineWaveGenerated: string;
    files: string;
    cases: string;
  };
}
