import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  FileText, 
  BrainCircuit,
  Loader,
  Copy,
  Check
} from 'lucide-react';
import { useAI, Flashcard } from '../context/AIContext';
import { useSettings } from '../context/SettingsContext';

const LearningTools: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'explain' | 'summarize'>('explain');
  const [inputText, setInputText] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [flashcards, setFlashcards] = useState<Flashcard[] | null>(null);
  const [isFlipped, setIsFlipped] = useState<boolean[]>([]);
  const [hasCopied, setHasCopied] = useState(false);

  const { isProcessing, getAIResponse, generateFlashcards } = useAI();
  const { reducedMotion } = useSettings();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isProcessing) return;
    
    setResult(null); // Clear previous results
    setFlashcards(null);

    const prompt = activeTab === 'explain' 
        ? `Explain the following concept in a clear and simple way`
        : `Summarize the following text into key bullet points`;
    
    const response = await getAIResponse(prompt, inputText);
    setResult(response);
  };

  const handleGenerateFlashcards = async () => {
    if(!result || isProcessing) return;
    const cards = await generateFlashcards(result);
    if (cards) {
        setFlashcards(cards);
        setIsFlipped(new Array(cards.length).fill(false));
    }
  };

  const handleFlipCard = (index: number) => {
    setIsFlipped(prev => {
        const newFlipped = [...prev];
        newFlipped[index] = !newFlipped[index];
        return newFlipped;
    });
  };

  const handleCopyToClipboard = () => {
    if (!result) return;
    navigator.clipboard.writeText(result);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2000);
  };
  
  const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

  return (
    <div className="container mx-auto px-4 py-6 max-w-5xl">
      <motion.div variants={containerVariants} initial="hidden" animate="visible">
        <motion.div variants={itemVariants} className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-foreground">Learning Tools</h1>
          <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">Your AI-powered study partner. Explain complex topics, summarize articles, and create flashcards to reinforce your learning.</p>
        </motion.div>
        
        <motion.div variants={itemVariants} className="bg-card rounded-2xl shadow-soft hover:shadow-warm transition-shadow duration-300 p-6 border border-appBorder mb-6">
          <div className="flex border-b border-appBorder mb-6">
            {(['explain', 'summarize'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setResult(null); setFlashcards(null); setInputText(''); }}
                className={`py-3 px-4 font-medium text-sm border-b-2 transition-colors ${
                  activeTab === tab
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab === 'explain' ? 'Explain a Concept' : 'Summarize Text'}
              </button>
            ))}
          </div>
          
          <form onSubmit={handleSubmit}>
            {activeTab === 'explain' ? (
              <div>
                <label htmlFor="concept" className="block text-sm font-medium text-foreground mb-2">Enter a concept you'd like explained</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search size={18} className="text-muted-foreground" />
                  </div>
                  <input type="text" id="concept" value={inputText} onChange={(e) => setInputText(e.target.value)} placeholder="e.g., Photosynthesis, The Cold War..." className="pl-10 pr-4 py-3 w-full bg-background border border-appBorder rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground" />
                </div>
              </div>
            ) : (
              <div>
                <label htmlFor="content" className="block text-sm font-medium text-foreground mb-2">Paste content you'd like summarized</label>
                <textarea id="content" value={inputText} onChange={(e) => setInputText(e.target.value)} placeholder="Paste an article or text here..." rows={8} className="w-full bg-background border border-appBorder rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground resize-none" />
              </div>
            )}
            
            <div className="flex justify-end mt-4">
              <button type="submit" disabled={isProcessing || !inputText.trim()} className="btn-primary flex items-center disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed">
                {isProcessing ? <><Loader size={18} className="mr-2 animate-spin" />Processing...</> : 'Submit'}
              </button>
            </div>
          </form>
        </motion.div>
        
        <AnimatePresence>
        {(isProcessing && !result) && (
            <motion.div variants={itemVariants} className="text-center text-muted-foreground">
                <p>Thinking...</p>
            </motion.div>
        )}
        {result && (
          <motion.div variants={itemVariants} className="bg-card rounded-2xl shadow-soft hover:shadow-warm transition-shadow duration-300 p-6 border border-appBorder">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-card-foreground">{activeTab === 'explain' ? 'Explanation' : 'Summary'}</h2>
              <div className="flex items-center gap-2">
                 <button onClick={handleGenerateFlashcards} disabled={isProcessing} className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary-hover disabled:text-muted-foreground disabled:cursor-not-allowed">
                    <BrainCircuit size={16}/> Create Flashcards
                 </button>
                 <button onClick={handleCopyToClipboard} className="p-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors">
                    {hasCopied ? <Check size={16} className="text-primary" /> : <Copy size={16} />}
                 </button>
              </div>
            </div>
            <div className="prose prose-p:text-foreground prose-strong:text-foreground prose-headings:text-foreground max-w-none">
              <p className="whitespace-pre-line">{result}</p>
            </div>
          </motion.div>
        )}
        </AnimatePresence>

        <AnimatePresence>
        {flashcards && flashcards.length > 0 && (
             <motion.div variants={itemVariants} className="mt-6">
                <h2 className="text-lg font-semibold text-foreground mb-4 text-center">Your Flashcards</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {flashcards.map((card, index) => (
                         <motion.div
                            key={index}
                            onClick={() => handleFlipCard(index)}
                            className="h-48 rounded-2xl cursor-pointer"
                            transition={{ duration: 0.5 }}
                            animate={{ rotateY: isFlipped[index] ? 180 : 0 }}
                            style={{ transformStyle: 'preserve-3d' }}
                         >
                            {/* Front of Card */}
                            <div className="absolute w-full h-full bg-muted rounded-2xl p-4 flex items-center justify-center text-center backface-hidden">
                                <p className="font-semibold text-foreground">{card.question}</p>
                            </div>
                            {/* Back of Card */}
                            <div className="absolute w-full h-full bg-secondary rounded-2xl p-4 flex items-center justify-center text-center backface-hidden" style={{transform: 'rotateY(180deg)'}}>
                                <p className="text-sm text-secondary-foreground">{card.answer}</p>
                            </div>
                         </motion.div>
                    ))}
                </div>
            </motion.div>
        )}
        </AnimatePresence>

      </motion.div>
    </div>
  );
};

// Add this CSS to your global index.css file to make the card flip work
/*
@layer utilities {
  .backface-hidden {
    backface-visibility: hidden;
    -webkit-backface-visibility: hidden;
  }
}
*/

export default LearningTools;
