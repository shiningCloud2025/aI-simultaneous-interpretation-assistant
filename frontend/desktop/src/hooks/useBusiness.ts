import { useCallback, useState } from 'react';
import { api, uploadFile } from '../lib/api';
import type {
  EvaluationRecord,
  GenerationRecord,
  WordMaterialRecord,
} from '../lib/api';
import { useDesktopStore } from '../stores/desktopStore';

/**
 * 业务 hooks：把「阅读 / 写作 / 批阅」的逻辑从 UI 中抽离，
 * 使桌面端悬浮条与桌面平台面板复用同一份实现，两端数据天然一致。
 */

/** 阅读：单词素材生成 */
export function useWordMaterial() {
  const [word, setWord] = useState('');
  const [language, setLanguage] = useState('english');
  const [stage, setStage] = useState('en_senior');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  // 结果统一存共享 store，悬浮条与桌面平台同时可见
  const result = useDesktopStore((s) => s.wordResult);
  const setResult = useDesktopStore((s) => s.setWordResult);

  const generate = useCallback(async () => {
    const normalized = word.trim();
    if (!normalized) {
      setError('请输入单词');
      return;
    }
    if (normalized.split(/[\n,，\s]+/).filter(Boolean).length > 1) {
      setError('一次只能输入一个单词');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await api.generateWordMaterial(normalized, language, stage);
      setResult({
        word: normalized,
        sentence: data.sentence,
        translation: data.translation,
        imageUrl: data.imageUrl,
      });
      setRefreshKey((v) => v + 1);
    } catch (e: any) {
      setError(e?.message || '生成失败');
    } finally {
      setLoading(false);
    }
  }, [word, language, stage, setResult]);

  const restore = useCallback(
    (record: WordMaterialRecord) => {
      setResult({
        word: record.word || '',
        sentence: record.sentence,
        translation: record.translation,
        imageUrl: record.imageUrl,
      });
      setWord(record.word || '');
      if (record.languageCode) setLanguage(record.languageCode);
      if (record.stageCode) setStage(record.stageCode);
      setError('');
    },
    [setResult]
  );

  return {
    word, setWord, language, setLanguage, stage, setStage,
    loading, error, setError, result, generate, restore, refreshKey,
  };
}

/** 写作：作文出题 */
export function useWritingTopic() {
  const [language, setLanguage] = useState('english');
  const [stage, setStage] = useState('en_senior');
  const [genre, setGenre] = useState('en_senior_application');
  const [difficulty, setDifficulty] = useState('medium');
  const [scene, setScene] = useState('campus');
  const [customScene, setCustomScene] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const topic = useDesktopStore((s) => s.writingTopic);
  const setTopic = useDesktopStore((s) => s.setWritingTopic);

  const generate = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.generateWritingTopic({
        languageCode: language,
        stageCode: stage,
        genreCode: genre,
        difficultyCode: difficulty,
        sceneCode: scene,
        customScene: scene === 'custom' ? customScene : undefined,
      });
      setTopic(data);
      setRefreshKey((v) => v + 1);
    } catch (e: any) {
      setError(e?.message || '生成失败');
    } finally {
      setLoading(false);
    }
  }, [language, stage, genre, difficulty, scene, customScene, setTopic]);

  const restore = useCallback(
    (record: GenerationRecord) => {
      setTopic({
        title: record.title || '',
        prompt: record.prompt || '',
        requirement: record.requirement || '',
        wordLimitMin: record.wordLimitMin,
        wordLimitMax: record.wordLimitMax,
        keyPoints: record.keyPoints,
        vocabularyHints: record.vocabularyHints,
        structureHints: record.structureHints,
        scoringCriteria: record.scoringCriteria,
      });
      if (record.languageCode) setLanguage(record.languageCode);
      if (record.stageCode) setStage(record.stageCode);
      if (record.genreCode) setGenre(record.genreCode);
      if (record.difficultyCode) setDifficulty(record.difficultyCode);
      if (record.sceneCode) setScene(record.sceneCode);
      setError('');
    },
    [setTopic]
  );

  return {
    language, setLanguage, stage, setStage, genre, setGenre,
    difficulty, setDifficulty, scene, setScene, customScene, setCustomScene,
    loading, error, setError, topic, generate, restore, refreshKey,
  };
}

