import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { MessageList, Message } from './MessageList';
import { ChatInput } from './ChatInput';
import { useTableStore, TableParameters } from '../../store/useTableStore';
import { ScrollArea } from '../ui/scroll-area';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export const ChatBot: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'assistant', content: '你好！我是你的 AI 家具设计师。今天我能帮你如何定制你的桌子？' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const { parameters, setParameters, setScenePrompt } = useTableStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  const handleSend = async (content: string) => {
    const userMessage: Message = { id: Date.now().toString(), role: 'user', content };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      // Convert history to Gemini format
      const history = newMessages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }));

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: history,
        config: {
          systemInstruction: `你是一位资深家具设计师和参数化控制代理。
          当前的桌子参数: ${JSON.stringify(parameters)}。
          
          分析用户的意图（风格、尺寸、场景等）。
          
          输出要求：你必须严格返回一个有效的 JSON 对象，包含更新后的参数（仅包含发生变化的参数）和一段简短的回复文字（中文），解释你的修改。
          同时，提取任何风格或场景关键词（例如："简约书房"、"工业风办公室"）并作为 'scenePrompt' 返回。
          
          格式示例: {
            "updatedParameters": { "tableLength": 60, "legWidth": 30 },
            "reply": "我增加了桌面长度并调整了桌腿宽度，使其看起来更加稳重。",
            "scenePrompt": "简约书房"
          }`,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              updatedParameters: {
                type: Type.OBJECT,
                properties: {
                  tableLength: { type: Type.NUMBER },
                  tableWidth: { type: Type.NUMBER },
                  cornerRadius: { type: Type.NUMBER },
                  legHeight: { type: Type.NUMBER },
                  legWidth: { type: Type.NUMBER },
                  legFlare: { type: Type.NUMBER },
                  legInset: { type: Type.NUMBER },
                  apronHeight: { type: Type.NUMBER },
                  colorHue: { type: Type.NUMBER },
                  metalness: { type: Type.NUMBER },
                  roughness: { type: Type.NUMBER }
                },
                description: "需要更新的参数"
              },
              reply: {
                type: Type.STRING,
                description: "给用户的中文回复"
              },
              scenePrompt: {
                type: Type.STRING,
                description: "提取的场景/风格关键词"
              }
            },
            required: ["updatedParameters", "reply"]
          }
        }
      });

      const result = JSON.parse(response.text || '{}');
      
      if (result.updatedParameters) {
        // Sanitize parameters: only keep numeric values and valid keys
        const sanitizedParams: Partial<TableParameters> = {};
        const validKeys = Object.keys(parameters);
        
        Object.entries(result.updatedParameters).forEach(([key, value]) => {
          if (validKeys.includes(key) && typeof value === 'number' && !isNaN(value)) {
            // @ts-ignore - We know these are numeric parameters
            sanitizedParams[key as keyof TableParameters] = value;
          }
        });

        if (Object.keys(sanitizedParams).length > 0) {
          setParameters(sanitizedParams);
        }
      }
      
      if (result.scenePrompt) {
        setScenePrompt(result.scenePrompt);
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: result.reply || "我已经根据您的要求更新了设计。"
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('AI Chat Error:', error);
      setMessages((prev) => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: "抱歉，我在处理您的请求时遇到了错误。请稍后再试。"
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <ScrollArea ref={scrollRef} className="flex-1 min-h-0 px-1">
        <MessageList messages={messages} />
      </ScrollArea>
      <ChatInput onSend={handleSend} isLoading={isLoading} />
    </div>
  );
};
