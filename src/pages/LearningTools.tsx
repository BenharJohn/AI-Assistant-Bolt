import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  Book, 
  FileText, 
  Highlighter, 
  VolumeX, 
  Volume2, 
  Bookmark,
  Loader
} from 'lucide-react';
import { useAI } from '../context/AIContext';
import { useSettings } from '../context/SettingsContext';

const LearningTools: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'explain' | 'summarize'>('explain');
  const [content, setContent] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [isReading, setIsReading] = useState(false);
  const { isProcessing, explainConcept, summarizeContent } = useAI();
  const { reducedMotion } = useSettings();
  
  const handleSearch = async () => {
    if (!searchTerm.trim() || isProcessing) return;
    
    try {
      const explanation = await explainConcept(searchTerm);
      setResult(explanation);
    } catch (error) {
      setResult('Sorry, I encountered an error processing your request.');
    }
  };
  
  const handleSummarize = async () => {
    if (!content.trim() || isProcessing) return;
    
    try {
      const summary = await summarizeContent(content);
      setResult(summary);
    } catch (error) {
      setResult('Sorry, I encountered an error processing your request.');
    }
  };
  
  const toggleReading = () => {
    setIsReading(!isReading);
    // In a real app, this would start/stop text-to-speech
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === 'explain') {
      handleSearch();
    } else {
      handleSummarize();
    }
  };
  
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: reducedMotion ? 0 : 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: reducedMotion ? 0 : 0.3 }
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-5xl">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants} className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Learning Tools</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Get help understanding concepts and summarizing content
          </p>
        </motion.div>
        
        <motion.div variants={itemVariants} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700 mb-6">
          <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
            <button
              onClick={() => {
                setActiveTab('explain');
                setResult(null);
              }}
              className={`py-3 px-4 font-medium text-sm border-b-2 ${
                activeTab === 'explain'
                  ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Explain Concepts
            </button>
            <button
              onClick={() => {
                setActiveTab('summarize');
                setResult(null);
              }}
              className={`py-3 px-4 font-medium text-sm border-b-2 ${
                activeTab === 'summarize'
                  ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Summarize Content
            </button>
          </div>
          
          <form onSubmit={handleSubmit}>
            {activeTab === 'explain' ? (
              <div className="mb-6">
                <label htmlFor="concept\" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Enter a concept you'd like explained
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search size={18} className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="concept"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="e.g. ADHD, dyslexia, executive functioning"
                    className="pl-10 pr-4 py-3 w-full border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
            ) : (
              <div className="mb-6">
                <label htmlFor="content" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Paste content you'd like summarized
                </label>
                <textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Paste text content here..."
                  rows={6}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            )}
            
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isProcessing || (activeTab === 'explain' ? !searchTerm.trim() : !content.trim())}
                className={`px-4 py-2 rounded-lg flex items-center ${
                  isProcessing || (activeTab === 'explain' ? !searchTerm.trim() : !content.trim())
                    ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white transition-colors duration-200'
                }`}
              >
                {isProcessing ? (
                  <>
                    <Loader size={18} className="mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    {activeTab === 'explain' ? 'Explain' : 'Summarize'}
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
        
        {result && (
          <motion.div
            variants={itemVariants}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {activeTab === 'explain' ? 'Explanation' : 'Summary'}
              </h2>
              <div className="flex space-x-2">
                <button 
                  onClick={toggleReading}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                >
                  {isReading ? (
                    <VolumeX size={20} className="text-gray-500 dark:text-gray-400" />
                  ) : (
                    <Volume2 size={20} className="text-gray-500 dark:text-gray-400" />
                  )}
                </button>
                <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200">
                  <Bookmark size={20} className="text-gray-500 dark:text-gray-400" />
                </button>
              </div>
            </div>
            
            <div className="prose dark:prose-invert max-w-none">
              <p className="whitespace-pre-line">{result}</p>
            </div>
            
            <div className="mt-6 flex flex-wrap gap-2">
              <button className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded-full text-sm">
                Save to Notes
              </button>
              <button className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm">
                Copy Text
              </button>
              <button className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm">
                Share
              </button>
            </div>
          </motion.div>
        )}
        
        <motion.div variants={itemVariants} className="mt-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Learning Resources</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-5 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow duration-200">
              <div className="flex items-center mb-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-full mr-3">
                  <Book size={18} className="text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="font-medium text-gray-900 dark:text-white">Reading Strategies</h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                Learn effective techniques for improving reading comprehension and focus.
              </p>
              <button className="text-purple-600 dark:text-purple-400 text-sm font-medium">
                View Resource →
              </button>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-5 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow duration-200">
              <div className="flex items-center mb-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-full mr-3">
                  <FileText size={18} className="text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="font-medium text-gray-900 dark:text-white">Note-Taking Methods</h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                Discover note-taking systems that work well for ADHD and dyslexic minds.
              </p>
              <button className="text-blue-600 dark:text-blue-400 text-sm font-medium">
                View Resource →
              </button>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-5 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow duration-200">
              <div className="flex items-center mb-3">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-full mr-3">
                  <Highlighter size={18} className="text-green-600 dark:text-green-400" />
                </div>
                <h3 className="font-medium text-gray-900 dark:text-white">Study Techniques</h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                Explore study methods that enhance retention and reduce overwhelm.
              </p>
              <button className="text-green-600 dark:text-green-400 text-sm font-medium">
                View Resource →
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default LearningTools;