import { useAppStore } from '../stores/appStore';
import { Card, StatCard } from './ui';

export function Dashboard() {
  const setActivePanel = useAppStore((s) => s.setActivePanel);
  const showToast = (m: string) => alert(m);

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 24 }}>
        <StatCard label="今日翻译时长" value="2.5" unit="小时" trend="↑ 12% 较昨日" />
        <StatCard label="今日翻译次数" value="128" unit="次" trend="↑ 8% 较昨日" />
        <StatCard label="翻译准确率" value="96.8" unit="%" trend="↑ 0.3% 较昨日" />
      </div>

      <Card title="快捷操作">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
          {[
            { icon: '🎤', label: '开始录音', action: () => setActivePanel('translate') },
            { icon: '🌐', label: '实时翻译', action: () => setActivePanel('translate') },
            { icon: '📄', label: '静态转译', action: () => setActivePanel('static-trans') },
            { icon: '⚡', label: '模型设置', action: () => setActivePanel('model-config') },
          ].map((a) => (
            <div key={a.label} onClick={a.action} style={{ background: '#fafaf9', border: '1px solid #f0efec', borderRadius: 10, padding: 16, textAlign: 'center', cursor: 'pointer' }}>
              <div style={{ fontSize: 22, marginBottom: 6 }}>{a.icon}</div>
              <div style={{ fontSize: 12, color: '#888' }}>{a.label}</div>
            </div>
          ))}
        </div>
      </Card>

      <Card title="最近翻译">
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <tbody>
            {[
              ['EN→ZH', 'Let\'s discuss the quarterly revenue forecast...', '我们需要确定季度收入预测...', 'GPT-4o', '2分钟前'],
              ['ZH→EN', '我们需要在下周一之前完成这份报告', 'We need to finish this report by next Monday', 'GPT-4o', '15分钟前'],
              ['JA→ZH', '本日の会議の議題についてご説明します', '关于今天会议的议题进行说明', 'Claude 3.5', '1小时前'],
              ['EN→ZH', 'The quarterly results are in', '季度结果出来了', 'GPT-4o', '2小时前'],
            ].map((r, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #fafaf9' }}>
                <td style={{ padding: '10px 12px' }}><span style={{ fontSize: 10, color: '#bbb', background: '#f5f3f0', padding: '2px 6px', borderRadius: 4 }}>{r[0]}</span></td>
                <td style={{ padding: '10px 12px', color: '#555' }}>{r[1]}</td>
                <td style={{ padding: '10px 12px', color: '#555' }}>{r[2]}</td>
                <td style={{ padding: '10px 12px', color: '#999', fontSize: 12 }}>{r[3]}</td>
                <td style={{ padding: '10px 12px', color: '#bbb', fontSize: 11 }}>{r[4]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card title="术语库">
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <tbody>
            {[
              ['机器学习', 'Machine Learning', 'ZH→EN', '技术'],
              ['董事会', 'Board of Directors', 'ZH→EN', '商务'],
              ['财报', 'Financial Report', 'ZH→EN', '金融'],
            ].map((r, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #fafaf9' }}>
                <td style={{ padding: '10px 12px', color: '#555' }}>{r[0]}</td>
                <td style={{ padding: '10px 12px', color: '#555' }}>{r[1]}</td>
                <td style={{ padding: '10px 12px' }}><span style={{ fontSize: 10, color: '#bbb', background: '#f5f3f0', padding: '2px 6px', borderRadius: 4 }}>{r[2]}</span></td>
                <td style={{ padding: '10px 12px', color: '#999', fontSize: 12 }}>{r[3]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}
