# Analytics Events — Umami (Pongue)

Catalogue des events trackés sur Pongue via Umami (instance auto-hébergée
`umami.ilandols.com`, site `pongue.ilandols.com`).

Le **trafic** (pages vues, routes SPA `/`, `/signin`, `/game`…, pays, navigateurs,
référents) est capté automatiquement par le snippet dans `index.html` — aucun event à
poser. Les tableaux ci-dessous ne concernent que les **actions**.

> **Confidentialité** : aucune donnée personnelle en propriété (pas de pseudo, pas de
> contenu de message). Uniquement des catégories / compteurs.
>
> Méthode : `attribut` = `data-umami-event` dans le JSX ; `track()` = `trackEvent()`
> de `src/lib/analytics.ts`.

---

## 🔐 Auth & compte

| Event              | Props                              | Méthode   |
| ------------------ | ---------------------------------- | --------- |
| `signup`           | `{ method: "local" \| "42" }`      | `track()` |
| `signin`           | —                                  | `track()` |
| `logout`           | —                                  | `track()` |
| `2fa-enable`       | —                                  | `track()` |
| `2fa-disable`      | —                                  | `track()` |
| `2fa-authenticate` | —                                  | `track()` |
| `profile-update`   | `{ avatar: boolean, username: boolean }` | `track()` |

---

## 🏓 Jeu (Pong)

| Event               | Props                              | Méthode   |
| ------------------- | ---------------------------------- | --------- |
| `matchmaking-start` | —                                  | `track()` |
| `matchmaking-cancel`| —                                  | `track()` |
| `game-start`        | —                                  | `track()` |
| `game-end`          | `{ result: "win" \| "lose" }`      | `track()` |
| `game-cancel`       | —                                  | `track()` |
| `game-disconnect`   | —                                  | `track()` |
| `spectate-start`    | —                                  | `track()` |
| `spectate-stop`     | —                                  | `track()` |

---

## 💬 Chat & channels

| Event                     | Props                                      | Méthode   |
| ------------------------- | ------------------------------------------ | --------- |
| `channel-create`          | `{ type: "public" \| "private" \| "mp" }`  | `track()` |
| `channel-join`            | —                                          | `track()` |
| `channel-leave`           | —                                          | `track()` |
| `channel-delete`          | —                                          | `track()` |
| `message-send`            | — (compteur seul, **aucun contenu**)       | `track()` |
| `dm-send`                 | —                                          | `track()` |
| `channel-settings-update` | —                                          | `track()` |
| `channel-role-set`        | —                                          | `track()` |
| `channel-mute`            | —                                          | `track()` |
| `game-invite-send`        | —                                          | `track()` |
| `game-invite-accept`      | —                                          | `track()` |

---

## 👥 Social

| Event          | Props | Méthode   |
| -------------- | ----- | --------- |
| `friend-add`   | —     | `track()` |
| `friend-remove`| —     | `track()` |
| `user-block`   | —     | `track()` |
| `user-unblock` | —     | `track()` |
