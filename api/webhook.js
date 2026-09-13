const admin = require('firebase-admin');

// Conecta ao Firebase usando Variáveis de Ambiente da Vercel
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, '\n'),
    })
  });
}

const db = admin.firestore();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send('Método não permitido.');
  }

  const payload = req.body;

  // 'paid' significa pagamento aprovado na Kiwify (Pix ou Cartão)
  if (payload.order_status === 'paid') {
    
    const cliente = payload.Customer || payload.customer;
    const produto = payload.Product || payload.product;
    
    const emailComprador = cliente.email;
    const nomeProduto = produto.product_name.toLowerCase(); 

    try {
      const usersRef = db.collection('users');
      const snapshot = await usersRef.where('email', '==', emailComprador).get();

      if (snapshot.empty) {
        console.error('Usuário não encontrado no sistema:', emailComprador);
        return res.status(200).send('Usuário não encontrado.');
      }

      const userDoc = snapshot.docs[0];
      const userData = userDoc.data();
      
      let creditosAtuais = userData.creditos || { estudio: 0, express: 0, influencer: 0 };
      let novoPlano = userData.plano || 'gratis';

      // 🛑 REGRA IMPORTANTE: Os nomes lá na Kiwify DEVEM conter essas palavras-chave!
      if (nomeProduto.includes('básico') || nomeProduto.includes('basico')) {
        novoPlano = 'basico';
        creditosAtuais.estudio += 10;
        creditosAtuais.express += 10;
        creditosAtuais.influencer += 10;
      } 
      else if (nomeProduto.includes('intermediário') || nomeProduto.includes('intermediario')) {
        novoPlano = 'intermediario';
        creditosAtuais.estudio += 30;
        creditosAtuais.express += 30;
        creditosAtuais.influencer += 30;
      } 
      else if (nomeProduto.includes('avançado') || nomeProduto.includes('avancado')) {
        novoPlano = 'avancado';
        creditosAtuais.estudio += 100;
        creditosAtuais.express += 100;
        creditosAtuais.influencer += 100;
      } 
      else if (nomeProduto.includes('10 créditos')) {
        creditosAtuais.estudio += 10;
        creditosAtuais.express += 10;
        creditosAtuais.influencer += 10;
      } 
      else if (nomeProduto.includes('20 créditos')) {
        creditosAtuais.estudio += 20;
        creditosAtuais.express += 20;
        creditosAtuais.influencer += 20;
      }

      await userDoc.ref.update({
        plano: novoPlano,
        creditos: creditosAtuais
      });

      console.log(`✅ ${emailComprador} atualizado. Produto: ${nomeProduto}`);
      return res.status(200).send('Webhook processado.');

    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      return res.status(500).send('Erro interno.');
    }
  }

  return res.status(200).send('Status ignorado.');
}
