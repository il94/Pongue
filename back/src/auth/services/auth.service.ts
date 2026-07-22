import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { PrismaClient, User, Prisma, Role, UserStatus } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from "./users.service";
import * as argon from 'argon2';
import { AuthDto } from "../dto/auth.dto";
import { CreateUserDto } from "../dto/users.dto";
import { authenticator } from "otplib";
import { AppGateway } from 'src/app.gateway';
import { isDemoUser } from 'src/app.service';
import { toDataURL } from 'qrcode';
import { Response } from "express";
import { Socket } from "socket.io";
import { Multer } from "multer";

type SigninResponse = {
	access_token: string
} | Partial<User>

@Injectable()
export class AuthService {
	constructor(
		private prisma: PrismaService, 
		private jwt: JwtService, 
		private userService: UsersService,
		private appGateway: AppGateway
	) {}

	// Cree un user et renvoie un token d'authentification
	async signup(userDatas: CreateUserDto, file?: Express.Multer.File): Promise<{ access_token: string }>{
		try {
			const newUser = await this.userService.createUser(userDatas, file)
			return this.signToken(newUser.id, newUser.username)
		}
		catch (error) {
			if (error instanceof ForbiddenException || error instanceof ConflictException)
				throw error
			else
				throw new BadRequestException()
		}
	}

	// Verifie le username et le mot de passe
	// Set le statut du user a connecte
	// Renvoie un token d'authentification
	async validateUser(userDatas: AuthDto): Promise<SigninResponse> {
		try {
			// Verifie si le user existe
			const user = await this.prisma.user.findUnique({
				where: {
					username: userDatas.username
				},
				// select: {
				// 	status: true
				// }
			})
			if (!user)
				throw new NotFoundException("User not found")

			if (user.status != UserStatus.OFFLINE)
			{
				// Oriente le visiteur vers l'autre compte de demonstration
				if (isDemoUser(user.username))
					throw new ForbiddenException("This demo account is in use, try the other one")
				throw new ForbiddenException("already connected")
			}

			// Verifie si le mot de passe fourni est correct
			const pwdMatch = await argon.verify(user.hash, userDatas.hash)
			if (!pwdMatch)
				throw new ForbiddenException("Wrong password")

			// Genere un token d'authentification a partir de l'id et du username
			const token: { access_token: string } = await this.signToken(user.id, user.username)

			// Si le user n'a pas active le twoFA, connecte le user et renvoie son token
			if (user.twoFA === false)
			{
				// Set le statut du user a connecte
				await this.prisma.user.update({
					where: {
						id: user.id
					},
					data: {
						status: UserStatus.ONLINE
					}
				})

				return token
			}

			// Si le user a active le twoFA, renvoie les datas necessaires pour le front pour le rediriger vers la page twoFA
			else
				return { id: user.id, twoFA: user.twoFA }
		}
		catch (error) {
			if (error instanceof ForbiddenException || error instanceof NotFoundException)
				throw error
			else if (error instanceof Prisma.PrismaClientKnownRequestError)
				throw new ForbiddenException("The provided credentials are not allowed")
			else
				throw new BadRequestException()
		}
	}

	// Set le statut du user a deconnecte
	async logout(userId: number) {
		try {
			// Verifie si le user existe
			const user = await this.prisma.user.findUnique({
				where: {
					id: userId
				}
			})
			if (!user)
				throw new NotFoundException("User not found")

			// Change le statut du user
			await this.prisma.user.update({
				where: {
					id: userId
				},
				data: {
					status: UserStatus.OFFLINE
				}
			})
		}
		catch (error) {
			if (error instanceof NotFoundException)
				throw error
			else if (error instanceof Prisma.PrismaClientKnownRequestError)
				throw new ForbiddenException("The provided credentials are not allowed")
			else
				throw new BadRequestException()
		}
		finally {
			// Deconnecte le socket du user
			const socketUser: Socket | undefined = this.appGateway.getSocketByUserId(userId.toString())
			if (socketUser)
				socketUser.disconnect()
		}
	}

