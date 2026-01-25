import React, { useState } from 'react'
import styled from 'styled-components'
import { Plus, GripVertical, Copy, Trash2, ChevronDown, ChevronUp, X } from 'lucide-react'

// Types
export type QuestionType = 'short_answer' | 'paragraph' | 'multiple_choice' | 'checkboxes' | 'dropdown' | 'linear_scale' | 'date' | 'time'

export interface FormQuestion {
  id: string
  type: QuestionType
  question: string
  description?: string
  required: boolean
  options?: string[]
  minScale?: number
  maxScale?: number
  minLabel?: string
  maxLabel?: string
}

// Props
interface FormBuilderProps {
  questions: FormQuestion[]
  onChange: (questions: FormQuestion[]) => void
  disabled?: boolean
  maxQuestions?: number
}

const FormBuilder: React.FC<FormBuilderProps> = ({ questions, onChange, disabled = false, maxQuestions }) => {
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null)

  // Question Management Functions
  const addQuestion = (type: QuestionType) => {
    if (maxQuestions && questions.length >= maxQuestions) return

    const newQuestion: FormQuestion = {
      id: `q_${Date.now()}`,
      type,
      question: 'Untitled Question',
      required: false,
      ...(type === 'multiple_choice' || type === 'checkboxes' || type === 'dropdown' ? { options: ['Option 1'] } : {}),
      ...(type === 'linear_scale' ? { minScale: 1, maxScale: 5, minLabel: '', maxLabel: '' } : {})
    }

    onChange([...questions, newQuestion])
    setEditingQuestionId(newQuestion.id)
  }

  const updateQuestion = (id: string, updates: Partial<FormQuestion>) => {
    onChange(questions.map(q => q.id === id ? { ...q, ...updates } : q))
  }

  const duplicateQuestion = (id: string) => {
    const questionToDuplicate = questions.find(q => q.id === id)
    if (!questionToDuplicate) return

    const duplicatedQuestion: FormQuestion = {
      ...questionToDuplicate,
      id: `q_${Date.now()}`,
      question: `${questionToDuplicate.question} (Copy)`
    }

    const index = questions.findIndex(q => q.id === id)
    const newQuestions = [...questions]
    newQuestions.splice(index + 1, 0, duplicatedQuestion)
    onChange(newQuestions)
  }

  const removeQuestion = (id: string) => {
    onChange(questions.filter(q => q.id !== id))
    if (editingQuestionId === id) {
      setEditingQuestionId(null)
    }
  }

  const addOption = (questionId: string) => {
    const question = questions.find(q => q.id === questionId)
    if (!question || !question.options) return

    const newOptions = [...question.options, `Option ${question.options.length + 1}`]
    updateQuestion(questionId, { options: newOptions })
  }

  const updateOption = (questionId: string, optionIndex: number, value: string) => {
    const question = questions.find(q => q.id === questionId)
    if (!question || !question.options) return

    const newOptions = [...question.options]
    newOptions[optionIndex] = value
    updateQuestion(questionId, { options: newOptions })
  }

  const removeOption = (questionId: string, optionIndex: number) => {
    const question = questions.find(q => q.id === questionId)
    if (!question || !question.options || question.options.length <= 1) return

    const newOptions = question.options.filter((_, i) => i !== optionIndex)
    updateQuestion(questionId, { options: newOptions })
  }

  const moveQuestion = (id: string, direction: 'up' | 'down') => {
    const index = questions.findIndex(q => q.id === id)
    if (index === -1) return
    if (direction === 'up' && index === 0) return
    if (direction === 'down' && index === questions.length - 1) return

    const newQuestions = [...questions]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    ;[newQuestions[index], newQuestions[targetIndex]] = [newQuestions[targetIndex], newQuestions[index]]
    onChange(newQuestions)
  }

  const questionTypes: { type: QuestionType; label: string }[] = [
    { type: 'short_answer', label: 'Short Answer' },
    { type: 'paragraph', label: 'Paragraph' },
    { type: 'multiple_choice', label: 'Multiple Choice' },
    { type: 'checkboxes', label: 'Checkboxes' },
    { type: 'dropdown', label: 'Dropdown' },
    { type: 'linear_scale', label: 'Linear Scale' },
    { type: 'date', label: 'Date' },
    { type: 'time', label: 'Time' }
  ]

  return (
    <FormBuilderContainer>
      <QuestionTypeSelector>
        <SelectorLabel>Add Question:</SelectorLabel>
        <TypeButtonsGrid>
          {questionTypes.map(({ type, label }) => (
            <TypeButton
              key={type}
              type="button"
              onClick={() => addQuestion(type)}
              disabled={disabled || (maxQuestions ? questions.length >= maxQuestions : false)}
            >
              <Plus size={16} />
              {label}
            </TypeButton>
          ))}
        </TypeButtonsGrid>
      </QuestionTypeSelector>

      {questions.length > 0 && (
        <QuestionsList>
          {questions.map((question, index) => (
            <QuestionCard key={question.id} $isEditing={editingQuestionId === question.id}>
              <QuestionHeader>
                <QuestionDragHandle>
                  <GripVertical size={20} />
                </QuestionDragHandle>
                <QuestionTitleInput
                  type="text"
                  value={question.question}
                  onChange={(e) => updateQuestion(question.id, { question: e.target.value })}
                  onFocus={() => setEditingQuestionId(question.id)}
                  disabled={disabled}
                  placeholder="Question"
                />
                <QuestionTypeLabel>{question.type.replace('_', ' ')}</QuestionTypeLabel>
              </QuestionHeader>

              <QuestionDescInput
                value={question.description || ''}
                onChange={(e) => updateQuestion(question.id, { description: e.target.value })}
                placeholder="Description (optional)"
                disabled={disabled}
              />

              {(question.type === 'multiple_choice' || question.type === 'checkboxes' || question.type === 'dropdown') && (
                <OptionsContainer>
                  {question.options?.map((option, optIndex) => (
                    <OptionItem key={optIndex}>
                      <OptionInput
                        type="text"
                        value={option}
                        onChange={(e) => updateOption(question.id, optIndex, e.target.value)}
                        placeholder={`Option ${optIndex + 1}`}
                        disabled={disabled}
                      />
                      {!disabled && question.options && question.options.length > 1 && (
                        <IconButton
                          type="button"
                          onClick={() => removeOption(question.id, optIndex)}
                          title="Remove option"
                        >
                          <X size={16} />
                        </IconButton>
                      )}
                    </OptionItem>
                  ))}
                  {!disabled && (
                    <AddOptionButton type="button" onClick={() => addOption(question.id)}>
                      <Plus size={16} />
                      Add Option
                    </AddOptionButton>
                  )}
                </OptionsContainer>
              )}

              {question.type === 'linear_scale' && (
                <ScaleContainer>
                  <ScaleRow>
                    <ScaleInput
                      type="number"
                      value={question.minScale || 1}
                      onChange={(e) => updateQuestion(question.id, { minScale: parseInt(e.target.value) || 1 })}
                      min="0"
                      max="10"
                      disabled={disabled}
                    />
                    <span>to</span>
                    <ScaleInput
                      type="number"
                      value={question.maxScale || 5}
                      onChange={(e) => updateQuestion(question.id, { maxScale: parseInt(e.target.value) || 5 })}
                      min="0"
                      max="10"
                      disabled={disabled}
                    />
                  </ScaleRow>
                  <ScaleLabels>
                    <ScaleLabelInput
                      type="text"
                      value={question.minLabel || ''}
                      onChange={(e) => updateQuestion(question.id, { minLabel: e.target.value })}
                      placeholder="Label (min)"
                      disabled={disabled}
                    />
                    <ScaleLabelInput
                      type="text"
                      value={question.maxLabel || ''}
                      onChange={(e) => updateQuestion(question.id, { maxLabel: e.target.value })}
                      placeholder="Label (max)"
                      disabled={disabled}
                    />
                  </ScaleLabels>
                </ScaleContainer>
              )}

              <QuestionFooter>
                <RequiredCheckbox>
                  <input
                    type="checkbox"
                    checked={question.required}
                    onChange={(e) => updateQuestion(question.id, { required: e.target.checked })}
                    disabled={disabled}
                  />
                  <span>Required</span>
                </RequiredCheckbox>
                {!disabled && (
                  <QuestionActions>
                    <ActionButton
                      type="button"
                      onClick={() => moveQuestion(question.id, 'up')}
                      disabled={index === 0}
                      title="Move up"
                    >
                      <ChevronUp size={18} />
                    </ActionButton>
                    <ActionButton
                      type="button"
                      onClick={() => moveQuestion(question.id, 'down')}
                      disabled={index === questions.length - 1}
                      title="Move down"
                    >
                      <ChevronDown size={18} />
                    </ActionButton>
                    <ActionButton
                      type="button"
                      onClick={() => duplicateQuestion(question.id)}
                      title="Duplicate"
                    >
                      <Copy size={18} />
                    </ActionButton>
                    <ActionButton
                      type="button"
                      onClick={() => removeQuestion(question.id)}
                      $danger
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </ActionButton>
                  </QuestionActions>
                )}
              </QuestionFooter>
            </QuestionCard>
          ))}
        </QuestionsList>
      )}

      {questions.length === 0 && (
        <EmptyState>
          <EmptyStateText>No questions yet. Click a button above to add your first question.</EmptyStateText>
        </EmptyState>
      )}
    </FormBuilderContainer>
  )
}

