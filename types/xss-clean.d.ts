declare module 'xss-clean' {
    import { Request, Response, NextFunction } from 'express';
    const xss: () => (req: Request, res: Response, next: NextFunction) => void;
    export default xss;
}
