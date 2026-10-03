const mailService = require('../services/mailService');

exports.renderContact = (req, res) => {
  res.render('contact', {
    title: 'Fale Conosco | O Que É Isso? Artesanato',
    user: req.user || null,
    success: null,
    error: null,
    formData: {},
  });
};

exports.sendContactMessage = async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).render('contact', {
        title: 'Fale Conosco | O Que É Isso?',
        user: req.user || null,
        success: null,
        error: 'Por favor, preencha os campos obrigatórios (Nome, E-mail e Mensagem).',
        formData: req.body,
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
    });
  } catch (error) {
    console.error('Erro ao enviar mensagem de contato:', error);
    res.status(500).render('contact', {
      title: 'Fale Conosco | O Que É Isso?',
      user: req.user || null,
      success: null,
      error: 'Ocorreu um erro ao enviar sua mensagem. Por favor, tente novamente.',
      formData: req.body,
    });
  }
};
