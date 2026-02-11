import { useEffect, useMemo, useState } from "react";
import "@/App.css";
import { LineChart } from "@/components/LineChart.tsx";
import { decodeTextAuto, triggerDownload } from "@/domain/encoding.ts";
import {
  GRAVITY,
  createEmptyModel,
  parseAvdCsv,
  parseModelDat,
  parseResponseCsv,
  parseSpectrumCsv,
  parseWaveCsv,
  serializeModelDat,
  serializeResponseCsv,
  serializeWaveCsv,
} from "@/domain/format.ts";
import { eigenWork } from "@/domain/modal.ts";
import {
  createForceWaveInput,
  createZeroWave,
  getResultMaxValues,
  runResponse,
} from "@/domain/response.ts";
import { createSineWaveFileName, makeSineWave } from "@/domain/sineWave.ts";
import {
  analyzeWave,
  createAvdCsv,
  createSpectrumCsv,
} from "@/domain/waveAnalysis.ts";
import type {
  ModalResult,
  ModelData,
  ModelRunConfig,
  ResponseResult,
  WaveAnalysisResult,
  WorkspaceFile,
} from "@/domain/types.ts";
import {
  clearWorkspace,
  fileNameFromPath,
  folderFromPath,
  initializeWorkspace,
  listAllFiles,
  putFile,
  putFiles,
  requiredFolders,
} from "@/storage/workspaceDb.ts";
import { exportWorkspaceZip, importWorkspaceZip } from "@/storage/workspaceZip.ts";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks/useTranslation";
import { Language } from "@/locales";
import { storage } from "@/utils/localStorage";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageToggle } from "@/components/LanguageToggle";
import { HelpManual } from "@/components/HelpManual";
import { Favicon } from "@/components/Favicon";

type MenuKey =
  | "model"
  | "eigen"
  | "sine"
  | "wave"
  | "base"
  | "view"
  | "force";

interface ModelSelection extends ModelRunConfig {
  selected: boolean;
}

interface ForceRow {
  id: number;
  wavePath: string;
  floorIndex: number;
  maxForceKn: number;
}

type SelectionUpdater = (updater: (prev: ModelSelection[]) => ModelSelection[]) => void;

// Menu keys for type safety
const MENU_KEYS = ["model", "eigen", "sine", "wave", "base", "view", "force"] as const;

function normalizeModelSelection(
  previous: ModelSelection[],
  modelPaths: string[],
): ModelSelection[] {
  const byPath = new Map(previous.map((item) => [item.modelPath, item]));
  const next = modelPaths.map((path, index) => {
    const old = byPath.get(path);
    return (
      old ?? {
        modelPath: path,
        indexOrder: index + 1,
        selected: false,
        useUserDamping: false,
        userDampingH: 0.01,
        dampingPercent: 0,
      }
    );
  });
  return next.sort((lhs, rhs) => lhs.indexOrder - rhs.indexOrder);
}

function dampingFromSelection(selection: ModelSelection): number {
  if (selection.useUserDamping) {
    return selection.userDampingH;
  }
  if (selection.dampingPercent <= 0) {
    return -1;
  }
  return selection.dampingPercent / 100;
}

function modelNameFromPath(path: string): string {
  return fileNameFromPath(path).replace(/\.[^.]+$/, "");
}

function folderFileCount(files: WorkspaceFile[], folder: string): number {
  return files.filter((file) => folderFromPath(file.path) === folder).length;
}

function toStem(path: string): string {
  return fileNameFromPath(path).replace(/\.[^.]+$/, "");
}

function resolvePathOrFirst(selectedPath: string, candidates: string[]): string {
  if (selectedPath && candidates.includes(selectedPath)) {
    return selectedPath;
  }
  return candidates[0] ?? "";
}

