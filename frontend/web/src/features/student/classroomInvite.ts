/** 邀请链接只负责携带课堂码；加入课堂仍调用同一个学生接口。 */
export function classroomCodeFromLink(value: string): string | null {
  try {
    const url = new URL(value.trim());
    if (!['http:', 'https:'].includes(url.protocol) || url.pathname.replace(/\/$/, '') !== '/join-classroom') return null;
    const code = url.searchParams.get('code')?.trim().toUpperCase() || '';
    return /^[A-Z0-9]{8}$/.test(code) ? code : null;
  } catch {
    return null;
  }
}
