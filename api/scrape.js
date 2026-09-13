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
    const targetUrl = url.startsWith('http') ? url : `https://${url}`;
    
    // Leitor inteligente para renderizar páginas dinâmicas e converter em texto limpo
    const response = await fetch(`https://r.jina.ai/${targetUrl}`, {
      headers: {
        'Accept': 'application/json',
        'X-No-Cache': 'true'
      }
    });

    if (!response.ok) {
      throw new Error(`Falha ao ler a página (${response.status})`);
    }

    const data = await response.json();
    const rawContent = data.data?.content || '';

    // Filtra e limpa scripts, links e marcadores desnecessários
    const cleanContent = rawContent
      .replace(/!\[.*?\]\(.*?\)/g, '')
      .replace(/\[.*?\]\(.*?\)/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 3000);

    return res.status(200).json({
      success: true,
      extractedData: cleanContent || `Produto extraído da URL: ${targetUrl}`
    });

  } catch (error) {
    console.error("Erro no scraping:", error);
    return res.status(500).json({ error: 'Erro ao extrair dados da URL: ' + error.message });
  }
}
