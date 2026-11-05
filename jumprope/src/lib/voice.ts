/** 音声フィードバック（ポケットの中でも状態が分かるように） */
let enabled = true;

export function setVoiceEnabled(v: boolean) {
  enabled = v;
}

/** iOS はユーザー操作中に一度発話しておかないと以後鳴らないため、開始ボタンで呼ぶ */
export function unlockVoice() {
  if (!('speechSynthesis' in window)) return;
  const u = new SpeechSynthesisUtterance(' ');
  u.volume = 0;
  window.speechSynthesis.speak(u);
}

export function say(text: string) {
  if (!enabled || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'ja-JP';
  u.rate = 1.1;
  window.speechSynthesis.speak(u);
}
