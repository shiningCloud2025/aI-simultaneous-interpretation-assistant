import React, { useState, useRef, useCallback, useMemo, useEffect, Component } from 'react';
import { Card, PageBanner } from './ui';
import { HotTable } from '@handsontable/react';
import Handsontable from 'handsontable';
import 'handsontable/styles/handsontable.min.css';
import 'handsontable/styles/ht-theme-main.min.css';

// 注册所有功能模块
import { registerAllModules } from 'handsontable/registry';
registerAllModules();

// 注册中文语言包
import { registerLanguageDictionary } from 'handsontable/i18n';
import zhCN from 'handsontable/languages/zh-CN';
registerLanguageDictionary(zhCN);

interface SheetData {
  name: string;
  data: string[][];
  colHeaders: string[];
}

function colToLetter(col: number): string {
  let letter = '';
  while (col >= 0) {
    letter = String.fromCharCode((col % 26) + 65) + letter;
    col = Math.floor(col / 26) - 1;
  }
  return letter;
}

// ErrorBoundary 捕获子组件错误
class EduExcelErrorBoundary extends Component<{ children: React.ReactNode }, { err: Error | null }> {
  state = { err: null as Error | null };
  static getDerivedStateFromError(err: Error) { return { err }; }
  componentDidCatch(err: Error, info: any) {
    console.error('EduExcel error:', err, info);
  }
  render() {
    if (this.state.err) {
      return (
        <div style={{ padding: 40, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>⚠️</div>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Excel 编辑器加载失败</div>
          <div style={{ fontSize: 12, color: '#c00', marginBottom: 16 }}>{this.state.err.message}</div>
          <button onClick={() => location.reload()} style={{ padding: '8px 24px', borderRadius: 8, background: '#2c2c2c', color: '#fff', border: 'none', cursor: 'pointer' }}>刷新页面</button>
        </div>
      );
    }
    return this.props.children;
  }
}

export function EduExcel() {
  return (
    <EduExcelErrorBoundary>
      <EduExcelInner />
    </EduExcelErrorBoundary>
  );
}

function EduExcelInner() {
  const [file, setFile] = useState<File | null>(null);
  const [sheets, setSheets] = useState<SheetData[]>([]);
  const [activeSheet, setActiveSheet] = useState(0);
  const [loading, setLoading] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [tableHeight, setTableHeight] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hotRef = useRef<Handsontable | null>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);
  // HyperFormula 实例缓存（懒加载，单例）
  const hfRef = useRef<any>(null);
  const hfLoadingRef = useRef(false);

  // 监听容器尺寸变化
  useEffect(() => {
    if (!tableContainerRef.current) return;
    const ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        setTableHeight(entry.contentRect.height);
      }
    });
    ro.observe(tableContainerRef.current);
    return () => ro.disconnect();
  }, []);

  const currentSheet = sheets[activeSheet];

  // 解析上传文件
  const handleFileImport = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const ext = f.name.split('.').pop()?.toLowerCase() || '';
    if (!['xlsx', 'xls', 'csv'].includes(ext)) {
      alert('请上传 .xlsx / .xls / .csv 格式的文件');
      return;
    }
    setFile(f);
    setLoading(true);
    try {
      const XLSX = await import('xlsx');
      const arrayBuffer = await f.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true });
      const sheetData: SheetData[] = workbook.SheetNames.map((name: string) => {
        const ws = workbook.Sheets[name];
        const raw: (string | number | null)[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '', raw: false });
        if (!raw.length) return { name, data: [], colHeaders: [] };

        const maxCols = Math.max(...raw.map(r => r.length));
        const headers = raw[0].map((c, i) => {
          const v = c == null ? '' : String(c);
          return v || colToLetter(i);
        });
        const paddedHeaders = [...headers];
        for (let i = headers.length; i < maxCols; i++) {
          paddedHeaders.push(colToLetter(i));
        }
        const data = raw.slice(1).map(r => {
          const row: string[] = [];
          for (let i = 0; i < maxCols; i++) {
            row.push(i < r.length && r[i] != null ? String(r[i]) : '');
          }
          return row;
        });
        if (!data.length) data.push(Array(maxCols).fill(''));
        return { name, data, colHeaders: paddedHeaders };
      });
      setSheets(sheetData);
      setActiveSheet(0);
    } catch (e: any) {
      console.error(e);
      alert('Excel 解析失败: ' + (e?.message || '未知错误'));
    } finally {
      setLoading(false);
    }
    e.target.value = '';
  }, []);

  // 新建空白表格
  const handleNewBlank = () => {
    try {
      const colHeaders = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
      const data: string[][] = [];
      for (let r = 0; r < 50; r++) {
        const row: string[] = [];
        for (let c = 0; c < colHeaders.length; c++) row.push('');
        data.push(row);
      }
      // 用一个简单的对象代替 File，避免浏览器 File 构造器的边界问题
      const fakeFile = { name: '未命名表格.xlsx' } as File;
      setFile(fakeFile);
      setSheets([{ name: 'Sheet1', data, colHeaders }]);
      setActiveSheet(0);
    } catch (e) {
      console.error('handleNewBlank error:', e);
      alert('新建表格失败: ' + (e as any)?.message);
    }
  };

  const closeFile = () => {
    setFile(null);
    setSheets([]);
    setActiveSheet(0);
    setZoom(1);
  };

  const getCurrentData = useCallback((): string[][] => {
    if (hotRef.current) {
      return hotRef.current.getData() as string[][];
    }
    return currentSheet?.data || [];
  }, [currentSheet]);

  // 导出 CSV
  const handleExportCsv = () => {
    const sheet = sheets[activeSheet];
    if (!sheet) return;
    const data = getCurrentData();
    const allRows = [sheet.colHeaders, ...data];
    const csv = allRows.map(row => row.map(c => {
      const s = String(c ?? '');
      return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
    }).join(',')).join('\n');
    downloadBlob(new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' }), (file?.name || 'table').replace(/\.\w+$/i, '') + '.csv');
    alert('已导出 CSV');
  };

  // 导出 Excel
  const handleExportXlsx = async () => {
    if (!sheets.length) return;
    try {
      const XLSX = await import('xlsx');
      const wb = XLSX.utils.book_new();
      for (let i = 0; i < sheets.length; i++) {
        const sheet = sheets[i];
        const data = i === activeSheet ? getCurrentData() : sheet.data;
        const ws = XLSX.utils.aoa_to_sheet([sheet.colHeaders, ...data]);
        XLSX.utils.book_append_sheet(wb, ws, sheet.name);
      }
      XLSX.writeFile(wb, (file?.name || 'table').replace(/\.\w+$/i, '') + '_export.xlsx');
      alert('已导出 Excel');
    } catch (e: any) {
      console.error(e);
      alert('导出失败: ' + (e?.message || '未知错误'));
    }
  };

  // 导出 PDF
  const handleExportPdf = async () => {
    const sheet = sheets[activeSheet];
    if (!sheet) return;
    try {
      const { default: jsPDF } = await import('jspdf');
      const data = getCurrentData();
      const doc = new jsPDF({ orientation: 'landscape', unit: 'pt' });
      (doc as any).autoTable({
        head: [sheet.colHeaders],
        body: data,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [68, 114, 196], textColor: 255, fontStyle: 'bold' },
      });
      doc.save((file?.name || 'table').replace(/\.\w+$/i, '') + '.pdf');
      alert('已导出 PDF');
    } catch (e: any) {
      console.error(e);
      alert('PDF 导出失败: ' + (e?.message || '未知错误'));
    }
  };

  // 添加行
  const handleAddRow = () => {
    if (!hotRef.current) return;
    const rowCount = hotRef.current.countRows();
    hotRef.current.alter('insert_row_below', rowCount - 1, 1);
  };

  // 添加列
  const handleAddCol = () => {
    if (!hotRef.current) return;
    hotRef.current.alter('insert_col_end', 1);
  };

  // ==================== HyperFormula 公式引擎 ====================
  // 懒加载：表格挂载后再异步初始化，不阻塞首次渲染
  const ensureHF = useCallback(async () => {
    if (hfRef.current || hfLoadingRef.current) return hfRef.current;
    hfLoadingRef.current = true;
    try {
      const mod = await import('hyperformula');
      const HF = (mod as any).HyperFormula || (mod as any).default;
      hfRef.current = HF.buildEmpty({ licenseKey: 'non-commercial-and-evaluation' });
    } catch (e) {
      console.warn('HF load error:', e);
    } finally {
      hfLoadingRef.current = false;
    }
    return hfRef.current;
  }, []);

  // Handsontable 设置 —— 用 ref 缓存避免 hotSettings 引用变化触发重挂载
  const hotSettingsRef = useRef<any>(null);
  const hotSettingsKey = `${activeSheet}-${sheets.length}-${tableHeight}`;

  if (!hotSettingsRef.current || hotSettingsRef.current.__key !== hotSettingsKey) {
    if (!currentSheet) {
      hotSettingsRef.current = null;
    } else {
      hotSettingsRef.current = {
        __key: hotSettingsKey,
        data: currentSheet.data,
        colHeaders: currentSheet.colHeaders,
        rowHeaders: true,
        height: tableHeight > 0 ? tableHeight : 400,
        width: '100%',
        licenseKey: 'non-commercial-and-evaluation',
        language: 'zh-CN',
        stretchH: 'none',
        columnSorting: true,
        filters: true,
        dropdownMenu: ['filter_by_condition', 'filter_by_value', 'filter_action_bar'],
        contextMenu: [
          'row_above', 'row_below', 'col_left', 'col_right',
          '---------',
          'remove_row', 'remove_col',
          '---------',
          'undo', 'redo',
          '---------',
          'alignment',
          '---------',
          'copy', 'cut',
        ],
        undo: true,
        autoColumnSize: { syncLimit: 100 },
        manualColumnResize: true,
        manualRowResize: true,
        wordWrap: true,
        copyPaste: { pasteMode: 'overwrite', rowsLimit: Infinity, columnsLimit: Infinity },
        minSpareRows: 1,
        minSpareCols: 1,
        afterChange: (changes: any) => {
          if (!changes) return;
          try {
            if (!hotRef.current) return;
            const data = hotRef.current.getData() as string[][];
            setSheets(prev => {
              const next = [...prev];
              const sheet = { ...next[activeSheet] };
              sheet.data = data;
              next[activeSheet] = sheet;
              return next;
            });
          } catch (e) {
            console.warn('afterChange error:', e);
          }
        },
      };
    }
  }

  // 给 HotTable 挂上 afterInit 钩子（一次性）
  useEffect(() => {
    if (!hotRef.current) return;
    const hot = hotRef.current;
    const initHF = () => {
      ensureHF().then((hf: any) => {
        if (!hot || !hf || !currentSheet) return;
        try {
          const sid = hf.getSheetId(currentSheet.name) ?? hf.addSheet(currentSheet.name);
          hf.clearSheet(sid);
          const data = currentSheet.data.map((r: string[]) =>
            r.map((c: string) => (typeof c === 'string' && c.startsWith('=') ? c : (c === '' || isNaN(Number(c)) ? c : Number(c))))
          );
          if (data.length && data[0].length) {
            hf.setCellContents({ row: 0, col: 0, sheet: sid }, data as any);
          }
          hot.updateSettings({ formulas: { engine: hf, sheetName: currentSheet.name } } as any);
        } catch (e) {
          console.warn('HF init error:', e);
        }
      }).catch((e: any) => console.warn('HF load error:', e));
    };
    initHF();
  }, [hotSettingsKey, ensureHF, currentSheet]);

  // ==================== 编辑器视图 ====================
  if (file && sheets.length > 0 && hotSettingsRef.current) {
    return (
      <div style={fullscreenStyle}>
        {/* 顶栏 */}
        <div style={topBarStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span onClick={closeFile} style={backLinkStyle}>← 返回</span>
            <span style={{ color: '#ccc' }}>/</span>
            <span style={{ fontSize: 14, fontWeight: 600 }}>{file.name}</span>
            <span style={{ fontSize: 12, color: '#999' }}>· {sheets.length} 个工作表</span>
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <button onClick={() => setZoom(z => Math.max(0.5, z - 0.1))} style={toolBtn}>🔍−</button>
            <span style={{ fontSize: 12, color: '#999', minWidth: 36, textAlign: 'center' }}>{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom(z => Math.min(2, z + 0.1))} style={toolBtn}>🔍+</button>
            <span style={sep} />
            <button onClick={handleAddRow} style={toolBtn}>＋行</button>
            <button onClick={handleAddCol} style={toolBtn}>＋列</button>
            <span style={sep} />
            <button onClick={handleExportCsv} style={toolBtn}>📄 CSV</button>
            <button onClick={handleExportXlsx} style={toolBtn}>📊 Excel</button>
            <button onClick={handleExportPdf} style={toolBtn}>📕 PDF</button>
            <span style={sep} />
            <button onClick={() => fileInputRef.current?.click()} style={toolBtn}>📤 重新上传</button>
            <button onClick={handleNewBlank} style={toolBtn}>🆕 新建</button>
          </div>
        </div>

        {/* 工作表标签 */}
        <div style={sheetTabBarStyle}>
          {sheets.map((sheet, idx) => (
            <div key={idx} onClick={() => setActiveSheet(idx)} style={{
              ...sheetTabStyle,
              color: idx === activeSheet ? '#1a1a1a' : '#888',
              borderBottomColor: idx === activeSheet ? '#2c2c2c' : 'transparent',
              fontWeight: idx === activeSheet ? 600 : 400,
            }}>{sheet.name}</div>
          ))}
        </div>

        {/* 公式栏 */}
        <div style={{ background: '#fafaf9', borderBottom: '1px solid #f0efec', display: 'flex', alignItems: 'center', padding: '4px 12px', gap: 8, flexShrink: 0 }}>
          <span style={{ fontSize: 11, color: '#999', fontWeight: 600, minWidth: 20 }}>fx</span>
          <FormulaBar hotRef={hotRef} />
        </div>

        {/* 表格编辑器 */}
        <div ref={tableContainerRef} style={{ flex: 1, overflow: 'hidden', margin: 12, background: '#fff', borderRadius: 10, boxShadow: '0 2px 16px rgba(0,0,0,.08)', position: 'relative' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden', zoom }}>
            <HotTable
              key="main-table"
              ref={(el: any) => { if (el) hotRef.current = el.hotInstance; }}
              {...hotSettingsRef.current}
            />
          </div>
        </div>

        <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" style={{ display: 'none' }} onChange={handleFileImport} />
      </div>
    );
  }

  // ==================== 首页 ====================
  return (
    <>
      <PageBanner icon="📈" title="Excel 集成" desc="在线表格编辑器：支持公式计算（SUM/IF/VLOOKUP 等 300+ 函数），排序筛选，导出 CSV/Excel/PDF" />
      <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" style={{ display: 'none' }} onChange={handleFileImport} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <Card title="📤 打开文件">
          <div style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📁</div>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>上传 Excel / CSV</div>
            <div style={{ fontSize: 12, color: '#999', marginBottom: 20 }}>在浏览器内直接编辑，数据不上传服务器</div>
            <button onClick={() => fileInputRef.current?.click()} disabled={loading} style={primaryBtn(loading)}>
              {loading ? '解析中...' : '选择文件'}
            </button>
            <div style={{ marginTop: 12, fontSize: 11, color: '#bbb' }}>.xlsx .xls .csv</div>
          </div>
        </Card>

        <Card title="🆕 新建表格">
          <div style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📈</div>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>从空白开始</div>
            <div style={{ fontSize: 12, color: '#999', marginBottom: 20 }}>10列 × 50行空表格，自由编辑</div>
            <button onClick={handleNewBlank} style={newBtnStyle}>新建表格</button>
          </div>
        </Card>
      </div>

      <div style={{ marginTop: 20 }}>
        <Card title="✨ 编辑器功能">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {[
              { icon: '🔢', title: '公式计算', desc: '=SUM / =IF / =VLOOKUP 等 300+ 函数' },
              { icon: '✏️', title: '单元格编辑', desc: '双击编辑，Tab/Enter 跳转' },
              { icon: '📋', title: '复制粘贴', desc: '支持 Ctrl+C/V 批量粘贴' },
              { icon: '↩️', title: '撤销重做', desc: 'Ctrl+Z / Ctrl+Y' },
              { icon: '🔤', title: '排序筛选', desc: '点击列头排序，支持筛选' },
              { icon: '📏', title: '行列调整', desc: '拖拽调整列宽行高' },
              { icon: '➕', title: '动态增删', desc: '右键菜单插入/删除行列' },
              { icon: '💾', title: '多格式导出', desc: 'CSV / Excel / PDF' },
              { icon: '🔍', title: '视图缩放', desc: '50%~200% 缩放查看' },
            ].map((f, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, padding: 10, background: '#fafaf9', borderRadius: 8 }}>
                <div style={{ fontSize: 20 }}>{f.icon}</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{f.title}</div>
                  <div style={{ fontSize: 11, color: '#888' }}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}

// ==================== 公式栏组件 ====================
function FormulaBar({ hotRef }: { hotRef: React.MutableRefObject<Handsontable | null> }) {
  const [value, setValue] = useState('');
  const [cellRef, setCellRef] = useState('');

  useEffect(() => {
    const hot = hotRef.current;
    if (!hot) return;

    const updateFormulaBar = () => {
      if (!hot) return;
      try {
        const sel = hot.getSelected();
        if (!sel || !sel.length) return;
        const [startRow, startCol, endRow, endCol] = sel[0];
        const cellValue = hot.getDataAtCell(startRow, startCol);
        setValue(cellValue != null ? String(cellValue) : '');
        if (startRow === endRow && startCol === endCol) {
          setCellRef(`${colToLetter(startCol)}${startRow + 1}`);
        } else {
          setCellRef(`${colToLetter(startCol)}${startRow + 1}:${colToLetter(endCol)}${endRow + 1}`);
        }
      } catch {}
    };

    try {
      updateFormulaBar();
      hot.addHook('afterSelection', updateFormulaBar);
      hot.addHook('afterChange', updateFormulaBar);
    } catch {}

    return () => {
      try {
        const h = hotRef.current;
        if (h) {
          try { h.removeHook('afterSelection', updateFormulaBar); } catch {}
          try { h.removeHook('afterChange', updateFormulaBar); } catch {}
        }
      } catch {}
    };
  }, [hotRef]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      const hot = hotRef.current;
      if (!hot) return;
      const sel = hot.getSelected();
      if (!sel || !sel.length) return;
      hot.setDataAtCell(sel[0][0], sel[0][1], value);
      (e.target as HTMLInputElement).blur();
      setTimeout(() => hot.selectCell(sel[0][0], sel[0][1]), 50);
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', flex: 1, gap: 6 }}>
      <div style={{
        background: '#fff', border: '1px solid #e0ded8', borderRadius: 6,
        padding: '4px 10px', fontSize: 12, fontFamily: 'monospace',
        color: '#666', minWidth: 48, textAlign: 'center', whiteSpace: 'nowrap',
      }}>{cellRef || '—'}</div>
      <input
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="输入值或公式（如 =SUM(A1:A10)）"
        style={{
          flex: 1, border: '1px solid #e0ded8', borderRadius: 6,
          padding: '4px 10px', fontSize: 13, fontFamily: 'monospace',
          outline: 'none', background: '#fff',
        }}
      />
    </div>
  );
}

// ==================== 样式常量 ====================
const fullscreenStyle: React.CSSProperties = {
  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
  background: '#f5f3f0', display: 'flex', flexDirection: 'column', zIndex: 100,
};
const topBarStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  padding: '8px 20px', background: '#fff', borderBottom: '1px solid #f0efec', flexShrink: 0,
};
const backLinkStyle: React.CSSProperties = { color: '#2c2c2c', cursor: 'pointer', fontSize: 13 };
const sheetTabBarStyle: React.CSSProperties = {
  background: '#fff', borderBottom: '1px solid #f0efec', display: 'flex',
  padding: '0 16px', overflowX: 'auto', flexShrink: 0,
};
const sheetTabStyle: React.CSSProperties = {
  padding: '10px 18px', cursor: 'pointer', fontSize: 13,
  borderBottom: '2px solid transparent', whiteSpace: 'nowrap', transition: 'all .15s',
};
const toolBtn: React.CSSProperties = {
  padding: '6px 14px', borderRadius: 8, fontSize: 12,
  background: '#f5f3f0', border: 'none', color: '#666', cursor: 'pointer',
};
const sep: React.CSSProperties = { width: 1, height: 20, background: '#e8e6e1', margin: '0 4px' };
const primaryBtn = (loading: boolean): React.CSSProperties => ({
  padding: '12px 32px', borderRadius: 10, fontSize: 14,
  background: '#2c2c2c', color: '#fff', border: 'none',
  cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 600,
  opacity: loading ? 0.6 : 1,
});
const newBtnStyle: React.CSSProperties = {
  padding: '12px 32px', borderRadius: 10, fontSize: 14,
  background: '#fff', color: '#2c2c2c', border: '1.5px solid #e0ded8',
  cursor: 'pointer', fontWeight: 600,
};

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}
