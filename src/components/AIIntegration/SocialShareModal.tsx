import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Copy, 
  Download, 
  Check, 
  ChevronLeft, 
  ChevronRight, 
  Heart, 
  MessageSquare, 
  Star, 
  Share as ShareIcon,
  Sparkles 
} from 'lucide-react';
import { Button } from '../ui/button';
import { useTableStore } from '../../store/useTableStore';
import { generateXHSContent, XHSContent } from '../../services/socialCopyService';
import { saveAs } from 'file-saver';

interface SocialShareModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SocialShareModal: React.FC<SocialShareModalProps> = ({ isOpen, onClose }) => {
  const { generatedImages, parameters } = useTableStore();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [content, setContent] = useState<XHSContent | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && !content) {
      handleGenerate();
    }
  }, [isOpen]);

  const handleGenerate = async () => {
    setIsLoading(true);
    const data = await generateXHSContent(parameters);
    setContent(data);
    setIsLoading(false);
  };

  const copyToClipboard = () => {
    if (!content) return;
    const fullText = `${content.title}\n\n${content.body}\n\n${content.tags.map(t => `#${t}`).join(' ')}`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadImage = () => {
    if (generatedImages.length === 0) return;
    saveAs(generatedImages[currentIdx], `XHS_Post_${currentIdx + 1}.png`);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-5xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row h-[85vh]"
        >
          {/* Close Button */}
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 z-10 w-10 h-10 rounded-full bg-black/10 flex items-center justify-center text-slate-800 hover:bg-black/20 transition-all"
          >
            <X size={20} />
          </button>

          {/* Left: Image Side (3:4 Ratio Container) */}
          <div className="w-full md:w-[45%] bg-slate-100 relative flex items-center justify-center p-6 border-r border-slate-100">
             <div className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden shadow-xl bg-slate-200">
                <AnimatePresence mode="wait">
                  <motion.img 
                    key={currentIdx}
                    src={generatedImages[currentIdx]}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="w-full h-full object-cover"
                  />
                </AnimatePresence>

                {/* Navigation */}
                <div className="absolute inset-x-0 bottom-6 flex justify-center gap-2">
                   {generatedImages.map((_, i) => (
                     <div 
                       key={i} 
                       className={`h-1.5 rounded-full transition-all ${i === currentIdx ? 'w-6 bg-white shadow-md' : 'w-1.5 bg-white/50'}`}
                     />
                   ))}
                </div>
                
                <button 
                  onClick={() => setCurrentIdx((c) => (c > 0 ? c - 1 : generatedImages.length - 1))}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/40 transition-all"
                >
                  <ChevronLeft size={20} />
                </button>
                <button 
                  onClick={() => setCurrentIdx((c) => (c < generatedImages.length - 1 ? c + 1 : 0))}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/40 transition-all"
                >
                  <ChevronRight size={20} />
                </button>

                {/* Simulated XHS Footer Icon */}
                <div className="absolute top-4 left-4 h-8 px-3 bg-red-500 rounded-full flex items-center gap-1.5 border border-white/20 shadow-lg">
                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  <span className="text-[10px] font-black text-white italic tracking-tighter">RED</span>
                </div>
             </div>
          </div>

          {/* Right: Copy Side */}
          <div className="flex-1 p-8 md:p-12 overflow-y-auto flex flex-col">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-500">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800">小红书灵感助手</h2>
                  <p className="text-xs text-slate-500 font-medium">AI 正在为您生成高审美种草文案</p>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleGenerate}
                disabled={isLoading}
                className="rounded-full gap-2 text-xs h-9 border-slate-200"
              >
                重新生成
              </Button>
            </div>

            {isLoading ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-4 py-20">
                <div className="w-12 h-12 border-4 border-red-500/10 border-t-red-500 rounded-full animate-spin" />
                <p className="text-sm font-medium text-slate-500 italic">正在寻找生活中的诗意...</p>
              </div>
            ) : content && (
              <div className="space-y-6 flex-1">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-2 block">Post Title</span>
                  <p className="text-xl font-bold text-slate-800 leading-tight">
                    {content.title}
                  </p>
                </div>

                <div className="relative group">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-2 block">Caption Content</span>
                  <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 text-sm text-slate-600 leading-relaxed max-h-[300px] overflow-y-auto whitespace-pre-wrap">
                    {content.body}
                    <div className="mt-4 flex flex-wrap gap-2 text-red-500 font-bold">
                      {content.tags.map((tag, i) => (
                        <span key={i}>#{tag}</span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Simulated Social Metrics */}
                <div className="flex items-center gap-6 text-slate-400 border-t border-slate-50 pt-6">
                   <div className="flex items-center gap-2">
                      <Heart size={18} />
                      <span className="text-xs font-bold">点赞</span>
                   </div>
                   <div className="flex items-center gap-2">
                      <Star size={18} />
                      <span className="text-xs font-bold">收藏</span>
                   </div>
                   <div className="flex items-center gap-2">
                      <MessageSquare size={18} />
                      <span className="text-xs font-bold">评论</span>
                   </div>
                </div>
              </div>
            )}

            <div className="mt-8 pt-8 border-t border-slate-100 flex flex-col sm:flex-row gap-3">
              <Button 
                onClick={copyToClipboard}
                className="flex-1 rounded-full h-12 bg-slate-900 gap-2 font-bold text-sm"
              >
                {copied ? <Check size={18} /> : <Copy size={18} />}
                {copied ? '文案已复制到剪贴板' : '一键复制全篇文案'}
              </Button>
              <Button 
                variant="outline"
                onClick={downloadImage}
                className="rounded-full h-12 px-8 border-slate-200 gap-2 font-bold text-sm"
              >
                <Download size={18} />
                保存封面
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
