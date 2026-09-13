from http.server import BaseHTTPRequestHandler
import json
import os
import google.generativeai as genai

class handler(BaseHTTPRequestHandler):
    # Lida com validação de segurança de navegadores (CORS)
    def do_OPTIONS(self):
        self.send_response(200, "ok")
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header("Access-Control-Allow-Headers", "X-Requested-With, Content-type")
        self.end_headers()

    # Recebe os dados do formulário e chama a IA
    def do_POST(self):
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))

            produto = data.get('produto', '')
            estilo = data.get('estilo', 'Review Sincero')
            tom = data.get('tom', 'Entusiasta')

            # Pega a chave que vamos configurar na Vercel
            api_key = os.environ.get("GEMINI_API_KEY")
            if not api_key:
                raise Exception("Chave de API do Gemini não configurada.")

            genai.configure(api_key=api_key)
            
            # Força o uso do modelo flash mais rápido e barato
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

            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({'result': response.text}).encode('utf-8'))

        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({'error': str(e)}).encode('utf-8'))
