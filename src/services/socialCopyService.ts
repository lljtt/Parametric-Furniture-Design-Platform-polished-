import { GoogleGenAI } from "@google/genai";
import { TableParameters } from "../store/useTableStore";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface XHSContent {
  title: string;
  body: string;
  tags: string[];
}

export const generateXHSContent = async (params: TableParameters): Promise<XHSContent> => {
  const prompt = `
    你是一个资深的家居生活博主。请为一款用户自定义设计的桌子编写一段小红书风格的宣传文案。
    
    产品参数：
    - 材质：${params.materialCategory === 'anodized' ? '冰蓝色阳极氧化铝' : params.materialCategory === 'wood' ? '实木胡桃色' : '岩板'}
    - 尺寸：${params.tableLength}mm x ${params.tableWidth}mm
    - 设计风格：极简主义，未来感，精密制造
    
    要求：
    1. 标题要吸睛（包含Emoji）。
    2. 文案不要有廉价的“卖货感”，要营造一种“清晨阳光洒在桌面上”、“深夜独处时的静谧感”等美好生活愿景。
    3. 语言感性、细腻，多用 Emoji。
    4. 结尾包含 5-8 个相关的话题标签。
    5. 返回格式为 JSON：{"title": "...", "body": "...", "tags": ["...", "..."]}
    
    请直接返回 JSON 代码块：`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: {
        parts: [{ text: prompt }]
      }
    }) as any;

    const text = response.text || "";
    // Simple JSON extraction
    const jsonStr = text.match(/\{[\s\S]*\}/)?.[0] || "";
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("AI Copy generation failed:", error);
    return {
      title: "藏在细节里的家居美学 🧊",
      body: "当极简主义遇见精密铝材，家里的角落也拥有了呼吸感。不仅仅是一张桌子，更是对理想生活的一种表达。",
      tags: ["家居美学", "极简生活", "我的私藏好物", "装修灵感"]
    };
  }
};
