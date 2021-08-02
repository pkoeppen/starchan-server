import * as helpers from '../helpers';
import * as resolvers from '../resolvers';
import { NextFunction, Request, Response } from 'express';
import { SafeError, prisma } from '../globals';
import { auth, recaptcha } from '../middleware/auth';
import { Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import _ from 'lodash';
import jwt from 'jsonwebtoken';
import passport from 'passport';

const router = Router();

/*
 * Logs a user in.
 */
router.post('/login', recaptcha, logIn);
async function logIn(req: Request, res: Response, next: NextFunction) {
  passport.authenticate('local', async (error, mod, message, status) => {
    if (error) {
      return next(error);
    }
    if (!mod) {
      return next(
        new SafeError(
          message || 'Unknown error',
          status || StatusCodes.UNAUTHORIZED
        )
      );
    }

    req.login(mod, { session: false }, async (error) => {
      if (error) {
        return next(error);
      }
      const modClean = _.pick(mod, ['username', 'email']);
      const duration = 4 * 60 * 60 * 1000; // 4 hours.
      const expires = Date.now() + duration;
      const token = jwt.sign(
        { expires, mod: modClean },
        process.env.JWT_SECRET as string
      );
      const cookieOptions = {
        httpOnly: false,
        sameSite: 'lax' as any, // Because TypeScript is retarded.
        secure: process.env.NODE_ENV === 'production',
        domain: 'local.starchan.org',
        path: '/',
        maxAge: duration,
      };

      // Set cookies.
      res.cookie('token', token, cookieOptions);
      res.cookie('expires', expires.toString(), cookieOptions);
      res.cookie('mod', JSON.stringify(modClean), cookieOptions);

      res.status(StatusCodes.OK).send({ token, expires, mod: modClean });
    });
  })(req, res, next);
}

/*
 * Logs a user out.
 */
router.post('/logout', auth, logout);
async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    const jwt = req.headers.jwt as string;
    const tokenExpiry = (req.user as any)?.expires;
    await helpers.blacklistJwt(jwt, tokenExpiry);
    req.logout();
    res.status(StatusCodes.OK).end();
  } catch (error) {
    next(error);
  }
}

export default router;
