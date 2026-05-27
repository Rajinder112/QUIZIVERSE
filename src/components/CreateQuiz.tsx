import React, { useState, useRef } from 'react';
import { useGame } from '../context/GameContext';
import type { Question, Quiz } from '../context/GameContext';
import { Plus, Trash2, ArrowLeft, Save, AlertCircle, FileUp, Info } from 'lucide-react';
import { read, utils } from 'xlsx';

export const CreateQuiz: React.FC = () => {
  const { saveQuiz, setGameState, editingQuiz, setEditingQuiz } = useGame();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [successMessage, setSuccessMessage] = useState('');

  const [title, setTitle] = useState(editingQuiz?.title ?? '');
  const [questions, setQuestions] = useState<Omit<Question, 'id'>[]>(
    editingQuiz
      ? editingQuiz.questions.map(({ text, options, correctAnswer }) => ({ text, options, correctAnswer }))
      : [{ text: '', options: ['', '', '', ''], correctAnswer: 0 }]
  );
  const [errors, setErrors] = useState<{ title?: string; questionIndex?: number; message?: string }>({});

  const handleSpreadsheetUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        const workbook = read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows = utils.sheet_to_json<any>(sheet, { header: 1 });

        if (rows.length < 2) {
          setErrors({ message: 'The uploaded file is empty or missing data rows.' });
          setSuccessMessage('');
          return;
        }

        // Headers (first row)
        const headers = rows[0].map((h: any) => String(h).trim().toLowerCase());
        
        // Find indexes for columns
        const qIdx = headers.findIndex((h: string) => h.includes('question'));
        const o1Idx = headers.findIndex((h: string) => h.includes('option 1') || h.includes('option a'));
        const o2Idx = headers.findIndex((h: string) => h.includes('option 2') || h.includes('option b'));
        const o3Idx = headers.findIndex((h: string) => h.includes('option 3') || h.includes('option c'));
        const o4Idx = headers.findIndex((h: string) => h.includes('option 4') || h.includes('option d'));
        const ansIdx = headers.findIndex((h: string) => h.includes('correct') || h.includes('answer'));

        // Fallback to absolute indexes if headers not found by name
        const finalQIdx = qIdx !== -1 ? qIdx : 0;
        const finalO1Idx = o1Idx !== -1 ? o1Idx : 1;
        const finalO2Idx = o2Idx !== -1 ? o2Idx : 2;
        const finalO3Idx = o3Idx !== -1 ? o3Idx : 3;
        const finalO4Idx = o4Idx !== -1 ? o4Idx : 4;
        const finalAnsIdx = ansIdx !== -1 ? ansIdx : 5;

        const parsedQuestions: Omit<Question, 'id'>[] = [];

        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row || row.length === 0) continue;

          const qText = row[finalQIdx] !== undefined ? String(row[finalQIdx]).trim() : '';
          const opt1 = row[finalO1Idx] !== undefined ? String(row[finalO1Idx]).trim() : '';
          const opt2 = row[finalO2Idx] !== undefined ? String(row[finalO2Idx]).trim() : '';
          const opt3 = row[finalO3Idx] !== undefined ? String(row[finalO3Idx]).trim() : '';
          const opt4 = row[finalO4Idx] !== undefined ? String(row[finalO4Idx]).trim() : '';
          const rawAns = row[finalAnsIdx] !== undefined ? String(row[finalAnsIdx]).trim() : '';

          // Skip completely blank rows
          if (!qText && !opt1 && !opt2 && !opt3 && !opt4) continue;

          if (!qText || !opt1 || !opt2 || !opt3 || !opt4 || !rawAns) {
            throw new Error(`Row ${i + 1} has blank columns. Question text, options 1-4, and Correct Answer are required.`);
          }

          let correctAnswerIndex = 0;
          const normalizedAns = rawAns.toLowerCase();

          // 1. Try matching index 0-3
          if (['0', '1', '2', '3'].includes(normalizedAns)) {
            correctAnswerIndex = parseInt(normalizedAns, 10);
          }
          // 2. Try matching option number 1-4
          else if (['1', '2', '3', '4'].includes(normalizedAns)) {
            correctAnswerIndex = parseInt(normalizedAns, 10) - 1;
          }
          // 3. Try matching option letter A-D
          else if (normalizedAns === 'a') correctAnswerIndex = 0;
          else if (normalizedAns === 'b') correctAnswerIndex = 1;
          else if (normalizedAns === 'c') correctAnswerIndex = 2;
          else if (normalizedAns === 'd') correctAnswerIndex = 3;
          // 4. Try matching option exact text
          else {
            const optionsLower = [opt1.toLowerCase(), opt2.toLowerCase(), opt3.toLowerCase(), opt4.toLowerCase()];
            const matchIdx = optionsLower.indexOf(normalizedAns);
            if (matchIdx !== -1) {
              correctAnswerIndex = matchIdx;
            } else {
              throw new Error(`Row ${i + 1}: Correct Answer value "${rawAns}" does not match options A/B/C/D, number 1-4, or option texts.`);
            }
          }

          parsedQuestions.push({
            text: qText,
            options: [opt1, opt2, opt3, opt4],
            correctAnswer: correctAnswerIndex
          });
        }

        if (parsedQuestions.length === 0) {
          throw new Error('No valid questions parsed from the spreadsheet.');
        }

        setQuestions(parsedQuestions);
        setErrors({});
        setSuccessMessage(`Successfully imported ${parsedQuestions.length} questions!`);
      } catch (err: any) {
        setErrors({ message: err.message || 'Failed to read spreadsheet file.' });
        setSuccessMessage('');
      }
    };

    reader.onerror = () => {
      setErrors({ message: 'FileReader failed to parse files.' });
      setSuccessMessage('');
    };

    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  const handleAddQuestion = () => {
    setQuestions([
      ...questions,
      {
        text: '',
        options: ['', '', '', ''],
        correctAnswer: 0,
      }
    ]);
  };

  const handleRemoveQuestion = (index: number) => {
    if (questions.length <= 1) return;
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleQuestionTextChange = (index: number, text: string) => {
    const updated = [...questions];
    updated[index].text = text;
    setQuestions(updated);
  };

  const handleOptionChange = (qIndex: number, optIndex: number, text: string) => {
    const updated = [...questions];
    updated[qIndex].options[optIndex] = text;
    setQuestions(updated);
  };

  const handleCorrectAnswerChange = (qIndex: number, optIndex: number) => {
    const updated = [...questions];
    updated[qIndex].correctAnswer = optIndex;
    setQuestions(updated);
  };

  const handleSave = () => {
    // Validation
    if (!title.trim()) {
      setErrors({ title: 'Quiz Title is required!' });
      return;
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.text.trim()) {
        setErrors({ 
          questionIndex: i, 
          message: `Question ${i + 1} text is required!` 
        });
        return;
      }
      for (let o = 0; o < 4; o++) {
        if (!q.options[o].trim()) {
          setErrors({ 
            questionIndex: i, 
            message: `Option ${o + 1} in Question ${i + 1} cannot be empty!` 
          });
          return;
        }
      }
    }

    // Save — reuse existing id when editing so saveQuiz replaces it
    const finalQuiz: Quiz = {
      id: editingQuiz ? editingQuiz.id : 'quiz_' + Math.random().toString(36).substring(2, 9),
      title: title.trim(),
      questions: questions.map((q, idx) => ({
        ...q,
        id: `q_${idx}_${Date.now()}`
      }))
    };

    saveQuiz(finalQuiz);
    setEditingQuiz(null);
    setGameState('idle');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={() => { setEditingQuiz(null); setGameState('idle'); }}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white hover:border-slate-700 hover:bg-slate-800/50 transition-all"
        >
          <ArrowLeft size={18} />
          Back to Dashboard
        </button>

        <h1 className="text-3xl font-extrabold bg-gradient-to-r from-quizPurple to-blue-400 bg-clip-text text-transparent">
          {editingQuiz ? 'Edit Quiz' : 'Create Custom Quiz'}
        </h1>
        
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-6 py-2.5 bg-quizPurple hover:bg-quizPurple-hover text-white rounded-xl shadow-lg shadow-quizPurple/20 font-semibold transition-all hover:scale-105 active:scale-95"
        >
          <Save size={18} />
          Save Quiz
        </button>
      </div>

      {/* Validation & Success Banners */}
      {Object.keys(errors).length > 0 && (
        <div className="mb-6 p-4 bg-red-950/60 border border-red-500/50 rounded-xl flex items-center gap-3 text-red-300">
          <AlertCircle size={20} className="text-red-400 shrink-0" />
          <span>{errors.title || errors.message}</span>
        </div>
      )}
      {successMessage && (
        <div className="mb-6 p-4 bg-emerald-950/60 border border-emerald-500/50 rounded-xl flex items-center gap-3 text-emerald-300 animate-scale-in">
          <Info size={20} className="text-emerald-400 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Form Fields */}
      <div className="space-y-6">
        {/* Title Input */}
        <div className="glass-card p-6">
          <label className="block text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Quiz Title
          </label>
          <input
            type="text"
            placeholder="e.g., Ultimate Harry Potter Trivia"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setErrors({});
            }}
            className="w-full px-4 py-3 bg-slate-950/80 border border-slate-800 focus:border-quizPurple focus:ring-1 focus:ring-quizPurple rounded-xl text-white outline-none transition-all placeholder:text-slate-600 text-lg"
          />
        </div>

        {/* Spreadsheet Import Card */}
        <div className="glass-card p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-quizPurple/10 border border-quizPurple/20 text-quizPurple rounded-xl shrink-0 mt-0.5">
                <FileUp size={20} />
              </div>
              <div>
                <h4 className="font-bold text-white text-sm">Import from Spreadsheet</h4>
                <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                  Upload an Excel (`.xlsx`, `.xls`) or `.csv` file to import questions in bulk.
                </p>
              </div>
            </div>
            
            <div>
              <input
                type="file"
                ref={fileInputRef}
                accept=".xlsx,.xls,.csv"
                onChange={handleSpreadsheetUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 border border-slate-800 text-slate-200 hover:text-white hover:border-slate-700 hover:bg-slate-800/80 rounded-xl transition-all text-sm font-semibold w-full md:w-auto justify-center cursor-pointer"
              >
                <FileUp size={16} />
                Choose File
              </button>
            </div>
          </div>

          {/* Info Box detailing columns */}
          <div className="mt-4 p-4 bg-slate-950/60 border border-slate-900 rounded-xl text-xs text-slate-400 leading-relaxed flex items-start gap-2.5">
            <Info size={16} className="text-quizPurple shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-350 block mb-1">Expected Template Structure:</span>
              Your spreadsheet should have headers in the first row. We look for columns named: 
              <code className="text-quizPurple font-bold mx-1 font-mono">Question</code>, 
              <code className="text-quizPurple font-bold mx-1 font-mono">Option 1</code>, 
              <code className="text-quizPurple font-bold mx-1 font-mono">Option 2</code>, 
              <code className="text-quizPurple font-bold mx-1 font-mono">Option 3</code>, 
              <code className="text-quizPurple font-bold mx-1 font-mono">Option 4</code>, and 
              <code className="text-quizPurple font-bold mx-1 font-mono">Correct Answer</code>. 
              <span className="block mt-1.5 font-semibold text-slate-350">
                Correct Answer can be a number (1-4), index (0-3), letter (A-D), or the matching option text itself.
              </span>
            </div>
          </div>
        </div>

        {/* Questions list */}
        <div className="space-y-6">
          {questions.map((q, qIndex) => (
            <div 
              key={qIndex} 
              className={`glass-card p-6 border transition-all duration-300 ${
                errors.questionIndex === qIndex ? 'border-red-500/50 ring-1 ring-red-500/20' : 'border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-800">
                <span className="text-lg font-bold text-slate-300">
                  Question {qIndex + 1} of {questions.length}
                </span>
                
                {questions.length > 1 && (
                  <button
                    onClick={() => handleRemoveQuestion(qIndex)}
                    className="p-2 text-slate-500 hover:text-red-400 hover:bg-slate-900/60 rounded-lg transition-all"
                    title="Delete Question"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>

              {/* Question Text */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Question Prompt
                </label>
                <input
                  type="text"
                  placeholder="What is the question you want to ask?"
                  value={q.text}
                  onChange={(e) => {
                    handleQuestionTextChange(qIndex, e.target.value);
                    setErrors({});
                  }}
                  className="w-full px-4 py-3 bg-slate-950/80 border border-slate-800 focus:border-quizPurple focus:ring-1 focus:ring-quizPurple rounded-xl text-white outline-none transition-all"
                />
              </div>

              {/* Options */}
              <div>
                <label className="block text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
                  Answer Options & Correct Answer Selection
                </label>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {q.options.map((opt, optIndex) => {
                    // Colors mapping for options
                    const borders = [
                      'focus:border-red-500 border-slate-800/80',
                      'focus:border-blue-500 border-slate-800/80',
                      'focus:border-yellow-500 border-slate-800/80',
                      'focus:border-emerald-500 border-slate-800/80'
                    ];
                    
                    const optionLabels = ['A', 'B', 'C', 'D'];
                    const dotColors = ['bg-red-500', 'bg-blue-500', 'bg-yellow-500', 'bg-emerald-500'];

                    const isCorrect = q.correctAnswer === optIndex;

                    return (
                      <div 
                        key={optIndex} 
                        className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                          isCorrect 
                            ? 'bg-slate-900 border-slate-700/80 ring-1 ring-quizPurple/20' 
                            : 'bg-slate-950/50 border-slate-900/50'
                        }`}
                      >
                        {/* Radio select */}
                        <button
                          type="button"
                          onClick={() => handleCorrectAnswerChange(qIndex, optIndex)}
                          className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all shrink-0 ${
                            isCorrect 
                              ? 'border-quizPurple bg-quizPurple text-white' 
                              : 'border-slate-700 hover:border-slate-500'
                          }`}
                        >
                          {isCorrect && (
                            <div className="w-2.5 h-2.5 bg-white rounded-full" />
                          )}
                        </button>

                        <div className="flex items-center gap-2 w-full">
                          <span className={`w-6 h-6 text-xs font-bold rounded flex items-center justify-center text-white shrink-0 ${dotColors[optIndex]}`}>
                            {optionLabels[optIndex]}
                          </span>
                          <input
                            type="text"
                            placeholder={`Option ${optionLabels[optIndex]}`}
                            value={opt}
                            onChange={(e) => {
                              handleOptionChange(qIndex, optIndex, e.target.value);
                              setErrors({});
                            }}
                            className={`w-full bg-slate-950 px-3 py-2 border rounded-lg outline-none text-sm text-slate-200 transition-all ${borders[optIndex]}`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add Question Button */}
        <button
          onClick={handleAddQuestion}
          className="w-full flex items-center justify-center gap-2 py-4 bg-slate-900 border-2 border-dashed border-slate-800 text-slate-400 hover:text-white hover:border-quizPurple/50 hover:bg-slate-900/80 rounded-2xl transition-all font-semibold"
        >
          <Plus size={18} />
          Add Another Question
        </button>

        {/* Save Bar Sticky */}
        <div className="flex justify-end gap-4 pt-4 pb-8">
          <button
            onClick={() => { setEditingQuiz(null); setGameState('idle'); }}
            className="px-6 py-3 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white hover:border-slate-700 hover:bg-slate-800 transition-all font-semibold"
          >
            Cancel
          </button>
          
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-8 py-3 bg-quizPurple hover:bg-quizPurple-hover text-white rounded-xl shadow-lg shadow-quizPurple/20 font-semibold transition-all hover:scale-105 active:scale-95"
          >
            <Save size={18} />
            Save & Finish Quiz
          </button>
        </div>
      </div>
    </div>
  );
};
