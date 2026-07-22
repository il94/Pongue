import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException, ContextType } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { User } from '@prisma/client';
import { isDemoUser } from 'src/app.service';

@Injectable()
export class JwtGuard extends AuthGuard('jwt') {
	constructor(private reflector: Reflector) {
	  super();
	}

	canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
		const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
		  context.getHandler(),
		  context.getClass(),
		]);
		if (isPublic) {
		  return true;
		}
		return super.canActivate(context);
	}
}

// Routes interdites aux comptes de demonstration
// PATCH /user/me couvre le username, le mot de passe et l'avatar
const DEMO_FORBIDDEN_ROUTES = [
	{ method: 'PATCH', path: '/user/me' },
	{ method: 'GET', path: '/auth/2fa/generate' },
	{ method: 'PATCH', path: '/auth/2fa/enable' },
	{ method: 'PATCH', path: '/auth/2fa/disable' }
];

@Injectable()
export class DemoGuard implements CanActivate {

	canActivate(context: ExecutionContext): boolean {

		// Ignore tout ce qui n'est pas une requete HTTP authentifiee
		if (context.getType<ContextType>() !== 'http')
			return true

		const request = context.switchToHttp().getRequest<Request & { user?: User }>()
		if (!request.user)
			return true

		// Laisse passer les users qui ne sont pas des comptes de demonstration
		if (!isDemoUser(request.user.username))
			return true

		// Refuse la modification des donnees du compte de demonstration
		const isForbidden = DEMO_FORBIDDEN_ROUTES.some((route) =>
			route.method === request.method && route.path === request.path)
		if (isForbidden)
			throw new ForbiddenException("The demo account can't change its own settings")

		return true
	}
}

@Injectable()
export class Api42AuthGuard extends AuthGuard('42') {
	async canActivate(context: ExecutionContext): Promise<boolean> {
		const activate = (await super.canActivate(context)) as boolean;
		const request = context.switchToHttp().getRequest();
		await super.logIn(request);
		return activate; 
	}
}