function App() {
  const [ready, setReady] = useState(false);
  const [notice, setNotice] = useState("");
  const [activeMenu, setActiveMenu] = useState<MenuKey>("model");
  const [files, setFiles] = useState<WorkspaceFile[]>([]);

  const [modelDraft, setModelDraft] = useState<ModelData>(createEmptyModel("ModelA"));
  const [selectedModelPath, setSelectedModelPath] = useState("");

  const [eigenModelPath, setEigenModelPath] = useState("");
  const [eigenResult, setEigenResult] = useState<ModalResult | null>(null);

  const [sineInput, setSineInput] = useState({
    freqHz: 3,
    preCycles: 5,
    harmonicCycles: 8,
    postCycles: 5,
    addAfterObservation: true,
  });
  const [sineWave, setSineWave] = useState<number[]>([]);
  const [sineFileName, setSineFileName] = useState("Freq0300_001.csv");

  const [waveTargetPath, setWaveTargetPath] = useState("");
  const [existingAvdPath, setExistingAvdPath] = useState("");
  const [waveAnalysisResult, setWaveAnalysisResult] =
    useState<WaveAnalysisResult | null>(null);

  const [baseWavePath, setBaseWavePath] = useState("");
  const [baseSelections, setBaseSelections] = useState<ModelSelection[]>([]);
  const [baseResults, setBaseResults] = useState<ResponseResult[]>([]);
  const [baseActiveResultName, setBaseActiveResultName] = useState("");
  const [baseViewGroupName, setBaseViewGroupName] = useState("default");
  const [showTmdTrace, setShowTmdTrace] = useState(true);

  const [forceRows, setForceRows] = useState<ForceRow[]>([]);
  const [forceName, setForceName] = useState("Force");
  const [forceSelections, setForceSelections] = useState<ModelSelection[]>([]);
  const [forceResults, setForceResults] = useState<ResponseResult[]>([]);
  const [forceActiveResultName, setForceActiveResultName] = useState("");

  const [viewChecks, setViewChecks] = useState<Record<string, boolean>>({});
  const [viewResults, setViewResults] = useState<ResponseResult[]>([]);
  const [viewActiveResultName, setViewActiveResultName] = useState("");

  // Theme and language state
  const { theme, toggleTheme } = useTheme();
  const [language, setLanguage] = useState<Language>(() => storage.getLanguage() || 'ja');
  const [showHelp, setShowHelp] = useState(false);
  const t = useTranslation(language);

  // Persist language preference
  useEffect(() => {
    storage.setLanguage(language);
  }, [language]);

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === 'ja' ? 'en' : 'ja'));
  };

  const fileMap = useMemo(
    () => new Map(files.map((item) => [item.path, item])),
    [files],
  );

  const modelFiles = useMemo(
    () =>
      files.filter(
        (file) =>
          folderFromPath(file.path) === "model" &&
          file.path.toLowerCase().endsWith(".dat"),
      ),
    [files],
  );
  const waveFiles = useMemo(
    () => files.filter((file) => folderFromPath(file.path) === "Wave"),
    [files],
  );
  const forceWaveFiles = useMemo(
    () => files.filter((file) => folderFromPath(file.path) === "ForceWave"),
    [files],
  );
  const avdFiles = useMemo(
    () => files.filter((file) => folderFromPath(file.path) === "WaveAnalysis/avd"),
    [files],
  );
  const resultFiles = useMemo(
    () => files.filter((file) => folderFromPath(file.path) === "Result/his"),
    [files],
  );
  const displacementViewFiles = useMemo(
    () =>
      files.filter(
        (file) => file.path.startsWith("変位Viewデータ/") && file.path.endsWith(".csv"),
      ),
    [files],
  );
  const viewCandidateFiles = useMemo(
    () =>
      [...resultFiles, ...displacementViewFiles].filter((file) =>
        file.path.toLowerCase().endsWith(".csv"),
      ),
    [displacementViewFiles, resultFiles],
  );

  const baseActiveResult = useMemo(
    () => baseResults.find((item) => item.name === baseActiveResultName) ?? null,
    [baseResults, baseActiveResultName],
  );
  const forceActiveResult = useMemo(
    () => forceResults.find((item) => item.name === forceActiveResultName) ?? null,
    [forceResults, forceActiveResultName],
  );
  const viewActiveResult = useMemo(
    () => viewResults.find((item) => item.name === viewActiveResultName) ?? null,
    [viewResults, viewActiveResultName],
  );
  const modelPaths = useMemo(() => modelFiles.map((item) => item.path), [modelFiles]);
  const normalizedBaseSelections = useMemo(
    () => normalizeModelSelection(baseSelections, modelPaths),
    [baseSelections, modelPaths],
  );
  const normalizedForceSelections = useMemo(
    () => normalizeModelSelection(forceSelections, modelPaths),
    [forceSelections, modelPaths],
  );
  const wavePaths = useMemo(() => waveFiles.map((file) => file.path), [waveFiles]);
  const effectiveBaseWavePath = useMemo(
    () => resolvePathOrFirst(baseWavePath, wavePaths),
    [baseWavePath, wavePaths],
  );
  const effectiveWaveTargetPath = useMemo(
    () => resolvePathOrFirst(waveTargetPath, wavePaths),
    [waveTargetPath, wavePaths],
  );
  const defaultForceRows = useMemo<ForceRow[]>(() => {
    if (forceWaveFiles.length === 0) {
      return [];
    }
    return [
      {
        id: 0,
        wavePath: forceWaveFiles[0].path,
        floorIndex: 0,
        maxForceKn: 10,
      },
    ];
  }, [forceWaveFiles]);
  const activeForceRows = useMemo(
    () => (forceRows.length > 0 ? forceRows : defaultForceRows),
    [defaultForceRows, forceRows],
  );

  const updateBaseSelections: SelectionUpdater = (updater) => {
    setBaseSelections((prev) => updater(normalizeModelSelection(prev, modelPaths)));
  };
  const updateForceSelections: SelectionUpdater = (updater) => {
    setForceSelections((prev) => updater(normalizeModelSelection(prev, modelPaths)));
  };

  function updateForceRows(updater: (rows: ForceRow[]) => ForceRow[]): void {
    setForceRows((prev) => updater(prev.length > 0 ? prev : defaultForceRows));
  }

  async function refreshFiles(): Promise<void> {
    const loaded = await listAllFiles();
    setFiles(loaded);
  }

  async function setNoticeAndRefresh(message: string): Promise<void> {
    setNotice(message);
    await refreshFiles();
  }

  useEffect(() => {
    (async () => {
      await initializeWorkspace();
      await refreshFiles();
      setReady(true);
    })();
  }, []);

  function getContent(path: string): string {
    return fileMap.get(path)?.content ?? "";
  }

  function updateModelArray(
    key: "weightsKn" | "stiffnessKnPerCm" | "extraDampingKnPerKine",
    index: number,
    value: number,
  ): void {
    setModelDraft((prev) => {
      const next = { ...prev };
      const array = [...next[key]];
      array[index] = Number.isFinite(value) ? value : 0;
      next[key] = array;
      return next;
    });
  }

  function ensureStoryCount(storyCount: number): void {
    setModelDraft((prev) => {
      const count = Math.min(9, Math.max(1, Math.floor(storyCount)));
      const normalize = (values: number[]) => {
        const next = values.slice(0, count);
        while (next.length < count) {
          next.push(0);
        }
        return next;
      };
      return {
        ...prev,
        storyCount: count,
        weightsKn: normalize(prev.weightsKn),
        stiffnessKnPerCm: normalize(prev.stiffnessKnPerCm),
        extraDampingKnPerKine: normalize(prev.extraDampingKnPerKine),
        tmdList: prev.tmdList.map((item) => ({
          ...item,
          floor: Math.min(count, Math.max(1, item.floor)),
        })),
      };
    });
  }

  async function handleLoadModel(path: string): Promise<void> {
    try {
      const parsed = parseModelDat(getContent(path), modelNameFromPath(path));
      setModelDraft(parsed);
      setSelectedModelPath(path);
      setNotice(t.messages.modelLoaded);
    } catch (error) {
      setNotice(`${t.messages.modelLoadError}: ${(error as Error).message}`);
    }
  }

  async function handleSaveModel(): Promise<void> {
    const name = modelDraft.name.trim() || "Model";
    const normalized: ModelData = {
      ...modelDraft,
      name,
      storyCount: Math.min(9, Math.max(1, modelDraft.storyCount)),
    };
    await putFile(`model/${name}.dat`, serializeModelDat(normalized));
    await setNoticeAndRefresh(t.messages.modelSaved);
    setSelectedModelPath(`model/${name}.dat`);
  }

  function handleComputeEigen(): void {
    if (!eigenModelPath) {
      setNotice(t.messages.selectModel);
      return;
    }
    try {
      const model = parseModelDat(getContent(eigenModelPath), modelNameFromPath(eigenModelPath));
      const mi = model.weightsKn.map((value) => value / GRAVITY);
      const ki = model.stiffnessKnPerCm.map((value) => value * 100);
      setEigenResult(eigenWork(mi, ki));
      setNotice(t.messages.eigenComplete);
    } catch (error) {
      setNotice(`${t.messages.eigenError}: ${(error as Error).message}`);
    }
  }

  function handleGenerateSine(): void {
    const generated = makeSineWave(sineInput);
    const existing = forceWaveFiles.map((file) => fileNameFromPath(file.path));
    setSineWave(generated);
    setSineFileName(createSineWaveFileName(sineInput.freqHz, existing));
    setNotice(t.messages.sineWaveGenerated);
  }

  async function handleSaveSine(): Promise<void> {
    if (sineWave.length === 0) {
      setNotice(t.messages.generateSineFirst);
      return;
    }
    const safeName = sineFileName.trim() || "Freq0300_001.csv";
    await putFile(`ForceWave/${safeName}`, serializeWaveCsv(sineWave));
    await setNoticeAndRefresh(t.messages.saveSineComplete);
  }

  function analysisPathFromWave(wavePath: string): { avd: string; spectrum: string } {
    const stem = toStem(wavePath);
    return {
      avd: `WaveAnalysis/avd/${stem}_avd.csv`,
      spectrum: `WaveAnalysis/spectrum/${stem}_sp.csv`,
    };
  }

  async function handleAnalyzeWave(): Promise<void> {
    const targetWavePath = effectiveWaveTargetPath;
    if (!targetWavePath) {
      setNotice(t.messages.selectWave);
      return;
    }
    try {
      const wave = parseWaveCsv(getContent(targetWavePath));
      const result = analyzeWave(wave, [0.05]);
      const paths = analysisPathFromWave(targetWavePath);
      await putFiles([
        { path: paths.avd, content: createAvdCsv(result) },
        {
          path: paths.spectrum,
          content: createSpectrumCsv(
            { period: result.period, rows: result.spectrumRows },
            [0.05],
          ),
        },
      ]);
      await setNoticeAndRefresh(t.messages.waveAnalysisComplete);
      setWaveAnalysisResult(result);
      setExistingAvdPath(paths.avd);
    } catch (error) {
      setNotice(`${t.messages.waveAnalysisError}: ${(error as Error).message}`);
    }
  }

  function handleLoadExistingWaveAnalysis(): void {
    if (!existingAvdPath) {
      setNotice(t.messages.selectWave);
      return;
    }
    try {
      const avd = parseAvdCsv(getContent(existingAvdPath));
      const spectrumPath = existingAvdPath
        .replace("WaveAnalysis/avd/", "WaveAnalysis/spectrum/")
        .replace("_avd.csv", "_sp.csv");
      const spectrum = parseSpectrumCsv(getContent(spectrumPath));
      const maxAbs = (array: number[]) =>
        array.reduce((max, value) => Math.max(max, Math.abs(value)), 0);
      setWaveAnalysisResult({
        time: avd.time,
        acc: avd.acc,
        vel: avd.vel,
        dis: avd.dis,
        period: spectrum.period,
        sa: spectrum.sa,
        spectrumRows: spectrum.period.map((period, index) => [
          period,
          spectrum.sa[index] ?? 0,
        ]),
        amax: maxAbs(avd.acc),
        vmax: maxAbs(avd.vel),
        dmax: maxAbs(avd.dis),
      });
      setNotice(t.messages.existingResultLoaded);
    } catch (error) {
      setNotice(`${t.messages.analysisResultLoadError}: ${(error as Error).message}`);
    }
  }

  async function runSelectedModels(
    selections: ModelSelection[],
    createResult: (selection: ModelSelection, model: ModelData) => ResponseResult | null,
  ): Promise<ResponseResult[]> {
    const selected = selections
      .filter((item) => item.selected)
      .sort((lhs, rhs) => lhs.indexOrder - rhs.indexOrder);
    const results: ResponseResult[] = [];
    for (const selection of selected) {
      const model = parseModelDat(
        getContent(selection.modelPath),
        modelNameFromPath(selection.modelPath),
      );
      const result = createResult(selection, model);
      if (result) {
        results.push(result);
      }
    }
    return results;
  }

  async function handleRunBaseResponse(): Promise<void> {
    const targetWavePath = effectiveBaseWavePath;
    if (!targetWavePath) {
      setNotice(t.messages.selectWave);
      return;
    }
    try {
      const wave = parseWaveCsv(getContent(targetWavePath));
      const waveName = toStem(targetWavePath);
      const results = await runSelectedModels(normalizedBaseSelections, (selection, model) => {
        const name = `${model.name}_${waveName}`;
        return runResponse(name, model, wave, dampingFromSelection(selection));
      });
      setBaseResults(results);
      setBaseActiveResultName(results[0]?.name ?? "");
      setNotice(`${t.messages.baseResponseComplete}: ${results.length} ${t.messages.cases}`);
    } catch (error) {
      setNotice(`${t.messages.baseResponseError}: ${(error as Error).message}`);
    }
  }

  async function saveResponseResults(
    results: ResponseResult[],
    groupName: string,
  ): Promise<void> {
    if (results.length === 0) {
      setNotice(t.messages.noResultsToSave);
      return;
    }
    const normalizedGroup = groupName.trim();
    const payload: { path: string; content: string }[] = [];
    for (const result of results) {
      const csv = serializeResponseCsv(result);
      payload.push({
        path: `Result/his/${result.name}_res.csv`,
        content: csv,
      });
      if (normalizedGroup) {
        payload.push({
          path: `変位Viewデータ/${normalizedGroup}/${result.name}_res.csv`,
          content: csv,
        });
      }
    }
    await putFiles(payload);
    await setNoticeAndRefresh(`${t.messages.resultCsvSaved}: ${results.length} ${t.messages.files}`);
  }

  async function handleRunForceResponse(): Promise<void> {
    try {
      const configuredRows = activeForceRows.filter(
        (row) => row.wavePath && Number.isFinite(row.maxForceKn),
      );
      if (configuredRows.length === 0) {
        setNotice(t.messages.configureForceRows);
        return;
      }

      const loaded = configuredRows.map((row) => ({
        floorIndex: row.floorIndex,
        data: createForceWaveInput(parseWaveCsv(getContent(row.wavePath)), row.maxForceKn),
      }));

      const minLength = loaded.reduce(
        (min, item) => Math.min(min, item.data.length),
        Number.POSITIVE_INFINITY,
      );
      if (!Number.isFinite(minLength) || minLength <= 0) {
        setNotice(t.messages.selectWave);
        return;
      }
      const forceSeries = loaded.map((item) => ({
        floorIndex: item.floorIndex,
        data: item.data.slice(0, minLength),
      }));
      const zeroWave = createZeroWave(minLength);
      const forceLabel = forceName.trim() || "Force";

      const results = await runSelectedModels(normalizedForceSelections, (selection, model) =>
        runResponse(
          `${model.name}_${forceLabel}`,
          model,
          zeroWave,
          dampingFromSelection(selection),
          forceSeries,
        ),
      );
      setForceResults(results);
      setForceActiveResultName(results[0]?.name ?? "");
      setNotice(`${t.messages.forceResponseComplete}: ${results.length} ${t.messages.cases}`);
    } catch (error) {
      setNotice(`${t.messages.forceResponseError}: ${(error as Error).message}`);
    }
  }

  function handleToggleViewCheck(path: string): void {
    setViewChecks((prev) => ({ ...prev, [path]: !prev[path] }));
  }

  function handleLoadViewResults(): void {
    const selectedPaths = Object.entries(viewChecks)
      .filter(([, checked]) => checked)
      .map(([path]) => path);
    if (selectedPaths.length === 0) {
      setNotice(t.messages.selectAtLeastOneCsv);
      return;
    }
    try {
      const loaded = selectedPaths.map((path) =>
        parseResponseCsv(getContent(path), modelNameFromPath(path)),
      );
      setViewResults(loaded);
      setViewActiveResultName(loaded[0]?.name ?? "");
      setNotice(`${t.messages.reloadDisplayComplete}: ${loaded.length} ${t.messages.files}`);
    } catch (error) {
      setNotice(`${t.messages.reloadError}: ${(error as Error).message}`);
    }
  }

  async function handleUploadResultCsv(filesToUpload: FileList | null): Promise<void> {
    if (!filesToUpload || filesToUpload.length === 0) {
      return;
    }
    const payload: { path: string; content: string }[] = [];
    for (const file of Array.from(filesToUpload)) {
      const content = decodeTextAuto(await file.arrayBuffer());
      payload.push({
        path: `変位Viewデータ/${file.name}`,
        content,
      });
    }
    await putFiles(payload);
    await setNoticeAndRefresh(`${t.messages.resultCsvImported}: ${payload.length} ${t.messages.files}`);
  }

  async function handleExportResultCsv(result: ResponseResult | null): Promise<void> {
    if (!result) {
      setNotice(t.messages.selectResultToExport);
      return;
    }
    const blob = new Blob([serializeResponseCsv(result)], {
      type: "text/csv;charset=utf-8",
    });
    triggerDownload(blob, `${result.name}_res.csv`);
  }

  async function handleImportZip(filesToUpload: FileList | null): Promise<void> {
    if (!filesToUpload || filesToUpload.length === 0) {
      return;
    }
    const count = await importWorkspaceZip(filesToUpload[0]);
    await setNoticeAndRefresh(`${t.messages.zipImportComplete}: ${count} ${t.messages.files}`);
  }

  async function handleResetWorkspace(): Promise<void> {
    const accepted = window.confirm(t.messages.resetConfirm);
    if (!accepted) {
      return;
    }
    await clearWorkspace();
    await initializeWorkspace();
    await setNoticeAndRefresh(t.messages.workspaceReset);
    setBaseResults([]);
    setForceResults([]);
    setViewResults([]);
  }

  function renderModelSelectionTable(
    selections: ModelSelection[],
    setSelections: SelectionUpdater,
  ) {
    return (
      <table className="data-table compact">
        <thead>
          <tr>
            <th>{t.table.select}</th>
            <th>{t.table.name}</th>
            <th>{t.table.index}</th>
            <th>{t.table.userDamping}</th>
            <th>{t.table.dampingH}</th>
            <th>{t.table.dampingConstant}</th>
          </tr>
        </thead>
        <tbody>
          {selections.map((selection, row) => (
            <tr key={selection.modelPath}>
              <td>
                <input
                  type="checkbox"
                  checked={selection.selected}
                  onChange={(event) => {
                    const checked = event.target.checked;
                    setSelections((prev) =>
                      prev.map((item, index) =>
                        index === row ? { ...item, selected: checked } : item,
                      ),
                    );
                  }}
                />
              </td>
              <td>{modelNameFromPath(selection.modelPath)}</td>
              <td>
                <input
                  type="number"
                  min={1}
                  value={selection.indexOrder}
                  onChange={(event) => {
                    const value = Number.parseInt(event.target.value, 10);
                    setSelections((prev) =>
                      prev.map((item, index) =>
                        index === row
                          ? { ...item, indexOrder: Number.isFinite(value) ? value : 1 }
                          : item,
                      ),
                    );
                  }}
                />
              </td>
              <td>
                <input
                  type="checkbox"
                  checked={selection.useUserDamping}
                  onChange={(event) => {
                    const checked = event.target.checked;
                    setSelections((prev) =>
                      prev.map((item, index) =>
                        index === row ? { ...item, useUserDamping: checked } : item,
                      ),
                    );
                  }}
                />
              </td>
              <td>
                <input
                  type="number"
                  step="0.001"
                  min={0}
                  value={selection.userDampingH}
                  disabled={!selection.useUserDamping}
                  onChange={(event) => {
                    const value = Number.parseFloat(event.target.value);
                    setSelections((prev) =>
                      prev.map((item, index) =>
                        index === row
                          ? { ...item, userDampingH: Number.isFinite(value) ? value : 0.01 }
                          : item,
                      ),
                    );
                  }}
                />
              </td>
              <td>
                <select
                  value={selection.dampingPercent}
                  disabled={selection.useUserDamping}
                  onChange={(event) => {
                    const value = Number.parseInt(event.target.value, 10);
                    setSelections((prev) =>
                      prev.map((item, index) =>
                        index === row
                          ? { ...item, dampingPercent: Number.isFinite(value) ? value : 0 }
                          : item,
                      ),
                    );
                  }}
                >
                  <option value={0}>f1/150</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
                    <option key={value} value={value}>
                      {value}%
                    </option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  function resultSeriesForPlot(result: ResponseResult | null) {
    if (!result) {
      return { acc: [], dis: [] };
    }
    const x = result.time;
    const top = Math.max(0, result.mainMassCount - 1);
    const acc = [
      { name: "入力波", x, y: result.waveAcc, color: "#2b59c3" },
      {
        name: `主系絶_${top + 2}F`,
        x,
        y: result.mainAcc[top] ?? [],
        color: "#d1495b",
      },
    ];
    const dis = [
      {
        name: `主系相_${top + 2}F`,
        x,
        y: result.mainDis[top] ?? [],
        color: "#00798c",
      },
    ];
    if (showTmdTrace && result.tmdCount > 0) {
      acc.push({
        name: "TMD加速度",
        x,
        y: result.tmdAcc[0] ?? [],
        color: "#f18f01",
      });
      dis.push({
        name: "TMD Dis",
        x,
        y: result.tmdDis[0] ?? [],
        color: "#8e6c88",
      });
    }
    return { acc, dis };
  }

  if (!ready) {
    return <div className="loading">{t.app.loading}</div>;
  }

  // Create menu items with translations
  const menuItems: { key: MenuKey; label: string }[] = [
    { key: "model", label: t.menu.modelEdit },
    { key: "eigen", label: t.menu.eigenMode },
    { key: "sine", label: t.menu.sineWave },
    { key: "wave", label: t.menu.waveAnalysis },
    { key: "base", label: t.menu.baseResponse },
    { key: "view", label: t.menu.resultView },
    { key: "force", label: t.menu.forceResponse },
  ];

  const baseSeries = resultSeriesForPlot(baseActiveResult);
  const forceSeries = resultSeriesForPlot(forceActiveResult);
  const viewSeries = resultSeriesForPlot(viewActiveResult);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <h1>{t.app.title}</h1>
          <p>{t.app.subtitle}</p>
        </div>
        <nav className="menu">
          {menuItems.map((item) => (
            <button
              key={item.key}
              className={activeMenu === item.key ? "menu-item active" : "menu-item"}
              onClick={() => setActiveMenu(item.key)}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <div className="folder-status">
          <h3>{t.folders.title}</h3>
          <ul>
            {requiredFolders().map((folder) => (
              <li key={folder}>
                <span>{folder}</span>
                <strong>{folderFileCount(files, folder)}</strong>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div className="notice">{notice || t.topbar.ready}</div>
          <div className="actions">
            <button onClick={() => setShowHelp(true)}>
              {t.topbar.help}
            </button>
            <label className="file-btn">
              {t.topbar.zipImport}
              <input
                type="file"
                accept=".zip"
                onChange={(event) => {
                  void handleImportZip(event.target.files);
                  event.target.value = "";
                }}
              />
            </label>
            <button onClick={() => void exportWorkspaceZip("tmd-workspace.zip")}>
              {t.topbar.zipExport}
            </button>
            <button className="danger" onClick={() => void handleResetWorkspace()}>
              {t.topbar.reset}
            </button>
            <LanguageToggle language={language} onToggle={toggleLanguage} />
            <ThemeToggle theme={theme} onToggle={toggleTheme} />
          </div>
        </header>

        {activeMenu === "model" && (
          <section className="panel">
            <h2>{t.modelEdit.title}</h2>
            <div className="row">
              <select
                value={selectedModelPath}
                onChange={(event) => setSelectedModelPath(event.target.value)}
              >
                <option value="">{t.modelEdit.selectModel}</option>
                {modelFiles.map((file) => (
                  <option key={file.path} value={file.path}>
                    {fileNameFromPath(file.path)}
                  </option>
                ))}
              </select>
              <button
                onClick={() => {
                  if (selectedModelPath) {
                    void handleLoadModel(selectedModelPath);
                  }
                }}
                disabled={!selectedModelPath}
              >
                {t.modelEdit.load}
              </button>
              <button
                onClick={() => {
                  setModelDraft(createEmptyModel("ModelA"));
                  setSelectedModelPath("");
                }}
              >
                {t.modelEdit.new}
              </button>
              <button onClick={() => void handleSaveModel()}>{t.modelEdit.save}</button>
            </div>
            <div className="grid-two">
              <div>
                <label>
                  {t.modelEdit.modelName}
                  <input
                    value={modelDraft.name}
                    onChange={(event) =>
                      setModelDraft((prev) => ({ ...prev, name: event.target.value }))
                    }
                  />
                </label>
                <label>
                  {t.modelEdit.storyCount}
                  <input
                    type="number"
                    min={1}
                    max={9}
                    value={modelDraft.storyCount}
                    onChange={(event) =>
                      ensureStoryCount(Number.parseInt(event.target.value, 10))
                    }
                  />
                </label>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>{t.modelEdit.floor}</th>
                      <th>{t.modelEdit.weight}</th>
                      <th>{t.modelEdit.stiffness}</th>
                      <th>{t.modelEdit.damping}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: modelDraft.storyCount }, (_, i) => (
                      <tr key={`story-${i}`}>
                        <td>{i + 1}</td>
                        <td>
                          <input
                            type="number"
                            value={modelDraft.weightsKn[i] ?? 0}
                            onChange={(event) =>
                              updateModelArray(
                                "weightsKn",
                                i,
                                Number.parseFloat(event.target.value),
                              )
                            }
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            value={modelDraft.stiffnessKnPerCm[i] ?? 0}
                            onChange={(event) =>
                              updateModelArray(
                                "stiffnessKnPerCm",
                                i,
                                Number.parseFloat(event.target.value),
                              )
                            }
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            value={modelDraft.extraDampingKnPerKine[i] ?? 0}
                            onChange={(event) =>
                              updateModelArray(
                                "extraDampingKnPerKine",
                                i,
                                Number.parseFloat(event.target.value),
                              )
                            }
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div>
                <div className="row">
                  <h3>{t.modelEdit.tmdInfo}</h3>
                  <button
                    onClick={() =>
                      setModelDraft((prev) => ({
                        ...prev,
                        tmdList: [
                          ...prev.tmdList,
                          { floor: prev.storyCount, weightKn: 10, freqHz: 2 },
                        ],
                      }))
                    }
                  >
                    {t.modelEdit.addRow}
                  </button>
                  <button
                    onClick={() =>
                      setModelDraft((prev) => ({
                        ...prev,
                        tmdList: [],
                      }))
                    }
                  >
                    {t.modelEdit.clear}
                  </button>
                </div>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>{t.modelEdit.floor}</th>
                      <th>{t.modelEdit.weight}</th>
                      <th>{t.modelEdit.frequency}</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {modelDraft.tmdList.map((item, index) => (
                      <tr key={`tmd-${index}`}>
                        <td>
                          <input
                            type="number"
                            min={1}
                            max={modelDraft.storyCount}
                            value={item.floor}
                            onChange={(event) => {
                              const floor = Number.parseInt(event.target.value, 10);
                              setModelDraft((prev) => ({
                                ...prev,
                                tmdList: prev.tmdList.map((row, rowIndex) =>
                                  rowIndex === index
                                    ? {
                                        ...row,
                                        floor: Math.min(
                                          prev.storyCount,
                                          Math.max(1, Number.isFinite(floor) ? floor : 1),
                                        ),
                                      }
                                    : row,
                                ),
                              }));
                            }}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            value={item.weightKn}
                            onChange={(event) => {
                              const value = Number.parseFloat(event.target.value);
                              setModelDraft((prev) => ({
                                ...prev,
                                tmdList: prev.tmdList.map((row, rowIndex) =>
                                  rowIndex === index
                                    ? { ...row, weightKn: Number.isFinite(value) ? value : 0 }
                                    : row,
                                ),
                              }));
                            }}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            value={item.freqHz}
                            onChange={(event) => {
                              const value = Number.parseFloat(event.target.value);
                              setModelDraft((prev) => ({
                                ...prev,
                                tmdList: prev.tmdList.map((row, rowIndex) =>
                                  rowIndex === index
                                    ? { ...row, freqHz: Number.isFinite(value) ? value : 0 }
                                    : row,
                                ),
                              }));
                            }}
                          />
                        </td>
                        <td>
                          <button
                            onClick={() =>
                              setModelDraft((prev) => ({
                                ...prev,
                                tmdList: prev.tmdList.filter(
                                  (_, rowIndex) => rowIndex !== index,
                                ),
                              }))
                            }
                          >
                            {t.modelEdit.delete}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <pre className="code-preview">{serializeModelDat(modelDraft)}</pre>
              </div>
            </div>
          </section>
        )}

        {activeMenu === "eigen" && (
          <section className="panel">
            <h2>{t.eigenMode.title}</h2>
            <div className="row">
              <select
                value={eigenModelPath}
                onChange={(event) => setEigenModelPath(event.target.value)}
              >
                <option value="">{t.eigenMode.selectModel}</option>
                {modelFiles.map((file) => (
                  <option key={file.path} value={file.path}>
                    {fileNameFromPath(file.path)}
                  </option>
                ))}
              </select>
              <button onClick={handleComputeEigen}>{t.eigenMode.compute}</button>
            </div>
            {eigenResult && (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{t.eigenMode.order}</th>
                    <th>{t.eigenMode.naturalFreq}</th>
                    <th>{t.eigenMode.effectiveMassRatio}</th>
                    <th>{t.eigenMode.participationFactor}</th>
                  </tr>
                </thead>
                <tbody>
                  {eigenResult.naturalFrequency.map((freq, index) => (
                    <tr key={`mode-${index}`}>
                      <td>{index + 1}</td>
                      <td>{freq.toFixed(4)}</td>
                      <td>{eigenResult.effectiveMassRatio[index].toFixed(4)}</td>
                      <td>{eigenResult.participationFactor[index].toFixed(4)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        )}

        {activeMenu === "sine" && (
          <section className="panel">
            <h2>{t.sineWave.title}</h2>
            <div className="grid-two">
              <div>
                <label>
                  {t.sineWave.frequency}
                  <input
                    type="number"
                    min={0.01}
                    step={0.01}
                    value={sineInput.freqHz}
                    onChange={(event) =>
                      setSineInput((prev) => ({
                        ...prev,
                        freqHz: Number.parseFloat(event.target.value),
                      }))
                    }
                  />
                </label>
                <label>
                  {t.sineWave.preCycles}
                  <input
                    type="number"
                    min={0}
                    value={sineInput.preCycles}
                    onChange={(event) =>
                      setSineInput((prev) => ({
                        ...prev,
                        preCycles: Number.parseInt(event.target.value, 10),
                      }))
                    }
                  />
                </label>
                <label>
                  {t.sineWave.harmonicCycles}
                  <input
                    type="number"
                    min={1}
                    value={sineInput.harmonicCycles}
                    onChange={(event) =>
                      setSineInput((prev) => ({
                        ...prev,
                        harmonicCycles: Number.parseInt(event.target.value, 10),
                      }))
                    }
                  />
                </label>
                <label>
                  {t.sineWave.postCycles}
                  <input
                    type="number"
                    min={0}
                    value={sineInput.postCycles}
                    onChange={(event) =>
                      setSineInput((prev) => ({
                        ...prev,
                        postCycles: Number.parseInt(event.target.value, 10),
                      }))
                    }
                  />
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={sineInput.addAfterObservation}
                    onChange={(event) =>
                      setSineInput((prev) => ({
                        ...prev,
                        addAfterObservation: event.target.checked,
                      }))
                    }
                  />
                  {t.sineWave.addObservation}

                </label>
                <div className="row">
                  <button onClick={handleGenerateSine}>{t.sineWave.generate}</button>
                  <input
                    value={sineFileName}
                    onChange={(event) => setSineFileName(event.target.value)}
                  />
                  <button onClick={() => void handleSaveSine()}>{t.sineWave.saveToForceWave}</button>
                </div>
              </div>
              <div>
                <LineChart
                  title={t.sineWave.amplitude}
                  xLabel={t.sineWave.time}
                  yLabel={t.sineWave.amplitude}
                  series={[
                    {
                      name: "sin",
                      x: sineWave.map((_, i) => i * 0.01),
                      y: sineWave,
                      color: "#d1495b",
                    },
                  ]}
                  height={360}
                />
              </div>
            </div>
          </section>
        )}

        {activeMenu === "wave" && (
          <section className="panel">
            <h2>{t.waveAnalysis.title}</h2>
            <div className="row">
              <select
                value={effectiveWaveTargetPath}
                onChange={(event) => setWaveTargetPath(event.target.value)}
              >
                <option value="">{t.waveAnalysis.selectWave}</option>
                {waveFiles.map((file) => (
                  <option key={file.path} value={file.path}>
                    {file.path}
                  </option>
                ))}
                {forceWaveFiles.map((file) => (
                  <option key={file.path} value={file.path}>
                    {file.path}
                  </option>
                ))}
              </select>
              <button onClick={() => void handleAnalyzeWave()}>{t.waveAnalysis.runAnalysis}</button>
            </div>
            <div className="row">
              <select
                value={existingAvdPath}
                onChange={(event) => setExistingAvdPath(event.target.value)}
              >
                <option value="">{t.waveAnalysis.selectExistingAvd}</option>
                {avdFiles.map((file) => (
                  <option key={file.path} value={file.path}>
                    {file.path}
                  </option>
                ))}
              </select>
              <button onClick={handleLoadExistingWaveAnalysis}>{t.waveAnalysis.loadExisting}</button>
            </div>
            {waveAnalysisResult && (
              <>
                <div className="summary-grid">
                  <div>{t.waveAnalysis.amax}: {waveAnalysisResult.amax.toFixed(3)} gal</div>
                  <div>{t.waveAnalysis.vmax}: {waveAnalysisResult.vmax.toFixed(3)} kine</div>
                  <div>{t.waveAnalysis.dmax}: {waveAnalysisResult.dmax.toFixed(3)} cm</div>
                  <div>{t.waveAnalysis.duration}: {(waveAnalysisResult.time.length * 0.01).toFixed(2)} s</div>
                </div>
                <div className="grid-two">
                  <LineChart
                    title={t.waveAnalysis.acceleration}
                    xLabel="Time [s]"
                    yLabel="A [gal]"
                    series={[
                      {
                        name: "A",
                        x: waveAnalysisResult.time,
                        y: waveAnalysisResult.acc,
                        color: "#d1495b",
                      },
                    ]}
                  />
                  <LineChart
                    title={t.waveAnalysis.velocity}
                    xLabel="Time [s]"
                    yLabel="V [kine]"
                    series={[
                      {
                        name: "V",
                        x: waveAnalysisResult.time,
                        y: waveAnalysisResult.vel,
                        color: "#00798c",
                      },
                    ]}
                  />
                </div>
                <div className="grid-two">
                  <LineChart
                    title={t.waveAnalysis.displacement}
                    xLabel="Time [s]"
                    yLabel="D [cm]"
                    series={[
                      {
                        name: "D",
                        x: waveAnalysisResult.time,
                        y: waveAnalysisResult.dis,
                        color: "#2b59c3",
                      },
                    ]}
                  />
                  <LineChart
                    title={t.waveAnalysis.spectrum}
                    xLabel="Period [s]"
                    yLabel="Sa"
                    series={[
                      {
                        name: "Sa(h=0.05)",
                        x: waveAnalysisResult.period,
                        y: waveAnalysisResult.sa,
                        color: "#f18f01",
                      },
                    ]}
                  />
                </div>
              </>
            )}
            <p className="note">
              {t.waveAnalysis.note}
            </p>
          </section>
        )}

        {activeMenu === "base" && (
          <section className="panel">
            <h2>{t.baseResponse.title}</h2>
            <div className="row">
              <select
                value={effectiveBaseWavePath}
                onChange={(event) => setBaseWavePath(event.target.value)}
              >
                <option value="">{t.baseResponse.selectWave}</option>
                {waveFiles.map((file) => (
                  <option key={file.path} value={file.path}>
                    {file.path}
                  </option>
                ))}
              </select>
              <button onClick={() => void handleRunBaseResponse()}>{t.baseResponse.runResponse}</button>
              <input
                value={baseViewGroupName}
                onChange={(event) => setBaseViewGroupName(event.target.value)}
              />
              <button onClick={() => void saveResponseResults(baseResults, baseViewGroupName)}>
                {t.baseResponse.saveResults}
              </button>
            </div>
            {renderModelSelectionTable(normalizedBaseSelections, updateBaseSelections)}
            <div className="row">
              <label>
                <input
                  type="checkbox"
                  checked={showTmdTrace}
                  onChange={(event) => setShowTmdTrace(event.target.checked)}
                />
                {t.baseResponse.showTmd}
              </label>
              <select
                value={baseActiveResultName}
                onChange={(event) => setBaseActiveResultName(event.target.value)}
              >
                <option value="">{t.baseResponse.selectResult}</option>
                {baseResults.map((result) => (
                  <option key={result.name} value={result.name}>
                    {result.name}
                  </option>
                ))}
              </select>
              <button onClick={() => void handleExportResultCsv(baseActiveResult)}>
                {t.baseResponse.downloadResult}
              </button>
            </div>
            {baseResults.length > 0 && (
              <table className="data-table compact">
                <thead>
                  <tr>
                    <th>{t.baseResponse.analysisName}</th>
                    <th>{t.baseResponse.mainAmax}</th>
                    <th>{t.baseResponse.mainDmax}</th>
                    <th>{t.baseResponse.tmdAmax}</th>
                    <th>{t.baseResponse.tmdDmax}</th>
                  </tr>
                </thead>
                <tbody>
                  {baseResults.map((result) => {
                    const max = getResultMaxValues(result);
                    return (
                      <tr key={result.name}>
                        <td>{result.name}</td>
                        <td>{max.maxMainAcc.toFixed(3)}</td>
                        <td>{max.maxMainDis.toFixed(3)}</td>
                        <td>{max.maxTmdAcc.toFixed(3)}</td>
                        <td>{max.maxTmdDis.toFixed(3)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
            <div className="grid-two">
              <LineChart
                title={t.baseResponse.absoluteAcceleration}
                xLabel="Time [s]"
                yLabel="gal"
                series={baseSeries.acc}
              />
              <LineChart
                title={t.baseResponse.responseDisplacement}
                xLabel="Time [s]"
                yLabel="cm"
                series={baseSeries.dis}
              />
            </div>
          </section>
        )}

        {activeMenu === "view" && (
          <section className="panel">
            <h2>{t.resultView.title}</h2>
            <div className="row">
              <button onClick={handleLoadViewResults}>{t.resultView.showSelected}</button>
              <select
                value={viewActiveResultName}
                onChange={(event) => setViewActiveResultName(event.target.value)}
              >
                <option value="">{t.resultView.selectViewTarget}</option>
                {viewResults.map((result) => (
                  <option key={result.name} value={result.name}>
                    {result.name}
                  </option>
                ))}
              </select>
              <button onClick={() => void handleExportResultCsv(viewActiveResult)}>
                {t.resultView.downloadResult}
              </button>
              <label className="file-btn">
                {t.resultView.addCsv}
                <input
                  type="file"
                  accept=".csv"
                  multiple
                  onChange={(event) => {
                    void handleUploadResultCsv(event.target.files);
                    event.target.value = "";
                  }}
                />
              </label>
            </div>
            <table className="data-table compact">
              <thead>
                <tr>
                  <th>{t.resultView.display}</th>
                  <th>{t.resultView.csvPath}</th>
                </tr>
              </thead>
              <tbody>
                {viewCandidateFiles.map((file) => (
                  <tr key={file.path}>
                    <td>
                      <input
                        type="checkbox"
                        checked={viewChecks[file.path] ?? false}
                        onChange={() => handleToggleViewCheck(file.path)}
                      />
                    </td>
                    <td>{file.path}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="grid-two">
              <LineChart
                title={t.resultView.reloadAcceleration}
                xLabel="Time [s]"
                yLabel="gal"
                series={viewSeries.acc}
              />
              <LineChart
                title={t.resultView.viewDisplacement}
                xLabel="Time [s]"
                yLabel="cm"
                series={viewSeries.dis}
              />
            </div>
          </section>
        )}

        {activeMenu === "force" && (
          <section className="panel">
            <h2>{t.forceResponse.title}</h2>
            <div className="row">
              <input
                value={forceName}
                onChange={(event) => setForceName(event.target.value)}
                placeholder={t.forceResponse.forceName}
              />
              <button
                onClick={() =>
                  updateForceRows((prev) => [
                    ...prev,
                    {
                      id: Date.now() + Math.floor(Math.random() * 1000),
                      wavePath: forceWaveFiles[0]?.path ?? "",
                      floorIndex: 0,
                      maxForceKn: 10,
                    },
                  ])
                }
              >
                {t.forceResponse.addForce}
              </button>
              <button onClick={() => void handleRunForceResponse()}>{t.forceResponse.runResponse}</button>
              <button onClick={() => void saveResponseResults(forceResults, baseViewGroupName)}>
                {t.forceResponse.saveResults}
              </button>
            </div>
            <table className="data-table compact">
              <thead>
                <tr>
                  <th>{t.forceResponse.applyWave}</th>
                  <th>{t.forceResponse.floor}</th>
                  <th>{t.forceResponse.maxForce}</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {activeForceRows.map((row, index) => (
                  <tr key={row.id}>
                    <td>
                      <select
                        value={row.wavePath}
                        onChange={(event) =>
                          updateForceRows((prev) =>
                            prev.map((item, rowIndex) =>
                              rowIndex === index
                                ? { ...item, wavePath: event.target.value }
                                : item,
                            ),
                          )
                        }
                      >
                        <option value="">{t.forceResponse.selectForceWave}</option>
                        {forceWaveFiles.map((file) => (
                          <option key={file.path} value={file.path}>
                            {file.path}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <select
                        value={row.floorIndex}
                        onChange={(event) =>
                          updateForceRows((prev) =>
                            prev.map((item, rowIndex) =>
                              rowIndex === index
                                ? {
                                    ...item,
                                    floorIndex: Number.parseInt(event.target.value, 10),
                                  }
                                : item,
                            ),
                          )
                        }
                      >
                        {Array.from({ length: 9 }, (_, i) => i).map((value) => (
                          <option key={value} value={value}>
                            {value + 2}F
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input
                        type="number"
                        value={row.maxForceKn}
                        onChange={(event) =>
                          updateForceRows((prev) =>
                            prev.map((item, rowIndex) =>
                              rowIndex === index
                                ? {
                                    ...item,
                                    maxForceKn: Number.parseFloat(event.target.value),
                                  }
                                : item,
                            ),
                          )
                        }
                      />
                    </td>
                    <td>
                      <button
                        onClick={() =>
                          updateForceRows((prev) =>
                            prev.filter((_, rowIndex) => rowIndex !== index),
                          )
                        }
                      >
                        {t.forceResponse.delete}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {renderModelSelectionTable(normalizedForceSelections, updateForceSelections)}
            <div className="row">
              <select
                value={forceActiveResultName}
                onChange={(event) => setForceActiveResultName(event.target.value)}
              >
                <option value="">{t.forceResponse.selectResult}</option>
                {forceResults.map((result) => (
                  <option key={result.name} value={result.name}>
                    {result.name}
                  </option>
                ))}
              </select>
              <button onClick={() => void handleExportResultCsv(forceActiveResult)}>
                {t.forceResponse.downloadResult}
              </button>
            </div>
            <div className="grid-two">
              <LineChart
                title={t.forceResponse.forceAcceleration}
                xLabel="Time [s]"
                yLabel="gal"
                series={forceSeries.acc}
              />
              <LineChart
                title={t.forceResponse.forceDisplacement}
                xLabel="Time [s]"
                yLabel="cm"
                series={forceSeries.dis}
              />
            </div>
          </section>
        )}

        <footer className="footer-note">
          {t.footer.license}
        </footer>
      </main>

      <HelpManual isOpen={showHelp} onClose={() => setShowHelp(false)} translations={t} />
      <Favicon theme={theme} />
    </div>
  );
}

export default App;

