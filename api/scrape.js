export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'URL do produto não fornecida.' });
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7'
      }
    });

    if (!response.ok) {
      throw new Error(`Falha ao carregar a página (${response.status})`);
    }

    const html = await response.text();

    const getMetaTag = (property) => {
      const match = html.match(new RegExp(`<meta[^>]*?(?:name|property)=["']${property}["'][^>]*?content=["']([^"']*)["']`, 'i')) ||
                    html.match(new RegExp(`<meta[^>]*?content=["']([^"']*)["'][^>]*?(?:name|property)=["']${property}["']`, 'i'));
      return match ? match[1] : '';
    };

    const title = getMetaTag('og:title') || getMetaTag('twitter:title') || (html.match(/<title[^>]*>([^<]*)<\/title>/i) || [])[1] || '';
    const description = getMetaTag('og:description') || getMetaTag('description') || getMetaTag('twitter:description') || '';

    const cleanText = html.replace(/<script\b[^<]*>([\s\S]*?)<\/script>/gi, '')
                          .replace(/<style\b[^<]*>([\s\S]*?)<\/style>/gi, '')
                          .replace(/<[^>]+>/g, ' ')
                          .replace(/\s+/g, ' ')
                          .trim();

    const textSnippet = cleanText.substring(0, 2000);

    return res.status(200).json({
      success: true,
      title: title.trim(),
      description: description.trim(),
      extractedData: `PRODUTO: ${title.trim()}\nDETALHES: ${description.trim()}\nTRECHO DE AVALIAÇÕES E FICHA TÉCNICA: ${textSnippet}`
    });

  } catch (error) {
    return res.status(500).json({ error: 'Erro ao extrair dados da URL: ' + error.message });
  }
}
