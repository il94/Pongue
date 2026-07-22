/*
 * Script de creation des comptes de demonstration (hors HTTP).
 *
 * Les comptes sont ceux listes dans DEMO_USERNAMES, et partagent le mot de
 * passe DEMO_PASSWORD. Ils permettent a un visiteur d'entrer dans l'app sans
 * inscription et sans compte 42, via le badge affiche sur les pages publiques.
 *
 * Deux comptes sont prevus pour que deux visiteurs puissent etre presents en
 * meme temps : ils sont amis et membres du meme salon, et peuvent donc se voir
 * en ligne, se parler et se defier.
 *
 * Le script cree aussi des comptes compagnons, un salon public avec des
 * messages et un historique de matchs : sans ca les onglets Social, Chat et
 * l'historique seraient vides, les comptes de demonstration ne pouvant pas
 * modifier leurs propres donnees.
 *
 * Le script est idempotent (upsert sur le username, puis remplacement des amis,
 * du salon et des messages) : le rejouer est sans risque.
 *
 * Usage : `docker compose exec back npm run seed:demo`
 * (le host `db` de DATABASE_URL ne se resout que dans le reseau Docker)
 */

import { PrismaClient, ChannelStatus, GameStatus, MatchResult, messageStatus, Role, roleInGame, UserStatus } from '@prisma/client';
import * as argon from 'argon2';
import * as fs from 'fs';
import { mkdir } from 'fs/promises';

const prisma = new PrismaClient()

// Meme liste que le DEMO_USERNAMES de src/app.service.ts, relue ici pour que le
// script reste independant du graphe de modules Nest
const DEMO_USERNAMES = (process.env.DEMO_USERNAMES ?? '')
	.split(',')
	.map((username) => username.trim())
	.filter((username) => username.length !== 0)

const COMPANION_USERNAMES = ['zephyr', 'milo', 'nova']

const CHANNEL_NAME = 'arena'

const MESSAGES = [
	{ author: 'zephyr', content: "Welcome to the arena !" },
	{ author: 'milo', content: "Who's up for a game ?" },
	{ author: 'nova', content: "Careful, zephyr never loses" },
	{ author: 'zephyr', content: "Send an invitation and find out" }
]

/* ============================== UTILS ===================================== */

// Copie un avatar par defaut dans le dossier des avatars uploades
async function setDefaultAvatar(userId: number, avatarName: string) {

	const currentDirectory = process.cwd()

	const defaultAvatar = await fs.promises.readFile(currentDirectory + "/defaultUserAvatars/" + avatarName)

	const uploadUserPath = currentDirectory + "/uploads/users/"
	if (!fs.existsSync(uploadUserPath))
		await mkdir(uploadUserPath, { recursive: true })

	await fs.promises.writeFile(uploadUserPath + userId.toString() + '_', defaultAvatar)
}

// Cree le user s'il n'existe pas, sans toucher a ses donnees s'il existe deja
async function createUser(username: string, hash: string, avatarName: string) {

	const user = await prisma.user.upsert({
		where: {
			username: username
		},
		update: {},
		create: {
			username: username,
			hash: hash,
			avatar: '',
			twoFA: false,
			twoFASecret: '',
			wins: 0,
			draws: 0,
			losses: 0,
			status: UserStatus.OFFLINE
		}
	})

	// L'avatar depend de l'id, il ne peut etre renseigne qu'apres la creation
	if (!user.avatar)
	{
		await setDefaultAvatar(user.id, avatarName)
		return await prisma.user.update({
			where: {
				id: user.id
			},
			data: {
				avatar: `${process.env.URL_BACK}/uploads/users/${user.id}_`
			}
		})
	}

	return user
}

// Lie deux users dans les deux sens
async function createFriendship(userId: number, friendId: number) {

	await prisma.friend.upsert({
		where: {
			userId_friendId: {
				userId: userId,
				friendId: friendId
			}
		},
		update: {},
		create: {
			userId: userId,
			friendId: friendId
		}
	})

	await prisma.friend.upsert({
		where: {
			userId_friendId: {
				userId: friendId,
				friendId: userId
			}
		},
		update: {},
		create: {
			userId: friendId,
			friendId: userId
		}
	})
}