// Styled Components
const FormBuilderContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`

const QuestionTypeSelector = styled.div`
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
`

const SelectorLabel = styled.h3`
  font-size: 1rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  margin: 0 0 1rem 0;
`

const TypeButtonsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 0.75rem;
`

const TypeButton = styled.button`
  padding: 0.75rem 1rem;
  background: rgba(99, 102, 241, 0.1);
  border: 1px solid rgba(99, 102, 241, 0.2);
  border-radius: 8px;
  color: #a78bfa;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background: rgba(99, 102, 241, 0.2);
    border-color: rgba(99, 102, 241, 0.4);
    transform: translateY(-2px);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

const QuestionsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`

const QuestionCard = styled.div<{ $isEditing?: boolean }>`
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid ${props => props.$isEditing ? 'rgba(99, 102, 241, 0.4)' : 'rgba(255, 255, 255, 0.1)'};
  border-radius: 12px;
  transition: all 0.2s ease;

  &:hover {
    border-color: rgba(99, 102, 241, 0.3);
  }
`

const QuestionHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
`

const QuestionDragHandle = styled.div`
  color: rgba(255, 255, 255, 0.4);
  cursor: grab;
  display: flex;
  align-items: center;

  &:active {
    cursor: grabbing;
  }
`

const QuestionTitleInput = styled.input`
  flex: 1;
  padding: 0.625rem 0.875rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  color: #ffffff;
  font-size: 1rem;
  font-weight: 500;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: rgba(99, 102, 241, 0.5);
    background: rgba(255, 255, 255, 0.08);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`

const QuestionTypeLabel = styled.span`
  padding: 0.375rem 0.75rem;
  background: rgba(99, 102, 241, 0.15);
  border: 1px solid rgba(99, 102, 241, 0.25);
  border-radius: 6px;
  color: #a78bfa;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: capitalize;
  white-space: nowrap;
