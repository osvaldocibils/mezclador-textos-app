import React, { useState, useRef } from 'react';
import { Upload, Download, FileText, Loader2, Trash2, X, Plus } from 'lucide-react';

interface TextFile {
  name: string;
  content: string;
}

type GenerationType = 'text' | 'stories' | 'dialogues';

function App() {
  const [textFiles, setTextFiles] = useState<TextFile[]>([]);
  const [baseGeneratedText, setBaseGeneratedText] = useState<string>('');
  const [generatedStories, setGeneratedStories] = useState<string>('');
  const [generatedDialogues, setGeneratedDialogues] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationType, setGenerationType] = useState<GenerationType>('text');
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [pastedText, setPastedText] = useState('');
  const [fileName, setFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);


  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newTextFiles: TextFile[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Verificar que sea un archivo .txt
      if (!file.name.toLowerCase().endsWith('.txt')) {
        alert(`El archivo ${file.name} no es un archivo .txt válido`);
        continue;
      }
      
      try {
        const content = await file.text();
        
        if (!content || content.trim().length < 10) {
          throw new Error('El archivo no contiene suficiente texto para procesar');
        }
        
        newTextFiles.push({
          name: file.name,
          content: content.trim()
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
        alert(`Error al procesar el archivo ${file.name}: ${errorMessage}`);
      }
    }

    if (newTextFiles.length > 0) {
      setTextFiles([...textFiles, ...newTextFiles]);
    }
    
    // Limpiar el input para permitir cargar el mismo archivo nuevamente
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const deleteFile = (index: number) => {
    const newFiles = [...textFiles];
    newFiles.splice(index, 1);
    setTextFiles(newFiles);
  };

  const clearAllFiles = () => {
    setTextFiles([]);
    setBaseGeneratedText('');
    setGeneratedStories('');
    setGeneratedDialogues('');
  };
  
  const handlePasteText = () => {
    setShowPasteModal(true);
    setPastedText('');
    setFileName('');
  };

  const addPastedTextAsFile = () => {
    if (!pastedText.trim()) {
      alert('Por favor ingresa algún texto');
      return;
    }
    
    if (!fileName.trim()) {
      alert('Por favor ingresa un nombre para el archivo');
      return;
    }
    
    if (pastedText.trim().length < 10) {
      alert('El texto debe tener al menos 10 caracteres');
      return;
    }
    
    const newFileName = fileName.endsWith('.txt') ? fileName : fileName + '.txt';
    
    const newFile: TextFile = {
      name: newFileName,
      content: pastedText.trim()
    };
    
    setTextFiles([...textFiles, newFile]);
    setShowPasteModal(false);
    setPastedText('');
    setFileName('');
  };

  const closePasteModal = () => {
    setShowPasteModal(false);
    setPastedText('');
    setFileName('');
  };
  // Function to add proper punctuation and capitalization
  const addProperPunctuation = (words: string[]): string => {
    if (words.length === 0) return '';
    
    let result = '';
    let isStartOfSentence = true;
    
    for (let i = 0; i < words.length; i++) {
      let word = words[i].toLowerCase();
      
      // Capitalize if it's start of sentence
      if (isStartOfSentence) {
        word = word.charAt(0).toUpperCase() + word.slice(1);
        isStartOfSentence = false;
      }
      
      result += word;
      
      // Add punctuation randomly
      if (i < words.length - 1) {
        // End of sentence punctuation (15% chance)
        if (Math.random() < 0.15) {
          const endPunctuation = Math.random();
          if (endPunctuation < 0.6) {
            result += '.';
          } else if (endPunctuation < 0.8) {
            // Add question marks with opening ¿
            const questionStart = Math.max(0, result.lastIndexOf(' ') + 1);
            result = result.substring(0, questionStart) + '¿' + result.substring(questionStart) + '?';
          } else {
            // Add exclamation marks with opening ¡
            const exclamationStart = Math.max(0, result.lastIndexOf(' ') + 1);
            result = result.substring(0, exclamationStart) + '¡' + result.substring(exclamationStart) + '!';
          }
          isStartOfSentence = true;
        }
        // Mid-sentence punctuation (20% chance)
        else if (Math.random() < 0.2) {
          const midPunctuation = [',', ';', ':', '...', '-'];
          result += midPunctuation[Math.floor(Math.random() * midPunctuation.length)];
        }
        
        result += ' ';
      } else {
        // Always end with proper punctuation
        if (!/[.!?]$/.test(result)) {
          result += '.';
        }
      }
    }
    
    return result;
  };

  const generateContent = (type: GenerationType) => {
    if (textFiles.length < 1) {
      alert('Por favor carga al menos 1 archivo de texto');
      return;
    }

    setIsGenerating(true);
    setGenerationType(type);

    setTimeout(() => {
      // Combine all text content
      const allText = textFiles.map(file => file.content).join(' ');
      
      // Split into words and clean them
      const words = allText
        .split(/\s+/)
        .map(word => word.replace(/[^\wáéíóúüñÁÉÍÓÚÜÑ\s]/g, '').trim())
        .filter(word => word.length > 0);
      
      // Function to create text of approximately 5000 characters
      const createTextOfApprox5000Chars = (): string => {
        const targetLength = 5000;
        let text = '';
        const selectedWords = [];
        
        // Collect words to reach approximately the target length
        while (text.length < targetLength - 200) {
          const word = words[Math.floor(Math.random() * words.length)];
          selectedWords.push(word);
          text += (text ? ' ' : '') + word;
        }
        
        // Add proper punctuation
        text = addProperPunctuation(selectedWords);
        
        return text;
      };
      
      let result = '';
      
      if (type === 'text') {
        // Generate new base text of approximately 5000 characters
        result = createTextOfApprox5000Chars();
        setBaseGeneratedText(result);
        setGeneratedStories('');
        setGeneratedDialogues('');
      } else if (type === 'stories') {
        // Use existing base text or generate new one
        let textToUse = baseGeneratedText;
        if (!textToUse) {
          textToUse = createTextOfApprox5000Chars();
          setBaseGeneratedText(textToUse);
        }
        
        // Convert base text to stories format
        const wordsFromBase = textToUse.split(/\s+/).filter(word => word.length > 0);
        const stories = [];
        let totalChars = 0;
        const targetLength = 4800;
        
        let wordIndex = 0;
        
        while (totalChars < targetLength && wordIndex < wordsFromBase.length) {
          let story = '';
          const maxStoryLength = 280; // Leave room for punctuation and spacing
          
          // Build story up to 280 characters
          while (story.length < maxStoryLength && wordIndex < wordsFromBase.length) {
            const word = wordsFromBase[wordIndex];
            const nextLength = story.length + (story ? 1 : 0) + word.length;
            
            if (nextLength <= maxStoryLength) {
              story += (story ? ' ' : '') + word;
              wordIndex++;
            } else {
              break;
            }
          }
          
          // Ensure story ends properly
          if (story && !/[.!?]$/.test(story)) {
            story += '.';
          }
          
          if (!story) break;
          
          // Check if adding this story would exceed our target
          const storyWithBreak = story + '\n\n';
          if (totalChars + storyWithBreak.length > targetLength) {
            break;
          }
          
          stories.push(story);
          totalChars += storyWithBreak.length;
          
          // Reset word index if we've used all words
          if (wordIndex >= wordsFromBase.length) {
            wordIndex = 0;
          }
        }
        
        result = stories.join('\n\n');
        setGeneratedStories(result);
      } else if (type === 'dialogues') {
        // Use existing base text or generate new one
        let textToUse = baseGeneratedText;
        if (!textToUse) {
          textToUse = createTextOfApprox5000Chars();
          setBaseGeneratedText(textToUse);
        }
        
        // Generate dialogues
        const wordsFromBase = textToUse.split(/\s+/).filter(word => word.length > 0);
        const dialogues = [];
        let totalChars = 0;
        const targetLength = 4800;
        
        let dialogueCount = 0;
        let wordIndex = 0;
        
        while (totalChars < targetLength && wordIndex < wordsFromBase.length) {
          let dialogue = '';
          const minDialogueLength = 10;
          const maxDialogueLength = Math.floor(Math.random() * (60 - minDialogueLength + 1)) + minDialogueLength;
          
          // Build dialogue with variable length between 10-60 characters
          while (dialogue.length < maxDialogueLength && wordIndex < wordsFromBase.length) {
            const word = wordsFromBase[wordIndex];
            const nextLength = dialogue.length + (dialogue ? 1 : 0) + word.length;
            
            if (nextLength <= maxDialogueLength) {
              dialogue += (dialogue ? ' ' : '') + word;
              wordIndex++;
            } else {
              break;
            }
          }
          
          // Ensure minimum length is met
          if (dialogue.length < minDialogueLength && wordIndex < wordsFromBase.length) {
            // Add more words to reach minimum length
            while (dialogue.length < minDialogueLength && wordIndex < wordsFromBase.length) {
              const word = wordsFromBase[wordIndex];
              dialogue += (dialogue ? ' ' : '') + word;
              wordIndex++;
            }
          }
          
          if (!dialogue) break;
          
          // Ensure dialogue ends properly
          if (!/[.!?]$/.test(dialogue)) {
            dialogue += '.';
          }
          
          const dialogueLine = `- ${dialogue}`;
          const isGroupEnd = (dialogueCount + 1) % 6 === 0;
          const lineBreak = isGroupEnd ? '\n\n' : '\n';
          const fullLine = dialogueLine + lineBreak;
          
          // Check if adding this dialogue would exceed our target
          if (totalChars + fullLine.length > targetLength) {
            break;
          }
          
          dialogues.push(dialogueLine);
          totalChars += fullLine.length;
          dialogueCount++;
          
          // Add group separator every 6 dialogues
          if (isGroupEnd) {
            dialogues.push('');
          }
          
          // Reset word index if we've used all words
          if (wordIndex >= wordsFromBase.length) {
            wordIndex = 0;
          }
        }
        
        result = dialogues.join('\n');
        setGeneratedDialogues(result);
      }

      setIsGenerating(false);
    }, 1000);
  };

  const downloadFile = (content: string, fileName: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-white p-4 sm:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">Mezclador de Textos. Generador de Historias y Diálogos.</h1>
          <p className="text-sm text-gray-500">app de artista - osvaldo cibils</p>
        </div>
        
        {/* Sección de Carga */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center space-y-4">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".txt"
            multiple
            className="hidden"
            id="file-upload"
          />
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <label
              htmlFor="file-upload"
              className="inline-flex items-center gap-2 bg-black text-white px-6 py-3 rounded-lg cursor-pointer hover:bg-gray-800 transition-colors"
            >
              <Upload size={20} />
              cargar archivos .txt
            </label>
            <button
              onClick={handlePasteText}
              className="inline-flex items-center gap-2 bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors"
            >
              <Plus size={20} />
              pegar texto
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Solo archivos de texto (.txt)
          </p>
        </div>

        {/* Lista de Archivos Cargados */}
        {textFiles.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Archivos Cargados</h2>
              <button
                onClick={clearAllFiles}
                className="inline-flex items-center gap-1 bg-gray-500 text-white px-3 py-1 text-sm rounded hover:bg-gray-600 transition-colors"
              >
                <Trash2 size={16} />
                Borrar Todos
              </button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {textFiles.map((file, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <FileText size={20} className="text-blue-600" />
                      <span className="font-medium">{file.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => downloadFile(file.content, file.name)}
                        className="text-gray-600 hover:text-black"
                        title="Descargar archivo"
                      >
                        <Download size={20} />
                      </button>
                      <button
                        onClick={() => deleteFile(index)}
                        className="text-gray-600 hover:text-red-600"
                        title="Eliminar archivo"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                  <div className="max-h-32 overflow-y-auto bg-gray-50 p-2 rounded text-sm">
                    {file.content.slice(0, 200)}...
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Botón de Generar */}
        <div className="text-center">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => generateContent('text')}
              disabled={isGenerating || textFiles.length < 1}
              className="inline-flex items-center gap-2 bg-gray-800 text-white px-6 py-3 rounded-lg disabled:bg-gray-300 hover:bg-gray-700 transition-colors"
            >
              {isGenerating && generationType === 'text' ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Generando...
                </>
              ) : (
                'Generar Texto'
              )}
            </button>
            
            <button
              onClick={() => generateContent('stories')}
              disabled={isGenerating || textFiles.length < 1}
              className="inline-flex items-center gap-2 bg-gray-800 text-white px-6 py-3 rounded-lg disabled:bg-gray-300 hover:bg-gray-700 transition-colors"
            >
              {isGenerating && generationType === 'stories' ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Generando...
                </>
              ) : (
                'Generar Historias'
              )}
            </button>
            
            <button
              onClick={() => generateContent('dialogues')}
              disabled={isGenerating || textFiles.length < 1}
              className="inline-flex items-center gap-2 bg-gray-800 text-white px-6 py-3 rounded-lg disabled:bg-gray-300 hover:bg-gray-700 transition-colors"
            >
              {isGenerating && generationType === 'dialogues' ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Generando...
                </>
              ) : (
                'Generar Diálogos'
              )}
            </button>
          </div>
        </div>

        {/* Texto Base Generado */}
        {baseGeneratedText && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Texto Generado</h2>
              <button
                onClick={() => downloadFile(baseGeneratedText, 'texto-continuo.txt')}
                className="inline-flex items-center gap-2 bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                <Download size={20} />
                Descargar Texto
              </button>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg whitespace-pre-wrap font-mono">
              {baseGeneratedText}
            </div>
          </div>
        )}
        
        {/* Historias Generadas */}
        {generatedStories && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Historias Generadas</h2>
              <button
                onClick={() => downloadFile(generatedStories, 'micro-historias.txt')}
                className="inline-flex items-center gap-2 bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                <Download size={20} />
                Descargar Historias
              </button>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg whitespace-pre-wrap font-mono">
              {generatedStories}
            </div>
          </div>
        )}
        
        {/* Diálogos Generados */}
        {generatedDialogues && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Diálogos Generados</h2>
              <button
                onClick={() => downloadFile(generatedDialogues, 'dialogos.txt')}
                className="inline-flex items-center gap-2 bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                <Download size={20} />
                Descargar Diálogos
              </button>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg whitespace-pre-wrap font-mono">
              {generatedDialogues}
            </div>
          </div>
        )}

        {/* Modal para Pegar Texto */}
        {showPasteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Pegar Texto</h3>
                <button
                  onClick={closePasteModal}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="filename" className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre del archivo
                  </label>
                  <input
                    type="text"
                    id="filename"
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                    placeholder="Ej: mi-texto"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Se añadirá automáticamente la extensión .txt</p>
                </div>
                
                <div>
                  <label htmlFor="pastedtext" className="block text-sm font-medium text-gray-700 mb-1">
                    Texto
                  </label>
                  <textarea
                    id="pastedtext"
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                    placeholder="Pega aquí tu texto..."
                    rows={12}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Caracteres: {pastedText.length} (mínimo 10)
                  </p>
                </div>
                
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={closePasteModal}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={addPastedTextAsFile}
                    className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus size={16} />
                    Añadir como archivo
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
