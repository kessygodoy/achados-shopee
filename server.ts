import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// API endpoint to generate product ads from URL or copied text
app.post("/api/generate-product", async (req, res) => {
  try {
    const { url, rawText, categories } = req.body;

    if (!url && !rawText) {
      return res.status(400).json({ error: "É necessário fornecer um link ou texto descritivo do produto." });
    }

    let scrapedTitle = "";
    let scrapedContent = "";

    // If a URL is provided, we can attempt a lightweight fetch to scrape any basic HTML titles/meta tags
    // inside the sandbox, in case the user didn't paste extra text.
    if (url) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000); // 4 sec timeout
        
        const fetchRes = await fetch(url, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36"
          },
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);

        if (fetchRes.ok) {
          const html = await fetchRes.text();
          // Extract title tag
          const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
          if (titleMatch && titleMatch[1]) {
            scrapedTitle = titleMatch[1].trim();
          }

          // Extract some meta tags for description
          const metaMatch = html.match(/<meta\s+name=["']description["']\s+content=["']([\s\S]*?)["']/i) ||
                            html.match(/<meta\s+property=["']og:description["']\s+content=["']([\s\S]*?)["']/i);
          if (metaMatch && metaMatch[1]) {
            scrapedContent = metaMatch[1].trim();
          }
        }
      } catch (err) {
        console.log("Note: Scraping URL direct fetch skipped or aborted due to bot protection style restriction.");
      }
    }

    const categoriesPrompt = categories && categories.length > 0 
      ? `Categorias existentes no blog: ${JSON.stringify(categories)}. Use uma delas ou sugira uma nova e adequada.`
      : "Categorias sugeridas: tecnologia, cozinha, beleza, casa, acessórios.";

    const inputData = `
      LINK DO PRODUTO: ${url || "Não fornecido"}
      TÍTULO CAPTURADO DO SITE: ${scrapedTitle || "Não encontrado"}
      CONTEÚDO CAPTURADO DO SITE: ${scrapedContent || "Não encontrado"}
      TEXTO MANUAL COLADO PELO USUÁRIO: ${rawText || "Não fornecido"}
    `;

    // Prompt Gemini 3.5 Flash for ad structuring with structured JSON response
    const geminiResponse = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Você é um redator publicitário de elite especializado em Marketing de Afiliados da Shopee Brasil.
Seu trabalho é converter as informações brutas de um produto (pode ser um link, título parcial ou descrição confusa) em um anúncio de alta conversão estruturado e refinado em Português do Brasil.

Dado as seguintes informações brutas de entrada:
${inputData}

Requisitos do anúncio:
1. "title": Crie um título dinâmico, limpo, chamativo e amigável sob medida, com menos de 100 caracteres. Remova termos feios de importadores asiáticos (como "grátis 2026 novo frete atacado"). Deixe profissional e irresistível!
2. "description": Escreva um texto de apresentação envolvente e profissional de 3 a 5 parágrafos médios. Destaque os maiores benefícios de uso, especificações técnicas claras, cenários de aplicação reais (ótimo para dar de presente, útil no trabalho, etc.) e por que vale tanto a pena comprar este item. use emoticons amigáveis.
3. "price": Extraia ou estime um preço promocional realista no formato de número decimal (Float). Se o preço bruto estiver disponível, use-o. Caso contrário, crie um preço bem atrativo e popular condizente com a categoria (ex: 29.90, 49.90, 89.90).
4. "originalPrice": Defina um preço de ancoragem alto que demonstre desconto real (normalmente de 40% a 100% mais caro que o promocional).
5. "category": Atribua a uma categoria adequada. ${categoriesPrompt}
6. "discountCode": Invente um código de cupom curto de alta conversão (ex: "ACHADO20", "SHOPEE80", "CASA15").
7. "link": Retorne o link de afiliado oficial do produto. Use exatamente o URL original fornecido "${url || "https://shopee.com.br"}".
8. "keywordImage": Sugira apenas uma palavra-chave em inglês para buscar uma foto profissional no Unsplash relacionada ao produto. Exemplos: "smartwatch", "airfryer", "humidifier", "makeupbox", "thermosbottle", "bluetoothheadphones".

Forneça a saída estritamente em formato JSON válido que respeite o esquema abaixo.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            price: { type: Type.NUMBER },
            originalPrice: { type: Type.NUMBER },
            category: { type: Type.STRING },
            discountCode: { type: Type.STRING },
            link: { type: Type.STRING },
            keywordImage: { type: Type.STRING }
          },
          required: ["title", "description", "price", "originalPrice", "category", "discountCode", "link", "keywordImage"]
        }
      }
    });

    const resultText = geminiResponse.text?.trim() || "{}";
    const parsedData = JSON.parse(resultText);

    // Map the keywordImage to a reliable high-quality Unsplash image preset or curated template
    const imageMap: Record<string, string> = {
      "smartwatch": "https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?w=600&auto=format&fit=crop&q=80",
      "airfryer": "https://images.unsplash.com/photo-1621972750749-0fbb1abb7736?w=600&auto=format&fit=crop&q=80",
      "humidifier": "https://images.unsplash.com/photo-1519183071298-a2962feb14f4?w=600&auto=format&fit=crop&q=80",
      "makeupbox": "https://images.unsplash.com/photo-1612817288484-6f916006741a?w=600&auto=format&fit=crop&q=80",
      "thermosbottle": "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600&auto=format&fit=crop&q=80",
      "bluetoothheadphones": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80",
      "kitchen": "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=600&auto=format&fit=crop&q=80",
      "home": "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&auto=format&fit=crop&q=80",
      "cosmetics": "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&auto=format&fit=crop&q=80",
      "tech": "https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&auto=format&fit=crop&q=80",
      "gadget": "https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=600&auto=format&fit=crop&q=80"
    };

    const kw = (parsedData.keywordImage || "tech").toLowerCase().trim();
    let selectedImageUrl = imageMap[kw];

    if (!selectedImageUrl) {
      // Find partial matches or use unsplash search placeholder with secure source redirect
      // Standard professional catalog default image fallback
      selectedImageUrl = `https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80`;
    }

    const payload = {
      title: parsedData.title,
      description: parsedData.description,
      price: parsedData.price,
      originalPrice: parsedData.originalPrice,
      category: parsedData.category,
      discountCode: parsedData.discountCode,
      link: parsedData.link,
      image: selectedImageUrl
    };

    res.json(payload);
  } catch (error: any) {
    console.error("Erro na geração por inteligência artificial:", error);
    res.status(500).json({ error: "Ocorreu um erro ao processar o seu link pelo Gemini: " + error.message });
  }
});

async function startServer() {
  // Vite middleware for dev or Static delivery for production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Listen on external standard ingress ports
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