`

const QuestionDescInput = styled.textarea`
  width: 100%;
  padding: 0.625rem 0.875rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 6px;
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.875rem;
  font-family: inherit;
  resize: vertical;
  min-height: 50px;
  transition: all 0.2s ease;
  margin-bottom: 0.75rem;

  &:focus {
    outline: none;
    border-color: rgba(99, 102, 241, 0.4);
    background: rgba(255, 255, 255, 0.05);
  }

  &::placeholder {
    color: rgba(255, 255, 255, 0.3);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`

const OptionsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
`

const OptionItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`

const OptionInput = styled.input`
  flex: 1;
  padding: 0.5rem 0.75rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 6px;
  color: #ffffff;
  font-size: 0.875rem;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: rgba(99, 102, 241, 0.4);
    background: rgba(255, 255, 255, 0.05);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`

const IconButton = styled.button`
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  color: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(239, 68, 68, 0.2);
    border-color: rgba(239, 68, 68, 0.4);
    color: #fca5a5;
  }
`

const AddOptionButton = styled.button`
  padding: 0.5rem 0.75rem;
  background: rgba(99, 102, 241, 0.1);
  border: 1px solid rgba(99, 102, 241, 0.2);
  border-radius: 6px;
  color: #a78bfa;
  font-size: 0.875rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(99, 102, 241, 0.2);
    border-color: rgba(99, 102, 241, 0.3);
  }
`

const ScaleContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
`

const ScaleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;

  span {
    color: rgba(255, 255, 255, 0.6);
    font-size: 0.875rem;
  }
`

const ScaleInput = styled.input`
  width: 80px;
  padding: 0.5rem 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  color: #ffffff;
  font-size: 0.875rem;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: rgba(99, 102, 241, 0.4);
    background: rgba(255, 255, 255, 0.08);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`

const ScaleLabels = styled.div`
  display: flex;
  gap: 0.75rem;
`

const ScaleLabelInput = styled.input`
  flex: 1;
  padding: 0.5rem 0.75rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 6px;
  color: #ffffff;
  font-size: 0.875rem;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: rgba(99, 102, 241, 0.4);
    background: rgba(255, 255, 255, 0.05);
  }

  &::placeholder {
    color: rgba(255, 255, 255, 0.3);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`

const QuestionFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 0.75rem;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
`

const RequiredCheckbox = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.875rem;

  input[type="checkbox"] {
    cursor: pointer;
  }

  input[type="checkbox"]:disabled {
    cursor: not-allowed;
  }
`

const QuestionActions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`

const ActionButton = styled.button<{ $danger?: boolean }>`
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  color: ${props => props.$danger ? '#fca5a5' : 'rgba(255, 255, 255, 0.6)'};
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background: ${props => props.$danger ? 'rgba(239, 68, 68, 0.2)' : 'rgba(99, 102, 241, 0.2)'};
    border-color: ${props => props.$danger ? 'rgba(239, 68, 68, 0.4)' : 'rgba(99, 102, 241, 0.3)'};
    color: ${props => props.$danger ? '#fca5a5' : '#a78bfa'};
  }

  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
`

const EmptyState = styled.div`
  padding: 3rem 2rem;
  text-align: center;
  background: rgba(255, 255, 255, 0.03);
  border: 1px dashed rgba(255, 255, 255, 0.1);
  border-radius: 12px;
`

const EmptyStateText = styled.p`
  margin: 0;
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.9375rem;
`

export default FormBuilder
