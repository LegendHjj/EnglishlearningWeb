// Keep pieces comfortably below Kokoro's 512-token phoneme window. The worker
// performs a precise, truncation-disabled tokenizer check and splits again if needed.
const MAX_CHARS = 240
const MAX_WORD_CHARS = 400

export function splitHeartInput(value: string): string[] {
  const text = value.trim()
  if (!text) return []
  const result: string[] = []
  // Keep punctuation attached to its word. Kokoro's own splitter understands
  // decimals and abbreviations; splitting on every period here corrupts them.
  const words = text.split(/\s+/).filter(Boolean)
  let part = ''
  for (const word of words) {
    if (word.length > MAX_WORD_CHARS) throw new Error('One word is too long for Heart to speak. Shorten it and try again.')
    const next = part ? `${part} ${word}` : word
    if (next.length > MAX_CHARS && part) { result.push(part); part = word }
    else part = next
  }
  if (part) result.push(part)
  return result
}

export function splitHeartSegment(value: string): [string, string] {
  const words = value.trim().split(/\s+/)
  if (words.length < 2) throw new Error('One word is too long for Heart to speak. Shorten it and try again.')
  const middle = Math.floor(words.length / 2)
  return [words.slice(0, middle).join(' '), words.slice(middle).join(' ')]
}
