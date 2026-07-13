const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

function configurePassport() {
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: process.env.GOOGLE_CALLBACK_URL || '/api/auth/google/callback',
        },
        async (_accessToken, _refreshToken, profile, done) => {
          try {
            const email = profile.emails?.[0]?.value?.toLowerCase();
            if (!email) return done(null, false, { message: 'No email from Google' });

            let user = await User.findOne({
              $or: [{ googleId: profile.id }, { email }],
            });

            if (user) {
              if (!user.googleId) {
                user.googleId = profile.id;
                user.authProvider = user.authProvider === 'local' ? 'local' : 'google';
                await user.save();
              }
            } else {
              user = await User.create({
                name: profile.displayName || email.split('@')[0],
                email,
                googleId: profile.id,
                authProvider: 'google',
                avatar: profile.photos?.[0]?.value || '',
                isEmailVerified: true,
              });
            }

            return done(null, user);
          } catch (err) {
            return done(err);
          }
        }
      )
    );
  }

  passport.serializeUser((user, done) => done(null, user._id));
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });
}

module.exports = configurePassport;
