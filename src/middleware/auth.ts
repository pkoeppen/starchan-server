import { SafeError, logger, prisma, redis } from '../globals';
import { StatusCodes } from 'http-status-codes';
import axios from 'axios';
import bcrypt from 'bcrypt';
import express from 'express';
import passport from 'passport';
import passportAnonymous from 'passport-anonymous';
import passportJwt from 'passport-jwt';
import passportLocal from 'passport-local';

passport.use(getLocalStrategy());
passport.use(getJwtStrategy());
passport.use(new passportAnonymous.Strategy());

/*
 * Authenticates a user and attaches it to the request.
 * Fails if authorization is invalid or not present.
 */
export const auth = passport.authenticate(['jwt'], { session: false });

/*
 * Authenticates a user and attaches it to the request,
 * but will also permit non-authenticated requests.
 */
export const attach = passport.authenticate(['jwt', 'anonymous'], {
  session: false,
});

/*
 * RECAPTCHA middleware.
 */
export const recaptcha = recaptchaMiddleware;

/*
 * Authenticates with a username and password.
 */
function getLocalStrategy() {
  return new passportLocal.Strategy(
    { usernameField: 'username', passwordField: 'password' },
    async function (this: passportLocal.Strategy, username, password, done) {
      logger.debug(`Logging in username ${username}`);
      try {
        const user = await prisma.user.findUnique({
          where: { username },
          include: {
            roles: {
              select: {
                level: true,
                boardId: true,
              },
            },
          },
        });

        if (!user) {
          return this.fail('Invalid credentials', StatusCodes.UNAUTHORIZED);
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
          return this.fail('Invalid credentials', StatusCodes.UNAUTHORIZED);
        }

        return done(null, user);
      } catch (error) {
        logger.debug(`Login failed: ${error}`);
        return this.fail('Unknown error', StatusCodes.INTERNAL_SERVER_ERROR);
      }
    }
  );
}

/*
 * Authenticates with a JWT.
 */
function getJwtStrategy() {
  return new passportJwt.Strategy(
    {
      jwtFromRequest: (req) => req.headers.jwt as string,
      secretOrKey: process.env.JWT_SECRET,
      passReqToCallback: true,
    },
    async function (
      this: passportJwt.Strategy,
      req: express.Request,
      payload: any,
      done: passportJwt.VerifiedCallback
    ) {
      const { expires, user } = payload;
      if (Date.now() > expires) {
        logger.debug('Authentication failed: JWT is expired');
        return this.fail('JWT expired', StatusCodes.UNAUTHORIZED);
      } else {
        const jwt = req.headers.jwt;
        const jwtBlacklistKey = `blacklist:jwt:${jwt}`;
        const blacklisted = await redis.get(jwtBlacklistKey);
        if (blacklisted) {
          logger.debug('Authentication failed: JWT is blacklisted');
          return this.fail('JWT blacklisted', StatusCodes.UNAUTHORIZED);
        } else {
          return done(null, { expires, ...user });
        }
      }
    }
  );
}

/*
 * Validates RECAPTCHA input.
 */
async function recaptchaMiddleware(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): Promise<void> {
  try {
    const secret = process.env.RECAPTCHA_KEY;
    const token = req.query.recaptcha;
    if (!token) {
      next(new SafeError('Missing RECAPTCHA token', StatusCodes.UNAUTHORIZED));
    }
    const url = `https://www.google.com/recaptcha/api/siteverify?secret=${secret}&response=${token}`;
    const response = await axios.post(url);
    const success = response.data?.success;
    if (!success) {
      next(
        new SafeError('RECAPTCHA validation failed', StatusCodes.UNAUTHORIZED)
      );
    }
    next();
  } catch (error) {
    next(error);
  }
}
