import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function getDynamicUnsplashImage(keyword: string): Promise<string | null> {
  try {
    const searchUrl = `https://unsplash.com/s/photos/${encodeURIComponent(keyword)}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    
    const response = await fetch(searchUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
      },
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const html = await response.text();
      // Match image URLs on Unsplash CDN
      const regex = /https:\/\/images\.unsplash\.com\/photo-[a-zA-Z0-9_\-]+/g;
      const matches = html.match(regex);
      if (matches && matches.length > 0) {
        const uniqueMatches = Array.from(new Set(matches));
        for (const imgUrl of uniqueMatches) {
          if (imgUrl.length > 50 && !imgUrl.includes("profile") && !imgUrl.includes("placeholder")) {
            return `${imgUrl}?w=600&auto=format&fit=crop&q=80`;
          }
        }
        return `${uniqueMatches[0]}?w=600&auto=format&fit=crop&q=80`;
      }
    }
  } catch (err) {
    console.log("Failed to fetch dynamic Unsplash image:", err);
  }
  return null;
}

export default async function handler(req: any, res: any) {
  // Set CORS and headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Método não permitido. Use POST." });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(403).json({
      error: "A chave API do Gemini (GEMINI_API_KEY) não está configurada no ambiente do Vercel. Por favor, adicione a chave 'GEMINI_API_KEY' com o valor fornecido nas configurações (Environment Variables) do seu projeto no painel da Vercel e faça um novo Deploy."
    });
  }

  // Initialize Gemini Client
  const ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  try {
    const { url, rawText, categories } = req.body;

    if (!url && !rawText) {
      return res.status(400).json({ error: "É necessário fornecer um link ou texto descritivo do produto." });
    }

    let scrapedTitle = "";
    let scrapedContent = "";
    let scrapedPrice: number | null = null;
    let scrapedImages: string[] = [];

    if (url) {
      try {
        let finalUrl = url;
        // Expand short links if needed (like shope.ee, shp.ee, or redirect routes)
        if (url.includes("shope.ee") || url.includes("shp.ee") || url.includes("shopee.com.br/m/") || url.includes("shopee.com.br/collabs/")) {
          try {
            // Attempt to expand via manual redirect to capture Location headers easily
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 4000);
            const redirectRes = await fetch(url, {
              method: "GET",
              redirect: "manual",
              headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8"
              },
              signal: controller.signal
            });
            clearTimeout(timeoutId);
            
            const locHeader = redirectRes.headers.get("location");
            if (locHeader) {
              finalUrl = locHeader;
              console.log("Expanded URL via location header:", finalUrl);
            } else if (redirectRes.url) {
              finalUrl = redirectRes.url;
            }
          } catch (expandErr) {
            console.log("First short link expansion failed, trying automatic follow:", expandErr);
            try {
              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), 4000);
              const redirectRes = await fetch(url, {
                method: "GET",
                redirect: "follow",
                headers: {
                  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
                },
                signal: controller.signal
              });
              clearTimeout(timeoutId);
              finalUrl = redirectRes.url;
            } catch (err2) {
              console.log("Automatic follow expansion failed:", err2);
            }
          }
        }

        // Try to extract Shopee IDs from the expanded URL
        const shopeeRegex1 = /i\.(\d+)\.(\d+)/i;
        const shopeeRegex2 = /\/product\/(\d+)\/(\d+)/i;
        const shopeeRegex3 = /product-i\.(\d+)\.(\d+)/i;
        
        let shopId = "";
        let itemId = "";
        
        let match = finalUrl.match(shopeeRegex1);
        if (match) {
          shopId = match[1];
          itemId = match[2];
        } else {
          match = finalUrl.match(shopeeRegex2);
          if (match) {
            shopId = match[1];
            itemId = match[2];
          } else {
            match = finalUrl.match(shopeeRegex3);
            if (match) {
              shopId = match[1];
              itemId = match[2];
            } else {
              try {
                const urlObj = new URL(finalUrl);
                const sId = urlObj.searchParams.get("shopid") || urlObj.searchParams.get("shopId");
                const iId = urlObj.searchParams.get("itemid") || urlObj.searchParams.get("itemId");
                if (sId && iId) {
                  shopId = sId;
                  itemId = iId;
                }
              } catch (_) {}
            }
          }
        }

        let apiSuccess = false;

        if (shopId && itemId) {
          // Attempt 1: Shopee Public API v4
          try {
            const shopeeApiUrl = `https://shopee.com.br/api/v4/item/get?itemid=${itemId}&shopid=${shopId}`;
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 4000);
            
            const apiRes = await fetch(shopeeApiUrl, {
              headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36",
                "Accept": "application/json",
                "Referer": finalUrl,
                "X-Requested-With": "XMLHttpRequest"
              },
              signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (apiRes.ok) {
              const apiJson = await apiRes.json();
              const itemData = apiJson.data || apiJson.item;
              if (itemData) {
                scrapedTitle = itemData.name || itemData.title || "";
                scrapedContent = itemData.description || "";
                
                if (itemData.price !== undefined && itemData.price !== null) {
                  scrapedPrice = itemData.price / 100000;
                }
                
                if (itemData.images && itemData.images.length > 0) {
                  scrapedImages = itemData.images.map((imgId: string) => `https://down-br-img.susercontent.com/file/${imgId}`);
                } else if (itemData.image) {
                  scrapedImages = [`https://down-br-img.susercontent.com/file/${itemData.image}`];
                }
                
                apiSuccess = scrapedImages.length > 0;
                console.log("Successfully fetched Shopee product data from API v4! Images:", scrapedImages.length);
              }
            }
          } catch (apiErr) {
            console.log("Shopee public item API v4 request failed:", apiErr);
          }

          // Attempt 2: If API v4 failed, try legacy API v2 which sometimes bypasses blocks
          if (!apiSuccess) {
            try {
              const shopeeApiV2Url = `https://shopee.com.br/api/v2/item/get_v2?item_id=${itemId}&shop_id=${shopId}`;
              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), 4000);
              
              const apiResV2 = await fetch(shopeeApiV2Url, {
                headers: {
                  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36",
                  "Accept": "application/json",
                  "Referer": finalUrl
                },
                signal: controller.signal
              });
              clearTimeout(timeoutId);

              if (apiResV2.ok) {
                const apiJsonV2 = await apiResV2.json();
                const itemData = apiJsonV2.data || apiJsonV2.item;
                if (itemData) {
                  scrapedTitle = scrapedTitle || itemData.name || itemData.title || "";
                  scrapedContent = scrapedContent || itemData.description || "";
                  
                  if (itemData.price !== undefined && itemData.price !== null && scrapedPrice === null) {
                    scrapedPrice = itemData.price / 100000;
                  }
                  
                  if (itemData.images && itemData.images.length > 0) {
                    scrapedImages = itemData.images.map((imgId: string) => `https://down-br-img.susercontent.com/file/${imgId}`);
                  }
                  
                  apiSuccess = scrapedImages.length > 0;
                  console.log("Successfully fetched Shopee product data from API v2 fallback!");
                }
              }
            } catch (v2Err) {
              console.log("Shopee API v2 fallback failed:", v2Err);
            }
          }
        }

        // Fallback to HTML scraping if API failed or wasn't a standard item URL
        if (!apiSuccess) {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 4000);
          
          const fetchRes = await fetch(finalUrl, {
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36",
              "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8"
            },
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);

          if (fetchRes.ok) {
            const html = await fetchRes.text();
            
            if (!scrapedTitle) {
              const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
              if (titleMatch && titleMatch[1]) {
                scrapedTitle = titleMatch[1].trim();
              }
            }

            if (!scrapedContent) {
              const metaMatch = html.match(/<meta\s+name=["']description["']\s+content=["']([\s\S]*?)["']/i) ||
                                html.match(/<meta\s+property=["']og:description["']\s+content=["']([\s\S]*?)["']/i);
              if (metaMatch && metaMatch[1]) {
                scrapedContent = metaMatch[1].trim();
              }
            }

            // Fetch Shopee structures & cdn images directly from HTML source
            const cdnRegex = /(https?:\/\/(?:[a-zA-Z0-9-]+\.)*(?:susercontent|shopee)\.[a-z0-9.]+\/file\/[a-zA-Z0-9_\-]+)/gi;
            const ogImageRegex = /<meta\s+(?:property|name)=["'](?:og:image|twitter:image)["']\s+content=["']([^"']+)["']/gi;
            
            const rawImages: string[] = [];

            let mOg;
            while ((mOg = ogImageRegex.exec(html)) !== null) {
              if (mOg[1] && mOg[1].startsWith("http")) {
                rawImages.push(mOg[1]);
              }
            }

            let mCdn;
            while ((mCdn = cdnRegex.exec(html)) !== null) {
              rawImages.push(mCdn[1]);
            }

            // ADVANCED SCANNER: Find any 32-character lowercase hex string wrapped in quotes typical of Shopee images
            const hashMatches = html.match(/"[a-f0-9]{32}"/gi);
            if (hashMatches) {
              for (const hit of hashMatches) {
                const cleanedHash = hit.substring(1, hit.length - 1);
                // Exclude common known platform/tracking hashes
                if (!["76ec8319f36f6d8995f782c5f1df7ef1", "f7cb8594b9cdb4802e3b2e5658bad1fa"].includes(cleanedHash)) {
                  rawImages.push(`https://down-br-img.susercontent.com/file/${cleanedHash}`);
                }
              }
            }

            const filtered = rawImages.filter(img => {
              const low = img.toLowerCase();
              return !low.includes("icon") && !low.includes("logo") && !low.includes("pixel") && !low.includes("sprite") && !low.includes("loading") && !low.includes("avatar");
            });

            scrapedImages = Array.from(new Set(filtered)).slice(0, 8);
          }
        }
      } catch (err) {
        console.log("Scraping URL fetch skipped or failed under serverless environment.", err);
      }
    }

    const categoriesPrompt = categories && categories.length > 0 
      ? `Categorias existentes no blog: ${JSON.stringify(categories)}. Use uma delas ou sugira uma nova e adequada.`
      : "Categorias sugeridas: tecnologia, cozinha, beleza, casa, acessórios.";

    const inputData = `
      LINK DO PRODUTO: ${url || "Não fornecido"}
      TÍTULO CAPTURADO DO SITE: ${scrapedTitle || "Não encontrado"}
      CONTEÚDO CAPTURADO DO SITE: ${scrapedContent || "Não encontrado"}
      PREÇO ENCONTRADO NO SITE (REAIS): ${scrapedPrice !== null ? `R$ ${scrapedPrice.toFixed(2)}` : "Não detectado"}
      TEXTO MANUAL COLADO PELO USUÁRIO: ${rawText || "Não fornecido"}
    `;

    // System structured response using Gemini 3.5 Flash
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
8. "keywordImage": Sugira de 1 a 3 termos de busca em inglês específicos (ex: "stanley water bottle", "neon rgb led strip", "wireless charger stand", "makeup organizer", "bluetooth portable speaker") que descrevam perfeitamente o produto para buscarmos uma foto profissional dele no Unsplash. Evite termos genéricos ou abstratos.

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

    const imageMap: Record<string, string[]> = {
      "smartwatch": [
        "https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?w=600&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=600&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=600&auto=format&fit=crop&q=80"
      ],
      "airfryer": [
        "https://images.unsplash.com/photo-1621972750749-0fbb1abb7736?w=600&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=600&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1628113315911-840847b352e6?w=600&auto=format&fit=crop&q=80"
      ],
      "humidifier": [
        "https://images.unsplash.com/photo-1519183071298-a2962feb14f4?w=600&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?w=600&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=600&auto=format&fit=crop&q=80"
      ],
      "makeupbox": [
        "https://images.unsplash.com/photo-1612817288484-6f916006741a?w=600&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1522337360788-8b13edd793be?w=600&auto=format&fit=crop&q=80"
      ],
      "thermosbottle": [
        "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1592080016724-490f3532ab7f?w=600&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=600&auto=format&fit=crop&q=80"
      ],
      "bluetoothheadphones": [
        "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=600&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=600&auto=format&fit=crop&q=80"
      ],
      "kitchen": [
        "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=600&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1527018601619-a508a2be00cd?w=600&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=600&auto=format&fit=crop&q=80"
      ],
      "home": [
        "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=600&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=600&auto=format&fit=crop&q=80"
      ],
      "cosmetics": [
        "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=600&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1515688594390-b649af70d282?w=600&auto=format&fit=crop&q=80"
      ],
      "tech": [
        "https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1504274066654-faaf72c56b16?w=600&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=600&auto=format&fit=crop&q=80"
      ],
      "gadget": [
        "https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=600&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=600&auto=format&fit=crop&q=80"
      ]
    };

    const kw = (parsedData.keywordImage || "tech").toLowerCase().trim();
    let imagesList: string[] = [];
    let primaryImage = "";

    if (scrapedImages && scrapedImages.length > 0) {
      imagesList = scrapedImages;
      primaryImage = scrapedImages[0];
    } else {
      // Try to fetch a high quality matched image dynamically from Unsplash!
      const dynamicImg = await getDynamicUnsplashImage(kw);
      if (dynamicImg) {
        primaryImage = dynamicImg;
        imagesList = [dynamicImg];
        console.log(`Found dynamic image for "${kw}":`, dynamicImg);
      } else {
        // Flexible matching for keywords static fallback
        let fallbackList: string[] | undefined = undefined;
        if (imageMap[kw]) {
          fallbackList = imageMap[kw];
        } else {
          // Look for any key that is a substring of the generated keyword, or vice-versa
          for (const key of Object.keys(imageMap)) {
            if (kw.includes(key) || key.includes(kw)) {
              fallbackList = imageMap[key];
              break;
            }
          }
        }

        if (fallbackList && fallbackList.length > 0) {
          imagesList = fallbackList;
          primaryImage = fallbackList[0];
        } else {
          // High quality general product/shopping defaults instead of a watch!
          const fallbacks = [
            "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=600&auto=format&fit=crop&q=80", // Golden premium shopping bags
            "https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=600&auto=format&fit=crop&q=80", // Creative storefront
            "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600&auto=format&fit=crop&q=80"  // Elegant packaging close-up
          ];
          imagesList = fallbacks;
          primaryImage = fallbacks[0];
        }
      }
    }

    const payload = {
      title: parsedData.title,
      description: parsedData.description,
      price: parsedData.price,
      originalPrice: parsedData.originalPrice,
      category: parsedData.category,
      discountCode: parsedData.discountCode,
      link: parsedData.link,
      image: primaryImage,
      images: imagesList
    };

    return res.status(200).json(payload);
  } catch (error: any) {
    console.error("Erro no processamento da API de Geração:", error);
    return res.status(500).json({ error: "Erro ao gerar anúncio pelo Gemini no Vercel: " + error.message });
  }
}
