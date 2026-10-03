const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');
const mailService = require('../services/mailService');

function configurePassport() {
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    const callbackURL = process.env.GOOGLE_CALLBACK_URL || `${(process.env.BASE_URL || 'http://localhost:3000').replace(/\/$/, '')}/auth/google/callback`;

    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL,
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            const email = profile.emails && profile.emails[0] ? profile.emails[0].value.toLowerCase() : null;

            if (!email) {
              return done(new Error('Nenhum e-mail retornado pela conta do Google.'), null);
            }

            // 1. Buscar usuário por googleId
            let user = await User.findOne({ googleId: profile.id });

            // 2. Se não encontrar por googleId, buscar por e-mail
            if (!user) {
              user = await User.findOne({ email });
            }

            // 3. Se usuário já existir, associa o googleId e atualiza avatar caso necessário
            if (user) {
              let updated = false;
              if (!user.googleId) {
                user.googleId = profile.id;
                updated = true;
              }
              if (profile.photos && profile.photos[0] && !user.avatar) {
                user.avatar = profile.photos[0].value;
                updated = true;
              }
              if (updated) {
                await user.save();
              }
              return done(null, user);
            }

            // 4. Se não existir, criar novo usuário registrado via Google
            const fullName =
              profile.displayName ||
              `${profile.name?.givenName || ''} ${profile.name?.familyName || ''}`.trim() ||
              'Usuário Google';
            const avatar = profile.photos && profile.photos[0] ? profile.photos[0].value : '';

            user = await User.create({
              name: fullName,
              email: email,
              googleId: profile.id,
              avatar: avatar,
              authProvider: 'google',
              role: 'user',
            });

            // Disparar e-mails assíncronos
            mailService.sendWelcomeEmail(user).catch((err) => console.error('[Mail] Erro welcome Google:', err.message));
            mailService.sendAdminNewUserAlert(user).catch((err) => console.error('[Mail] Erro alert admin Google:', err.message));

            return done(null, user);
          } catch (err) {
            console.error('Erro na autenticação do Google Strategy:', err);
            return done(err, null);
          }
        }
      )
    );
  } else {
    console.warn('⚠️ Google OAuth não configurado: GOOGLE_CLIENT_ID ou GOOGLE_CLIENT_SECRET ausentes.');
  }

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (err) {
      done(err, null);
    }
  });
}

module.exports = configurePassport;
