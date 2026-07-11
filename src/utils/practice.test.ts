import { expect, test } from 'vitest'
import { formatDuration, phraseHint, togglePinned } from './practice'

test('formats a recording timer',()=>expect(formatDuration(68)).toBe('01:08'))
test('shows only the phrase opening during Recall',()=>expect(phraseHint('From my understanding…','Recall')).toBe('From my…'))
test('caps pinned phrases at three',()=>expect(togglePinned(['p1','p2','p3'],'p4')).toEqual(['p1','p2','p3']))
