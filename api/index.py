from flask import Flask, request, jsonify
import os
import google.generativeai as genai

app = Flask(__name__)

@app.route('/api/generate', methods=['POST', 'OPTIONS'])
@app.route('/generate', methods=['POST', 'OPTIONS'])
def generate():
    if request.method == 'OPTIONS':
        return '', 200
        
    try:
        data = request.get_json() or {}
        produto = data.get('produto', '')
        estilo = data.get('estilo', 'Review Sincero')
        tom = data.get('tom', 'Entusiasta')

        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key:
            return jsonify({'error': 'Chave de API não configurada na Vercel.'}), 500

        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-1.5-flash')

        prompt_master = f"""
        Você é um especialista em marketing de resposta direta para TikTok Shop e Shopee.
        Crie um roteiro de vídeo curto (15-30s) baseado nas informações do produto.

        PRODUTO: {produto}
        ESTILO: {estilo}
        TOM: {tom}

        FORMATO EXATO DE RESPOSTA EM MARKDOWN:

        ### CENA 1: GANCHO VIRAL (0-3s)
        **🗣️ Narração (PT-BR):** [Texto da narração informal]
        **🎬 Prompt Visual (Inglês):**
        ```text
        [Prompt ultra detalhado em inglês: 4k, hyper-realistic, 9:16 ratio, iluminação e câmera]
        ```

        ### CENA 2: DEMONSTRAÇÃO E OBJEÇÃO (3-12s)
        **🗣️ Narração (PT-BR):** [Texto]
        **🎬 Prompt Visual (Inglês):**
        ```text
        [Prompt em inglês técnico]
        ```

        ### CENA 3: CHAMADA PARA AÇÃO (12-15s)
        **🗣️ Narração (PT-BR):** [Texto]
        **🎬 Prompt Visual (Inglês):**
        ```text
        [Prompt em inglês técnico]
        ```
        """

        response = model.generate_content(prompt_master)
        return jsonify({'result': response.text})

    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Aponta a entrada do servidor para o Flask
handler = app
