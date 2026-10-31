/**
 * Helper de tracking Umami.
 *
 * Umami est chargé via le snippet dans `index.html` (script auto-hébergé sur
 * umami.ilandols.com). Le trafic (pages vues, routes, pays, navigateurs) est
 * capté automatiquement ; ce helper ne sert qu'aux events d'actions.
 *
 * Règle de confidentialité : ne jamais passer de donnée personnelle en
 * propriété (pseudo, email, contenu de message...). Uniquement des catégories
 * ou des compteurs. Voir le catalogue dans `src/analytics-events.md`.
 */
export const trackEvent = (
	name: string,
	props?: Record<string, unknown>,
): void => {
	window.umami?.track(name, props)
}
