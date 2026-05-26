import { useEffect, useMemo, useState } from 'react';
import {
  fetchDebugConfig,
  updateDebugConfig,
  type DebugConfig,
} from '../api/debugConfigApi';

const PRESET_MULTIPLIERS = [1, 10, 20, 100];

type MultiplierKind = 'xp' | 'copper';

function parseMultiplier(value: string) {
  return Number(value);
}

export function DebugConfigPage() {
  const [config, setConfig] = useState<DebugConfig | null>(null);
  const [xpMultiplierInput, setXpMultiplierInput] = useState('1');
  const [copperMultiplierInput, setCopperMultiplierInput] = useState('1');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const parsedXpMultiplier = useMemo(() => parseMultiplier(xpMultiplierInput), [xpMultiplierInput]);
  const parsedCopperMultiplier = useMemo(() => parseMultiplier(copperMultiplierInput), [copperMultiplierInput]);
  const canSubmit =
    Number.isFinite(parsedXpMultiplier) &&
    parsedXpMultiplier > 0 &&
    Number.isFinite(parsedCopperMultiplier) &&
    parsedCopperMultiplier > 0 &&
    !submitting;

  useEffect(() => {
    let alive = true;

    async function loadConfig() {
      setLoading(true);
      setErrorMessage(null);

      try {
        const nextConfig = await fetchDebugConfig();
        if (!alive) {
          return;
        }

        setConfig(nextConfig);
        setXpMultiplierInput(String(nextConfig.debugTavernXpMultiplier));
        setCopperMultiplierInput(String(nextConfig.debugTavernCopperMultiplier));
      } catch (error) {
        if (!alive) {
          return;
        }

        setErrorMessage(error instanceof Error ? error.message : '读取 Debug 配置失败。');
      } finally {
        if (alive) {
          setLoading(false);
        }
      }
    }

    void loadConfig();

    return () => {
      alive = false;
    };
  }, []);

  const handlePresetClick = (kind: MultiplierKind, multiplier: number) => {
    if (kind === 'xp') {
      setXpMultiplierInput(String(multiplier));
      return;
    }

    setCopperMultiplierInput(String(multiplier));
  };

  const handleSubmit = async () => {
    if (!canSubmit) {
      setErrorMessage('请输入大于 0 的有效倍率。');
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const nextConfig = await updateDebugConfig({
        debugTavernXpMultiplier: parsedXpMultiplier,
        debugTavernCopperMultiplier: parsedCopperMultiplier,
      });
      setConfig(nextConfig);
      setXpMultiplierInput(String(nextConfig.debugTavernXpMultiplier));
      setCopperMultiplierInput(String(nextConfig.debugTavernCopperMultiplier));
      setSuccessMessage('倍率修改成功，在游戏内等待差房案牌刷新后（或主动触发刷新后）新差事才会生效对应倍率。');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '修改 Debug 配置失败。');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="debug-page">
      <section className="debug-panel" aria-labelledby="debug-config-title">
        <div className="debug-panel__eyebrow">Debug Config</div>
        <h1 id="debug-config-title" className="debug-panel__title">
          差房差事倍率
        </h1>

        <div className="debug-panel__status-grid">
          <div className="debug-panel__status">
            <span>当前经验倍率</span>
            <strong>{loading ? '读取中...' : `${config?.debugTavernXpMultiplier ?? '-'}x`}</strong>
          </div>
          <div className="debug-panel__status">
            <span>当前铜钱倍率</span>
            <strong>{loading ? '读取中...' : `${config?.debugTavernCopperMultiplier ?? '-'}x`}</strong>
          </div>
        </div>

        <div className="debug-panel__multiplier-group">
          <div className="debug-panel__group-title">经验倍率</div>
          <div className="debug-panel__presets" aria-label="经验倍率预设">
            {PRESET_MULTIPLIERS.map((multiplier) => (
              <button
                key={`xp-${multiplier}`}
                className="debug-panel__preset"
                type="button"
                onClick={() => handlePresetClick('xp', multiplier)}
              >
                {multiplier}倍
              </button>
            ))}
          </div>
          <label className="debug-panel__field">
            <span>目标经验倍率</span>
            <input
              min="0.01"
              step="0.01"
              type="number"
              value={xpMultiplierInput}
              onChange={(event) => setXpMultiplierInput(event.target.value)}
            />
          </label>
        </div>

        <div className="debug-panel__multiplier-group">
          <div className="debug-panel__group-title">铜钱倍率</div>
          <div className="debug-panel__presets" aria-label="铜钱倍率预设">
            {PRESET_MULTIPLIERS.map((multiplier) => (
              <button
                key={`copper-${multiplier}`}
                className="debug-panel__preset"
                type="button"
                onClick={() => handlePresetClick('copper', multiplier)}
              >
                {multiplier}倍
              </button>
            ))}
          </div>
          <label className="debug-panel__field">
            <span>目标铜钱倍率</span>
            <input
              min="0.01"
              step="0.01"
              type="number"
              value={copperMultiplierInput}
              onChange={(event) => setCopperMultiplierInput(event.target.value)}
            />
          </label>
        </div>

        <button
          className="debug-panel__submit"
          type="button"
          disabled={!canSubmit || loading}
          onClick={handleSubmit}
        >
          {submitting ? '提交中...' : '保存倍率'}
        </button>

        {errorMessage ? <div className="debug-panel__message debug-panel__message--error">{errorMessage}</div> : null}
        {successMessage ? <div className="debug-panel__message debug-panel__message--success">{successMessage}</div> : null}
      </section>
    </main>
  );
}
