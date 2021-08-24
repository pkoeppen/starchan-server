import * as globals from '../globals';
import * as helpers from '../helpers';
import * as resolvers from '../resolvers';
import { NextFunction, Request, Response } from 'express';
import { SafeError, prisma } from '../globals';
import { auth, recaptcha } from '../middleware/auth';
import { PermissionLevel } from '@prisma/client';
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
  passport.authenticate('local', async (error, user, message, status) => {
    if (error) {
      return next(error);
    }
    if (!user) {
      return next(
        new SafeError(
          message || 'Unknown error',
          status || StatusCodes.UNAUTHORIZED
        )
      );
    }

    req.login(user, { session: false }, async (error) => {
      if (error) {
        return next(error);
      }
      const userClean = _.pick(user, ['id', 'username', 'email', 'roles']);
      const duration = 4 * 60 * 60 * 1000; // 4 hours.
      const expires = Date.now() + duration;
      const token = jwt.sign(
        { expires, user: userClean },
        globals.JWT_SECRET as string
      );
      const cookieOptions = {
        httpOnly: false,
        sameSite: 'lax' as any, // Because TypeScript is retarded.
        secure: true,
        domain: `starchan.${globals.TLD}`,
        path: '/',
        maxAge: duration,
      };

      // Set cookies.
      res.cookie('token', token, cookieOptions);
      res.cookie('expires', expires.toString(), cookieOptions);
      res.cookie('user', JSON.stringify(userClean), cookieOptions);

      res.status(StatusCodes.OK).send({ token, expires, user: userClean });

      // Add log entry.
      await helpers.log('Logged in', req.user?.id, null);
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
    const tokenExpiry = req.user?.expires as number;
    await helpers.blacklistJwt(jwt, tokenExpiry);
    req.logout();

    // Use identical options to those when cookie was set, excluding maxAge.
    const cookieOptions = {
      httpOnly: false,
      sameSite: 'lax' as any,
      secure: true,
      domain: `starchan.${globals.TLD}`,
      path: '/',
    };

    // Clear all cookies.
    res.clearCookie('token', cookieOptions);
    res.clearCookie('expires', cookieOptions);
    res.clearCookie('user', cookieOptions);

    res.status(StatusCodes.OK).end();
  } catch (error) {
    next(error);
  }
}

/*
 * Gets all users.
 */
router.get('/', auth, getUsers);
async function getUsers(req: Request, res: Response, next: NextFunction) {
  try {
    // Get users.
    const users = await resolvers.getUsers();
    res.json(users);
  } catch (error) {
    next(error);
  }
}

/*
 * Updates a user by ID.
 */
router.post('/:userId', auth, updateUser);
async function updateUser(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.params.userId;
    const username = req.body.username
      ? helpers.validateUsername(req.body.username)
      : null;

    if (!username) {
      throw new SafeError('Nothing to update', StatusCodes.BAD_REQUEST);
    }

    if (username) {
      // Assert that the new username is available.
      const usernameTaken = !!(await prisma.user.findUnique({
        where: {
          username,
        },
      }));
      if (usernameTaken) {
        throw new SafeError('Username taken', StatusCodes.CONFLICT);
      }
    }

    // Update the user.
    const params = { userId, username };

    // Check permissions.
    const reqUserId = req.user?.id;
    if (userId !== reqUserId) {
      await helpers.checkPermissions(reqUserId, params, null, {
        default: PermissionLevel.OWNER,
      });
    }

    // Update the user.
    await resolvers.updateUser(params);
    res.status(200).end();

    // Add log entry.
    await helpers.log('Updated user', reqUserId, params);
  } catch (error) {
    next(error);
  }
}

export default router;