// Ajoute un user au salon s'il n'y est pas deja
async function joinChannel(userId: number, channelId: number, role: Role) {

	await prisma.usersOnChannels.upsert({
		where: {
			userId_channelId: {
				userId: userId,
				channelId: channelId
			}
		},
		update: {},
		create: {
			userId: userId,
			channelId: channelId,
			role: role
		}
	})
}

// Cree un match termine entre deux users
async function createMatch(winnerId: number, looserId: number, winnerScore: number, looserScore: number) {

	await prisma.game.create({
		data: {
			level: 1,
			status: GameStatus.FINISHED,
			players: {
				create: [
					{
						userId: winnerId,
						score: winnerScore,
						result: MatchResult.WINNER,
						role: roleInGame.PLAYER
					},
					{
						userId: looserId,
						score: looserScore,
						result: MatchResult.LOOSER,
						role: roleInGame.PLAYER
					}
				]
			}
		}
	})

	await prisma.user.update({
		where: {
			id: winnerId
		},
		data: {
			wins: {
				increment: 1
			}
		}
	})

	await prisma.user.update({
		where: {
			id: looserId
		},
		data: {
			losses: {
				increment: 1
			}
		}
	})
}

/* ============================== SEED ====================================== */

async function seedDemo() {

	// Verifie que les comptes a creer sont bien configures
	if (DEMO_USERNAMES.length === 0)
		throw new Error("DEMO_USERNAMES n'est pas defini : aucun compte de demonstration a creer")
	if (!process.env.DEMO_PASSWORD)
		throw new Error("DEMO_PASSWORD n'est pas defini")

	const hash = await argon.hash(process.env.DEMO_PASSWORD)

	// Cree les comptes de demonstration, avec un avatar different chacun
	const avatars = ['default_blue.png', 'default_red.png', 'default_green.png', 'default_yellow.png']
	const demoUsers = []
	for (const [index, username] of DEMO_USERNAMES.entries())
	{
		const demoUser = await createUser(username, hash, avatars[index % avatars.length])
		demoUsers.push(demoUser)
		console.log(`Demo user ${demoUser.username} is ready`)
	}

	// Cree les comptes compagnons, pour peupler la liste d'amis et le salon
	const companions = []
	for (const [index, username] of COMPANION_USERNAMES.entries())
		companions.push(await createUser(username, hash, avatars[(index + demoUsers.length) % avatars.length]))

	// Lie les comptes de demonstration entre eux et avec les compagnons
	for (const demoUser of demoUsers)
	{
		for (const other of [...demoUsers, ...companions])
		{
			if (other.id !== demoUser.id)
				await createFriendship(demoUser.id, other.id)
		}
	}

	// Cree le salon public commun, ou tout le monde se retrouve
	let channel = await prisma.channel.findFirst({
		where: {
			name: CHANNEL_NAME
		}
	})
	if (!channel)
	{
		channel = await prisma.channel.create({
			data: {
				name: CHANNEL_NAME,
				avatar: '',
				type: ChannelStatus.PUBLIC
			}
		})
	}

	await joinChannel(companions[0].id, channel.id, Role.OWNER)
	for (const user of [...demoUsers, ...companions.slice(1)])
		await joinChannel(user.id, channel.id, Role.MEMBER)

	// Remplace les messages du salon, pour ne pas les empiler a chaque passage
	await prisma.message.deleteMany({
		where: {
			channelId: channel.id
		}
	})
	for (const message of MESSAGES)
	{
		const author = companions.find((companion) => companion.username === message.author)
		await prisma.message.create({
			data: {
				authorId: author.id,
				channelId: channel.id,
				type: messageStatus.TEXT,
				content: message.content
			}
		})
	}

	// Cree un historique de matchs, seulement si les comptes n'en ont pas encore
	for (const demoUser of demoUsers)
	{
		const played = await prisma.usersOnGames.count({
			where: {
				userId: demoUser.id
			}
		})
		if (played !== 0)
			continue

		await createMatch(demoUser.id, companions[0].id, 5, 3)
		await createMatch(companions[1].id, demoUser.id, 5, 1)
		await createMatch(demoUser.id, companions[2].id, 5, 4)
	}

	console.log(`Demo accounts seeded : ${DEMO_USERNAMES.join(', ')}`)
}

seedDemo()
	.catch((error) => {
		console.error(error.message)
		process.exit(1)
	})
	.finally(async () => {
		await prisma.$disconnect()
	})
