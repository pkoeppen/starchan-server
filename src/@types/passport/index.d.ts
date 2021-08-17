import { Role } from '@prisma/client';

export {};

declare global {
  namespace Express {
    interface User {
      id: string;
      email: string;
      expires: number;
      username: string;
      roles: Pick<Role, 'level' | 'boardId'>[];
    }

    namespace Multer {
      interface File {
        id: string;
        filename: string;
        mimetype: string;
        size: number;
        nsfw: boolean;
        exists: boolean;
      }
    }
  }
}
