/**
 * UTC 시간 문자열을 Date 객체로 파싱
 * 서버에서 타임존 정보 없이 UTC 시간을 내려주면 'Z'를 붙여서 UTC로 인식하게 함
 */
function parseUTCDate(dateString: string): Date {
  // 이미 타임존 정보가 있으면 그대로 파싱
  if (dateString.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(dateString)) {
    return new Date(dateString)
  }
  // 타임존 정보가 없으면 UTC로 간주하여 Z를 붙임
  return new Date(dateString + 'Z')
}

/**
 * 메시지 시간 포맷 (HH:mm)
 */
export function formatTime(dateString: string): string {
  return parseUTCDate(dateString).toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * 상대 시간 포맷 (방금, N분 전, N시간 전, N일 전, MM월 DD일)
 */
export function formatRelativeTime(dateString: string): string {
  const date = parseUTCDate(dateString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return '방금'
  if (minutes < 60) return `${minutes}분 전`
  if (hours < 24) return `${hours}시간 전`
  if (days < 7) return `${days}일 전`

  return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
}

/**
 * 날짜+시간 포맷 (MM월 DD일 HH:mm)
 */
export function formatDateTime(dateString: string): string {
  return parseUTCDate(dateString).toLocaleDateString('ko-KR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