	/*********************** api42 Authentication ******************************************/

	async validate42User(profile: any): Promise<{user: User, isNew: boolean} | 
	{usernameId: User, avatar: string} | 
	Partial<User> | {isCo: boolean }> {
		try {
			const user = await this.prisma.user.findUnique({
				where: { usernameId: profile.usernameId, },
			});
			if (user) {
				if (user.status != UserStatus.OFFLINE) {
					// console.log("isCO: ", user)
					return { isCo: true }
				}
				else if (!user.twoFA) {
					const logUser = await this.prisma.user.update({ 
						where: { usernameId: profile.usernameId },
						data: { status: UserStatus.ONLINE }})
					return logUser
				}
				return { id: user.id, twoFA: user.twoFA };
			}

			return { usernameId: profile.usernameId, 
				avatar: profile.avatar, 
				isNew: true }
		} catch (error) {
            throw new BadRequestException(error.message)
		}
	}

	// Selon la reponse de l'api 42, connecte le user OU le redirige vers le twoFA OU lui cree un compte
	async return42Response(user: { usernameId: string, avatar: string, isNew: boolean } | Partial<User>, res: Response ) {
		
		const isProd = process.env.DOMAIN && process.env.DOMAIN[0] === '.'
		const cookieData = {
      secure: isProd,
      domain: process.env.DOMAIN,
      sameSite: "lax" as const
    };

		try {
	
			// Verifie si le user possebe bien un compte 42
			if (!user)
				throw new BadRequestException("User not found in 42 database")
			
			if ('isCo' in user)
				res.redirect(`${process.env.URL_FRONT}/error`)
					
			// Si le user possede deja un compte dans l'app
			if ('id' in user)
			{
				// Si le user n'a pas active la twoFA
				if (!user.twoFA)
				{
					// Genere un token d'authentification et l'envoie par les cookies
					const token = await this.signToken(user.id, user.username)
						//res.clearCookie('token', { httpOnly: true })
						res.cookie("access_token", token.access_token, {
							...cookieData
						})
						.redirect(`${process.env.URL_FRONT}`)
				}
			
				// Si le user a active la twoFA
				else
				{
					// Redirige vers la page twoFA avec les infos necessaires pour le front
					res.cookie('two_FA', true, {
						...cookieData
					})
					.cookie('userId', user.id, {
						...cookieData
					})
					.redirect(`${process.env.URL_FRONT}/twofa`)	
				}
			}
			// Si le user ne possede pas de compte dans l'app
			else if ('isNew' in user)
			{
				// Stocke les donnees necessaires a l'authentification dans des
				// cookies de 5 mins  et redirige vers la page de creation de compte
				const fiveMin = Date.now() + 5 * 60 * 1000;
				res.cookie('usernameId', user.usernameId, {
					expires: new Date(fiveMin),
					...cookieData
				})
				.cookie("avatar", user.avatar, {
					expires: new Date(fiveMin),
					...cookieData
				})
				.redirect(`${process.env.URL_FRONT}/signup42`)
			}
		}
		catch (error) {
			res.cookie("error_message", error.message, {
				...cookieData
			})
			.redirect(`${process.env.URL_FRONT}/error`)
		}
	}

	/*********************** TwoFA Authentication ******************************************/

	async generateTwoFASecret(user: User): Promise <{ secret:string, otpAuthURL: string}> {
		const secret = authenticator.generateSecret();
		const otpAuthURL = authenticator.keyuri(user.username, process.env.AUTH_APP_NAME, secret);
		await this.setTwoFASecret(secret, user.id);
		return { secret, otpAuthURL };
	}

	async generateQrCodeDataURL(otpAuthUrl: string): Promise<string> {
		return toDataURL(otpAuthUrl);
	}