/** 批阅：作文批改 */
export function useWritingReview() {
  const [submitType, setSubmitType] = useState<'text' | 'image'>('text');
  const [language, setLanguage] = useState('english');
  const [stage, setStage] = useState('en_postgraduate');
  const [genre, setGenre] = useState('en_postgraduate_part_a');
  const [title, setTitle] = useState('');
  const [prompt, setPrompt] = useState('');
  const [scoringCriteria, setScoringCriteria] = useState('');
  const [content, setContent] = useState('');
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const review = useDesktopStore((s) => s.reviewResult);
  const setReview = useDesktopStore((s) => s.setReviewResult);

  const handleUpload = useCallback(
    async (files: File[]) => {
      if (!files.length) return;
      setUploading(true);
      try {
        const uploaded = await Promise.all(files.map((f) => uploadFile<{ url: string }>(f)));
        setImageUrls((prev) => [...prev, ...uploaded.map((i) => i.url).filter(Boolean)]);
      } catch (e: any) {
        setError(e?.message || '上传失败');
      } finally {
        setUploading(false);
      }
    },
    []
  );

  const evaluate = useCallback(async () => {
    if (!prompt.trim() || !scoringCriteria.trim()) {
      setError('作文题干和评分标准不能为空');
      return;
    }
    if (submitType === 'text' && !content.trim()) {
      setError('请输入作文正文');
      return;
    }
    if (submitType === 'image' && imageUrls.length === 0) {
      setError('请上传作文图片');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await api.evaluateWriting({
        submitType,
        languageCode: language,
        stageCode: stage,
        genreCode: genre,
        title: submitType === 'text' ? title.trim() || undefined : undefined,
        prompt: prompt.trim(),
        scoringCriteria: scoringCriteria.trim(),
        content: submitType === 'text' ? content.trim() : undefined,
        imageUrls: submitType === 'image' ? imageUrls : undefined,
      });
      setReview(data);
      setRefreshKey((v) => v + 1);
    } catch (e: any) {
      setError(e?.message || '批阅失败');
    } finally {
      setLoading(false);
    }
  }, [submitType, language, stage, genre, title, prompt, scoringCriteria, content, imageUrls, setReview]);

  const restore = useCallback(
    (record: EvaluationRecord) => {
      setReview({
        score: Number(record.score ?? 0),
        feedback: record.feedback,
        suggestion: record.suggestion,
        highlights: record.highlights,
        improvementPoints: record.improvementPoints,
        sentenceFeedback: record.sentenceFeedback,
        improvedVersion: record.improvedVersion,
      });
      if (record.languageCode) setLanguage(record.languageCode);
      if (record.stageCode) setStage(record.stageCode);
      if (record.genreCode) setGenre(record.genreCode);
      if (record.submitType === 'text' || record.submitType === 'image') setSubmitType(record.submitType);
      setPrompt(record.prompt || '');
      setScoringCriteria(record.scoringCriteria || '');
      setTitle(record.title || '');
      setContent(record.content || record.ocrText || '');
      if (record.imageUrls?.length) setImageUrls(record.imageUrls);
      setError('');
    },
    [setReview]
  );

  return {
    submitType, setSubmitType, language, setLanguage, stage, setStage, genre, setGenre,
    title, setTitle, prompt, setPrompt, scoringCriteria, setScoringCriteria,
    content, setContent, imageUrls, setImageUrls,
    loading, uploading, error, setError, review, evaluate, restore, handleUpload, refreshKey,
  };
}
