import { FlatButton } from '@chickadee/ui';

import './AskRung.css';

/** 목업의 placeholder — 무엇을 적으면 되는지를 예로 보여 준다. */
const PLACEHOLDER = '예: ?. 가 undefined 를 내면 그 다음 줄은 어떻게 되는지 모르겠어요';

export interface AskRungProps {
  /** 「막힌 지점」 입력값. */
  text: string;
  onText: (value: string) => void;
  /** 만들어진 프롬프트. 비어 있으면 「복사」가 잠긴다. */
  prompt?: string | undefined;
  onBuild: () => void;
  /**
   * 「복사」. 클립보드 쓰기는 여기서 하지 않는다 — 이 컴포넌트는 그릴 뿐이고,
   * 밖으로 나가는 일은 부르는 쪽이 한다 (정본 §3-1 ④ — 앱은 아무것도 스스로 전송하지 않는다).
   */
  onCopy: () => void;
}

/**
 * `.askbox` — 사다리 ④단, 자유 질문 (05 §5 · 정본 §3-1).
 *
 * 유일하게 선택 사항인 단이다. 키가 없어도 되고, 만드는 것은 프롬프트 글자뿐이다 —
 * 담는 것은 이 줄과 앞뒤 4줄, 그리고 파일 이름까지다.
 */
export function AskRung({ text, onText, prompt, onBuild, onCopy }: AskRungProps) {
  return (
    <>
      <h4>직접 물어보기</h4>
      <p>
        키가 없어도 됩니다. 아래 칸에 막힌 지점을 적으면 <b>이 줄과 앞뒤 4줄만</b> 담은 프롬프트를 만들어
        드립니다. 이 앱은 아무것도 스스로 전송하지 않습니다 — 복사해서 붙여넣는 순간에만 밖으로 나갑니다.
      </p>

      <div className="askbox">
        <textarea
          aria-label="막힌 지점"
          placeholder={PLACEHOLDER}
          value={text}
          onChange={(e) => onText(e.target.value)}
        />
        <div className="row">
          <FlatButton onClick={onBuild}>프롬프트 만들기</FlatButton>
          <FlatButton ghost disabled={prompt === undefined || prompt === ''} onClick={onCopy}>
            복사
          </FlatButton>
          <span className="note">API 키 없음 · 로컬 사전과 내 코드만 사용</span>
        </div>
        {prompt === undefined || prompt === '' ? null : <div className="prompt-out">{prompt}</div>}
      </div>
    </>
  );
}
