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
    const rawUrl = url.trim();
    const cleanUrl = rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`;

    // Extrai o nome do produto diretamente da estrutura do link (URL Slug)
    let urlSlugTitle = "";
    try {
      const parsedUrl = new URL(cleanUrl);
      const pathSegments = parsedUrl.pathname.split('/').filter(Boolean);
      
      // Procura o trecho do texto do produto na URL (ex: /cadeira-para-auto-cosco...)
      const slugSegment = pathSegments.find(s => s.length > 5 && !s.startsWith('MLB') && !s.startsWith('i.'));
      if (slugSegment) {
        urlSlugTitle = decodeURIComponent(slugSegment)
          .replace(/[-_]/g, ' ')
          .replace(/\b(sp|br|p|item|product)\b/gi, '')
          .trim();
      }
    } catch (e) {
      console.warn("Erro ao extrair slug da URL", e);
    }

    // Leitura complementar via scraping
    let scrapedText = "";
    try {
      const response = await fetch(`https://r.jina.ai/${cleanUrl}`, {
        headers: {
          'Accept': 'application/json',
          'X-No-Cache': 'true'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.data?.content || '';
        scrapedText = content
          .replace(/!\[.*?\]\(.*?\)/g, '')
          .replace(/\[.*?\]\(.*?\)/g, '')
          .replace(/\s+/g, ' ')
          .substring(0, 2000);
      }
    } catch (e) {
      console.warn("Falha ao raspar via proxy", e);
    }

    // Prioriza o nome extraído do link se a raspagem trouxer conteúdos irrelevantes
    const finalProductInfo = urlSlugTitle 
      ? `PRODUTO IDENTIFICADO NO LINK: ${urlSlugTitle}\nDETALHES ADICIONAIS: ${scrapedText}`
      : `DETALHES DO PRODUTO: ${scrapedText || cleanUrl}`;

    return res.status(200).json({
      success: true,
      productName: urlSlugTitle,
      extractedData: finalProductInfo
    });

  } catch (error) {
    return res.status(500).json({ error: 'Erro ao processar URL: ' + error.message });
  }
}
