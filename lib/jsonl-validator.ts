export interface ValidationError {
  line: number
  error: string
}

export interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
  lineCount: number
}

export function validateJSONL(content: string, minLines: number = 10): ValidationResult {
  const errors: ValidationError[] = []
  const lines = content.trim().split('\n').filter(line => line.trim().length > 0)
  
  if (lines.length < minLines) {
    errors.push({
      line: 0,
      error: `File must contain at least ${minLines} lines, found ${lines.length}`
    })
  }

  lines.forEach((line, index) => {
    try {
      const parsed = JSON.parse(line)
      
      if (!parsed.messages || !Array.isArray(parsed.messages)) {
        errors.push({
          line: index + 1,
          error: 'Missing or invalid "messages" array'
        })
        return
      }

      if (parsed.messages.length === 0) {
        errors.push({
          line: index + 1,
          error: 'Messages array cannot be empty'
        })
        return
      }

      // Validate message structure
      for (const msg of parsed.messages) {
        if (!msg.role || !['system', 'user', 'assistant'].includes(msg.role)) {
          errors.push({
            line: index + 1,
            error: `Invalid message role: ${msg.role}. Must be 'system', 'user', or 'assistant'`
          })
        }
        if (!msg.content || typeof msg.content !== 'string') {
          errors.push({
            line: index + 1,
            error: 'Message must have a string "content" field'
          })
        }
      }
    } catch (e) {
      errors.push({
        line: index + 1,
        error: `Invalid JSON: ${e instanceof Error ? e.message : 'Unknown error'}`
      })
    }
  })

  return {
    valid: errors.length === 0,
    errors,
    lineCount: lines.length
  }
}
