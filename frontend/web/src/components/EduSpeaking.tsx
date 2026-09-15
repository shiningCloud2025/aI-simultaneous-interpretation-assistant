import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, PageBanner, Select } from './ui';
import { apiCall, uploadFile } from '../lib/api';
import { LlmModelPreference } from './LlmModelPreference';

const LANGUAGES = [
  { code: 'english', desc: '英语' },
  { code: 'japanese', desc: '日语' },
  { code: 'korean', desc: '韩语' },
];

const STAGES = [
  { code: 'en_primary', desc: '小学英语', language: 'english' },
  { code: 'en_junior', desc: '初中英语', language: 'english' },
  { code: 'en_senior', desc: '高中英语', language: 'english' },
  { code: 'en_cet4', desc: '大学英语四级', language: 'english' },
  { code: 'en_cet6', desc: '大学英语六级', language: 'english' },
  { code: 'en_postgraduate', desc: '考研英语', language: 'english' },
  { code: 'en_ielts', desc: '雅思', language: 'english' },
  { code: 'en_toefl', desc: '托福', language: 'english' },
];

const DIFFICULTIES = [
  { code: 'easy', desc: '简单' },
  { code: 'medium', desc: '中等' },
  { code: 'hard', desc: '困难' },
];

const SCENES = [
  { code: 'campus', desc: '校园生活' },
  { code: 'daily', desc: '日常交流' },
  { code: 'travel', desc: '旅行出行' },
  { code: 'shopping', desc: '购物消费' },
  { code: 'restaurant', desc: '餐厅点餐' },
  { code: 'interview', desc: '面试表达' },
  { code: 'presentation', desc: '课堂展示' },
  { code: 'culture', desc: '文化交流' },
  { code: 'social', desc: '社会话题' },
  { code: 'custom', desc: '自定义' },
];

const SPEAKING_EVALUATION_SAMPLE_RATE = 16000;

interface PageResult<T> {
  records: T[];
  total: number;
  pages: number;
  current: number;
  size: number;
}

interface SpeakingSentence {
  sentenceId: number;
  sortOrder?: number;
  sentence: string;
  translation?: string;
  standardAudioUrl?: string;
  keyPoints?: string[];
  practiceTips?: string[];
  latestEvaluation?: SpeakingLatestEvaluation;
}

interface SpeakingMaterial {
  id: number;
  title: string;
  sceneDescription?: string;
  sentences: SpeakingSentence[];
}

interface SpeakingRecord {
  id: number;
  success?: boolean;
  languageCode: string;
  stageCode: string;
  difficultyCode: string;
  sceneCode: string;
  customScene?: string;
  userPrompt?: string;
  title?: string;
  sceneDescription?: string;
  provider?: string;
  modelName?: string;
  ttsProvider?: string;
  ttsModelName?: string;
  ttsVoice?: string;
  ttsSpeechRate?: number;
  failureStage?: string;
  errorMessage?: string;
  createTime?: string;
}

interface SpeakingPracticeDetail {
  materialId: number;
  title: string;
  sceneDescription?: string;
  languageCode: string;
  stageCode: string;
  difficultyCode: string;
  sceneCode: string;
  sentences: SpeakingSentence[];
}

interface SpeakingLatestEvaluation {
  recordId?: number;
  studentAudioUrl?: string;
  recognizedText?: string;
  suggestedScore?: number;
  pronAccuracy?: number;
  pronFluency?: number;
  pronCompletion?: number;
  words?: SpeakingWordEvaluation[];
  createTime?: string;
}

interface SpeakingEvaluationResult extends SpeakingLatestEvaluation {
  voiceId?: string;
  sentenceId: number;
  refText?: string;
  rawResponse?: string;
}

interface SpeakingWordEvaluation {
  referenceWord?: string;
  word?: string;
  pronAccuracy?: number;
  pronFluency?: number;
  beginTime?: number;
  endTime?: number;
}

interface SysFileUploadResult {
  id: number;
  url: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  fileType: string;
}