	async turnOnTwoFA(user: User, twoFACode: string): Promise<User> {
		try {
			const getUser = await this.prisma.user.findUnique({ where: {id: user.id}});
			if (!getUser || getUser.status == UserStatus.OFFLINE)
				throw new NotFoundException('User not found or offline');
			if (getUser.twoFA)
				throw new ConflictException('2FA already enabled');

			const isCodeValid = authenticator.verify({
				token: twoFACode,
				secret: getUser.twoFASecret,
			});
			if (!isCodeValid)
				throw new ForbiddenException('Wrong authentication code');
			
				const setUser = await this.prisma.user.update({
				where: { id: user.id, },
				data: { twoFA: true, },
			});
			return setUser;
		}
		catch (error) {
			if (error instanceof ForbiddenException || error instanceof NotFoundException || error instanceof ConflictException)
				throw error
			else if (error instanceof Prisma.PrismaClientKnownRequestError)
				throw new ForbiddenException("The provided credentials are not allowed")
			else
				throw new BadRequestException()
		}
	}

	// Verifie le code envoye avec l'api de google et renvoie un token d'authentification
	async loginWith2fa(userId: number, twoFACode: string): Promise <{ access_token: string }> {
		try {
			// Recupere le user avec son username et son twoFaSecret et verifie si il existe
			const user = await this.prisma.user.findFirst({
				where: {
					id: userId
				},
				select: {
					username: true,
					status: true,
					twoFASecret: true
				}
			})
			if (!user || user.status != UserStatus.OFFLINE)
				throw new NotFoundException("User not found or already connected")

			// Verifie si le code fourni est correct avec l'api de google
			if (!await this.verifyCode(user.twoFASecret, twoFACode))
				throw new ForbiddenException("Wrong code")

			// Set le statut du user a connecte
			await this.prisma.user.update({ 
				where: {
					id: userId
				},
				data: {
					status: UserStatus.ONLINE
				}
			})

			// Retourne un token d'authentification
			return this.signToken(userId, user.username)
		}
		catch (error) {
			if (error instanceof ForbiddenException || error instanceof NotFoundException)
				throw error
			else if (error instanceof Prisma.PrismaClientKnownRequestError)
				throw new ForbiddenException("The provided credentials are not allowed")
			else
				throw new BadRequestException()
		}
	}

	async disableTwoFA(user: User, twoFACode: string): Promise <User> {
		try {
			const getUser = await this.prisma.user.findUnique({ where: {id: user.id, twoFA: true }});
			if (!getUser || getUser.status === UserStatus.OFFLINE)
				throw new NotFoundException('User with 2FA not found or offline');
		
			const codevalid = await this.verifyCode(getUser.twoFASecret, twoFACode)
			if (!codevalid) 
				throw new ForbiddenException("Wrong code")

			const setUser = await this.prisma.user.update({
				where: { id: user.id },
				data: { twoFA: false },
			});
			if  (!setUser)
				throw new NotFoundException('Failed to update user');
			
			return setUser;
		}
		catch (error) { 	
			if (error instanceof ForbiddenException || error instanceof NotFoundException)
				throw error
			else if (error instanceof Prisma.PrismaClientKnownRequestError)
				throw new ForbiddenException("The provided credentials are not allowed")
			else
				throw new BadRequestException()
			}
	}

/* =============================== UTILS ==================================== */

	// Genere un token d'authentification
	async signToken(userId: number, username: string): Promise<{ access_token: string }> {
		const payload = {
			sub: userId,
			username
		};
		const token =  await this.jwt.signAsync(payload, { secret: process.env.JWT_SECRET })
		if (!token)
			throw new BadRequestException("Failed to generate access_token")
		return { access_token: token, }
	}

	async setTwoFASecret(secret: string, userId: number): Promise<void> {
		try {
		const user = await this.prisma.user.update({
			where: { id: userId,},
			data: { twoFASecret: secret },
		});
		if (!user)
			throw new NotFoundException("User not found");
		} catch (error) { throw error; }
	}

	// Verifie si le code fourni est correct avec l'api de google
	async verifyCode(userTwoFASecret: string, twoFACode: string): Promise <boolean> {
		return authenticator.verify({
			token: twoFACode,
			secret: userTwoFASecret
		  });
	}
}