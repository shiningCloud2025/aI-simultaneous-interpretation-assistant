import { Card, SettingRow } from './ui';

export function HelpPage() {
  return (
    <>
      <Card title="常见问题">
        {[
          ['如何开始翻译？', '点击麦克风按钮即可开始录音翻译'],
          ['支持哪些语言？', '支持中文、English、日本語、한국어等12种语言'],
          ['如何切换翻译模型？', '在工具栏或设置页的模型配置中切换'],
          ['翻译准确率低怎么办？', '建议使用术语库和纠错功能提升准确率'],
        ].map(([q, a]) => (
          <SettingRow key={q} label={q}>
            <span onClick={() => alert(a)} style={{ color: '#2c2c2c', cursor: 'pointer', textDecoration: 'underline', fontSize: 12 }}>查看</span>
          </SettingRow>
        ))}
      </Card>
      <Card title="意见反馈">
        <div style={{ marginBottom: 16 }}><div style={{ fontSize: 13, color: '#666', marginBottom: 6, fontWeight: 500 }}>反馈类型</div>
          <select style={{ width: '100%', padding: '11px 14px', border: '1px solid #e8e6e1', borderRadius: 10, fontSize: 14, color: '#555', background: '#f7f6f4', outline: 'none' }}>
            <option>功能建议</option><option>Bug 反馈</option><option>使用问题</option><option>其他</option>
          </select>
        </div>
        <div style={{ marginBottom: 16 }}><div style={{ fontSize: 13, color: '#666', marginBottom: 6, fontWeight: 500 }}>详细描述</div>
          <textarea style={{ width: '100%', padding: '11px 14px', background: '#f7f6f4', border: '1px solid #e8e6e1', borderRadius: 10, fontSize: 14, outline: 'none', fontFamily: 'inherit', resize: 'vertical', minHeight: 80 }} placeholder="请描述你的问题或建议..." />
        </div>
        <button style={{ padding: '12px 36px', background: '#2c2c2c', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>提 交 反 馈</button>
      </Card>
    </>
  );
}
