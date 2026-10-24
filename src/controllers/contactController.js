const mailService = require('../services/mailService');

exports.renderContact = (req, res) => {
  res.render('contact', {
    title: 'Fale Conosco | O Que É Isso? Artesanato',
    user: req.user || null,
    success: null,
    error: null,
    formData: {},
    formTimestamp: Date.now(),
  });
};

exports.sendContactMessage = async (req, res) => {
  try {
    const { name, email, phone, subject, message, website_url, _form_time } = req.body;

    // ─── 1. VERIFICAÇÃO HONEYPOT (Campo invisível para humanos que bots preenchem) ───
    if (website_url && website_url.trim().length > 0) {
      console.warn(`[Anti-Spam] Robô bloqueado por Honeypot. Nome: "${name}", E-mail: "${email}"`);
      // Retorna sucesso falso para que o robô não tente contornar com outro payload
      return res.render('contact', {
        title: 'Fale Conosco | O Que É Isso?',
        user: req.user || null,
        success: 'Sua mensagem foi enviada com sucesso! Em breve nossa equipe entrará em contato com você.',
        error: null,
        formData: {},
        formTimestamp: Date.now(),
      });
    }

    // ─── 2. VERIFICAÇÃO TIME-GATE (Envio instantâneo menor que 3 segundos é bot) ───
    if (_form_time) {
      const elapsedSeconds = (Date.now() - parseInt(_form_time, 10)) / 1000;
      if (elapsedSeconds < 3) {
        console.warn(`[Anti-Spam] Robô bloqueado por envio em tempo desumano (${elapsedSeconds.toFixed(1)}s). Nome: "${name}", E-mail: "${email}"`);
        return res.render('contact', {
          title: 'Fale Conosco | O Que É Isso?',
          user: req.user || null,
          success: 'Sua mensagem foi enviada com sucesso! Em breve nossa equipe entrará em contato com você.',
          error: null,
          formData: {},
          formTimestamp: Date.now(),
        });
      }
    }

    // ─── 3. VALIDAÇÃO DOS CAMPOS OBRIGATÓRIOS ─────────────────────────────────────────
    if (!name || !email || !message) {
      return res.status(400).render('contact', {
        title: 'Fale Conosco | O Que É Isso?',
        user: req.user || null,
        success: null,
        error: 'Por favor, preencha os campos obrigatórios (Nome, E-mail e Mensagem).',
        formData: req.body,
        formTimestamp: Date.now(),
      });
    }

    // Disparar e-mails de notificação para admin e confirmação para o cliente
    await mailService.sendContactEmail({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone ? phone.trim() : '',
      subject: subject ? subject.trim() : 'Contato via Site',
      message: message.trim(),
    });

    res.render('contact', {
      title: 'Fale Conosco | O Que É Isso?',
      user: req.user || null,
      success: 'Sua mensagem foi enviada com sucesso! Em breve nossa equipe entrará em contato com você.',
      error: null,
      formData: {},
      formTimestamp: Date.now(),
    });
  } catch (error) {
    console.error('Erro ao enviar mensagem de contato:', error);
    res.status(500).render('contact', {
      title: 'Fale Conosco | O Que É Isso?',
      user: req.user || null,
      success: null,
      error: 'Ocorreu um erro ao enviar sua mensagem. Por favor, tente novamente.',
      formData: req.body,
      formTimestamp: Date.now(),
    });
  }
};