export function EduSpeakingGenerate() {
  const [language, setLanguage] = useState(LANGUAGES[0].code);
  const [stage, setStage] = useState(STAGES[2].code);
  const [difficulty, setDifficulty] = useState(DIFFICULTIES[1].code);
  const [scene, setScene] = useState(SCENES[0].code);
  const [customScene, setCustomScene] = useState('');
  const [userPrompt, setUserPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [material, setMaterial] = useState<SpeakingMaterial | null>(null);
  const [historySuccess, setHistorySuccess] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyUseCurrentFilter, setHistoryUseCurrentFilter] = useState(false);
  const [history, setHistory] = useState<SpeakingRecord[]>([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyPages, setHistoryPages] = useState(0);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [readonlyDetail, setReadonlyDetail] = useState<SpeakingPracticeDetail | null>(null);
  const [readonlyLoadingId, setReadonlyLoadingId] = useState<number | null>(null);
  const [toast, setToast] = useState('');

  const currentStages = useMemo(() => STAGES.filter(s => s.language === language), [language]);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(''), 2200);
  };

  const changeLanguage = (nextLanguage: string) => {
    setLanguage(nextLanguage);
    const firstStage = STAGES.find(s => s.language === nextLanguage);
    setStage(firstStage?.code || '');
  };

  useEffect(() => {
    loadHistory(1, historySuccess);
  }, [historySuccess, historyUseCurrentFilter, language, stage, difficulty, scene]);

  const loadHistory = async (page = historyPage, success = historySuccess, useCurrentFilter = historyUseCurrentFilter) => {
    setHistoryLoading(true);
    try {
      const filter: Record<string, unknown> = { success };
      if (useCurrentFilter) {
        filter.languageCode = language || undefined;
        filter.stageCode = stage || undefined;
        filter.difficultyCode = difficulty || undefined;
        filter.sceneCode = scene || undefined;
      }
      const data = await apiCall<PageResult<SpeakingRecord>>('/speaking/material/history/page', {
        method: 'POST',
        body: JSON.stringify({ page, size: 5, filter }),
      });
      setHistory(data.records || []);
      setHistoryPage(data.current || page);
      setHistoryPages(data.pages || 0);
      setHistoryTotal(data.total || 0);
    } catch (e: any) {
      setHistory([]);
      setHistoryPages(0);
      setHistoryTotal(0);
      showToast(e?.message || '口语素材历史加载失败');
    } finally {
      setHistoryLoading(false);
    }
  };

  const changeHistorySuccess = (success: boolean) => {
    setHistorySuccess(success);
    loadHistory(1, success, historyUseCurrentFilter);
  };

  const changeHistoryFilter = (checked: boolean) => {
    setHistoryUseCurrentFilter(checked);
    loadHistory(1, historySuccess, checked);
  };

  const handleGenerate = async () => {
    if (!stage || !difficulty || !scene) {
      showToast('请选择完整的生成口语素材条件');
      return;
    }
    setLoading(true);
    setMaterial(null);
    try {
      const data = await apiCall<SpeakingMaterial>('/speaking/material/generate', {
        method: 'POST',
        body: JSON.stringify({
          languageCode: language,
          stageCode: stage,
          difficultyCode: difficulty,
          sceneCode: scene,
          customScene: scene === 'custom' ? customScene.trim() || undefined : undefined,
          userPrompt: userPrompt.trim() || undefined,
        }),
      });
      setMaterial(data);
      loadHistory(1, true);
      showToast('生成口语素材成功');
    } catch (e: any) {
      showToast(e?.message || '生成口语素材失败');
      loadHistory(1, false);
    } finally {
      setLoading(false);
    }
  };

  const openReadonlyDetail = async (materialId: number) => {
    setReadonlyLoadingId(materialId);
    try {
      const data = await apiCall<SpeakingPracticeDetail>(`/speaking/material/${materialId}/practice-detail`);
      setReadonlyDetail(data);
    } catch (e: any) {
      showToast(e?.message || '素材详情加载失败');
    } finally {
      setReadonlyLoadingId(null);
    }
  };

  return (
    <>
      <PageBanner icon="🎙️" title="生成口语素材" desc="选择学段、难度与场景，一键生成跟读句子、译文、标准音频和练习建议" />

      <Card title="素材生成">
        <LlmModelPreference label="生成口语素材模型" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, alignItems: 'end' }}>
          <Field label="语言">
            <Select options={LANGUAGES.map(s => s.desc)} value={labelOf(LANGUAGES, language)} onChange={d => changeLanguage(codeOf(LANGUAGES, d))} />
          </Field>
          <Field label="学习阶段">
            <Select options={currentStages.map(s => s.desc)} value={labelOf(STAGES, stage)} onChange={d => setStage(codeOf(STAGES, d))} />
          </Field>
          <Field label="难度">
            <Select options={DIFFICULTIES.map(s => s.desc)} value={labelOf(DIFFICULTIES, difficulty)} onChange={d => setDifficulty(codeOf(DIFFICULTIES, d))} />
          </Field>
          <Field label="练习场景">
            <Select options={SCENES.map(s => s.desc)} value={labelOf(SCENES, scene)} onChange={d => setScene(codeOf(SCENES, d))} />
          </Field>
          {scene === 'custom' && (
            <Field label="自定义场景">
              <input
                value={customScene}
                onChange={e => setCustomScene(e.target.value)}
                placeholder="例如：机场转机时询问登机口变更"
                style={inputStyle}
              />
            </Field>
          )}
        </div>
        <div style={{ marginTop: 14 }}>
          <Field label="偏好说明">
            <textarea
              value={userPrompt}
              onChange={e => setUserPrompt(e.target.value)}
              placeholder="例如：更偏商务面试场景，句子短一些，适合课堂跟读"
              rows={3}
              style={textareaStyle}
            />
          </Field>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 14 }}>
          <button onClick={handleGenerate} disabled={loading || !stage} style={{ ...primaryBtn, opacity: loading || !stage ? .6 : 1 }}>
            {loading ? '生成中...' : '生成口语素材'}
          </button>
        </div>
      </Card>

      {material && (
        <Card title="生成结果">
          <MaterialDetail material={material} />
        </Card>
      )}

      <Card title="生成历史">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => changeHistorySuccess(true)} style={tabBtn(historySuccess)}>成功记录</button>
            <button onClick={() => changeHistorySuccess(false)} style={tabBtn(!historySuccess)}>失败记录</button>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#888', cursor: 'pointer' }}>
              <input type="checkbox" checked={historyUseCurrentFilter} onChange={e => changeHistoryFilter(e.target.checked)} />
              按当前条件筛选
            </label>
          </div>
          <button onClick={() => loadHistory(1, historySuccess)} disabled={historyLoading} style={ghostBtn}>{historyLoading ? '刷新中...' : '刷新'}</button>
        </div>

        {history.length === 0 ? (
          <div style={{ fontSize: 13, color: '#aaa', textAlign: 'center', padding: 24 }}>{historyLoading ? '加载中...' : '暂无生成历史'}</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {history.map(item => (
              <div key={item.id} style={listItemStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#333' }}>{item.success === false ? '生成失败' : item.title || '未命名口语素材'}</div>
                    <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                      {labelOf(LANGUAGES, item.languageCode)} · {labelOf(STAGES, item.stageCode)} · {labelOf(DIFFICULTIES, item.difficultyCode)} · {displayScene(item.sceneCode, item.customScene)}
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: '#bbb', whiteSpace: 'nowrap' }}>{formatTime(item.createTime)}</div>
                </div>
                {item.success === false ? (
                  <div style={{ fontSize: 13, color: '#c62828', lineHeight: 1.6, marginTop: 8 }}>{item.errorMessage || item.failureStage || '生成失败'}</div>
                ) : (
                  <>
                    {item.sceneDescription && <div style={{ fontSize: 13, color: '#555', lineHeight: 1.7, marginTop: 8, whiteSpace: 'pre-wrap' }}>{item.sceneDescription}</div>}
                    {item.userPrompt && <div style={{ fontSize: 12, color: '#888', marginTop: 8 }}>偏好：{item.userPrompt}</div>}
                    <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                      <button onClick={() => openReadonlyDetail(item.id)} disabled={readonlyLoadingId === item.id} style={ghostBtn}>
                        {readonlyLoadingId === item.id ? '加载中...' : '查看素材'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        <PaginationBar
          current={historyPage}
          pages={historyPages}
          total={historyTotal}
          loading={historyLoading}
          onChange={nextPage => loadHistory(nextPage, historySuccess)}
        />
      </Card>

      {readonlyDetail && (
        <ReadonlyPracticeDetailModal detail={readonlyDetail} onClose={() => setReadonlyDetail(null)} />
      )}

      {toast && (
        <div style={{ position: 'fixed', top: 24, left: '50%', transform: 'translateX(-50%)', padding: '10px 24px', background: '#2c2c2c', color: '#fff', borderRadius: 10, fontSize: 13, zIndex: 1100 }}>{toast}</div>
      )}
    </>
  );
}

export function EduSpeakingPractice() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [language, setLanguage] = useState(LANGUAGES[0].code);
  const [stage, setStage] = useState(STAGES[2].code);
  const [difficulty, setDifficulty] = useState(DIFFICULTIES[1].code);
  const [scene, setScene] = useState(SCENES[0].code);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyUseCurrentFilter, setHistoryUseCurrentFilter] = useState(false);
  const [history, setHistory] = useState<SpeakingRecord[]>([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyPages, setHistoryPages] = useState(0);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [detail, setDetail] = useState<SpeakingPracticeDetail | null>(null);
  const [detailLoadingId, setDetailLoadingId] = useState<number | null>(null);
  const [autoOpenedMaterialId, setAutoOpenedMaterialId] = useState<number | null>(null);
  const [toast, setToast] = useState('');

  const currentStages = useMemo(() => STAGES.filter(s => s.language === language), [language]);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(''), 2200);
  };

  const changeLanguage = (nextLanguage: string) => {
    setLanguage(nextLanguage);
    const firstStage = STAGES.find(s => s.language === nextLanguage);
    setStage(firstStage?.code || '');
  };

  useEffect(() => {
    loadHistory(1);
  }, [historyUseCurrentFilter, language, stage, difficulty, scene]);

  useEffect(() => {
    const materialId = Number(searchParams.get('materialId'));
    if (!materialId || materialId === autoOpenedMaterialId) {
      return;
    }
    setAutoOpenedMaterialId(materialId);
    openPracticeDetailById(materialId);
  }, [searchParams, autoOpenedMaterialId]);

  const loadHistory = async (page = historyPage, useCurrentFilter = historyUseCurrentFilter) => {
    setHistoryLoading(true);
    try {
      const filter: Record<string, unknown> = {};
      if (useCurrentFilter) {
        filter.languageCode = language || undefined;
        filter.stageCode = stage || undefined;
        filter.difficultyCode = difficulty || undefined;
        filter.sceneCode = scene || undefined;
      }
      const data = await apiCall<PageResult<SpeakingRecord>>('/speaking/material/history/page', {
        method: 'POST',
        body: JSON.stringify({ page, size: 5, filter }),
      });
      setHistory(data.records || []);
      setHistoryPage(data.current || page);
      setHistoryPages(data.pages || 0);
      setHistoryTotal(data.total || 0);
    } catch (e: any) {
      setHistory([]);
      setHistoryPages(0);
      setHistoryTotal(0);
      showToast(e?.message || '口语素材历史加载失败');
    } finally {
      setHistoryLoading(false);
    }
  };

  const changeHistoryFilter = (checked: boolean) => {
    setHistoryUseCurrentFilter(checked);
    loadHistory(1, checked);
  };

  const openPracticeDetail = async (record: SpeakingRecord) => {
    openPracticeDetailById(record.id);
  };

  const openPracticeDetailById = async (materialId: number) => {
    setDetailLoadingId(materialId);
    try {
      const data = await apiCall<SpeakingPracticeDetail>(`/speaking/material/${materialId}/practice-detail`);
      setDetail(data);
    } catch (e: any) {
      showToast(e?.message || '练习详情加载失败');
    } finally {
      setDetailLoadingId(null);
    }
  };

  const closePracticeDetail = () => {
    setDetail(null);
    setSearchParams({ panel: 'speaking-practice' });
  };

  return (
    <>
      <PageBanner icon="🗣️" title="口语练习" desc="从已生成的口语素材中选择练习，查看句子回显、标准音频和最新评测记录" />

      <Card title="练习筛选">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, alignItems: 'end' }}>
          <Field label="语言">
            <Select options={LANGUAGES.map(s => s.desc)} value={labelOf(LANGUAGES, language)} onChange={d => changeLanguage(codeOf(LANGUAGES, d))} />
          </Field>
          <Field label="学习阶段">
            <Select options={currentStages.map(s => s.desc)} value={labelOf(STAGES, stage)} onChange={d => setStage(codeOf(STAGES, d))} />
          </Field>
          <Field label="难度">
            <Select options={DIFFICULTIES.map(s => s.desc)} value={labelOf(DIFFICULTIES, difficulty)} onChange={d => setDifficulty(codeOf(DIFFICULTIES, d))} />
          </Field>
          <Field label="练习场景">
            <Select options={SCENES.map(s => s.desc)} value={labelOf(SCENES, scene)} onChange={d => setScene(codeOf(SCENES, d))} />
          </Field>
        </div>
      </Card>

      <Card title="我的口语素材">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#888', cursor: 'pointer' }}>
            <input type="checkbox" checked={historyUseCurrentFilter} onChange={e => changeHistoryFilter(e.target.checked)} />
            按当前条件筛选
          </label>
          <button onClick={() => loadHistory(1)} disabled={historyLoading} style={ghostBtn}>{historyLoading ? '刷新中...' : '刷新'}</button>
        </div>

        {history.length === 0 ? (
          <div style={{ fontSize: 13, color: '#aaa', textAlign: 'center', padding: 24 }}>{historyLoading ? '加载中...' : '暂无口语素材'}</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {history.map(item => (
              <div key={item.id} style={listItemStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#333' }}>{item.title || '未命名口语素材'}</div>
                    <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                      {labelOf(LANGUAGES, item.languageCode)} · {labelOf(STAGES, item.stageCode)} · {labelOf(DIFFICULTIES, item.difficultyCode)} · {displayScene(item.sceneCode, item.customScene)}
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: '#bbb', whiteSpace: 'nowrap' }}>{formatTime(item.createTime)}</div>
                </div>
                {item.sceneDescription && <div style={{ fontSize: 13, color: '#555', lineHeight: 1.7, marginTop: 8, whiteSpace: 'pre-wrap' }}>{item.sceneDescription}</div>}
                {item.userPrompt && <div style={{ fontSize: 12, color: '#888', marginTop: 8 }}>偏好：{item.userPrompt}</div>}
                <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                  <button onClick={() => openPracticeDetail(item)} disabled={detailLoadingId === item.id} style={ghostBtn}>
                    {detailLoadingId === item.id ? '加载中...' : '进入练习'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <PaginationBar
          current={historyPage}
          pages={historyPages}
          total={historyTotal}
          loading={historyLoading}
          onChange={nextPage => loadHistory(nextPage)}
        />
      </Card>

      {detail && (
        <div onClick={closePracticeDetail} style={overlay}>
          <div onClick={e => e.stopPropagation()} style={modal}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a' }}>{detail.title}</div>
                <div style={{ fontSize: 12, color: '#999', marginTop: 6 }}>
                  {labelOf(LANGUAGES, detail.languageCode)} · {labelOf(STAGES, detail.stageCode)} · {labelOf(DIFFICULTIES, detail.difficultyCode)} · {displayScene(detail.sceneCode)}
                </div>
              </div>
              <button onClick={closePracticeDetail} style={closeBtn}>×</button>
            </div>
            {detail.sceneDescription && <div style={{ ...noteStyle, marginBottom: 16 }}>{detail.sceneDescription}</div>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {detail.sentences?.map(sentence => (
                <PracticeSentenceCard
                  key={sentence.sentenceId}
                  sentence={sentence}
                  onEvaluated={result => {
                    setDetail(prev => {
                      if (!prev) return prev;
                      return {
                        ...prev,
                        sentences: prev.sentences.map(item =>
                          item.sentenceId === sentence.sentenceId
                            ? { ...item, latestEvaluation: result }
                            : item
                        ),
                      };
                    });
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div style={{ position: 'fixed', top: 24, left: '50%', transform: 'translateX(-50%)', padding: '10px 24px', background: '#2c2c2c', color: '#fff', borderRadius: 10, fontSize: 13, zIndex: 1100 }}>{toast}</div>
      )}
    </>
  );
}

function ReadonlyPracticeDetailModal({ detail, onClose }: { detail: SpeakingPracticeDetail; onClose: () => void }) {
  return (
    <div onClick={onClose} style={overlay}>
      <div onClick={e => e.stopPropagation()} style={modal}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a' }}>{detail.title}</div>
            <div style={{ fontSize: 12, color: '#999', marginTop: 6 }}>
              {labelOf(LANGUAGES, detail.languageCode)} · {labelOf(STAGES, detail.stageCode)} · {labelOf(DIFFICULTIES, detail.difficultyCode)} · {displayScene(detail.sceneCode)}
            </div>
          </div>
          <button onClick={onClose} style={closeBtn}>×</button>
        </div>
        {detail.sceneDescription && <div style={{ ...noteStyle, marginBottom: 16 }}>{detail.sceneDescription}</div>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {detail.sentences?.map(sentence => (
            <SentenceBlock key={sentence.sentenceId} sentence={sentence} />
          ))}
        </div>
      </div>
    </div>
  );
}

function MaterialDetail({ material, onPractice, loading }: { material: SpeakingMaterial; onPractice?: () => void; loading?: boolean }) {
  return (
    <div style={panelStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a' }}>{material.title}</div>
          {material.sceneDescription && <div style={{ fontSize: 13, color: '#666', lineHeight: 1.8, marginTop: 8, whiteSpace: 'pre-wrap' }}>{material.sceneDescription}</div>}
        </div>
        {onPractice && <button onClick={onPractice} disabled={loading} style={primaryBtn}>{loading ? '加载中...' : '进入练习'}</button>}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {material.sentences?.map(sentence => (
          <SentenceBlock key={sentence.sentenceId} sentence={sentence} />
        ))}
      </div>
    </div>
  );
}

function PracticeSentenceCard({
  sentence,
  onEvaluated,
}: {
  sentence: SpeakingSentence;
  onEvaluated: (evaluation: SpeakingEvaluationResult) => void;
}) {
  const [recording, setRecording] = useState(false);
  const [studentAudioUrl, setStudentAudioUrl] = useState('');
  const [studentAudioFile, setStudentAudioFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [recordError, setRecordError] = useState('');
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const chunksRef = useRef<Float32Array[]>([]);
  const sampleRateRef = useRef(16000);
  const evaluated = Boolean(sentence.latestEvaluation);

  useEffect(() => {
    return () => {
      processorRef.current?.disconnect();
      sourceRef.current?.disconnect();
      audioContextRef.current?.close();
      streamRef.current?.getTracks().forEach(track => track.stop());
      if (studentAudioUrl) {
        URL.revokeObjectURL(studentAudioUrl);
      }
    };
  }, [studentAudioUrl]);

  const startRecording = async () => {
    if (evaluated) {
      setRecordError('当前句子已完成评测');
      return;
    }
    const AudioContextCtor = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!navigator.mediaDevices?.getUserMedia || !AudioContextCtor) {
      setRecordError('当前浏览器不支持录音能力');
      return;
    }
    try {
      setRecordError('');
      if (studentAudioUrl) {
        URL.revokeObjectURL(studentAudioUrl);
        setStudentAudioUrl('');
      }
      setStudentAudioFile(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioContext = new AudioContextCtor();
      const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(4096, 1, 1);

      streamRef.current = stream;
      audioContextRef.current = audioContext;
      sourceRef.current = source;
      processorRef.current = processor;
      chunksRef.current = [];
      sampleRateRef.current = audioContext.sampleRate;

      processor.onaudioprocess = event => {
        chunksRef.current.push(new Float32Array(event.inputBuffer.getChannelData(0)));
      };
      source.connect(processor);
      processor.connect(audioContext.destination);
      setRecording(true);
    } catch (e: any) {
      setRecordError(e?.message || '录音启动失败，请检查麦克风权限');
      setRecording(false);
    }
  };

  const stopRecording = () => {
    processorRef.current?.disconnect();
    sourceRef.current?.disconnect();
    streamRef.current?.getTracks().forEach(track => track.stop());
    audioContextRef.current?.close();

    processorRef.current = null;
    sourceRef.current = null;
    streamRef.current = null;
    audioContextRef.current = null;

    const samples = mergeFloat32Chunks(chunksRef.current);
    const wavSamples = downsampleFloat32(samples, sampleRateRef.current, SPEAKING_EVALUATION_SAMPLE_RATE);
    const wavBlob = encodeWav(wavSamples, SPEAKING_EVALUATION_SAMPLE_RATE);
    const audioFile = new File([wavBlob], `speaking-practice-${sentence.sentenceId}-${Date.now()}.wav`, { type: 'audio/wav' });
    const objectUrl = URL.createObjectURL(audioFile);
    setStudentAudioFile(audioFile);
    setStudentAudioUrl(objectUrl);
    setRecording(false);
  };

  const submitEvaluation = async () => {
    if (evaluated) {
      setRecordError('当前句子已完成评测');
      return;
    }
    if (!studentAudioFile) {
      setRecordError('请先完成跟读录音');
      return;
    }
    setSubmitting(true);
    setRecordError('');
    try {
      const uploaded = await uploadFile<SysFileUploadResult>(studentAudioFile);
      if (!uploaded.url) {
        throw new Error('音频上传失败');
      }
      const result = await apiCall<SpeakingEvaluationResult>('/speaking/evaluation/evaluate', {
        method: 'POST',
        body: JSON.stringify({
          sentenceId: sentence.sentenceId,
          studentAudioUrl: uploaded.url,
        }),
      });
      onEvaluated(result);
      setStudentAudioFile(null);
    } catch (e: any) {
      setRecordError(e?.message || '提交评测失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={panelStyle}>
      <SentenceBlock sentence={sentence} />
      <div style={{ marginTop: 12, borderTop: '1px solid #f0efec', paddingTop: 12 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={recording ? stopRecording : startRecording}
            disabled={evaluated}
            style={{ ...(recording ? dangerBtn : primaryBtn), opacity: evaluated ? .45 : 1, cursor: evaluated ? 'not-allowed' : 'pointer' }}
          >
            {evaluated ? '已评测' : recording ? '停止录音' : '开始跟读录音'}
          </button>
          <button
            onClick={submitEvaluation}
            disabled={evaluated || !studentAudioFile || recording || submitting}
            style={{ ...ghostBtn, opacity: evaluated || !studentAudioFile || recording || submitting ? .45 : 1, cursor: evaluated || !studentAudioFile || recording || submitting ? 'not-allowed' : 'pointer' }}
          >
            {evaluated ? '已提交' : submitting ? '评测中...' : '提交评测'}
          </button>
        </div>
        {studentAudioUrl && <audio controls src={studentAudioUrl} style={{ width: '100%', marginTop: 10 }} />}
        {recordError && <div style={{ fontSize: 12, color: '#c62828', marginTop: 8 }}>{recordError}</div>}
        <div style={{ fontSize: 12, color: '#aaa', marginTop: 8 }}>录音会以 16k WAV 格式上传并提交评测。</div>
      </div>
      {sentence.latestEvaluation && <EvaluationView evaluation={sentence.latestEvaluation} />}
    </div>
  );
}

function SentenceBlock({ sentence }: { sentence: SpeakingSentence }) {
  return (
    <div style={{ border: '1px solid #f0efec', borderRadius: 10, padding: 14, background: '#fff' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#333', lineHeight: 1.7 }}>{sentence.sortOrder ? `${sentence.sortOrder}. ` : ''}{sentence.sentence}</div>
          {sentence.translation && <div style={{ fontSize: 13, color: '#777', lineHeight: 1.7, marginTop: 6 }}>{sentence.translation}</div>}
        </div>
      </div>
      {sentence.standardAudioUrl && (
        <audio controls src={sentence.standardAudioUrl} style={{ width: '100%', marginTop: 10 }} />
      )}
      <ChipSection title="重点表达" items={sentence.keyPoints} />
      <TipSection title="跟读建议" items={sentence.practiceTips} />
    </div>
  );
}

function EvaluationView({ evaluation }: { evaluation: SpeakingLatestEvaluation }) {
  return (
    <div style={{ marginTop: 12, borderTop: '1px solid #f0efec', paddingTop: 12 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 8 }}>
        <ScoreItem label="建议得分" value={evaluation.suggestedScore} maxScore={100} />
        <ScoreItem label="准确度" value={evaluation.pronAccuracy} maxScore={100} />
        <ScoreItem label="流利度" value={evaluation.pronFluency} maxScore={1} />
        <ScoreItem label="完整度" value={evaluation.pronCompletion} maxScore={1} />
      </div>
      {evaluation.recognizedText && (
        <div style={{ ...noteStyle, marginTop: 10 }}>
          <strong>标准正确文本：</strong>{evaluation.recognizedText}
        </div>
      )}
      {evaluation.studentAudioUrl && <audio controls src={evaluation.studentAudioUrl} style={{ width: '100%', marginTop: 10 }} />}
      {evaluation.words && evaluation.words.length > 0 && (
        <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {evaluation.words.map((word, index) => (
            <span key={`${word.referenceWord}-${index}`} style={{ fontSize: 12, color: '#234b49', background: 'rgba(35,75,73,.1)', padding: '5px 9px', borderRadius: 6 }}>
              {word.referenceWord || word.word} · {formatScore(word.pronAccuracy)}
            </span>
          ))}
        </div>
      )}
      {evaluation.createTime && <div style={{ fontSize: 11, color: '#bbb', marginTop: 8 }}>评测时间：{formatTime(evaluation.createTime)}</div>}
    </div>
  );
}

function ScoreItem({ label, value, maxScore }: { label: string; value?: number; maxScore?: number }) {
  return (
    <div style={{ background: '#fafaf9', border: '1px solid #f0efec', borderRadius: 8, padding: 10 }}>
      <div style={{ fontSize: 11, color: '#999' }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: '#234b49', marginTop: 4 }}>{formatScoreWithMax(value, maxScore)}</div>
    </div>
  );
}

function mergeFloat32Chunks(chunks: Float32Array[]) {
  const length = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const result = new Float32Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return result;
}

function downsampleFloat32(samples: Float32Array, inputSampleRate: number, outputSampleRate: number) {
  if (inputSampleRate === outputSampleRate) {
    return samples;
  }
  if (inputSampleRate < outputSampleRate) {
    return samples;
  }

  const ratio = inputSampleRate / outputSampleRate;
  const outputLength = Math.floor(samples.length / ratio);
  const result = new Float32Array(outputLength);

  for (let i = 0; i < outputLength; i += 1) {
    const start = Math.floor(i * ratio);
    const end = Math.min(Math.floor((i + 1) * ratio), samples.length);
    let sum = 0;
    for (let j = start; j < end; j += 1) {
      sum += samples[j];
    }
    result[i] = sum / Math.max(1, end - start);
  }

  return result;
}

function encodeWav(samples: Float32Array, sampleRate: number) {
  const bytesPerSample = 2;
  const blockAlign = bytesPerSample;
  const buffer = new ArrayBuffer(44 + samples.length * bytesPerSample);
  const view = new DataView(buffer);

  writeAscii(view, 0, 'RIFF');
  view.setUint32(4, 36 + samples.length * bytesPerSample, true);
  writeAscii(view, 8, 'WAVE');
  writeAscii(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);
  writeAscii(view, 36, 'data');
  view.setUint32(40, samples.length * bytesPerSample, true);

  let offset = 44;
  for (const sample of samples) {
    const clamped = Math.max(-1, Math.min(1, sample));
    view.setInt16(offset, clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, true);
    offset += bytesPerSample;
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

function writeAscii(view: DataView, offset: number, value: string) {
  for (let i = 0; i < value.length; i += 1) {
    view.setUint8(offset + i, value.charCodeAt(i));
  }
}

function ChipSection({ title, items }: { title: string; items?: string[] }) {
  if (!items || items.length === 0) return null;
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ fontSize: 12, color: '#999', marginBottom: 6 }}>{title}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {items.map((item, index) => (
          <span key={`${item}-${index}`} style={{ fontSize: 12, color: '#234b49', background: 'rgba(35,75,73,.1)', padding: '4px 9px', borderRadius: 6 }}>{item}</span>
        ))}
      </div>
    </div>
  );
}

function TipSection({ title, items }: { title: string; items?: string[] }) {
  if (!items || items.length === 0) return null;
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ fontSize: 12, color: '#999', marginBottom: 6 }}>{title}</div>
      <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: '#666', lineHeight: 1.8 }}>
        {items.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}
      </ul>
    </div>
  );
}

function PaginationBar({
  current,
  pages,
  total,
  loading,
  onChange,
}: {
  current: number;
  pages: number;
  total: number;
  loading: boolean;
  onChange: (page: number) => void;
}) {
  const safePages = Math.max(1, pages || 1);
  const safeCurrent = Math.min(Math.max(1, current || 1), safePages);
  const start = Math.max(1, Math.min(safeCurrent - 2, safePages - 4));
  const pageNumbers = Array.from({ length: Math.min(5, safePages) }, (_, index) => start + index)
    .filter(page => page <= safePages);

  return (
    <div style={pagerWrap}>
      <div style={pagerMeta}>共 {total || 0} 条 · 第 {safeCurrent} / {safePages} 页</div>
      <div style={pagerBtns}>
        <button onClick={() => onChange(safeCurrent - 1)} disabled={safeCurrent <= 1 || loading} style={pagerBtn(safeCurrent <= 1 || loading)}>上一页</button>
        {start > 1 && (
          <>
            <button onClick={() => onChange(1)} disabled={loading} style={pagerBtn(loading)}>1</button>
            <span style={pagerDots}>...</span>
          </>
        )}
        {pageNumbers.map(page => (
          <button
            key={page}
            onClick={() => onChange(page)}
            disabled={page === safeCurrent || loading}
            style={page === safeCurrent ? pagerActiveBtn : pagerBtn(loading)}
          >
            {page}
          </button>
        ))}
        {pageNumbers[pageNumbers.length - 1] < safePages && (
          <>
            <span style={pagerDots}>...</span>
            <button onClick={() => onChange(safePages)} disabled={loading} style={pagerBtn(loading)}>{safePages}</button>
          </>
        )}
        <button onClick={() => onChange(safeCurrent + 1)} disabled={safeCurrent >= safePages || loading} style={pagerBtn(safeCurrent >= safePages || loading)}>下一页</button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 12, color: '#999', marginBottom: 6 }}>{label}</div>
      {children}
    </div>
  );
}

function labelOf(options: { code: string; desc: string }[], code?: string) {
  return options.find(o => o.code === code)?.desc || code || '—';
}

function codeOf(options: { code: string; desc: string }[], desc: string) {
  return options.find(o => o.desc === desc)?.code || '';
}

function displayScene(sceneCode?: string, customScene?: string) {
  if (sceneCode === 'custom' && customScene) {
    return `自定义：${customScene}`;
  }
  return labelOf(SCENES, sceneCode);
}

function formatTime(value?: string) {
  return value ? new Date(value).toLocaleString() : '';
}

function formatScore(value?: number) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—';
  return Number(value).toFixed(1);
}

function formatScoreWithMax(value?: number, maxScore?: number) {
  const score = formatScore(value);
  if (score === '—' || maxScore === undefined) {
    return score;
  }
  return `${score}/${maxScore}`;
}

const primaryBtn: React.CSSProperties = {
  padding: '9px 16px',
  borderRadius: 8,
  border: 'none',
  background: '#2c2c2c',
  color: '#fff',
  fontSize: 12,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
};

const dangerBtn: React.CSSProperties = {
  ...primaryBtn,
  background: '#c62828',
};

function tabBtn(active: boolean): React.CSSProperties {
  return {
    padding: '7px 14px',
    borderRadius: 8,
    border: active ? '1px solid #2c2c2c' : '1px solid #e8e6e1',
    background: active ? '#2c2c2c' : '#fff',
    color: active ? '#fff' : '#666',
    fontSize: 12,
    cursor: 'pointer',
  };
}

function pagerBtn(disabled: boolean): React.CSSProperties {
  return {
    minWidth: 34,
    height: 32,
    padding: '0 10px',
    borderRadius: 8,
    border: '1px solid #e8e6e1',
    background: '#fff',
    color: '#666',
    fontSize: 12,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? .45 : 1,
  };
}

const pagerActiveBtn: React.CSSProperties = {
  minWidth: 34,
  height: 32,
  padding: '0 10px',
  borderRadius: 8,
  border: '1px solid #234b49',
  background: '#234b49',
  color: '#fff',
  fontSize: 12,
  fontWeight: 700,
  cursor: 'default',
};

const pagerWrap: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 12,
  flexWrap: 'wrap',
  marginTop: 14,
  paddingTop: 12,
  borderTop: '1px solid #f0efec',
};

const pagerMeta: React.CSSProperties = {
  fontSize: 12,
  color: '#999',
};

const pagerBtns: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  flexWrap: 'wrap',
};

const pagerDots: React.CSSProperties = {
  fontSize: 12,
  color: '#aaa',
  padding: '0 2px',
};

const ghostBtn: React.CSSProperties = {
  padding: '7px 14px',
  borderRadius: 8,
  border: '1px solid #e8e6e1',
  background: '#fff',
  color: '#666',
  fontSize: 12,
  cursor: 'pointer',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  height: 38,
  padding: '0 12px',
  border: '1px solid #e8e6e1',
  borderRadius: 8,
  fontSize: 13,
  outline: 'none',
  fontFamily: 'inherit',
};

const textareaStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  border: '1px solid #e8e6e1',
  borderRadius: 10,
  fontSize: 13,
  outline: 'none',
  fontFamily: 'inherit',
  resize: 'vertical',
  lineHeight: 1.7,
};

const listItemStyle: React.CSSProperties = {
  border: '1px solid #f0efec',
  borderRadius: 10,
  padding: 14,
  background: '#fff',
};

const panelStyle: React.CSSProperties = {
  border: '1px solid #f0efec',
  borderRadius: 12,
  padding: 16,
  background: '#fff',
};

const noteStyle: React.CSSProperties = {
  fontSize: 13,
  color: '#666',
  lineHeight: 1.8,
  background: '#fafaf9',
  border: '1px solid #f0efec',
  borderRadius: 10,
  padding: 12,
  whiteSpace: 'pre-wrap',
};

const overlay: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,.28)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 24,
  zIndex: 1000,
};

const modal: React.CSSProperties = {
  width: 'min(920px, 100%)',
  maxHeight: '84vh',
  overflowY: 'auto',
  background: '#fff',
  borderRadius: 14,
  padding: 24,
  boxShadow: '0 18px 50px rgba(0,0,0,.18)',
};

const closeBtn: React.CSSProperties = {
  width: 30,
  height: 30,
  borderRadius: 8,
  border: '1px solid #eee',
  background: '#fafaf9',
  color: '#999',
  fontSize: 20,
  cursor: 'pointer',
  lineHeight: '24px',
};
